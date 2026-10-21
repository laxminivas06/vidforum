/**
 * AI Tutor pure-logic checks (no DB, no AI calls): grade bands, chunking,
 * citation resolution and generated-question validation.
 * Run: npm run test:tutor
 */
import assert from 'node:assert/strict';
import { bandOf, gradeOf, simplerBand } from '../modules/ai-yantra/tutor/prompts';
import { chunkPages } from '../modules/ai-yantra/tutor/ingest.worker';
import { parseVerdictHeader, resolveCitations, validateQuestion } from '../modules/ai-yantra/tutor/tutor.service';
import type { RetrievedChunk } from '../modules/ai-yantra/tutor/tutor.repository';

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const chunk = (i: number, kind: 'text' | 'figure' = 'text'): RetrievedChunk => ({
  id: `00000000-0000-0000-0000-00000000000${i}`, content: kind === 'figure' ? 'FIGURE (page 9): Parts of a leaf' : `passage ${i}`,
  kind, page_start: 80 + i, page_end: 80 + i, chapter_id: 'ch', topic_id: null, textbook_file_id: 'book',
  chapter_no: 5, chapter_title: 'Life Processes', book_title: 'Science', image_key: kind === 'figure' ? 'k.jpg' : null, page_has_figures: kind === 'figure', page_figure_description: null, figure_index: kind === 'figure' ? 0 : null, page_figures: kind === 'figure' ? [{ caption: 'Fig 5.1 Leaf', image_key: 'f.jpg' }] : null, sim: 0.8,
});

console.log('AI Tutor verification');

check('class number from names (digits, roman, fallback)', () => {
  assert.equal(gradeOf('Grade 9 G2 41828', 1), 9);
  assert.equal(gradeOf('Class X'), 10);
  assert.equal(gradeOf('Class XII'), 12);
  assert.equal(gradeOf('Nursery', 3), 3);
  assert.equal(gradeOf('Nursery', null), 7);
});

check('grade bands and simpler band', () => {
  assert.deepEqual([1, 4, 7, 10, 12].map(bandOf), ['1-3', '4-5', '6-8', '9-10', '11-12']);
  assert.equal(simplerBand('9-10'), '6-8');
  assert.equal(simplerBand('1-3'), '1-3');
});

check('chunking keeps page ranges and size bounds', () => {
  const sentence = 'Plants make food by photosynthesis using sunlight and water. ';
  const chunks = chunkPages([
    { page_no: 1, text_content: sentence.repeat(40), figure_description: null },
    { page_no: 2, text_content: sentence.repeat(40), figure_description: null },
  ]);
  assert.ok(chunks.length >= 3);
  assert.ok(chunks.every((c) => c.content.length <= 1900));
  assert.equal(chunks[0].pageStart, 1);
  assert.equal(chunks[chunks.length - 1].pageEnd, 2);
});

check('citations: unknown [S#] dropped, figures surfaced', () => {
  const r = resolveCitations('Food is made in leaves [S1]. See figure [S2]. Made up [S9]. Both [S1, S2].', [chunk(1), chunk(2, 'figure')]);
  assert.ok(r.text.includes('[S1][S2]'));
  assert.ok(!r.text.includes('[S9]'));
  assert.deepEqual(r.citations.map((c) => c.ref), ['S1', 'S2']);
  assert.equal(r.citations[0].label, "Life Processes · p.81");
  assert.equal(r.figures.length, 1);
  assert.equal(r.figures[0].hasImage, true);
});

const base = {
  question: 'Where does photosynthesis happen?', options: ['Leaves', 'Roots', 'Stem', 'Flower'], correct_option_index: 0,
  answer_key: 'Leaves', rubric: [], explanation: 'Chlorophyll is in leaves.', marks: 1, topic_ref: 'T1', source_refs: ['S1'],
};
const topics = [{ ref: 'T1', id: 'topic-1' }];

check('valid MCQ accepted with answer from options', () => {
  const q = validateQuestion({ ...base, type: 'mcq' }, [chunk(1)], topics)!;
  assert.equal(q.answerKey, 'Leaves');
  assert.equal(q.topicId, 'topic-1');
  assert.deepEqual(q.sourceChunkIds, [chunk(1).id]);
});

check('malformed MCQs rejected (3 options, duplicates, bad index, no source)', () => {
  assert.equal(validateQuestion({ ...base, type: 'mcq', options: ['a', 'b', 'c'] }, [chunk(1)], topics), null);
  assert.equal(validateQuestion({ ...base, type: 'mcq', options: ['a', 'A', 'b', 'c'] }, [chunk(1)], topics), null);
  assert.equal(validateQuestion({ ...base, type: 'mcq', correct_option_index: 4 }, [chunk(1)], topics), null);
  assert.equal(validateQuestion({ ...base, type: 'mcq', source_refs: ['S7'] }, [chunk(1)], topics), null);
});

check('written question marks come from the rubric', () => {
  const q = validateQuestion({
    ...base, type: 'short', options: [], correct_option_index: -1, answer_key: 'In chloroplasts of leaf cells.',
    rubric: [{ point: 'mentions leaves', marks: 1 }, { point: 'mentions chloroplasts', marks: 1 }], marks: 5,
  }, [chunk(1)], topics)!;
  assert.equal(q.marks, 2);
  assert.equal(q.options, null);
});

check('verdict header: parsed, junk verdict refused, missing header detected', () => {
  const h = parseVerdictHeader('@@ verdict=in_syllabus topics=T2,T5 supports=- @@\nPlants make food [S1].')!;
  assert.equal(h.verdict, 'in_syllabus');
  assert.deepEqual(h.topics, ['T2', 'T5']);
  assert.equal(h.supports, null);
  assert.equal(h.rest, 'Plants make food [S1].');
  assert.equal(parseVerdictHeader('@@ verdict=whatever @@')!.verdict, 'out_of_syllabus');
  assert.equal(parseVerdictHeader('@@ verdict=linked topics=- supports=T3 @@')!.supports, 'T3');
  assert.equal(parseVerdictHeader('Plants make food'), null);
  assert.equal(parseVerdictHeader('@@ verdict=in_sylla'), null);
});

console.log(`\n${passed} checks passed`);
process.exit(0);
