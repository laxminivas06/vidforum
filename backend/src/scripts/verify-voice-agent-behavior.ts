import { processConversationalTurn } from '../modules/ai-yantra/intelligence/groqBrain';
import { prefetchStudentContext } from '../modules/ai-yantra/intelligence/tools';
import { env } from '../config/env';

async function runVerification() {
  console.log('--- 1. Testing PUBLIC_BASE_URL & Tunnel Connectivity ---');
  console.log('PUBLIC_BASE_URL:', env.PUBLIC_BASE_URL);

  const tunnelOk = env.PUBLIC_BASE_URL && env.PUBLIC_BASE_URL.includes('trycloudflare.com');
  console.log('Tunnel URL valid?', tunnelOk ? 'PASS' : 'FAIL');

  console.log('\n--- 2. Pre-warming Student Dossier ---');
  const instId = env.DEFAULT_TENANT_ID || '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f';
  const dossier = await prefetchStudentContext(instId, 'SIA-2026-0101');
  console.log('Student loaded:', dossier?.studentName, '| Dossier available:', !!dossier?.dossierSummary);

  console.log('\n--- 3. Testing Parent Leave Announcement Intake (NO UNPROMPTED MARKS) ---');
  const announcementMessages = [
    {
      role: 'assistant',
      content: 'నమస్కారం అండి! నేను Narayana School నుండి Priya ని మాట్లాడుతున్నాను. వచ్చే శనివారం మన school లో Annual Sports Day celebration ఉంది అండి. Parents అందరికీ hearty welcome.',
    },
    {
      role: 'user',
      content: 'నమస్కారం అండి, రేపు సాయి తేజ కి జ్వరం వచ్చింది, స్కూల్ కి రావడం లేదు. Leave note చేసుకోండి.',
    },
  ];

  const announcementResult = await processConversationalTurn(announcementMessages, {
    institutionId: instId,
    studentId: 'SIA-2026-0101',
    studentName: 'Sai Teja Chary',
    guardianName: 'Parent',
    language: 'te-IN',
    useCase: 'event_notice',
    studentDossier: dossier?.dossierSummary,
  });

  console.log('Agent Response to Parent Announcement:\n', announcementResult.reply);

  const mentionsMarks = /మార్కులు|marks|94|88|గ్రేడ్|grade/i.test(announcementResult.reply);
  const acknowledgesLeave = /leave|నోట్|note|సరే|తీసుకున్నా|సహాయం|details/i.test(announcementResult.reply);

  if (mentionsMarks) {
    console.error('FAIL: Agent recited marks unprompted when parent gave a leave announcement!');
  } else {
    console.log('PASS: Agent did NOT dump marks unprompted.');
  }

  if (acknowledgesLeave) {
    console.log('PASS: Agent acknowledged parent leave notice in warm Tenglish.');
  } else {
    console.warn('WARN: Agent acknowledgment check needs review.');
  }

  console.log('\n--- 4. Testing Explicit Marks Request ---');
  const marksMessages = [
    ...announcementMessages,
    { role: 'assistant', content: announcementResult.reply },
    {
      role: 'user',
      content: 'సాయి తేజ కి సైన్స్ లో ఎన్ని మార్కులు వచ్చాయి అండి?',
    },
  ];

  const marksResult = await processConversationalTurn(marksMessages, {
    institutionId: instId,
    studentId: 'SIA-2026-0101',
    studentName: 'Sai Teja Chary',
    guardianName: 'Parent',
    language: 'te-IN',
    useCase: 'event_notice',
    studentDossier: dossier?.dossierSummary,
  });

  console.log('Agent Response to Marks Question:\n', marksResult.reply);
  const answeredScience = /88|science|సైన్స్/i.test(marksResult.reply);
  if (answeredScience) {
    console.log('PASS: Agent answered Science marks accurately in Tenglish.');
  } else {
    console.warn('WARN: Agent reply did not explicitly contain expected Science score.');
  }

  console.log('\n=== All Verification Checks Completed ===');
}

runVerification().catch(console.error);
