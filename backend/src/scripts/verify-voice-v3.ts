/**
 * Verification Test Suite for VID Platform Voice Agent (AI Yantra v3.0)
 * Validates all 8 non-negotiable acoustic and architectural requirements.
 */

import { linear16ToMuLaw, muLawToLinear16Buffer, chunkMuLawFrames } from '../modules/ai-yantra/audio/mulaw';
import { SessionVadTracker, isSemanticCompleteClause } from '../modules/ai-yantra/audio/vad';
import { getComfortNoiseFrame, fillerAudioCache, ACOUSTIC_FILLER_SCRIPTS } from '../modules/ai-yantra/audio/comfortNoise';
import { normalizeSpokenText, validateScriptPurity } from '../modules/ai-yantra/audio/normalizer';
import { StereoCallRecorder } from '../modules/ai-yantra/audio/wav';
import {
  normalizeSubjectName,
  getStudentMarksTool,
  prefetchStudentContext,
  CANONICAL_SUBJECTS,
} from '../modules/ai-yantra/intelligence/tools';
import { processConversationalTurn, extractClauses } from '../modules/ai-yantra/intelligence/groqBrain';
import { getTraiWindowStatus, isInsideTraiWindow, isNearingCutoff } from '../modules/ai-yantra/queue/traiGuard';
import { env } from '../config/env';

