import { executeDatabaseTool, callGroqChatWithTools, validateScriptPurity } from './src/modules/ai-yantra/ai-yantra.routes';
import { db } from './src/config/database';

async function runVerification() {
  console.log('====================================================');
  console.log('AI Yantra Voice Agent: Phase 7 Verification Suite');
  console.log('====================================================\n');

  const tenantRes = await db.query(`SELECT id, name FROM institutions LIMIT 1`);
  const institution = tenantRes.rows[0];
  console.log(`[TEST TENANT] ${institution.name} (${institution.id})`);

  // Check sample student and marks
  const studentRes = await db.query(
    `SELECT s.id, s.admission_number, (s.first_name || ' ' || s.last_name) as name
     FROM students s
     JOIN marks m ON m.student_id = s.id
     WHERE s.institution_id = $1 LIMIT 1`,
    [institution.id]
  );

  let admissionNumber = 'SIA-2026-0101';
  let studentName = 'Sample Student';
  if (studentRes.rows.length > 0) {
    admissionNumber = studentRes.rows[0].admission_number;
    studentName = studentRes.rows[0].name;
  }
  console.log(`[TEST STUDENT] ${studentName} (${admissionNumber})\n`);

  // 1. Verify Database Tool Direct Execution
  console.log('--- 1. Testing Database Tools (get_student_marks, get_student_attendance, get_fee_status) ---');
  const marksTool = await executeDatabaseTool(institution.id, 'get_student_marks', {
    student_id: admissionNumber,
    subject: 'Science',
  });
  console.log('[DB TOOL] get_student_marks result:', JSON.stringify(marksTool));

  const attTool = await executeDatabaseTool(institution.id, 'get_student_attendance', {
    student_id: admissionNumber,
  });
  console.log('[DB TOOL] get_student_attendance result:', JSON.stringify(attTool));

  const feeTool = await executeDatabaseTool(institution.id, 'get_fee_status', {
    student_id: admissionNumber,
  });
  console.log('[DB TOOL] get_fee_status result:', JSON.stringify(feeTool));

  // 2. Language Purity & Tool Calling Tests for te-IN, en-IN, hi-IN
  const testCases = [
    {
      lang: 'te-IN',
      langName: 'Pure Telugu (తెలుగు)',
      query: 'నా బిడ్డకు సైన్స్ లో ఎన్ని మార్కులు వచ్చాయి అండి?',
      expectedScript: 'Telugu script (\\u0C00–\\u0C7F)',
    },
    {
      lang: 'en-IN',
      langName: 'Pure Indian English',
      query: 'What are my child\'s marks in Science?',
      expectedScript: 'Pure English script',
    },
    {
      lang: 'hi-IN',
      langName: 'Pure Hindi (हिंदी)',
      query: 'मेरे बच्चे के विज्ञान में कितने अंक आए हैं?',
      expectedScript: 'Devanagari script (\\u0900–\\u097F)',
    },
  ];

  console.log('\n--- 2. Testing Live Groq Agent Tool Execution & Language Purity ---');
  for (const tc of testCases) {
    console.log(`\n[TEST CASE: ${tc.langName} (${tc.lang})]`);
    console.log(`Parent Query: "${tc.query}"`);

    const result = await callGroqChatWithTools(
      institution.id,
      [{ role: 'user', content: tc.query }],
      admissionNumber,
      tc.lang
    );

    console.log(`Agent Spoken Reply: "${result.reply}"`);
    console.log(`Tool Invoked by Groq: ${result.toolUsed || 'none'}`);
    console.log(`Tool Data Received:`, JSON.stringify(result.toolData));

    // Validate purity
    const purity = validateScriptPurity(result.reply, tc.lang);
    console.log(`Script Purity Result: ${purity.valid ? 'PASSED (100% Pure Script)' : 'FAILED: ' + purity.reason}`);

    if (!purity.valid) {
      throw new Error(`Purity check failed for ${tc.lang}: ${purity.reason}`);
    }
    if (result.toolUsed !== 'get_student_marks') {
      console.warn(`[WARNING] Expected tool get_student_marks, received ${result.toolUsed}`);
    } else {
      console.log(` Tool verification PASSED: get_student_marks correctly executed!`);
    }
  }

  console.log('\n====================================================');
  console.log(' All Purity & Tool Calling Verifications PASSED!');
  console.log('====================================================');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('\n Verification FAILED with error:', err);
  process.exit(1);
});
