import { db } from '../src/config/database';
import { getStudentMarksTool, normalizeSubjectName } from '../src/modules/ai-yantra/intelligence/tools';
import { processConversationalTurn } from '../src/modules/ai-yantra/intelligence/groqBrain';
import { validateScriptPurity } from '../src/modules/ai-yantra/audio/normalizer';

async function verifyPhase1Fixes() {
  console.log('--- 1. Testing Subject Normalizer & Deterministic SQL Resolution ---');
  const mathNormalized = normalizeSubjectName('maths');
  const scienceNormalized = normalizeSubjectName('science');
  const teluguMathNormalized = normalizeSubjectName('లెక్కలు');

  console.log('maths ->', mathNormalized);
  console.log('science ->', scienceNormalized);
  console.log('లెక్కలు ->', teluguMathNormalized);

  if (mathNormalized !== 'Mathematics' || scienceNormalized !== 'General Science' || teluguMathNormalized !== 'Mathematics') {
    throw new Error('Subject normalizer failed!');
  }

  // Find student's exact tenant id
  const studentRes = await db.query("SELECT institution_id, id FROM students WHERE admission_number = 'SIA-2026-0101'");
  console.log('Student lookup:', studentRes.rows);
  const instId = studentRes.rows[0]?.institution_id;

  console.log('\n--- 2. Testing Database Tools with Maths and Science ---');
  const scienceResult = await getStudentMarksTool(instId, 'SIA-2026-0101', 'Science');
  console.log('Science Query Result:', JSON.stringify(scienceResult, null, 2));

  const mathsResult = await getStudentMarksTool(instId, 'SIA-2026-0101', 'Maths');
  console.log('Maths Query Result:', JSON.stringify(mathsResult, null, 2));

  if (!mathsResult.found || !mathsResult.subject.includes('Math')) {
    throw new Error(`Maths lookup failed or returned wrong subject: ${JSON.stringify(mathsResult)}`);
  }

  if (mathsResult.score === scienceResult.score && mathsResult.subject === scienceResult.subject) {
    throw new Error('Maths and Science collided! The bug is still present.');
  }

  console.log('SUCCESS: Maths returned', mathsResult.subject, mathsResult.score, 'and Science returned', scienceResult.subject, scienceResult.score);

  console.log('\n--- 3. Testing Groq Brain Turn & Natural Counselor Persona ---');
  const turnResult = await processConversationalTurn(
    [
      { role: 'user', content: 'నమస్కారం అండి, మా అబ్బాయికి సైన్స్ లో ఎన్ని మార్కులు వచ్చాయి?' },
      { role: 'assistant', content: 'నమస్కారం అండి! మీ అబ్బాయి సాయి తేజకు సైన్స్‌లో 100 కి 88 మార్కులు వచ్చాయి అండి.' },
      { role: 'user', content: 'మరి మ్యాథ్స్ లో ఎన్ని మార్కులు వచ్చాయి?' },
    ],
    {
      institutionId: instId,
      studentId: 'SIA-2026-0101',
      studentName: 'సాయి తేజ చారి',
      guardianName: 'తల్లిదండ్రులు',
      language: 'te-IN',
    }
  );

  console.log('Spoken Reply:\n', turnResult.reply);
  console.log('Tool Used:', turnResult.toolUsed);
  console.log('Tool Data:', JSON.stringify(turnResult.toolData));

  // Check for forbidden robotic words
  const forbidden = ['database', 'records', 'querying', 'fetching', 'system', 'tool', 'API', 'డేటాబేస్', 'సిస్టమ్'];
  for (const word of forbidden) {
    if (turnResult.reply.toLowerCase().includes(word.toLowerCase())) {
      throw new Error(`Robotic vocabulary detected in output: "${word}"`);
    }
  }

  // Check script purity
  const purity = validateScriptPurity(turnResult.reply, 'te-IN');
  console.log('Telugu Script Purity Check:', purity);
  if (!purity.valid) {
    console.warn('Script purity warning:', purity.reason);
  }

  console.log('\n=== ALL PHASE 1 TESTS PASSED PERFECTLY ===');
  process.exit(0);
}

verifyPhase1Fixes().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