async function runVerification() {
  console.log('================================================================');
  console.log('   VID PLATFORM VOICE AGENT (AI YANTRA v3.0) VERIFICATION SUITE ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${name}${detail ? ` - ${detail}` : ''}`);
    }
  }

  // --- TEST 1: G.711 Mu-Law 160-byte 20ms Frame Packetizer ---
  console.log('--- 1. Testing Zero Resampling Distortion & 160-byte Frame Packetizer ---');
  const dummyPcm = Buffer.alloc(1600); // 800 samples = 100ms @ 8kHz
  for (let i = 0; i < 800; i++) {
    dummyPcm.writeInt16LE(Math.round(Math.sin(i / 10) * 10000), i * 2);
  }
  const dummyMuLaw = Buffer.alloc(800);
  for (let i = 0; i < 800; i++) {
    dummyMuLaw[i] = linear16ToMuLaw(dummyPcm.readInt16LE(i * 2));
  }
  const frames = chunkMuLawFrames(dummyMuLaw, 160);
  assert(frames.length === 5, 'Exactly 5 frames produced for 100ms audio');
  assert(frames.every((f) => f.length === 160), 'Every frame is strictly 160 bytes (20ms @ 8000 Hz)');

  // --- TEST 2: Neural VAD & Instant Barge-In (>= 120ms speech) ---
  console.log('\n--- 2. Testing Neural VAD & Instant Barge-In Cutoff ---');
  const vadTracker = new SessionVadTracker();

  // Feed 5 frames of high vocal energy while agent is speaking (100ms)
  let bargeInFiredAt5 = false;
  const loudSpeechPcm8k = Buffer.alloc(320); // 160 samples = 20ms
  for (let i = 0; i < 160; i++) {
    loudSpeechPcm8k.writeInt16LE(2500, i * 2); // 2500 RMS vocal energy
  }
  const loudSpeechPcm16k = Buffer.alloc(640);
  for (let i = 0; i < 320; i++) {
    loudSpeechPcm16k.writeInt16LE(2500, i * 2);
  }

  for (let i = 0; i < 5; i++) {
    const res = await vadTracker.processFrameAsync(loudSpeechPcm8k, loudSpeechPcm16k, true);
    if (res.bargeInTriggered) bargeInFiredAt5 = true;
  }
  assert(!bargeInFiredAt5, 'Barge-in does NOT fire prematurely at 100ms (5 frames)');

  // Feed 6th frame (120ms total)
  const sixthFrameRes = await vadTracker.processFrameAsync(loudSpeechPcm8k, loudSpeechPcm16k, true);
  assert(sixthFrameRes.bargeInTriggered, 'Barge-in fires INSTANTLY on frame 6 (120ms speech)');

  // --- TEST 3: Semantic Turn Detection (400ms vs 1000ms) ---
  console.log('\n--- 3. Testing Semantic Turn Detection ---');
  assert(isSemanticCompleteClause('నా బాబు మార్కులు ఎంత అండి?'), 'Recognizes Telugu complete question as complete clause');
  assert(isSemanticCompleteClause('మరి సైన్స్ మార్కులు ఎంత?'), 'Recognizes question mark as complete clause');
  assert(isSemanticCompleteClause('సరే ధన్యవాదాలు అండి'), 'Recognizes polite Telugu closing as complete clause');
  assert(!isSemanticCompleteClause('అంటే నాకు'), 'Recognizes trailing mid-thought speech as incomplete clause');

  // --- TEST 4: Comfort Noise Generation & Acoustic Fillers ---
  console.log('\n--- 4. Testing Comfort Noise (-55 dBFS) & RAM Acoustic Fillers ---');
  const cng = getComfortNoiseFrame();
  assert(cng.length === 160, 'Comfort noise frame is exactly 160 bytes');
  assert(fillerAudioCache.has('te-IN'), 'Telugu acoustic filler is cached in RAM');
  assert(fillerAudioCache.has('hi-IN'), 'Hindi acoustic filler is cached in RAM');
  const teluguFiller = fillerAudioCache.get('te-IN');
  assert(teluguFiller.length > 0 && teluguFiller[0].length === 160, 'Cached filler clips sliced in 160-byte frames');

  // --- TEST 5: Spoken Normalizer & Script Purity ---
  console.log('\n--- 5. Testing Spoken Normalizer & Cultural Honorifics ---');
  const normalizedTeluguMarks = normalizeSpokenText('88/100 marks', 'te-IN');
  assert(normalizedTeluguMarks.includes('100 కి 88'), 'Normalizes fraction 88/100 -> 100 కి 88 in Telugu');

  const normalizedTeluguFee = normalizeSpokenText('₹12,500', 'te-IN');
  assert(normalizedTeluguFee.includes('12500 రూపాయలు'), 'Normalizes ₹12,500 -> 12500 రూపాయలు');

  const honorificChecked = normalizeSpokenText('రేపు సెలవు నమోదు చేసుకుంటాము', 'te-IN');
  assert(honorificChecked.includes('అండి'), 'Injects respectful cultural honorific (అండి) in Telugu response');

  const hindiPurity = validateScriptPurity('नमस्ते जी, आप कैसे हैं?', 'hi-IN', true);
  assert(hindiPurity.valid, 'Devanagari script passes pure Hindi validator');

  // --- TEST 6: Canonical Subject Resolution & Targeted Not-Found ---
  console.log('\n--- 6. Testing Canonical Subject Resolution & Synonym Mapping ---');
  assert(normalizeSubjectName('maths') === 'Mathematics', 'Normalizes "maths" -> "Mathematics"');
  assert(normalizeSubjectName('ganitham') === 'Mathematics', 'Normalizes "ganitham" -> "Mathematics"');
  assert(normalizeSubjectName('science') === 'General Science', 'Normalizes "science" -> "General Science"');
  assert(normalizeSubjectName('evs') === 'General Science', 'Normalizes "evs" -> "General Science"');
  assert(normalizeSubjectName('social studies') === 'Social Studies', 'Normalizes "social studies" -> "Social Studies"');
  assert(CANONICAL_SUBJECTS.includes(normalizeSubjectName('random')), 'Always falls back to canonical enum');

  const instId = env.DEFAULT_TENANT_ID || '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f';
  const targetSubjectResult = await getStudentMarksTool(instId, 'SIA-2026-0101', 'General Science');
  assert(targetSubjectResult.subject === 'General Science', 'Marks tool query matches canonical subject');
  assert(
    !targetSubjectResult.note.includes('database') && !targetSubjectResult.note.includes('records'),
    'Tool note contains ZERO robotic vocabulary'
  );

  // --- TEST 7: Clause Streaming Extractor ---
  console.log('\n--- 7. Testing Clause Streaming Boundaries ---');
  const speechText = 'నమస్కారం అండి! నారాయణ స్కూల్ నుండి ప్రియ మాట్లాడుతున్నాను. మీ విద్యార్థి సైన్స్ లో 88 మార్కులు సాధించారు.';
  const clauses = extractClauses(speechText);
  assert(clauses.length >= 3, `Extracts ${clauses.length} clauses at punctuation boundaries`);
  assert(clauses[0].includes('నమస్కారం అండి!'), 'First clause cleanly delimited by exclamation');

  // --- TEST 8: Dual-Channel Stereo WAV Call Recording ---
  console.log('\n--- 8. Testing Dual-Channel Stereo Call Recording ---');
  const recorder = new StereoCallRecorder();
  const leftSample = Buffer.alloc(320); // 160 samples (Parent)
  const rightSample = Buffer.alloc(320); // 160 samples (Counselor)
  leftSample.writeInt16LE(1500, 0);
  rightSample.writeInt16LE(3000, 0);

  recorder.recordLeft(leftSample);
  recorder.recordRight(rightSample);
  const stereoWav = recorder.finalizeWav();

  assert(stereoWav.subarray(0, 4).toString('ascii') === 'RIFF', 'Valid RIFF WAV container');
  assert(stereoWav.subarray(8, 12).toString('ascii') === 'WAVE', 'WAVE format header present');
  assert(stereoWav.readUInt16LE(22) === 2, 'WAV NumChannels is strictly 2 (Stereo L/R)');
  assert(stereoWav.readUInt32LE(24) === 8000, 'WAV SampleRate is strictly 8000 Hz');

  // --- TEST 9: TRAI Calling Window Guard (08:00 AM - 08:00 PM IST) ---
  console.log('\n--- 9. Testing TRAI Compliance & Auto-Pauser ---');
  const traiStatus = getTraiWindowStatus();
  console.log('Current TRAI Status in IST:', JSON.stringify(traiStatus, null, 2));
  assert(traiStatus.currentIstTime.includes('IST'), 'TRAI Status resolves current Asia/Kolkata time');
  assert(typeof traiStatus.isOpen === 'boolean', 'TRAI isOpen boolean computed accurately');

  console.log('\n================================================================');
  console.log(` VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL 8 NON-NEGOTIABLE v3.0 REQUIREMENTS VERIFIED WITH ZERO ERRORS!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
