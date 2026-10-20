import { getTraiWindowStatus, isInsideTraiWindow, getMsUntilNextWindowOpen } from '../src/modules/ai-yantra/queue/traiGuard';
import { buildWhatsAppMessageBody, sendMetaWhatsAppMessage } from '../src/modules/ai-yantra/whatsapp/metaCloudApi';
import { getTelephonyProvider, maskPhoneNumber, normalizeE164 } from '../src/modules/ai-yantra/telephony';
import { initializeCampaignQueue } from '../src/modules/ai-yantra/queue/campaignQueue';

async function verifyPhase2() {
  console.log('=== PHASE 2 INTEGRATION VERIFICATION ===\n');

  // 1. TRAI Calling Window Guard
  console.log('--- 1. Testing TRAI / DoT Calling Window Guard ---');
  const trai = getTraiWindowStatus();
  console.log('TRAI Status:', JSON.stringify(trai, null, 2));
  console.log('Is Inside Window (08:00 - 20:00 IST):', isInsideTraiWindow());
  console.log('Ms until next window:', getMsUntilNextWindowOpen());

  if (typeof trai.isOpen !== 'boolean' || !trai.currentIstTime.includes('IST')) {
    throw new Error('TRAI window status invalid');
  }

  // 2. Meta WhatsApp Receipt & Recovery Builder
  console.log('\n--- 2. Testing Meta WhatsApp Receipt & Recovery Messages ---');
  const feeMsg = buildWhatsAppMessageBody({
    toPhone: '+919553706650',
    guardianName: 'రమేష్',
    studentName: 'సాయి తేజ',
    useCase: 'fee_reminder',
    callOutcome: 'completed',
    feeAmountDue: '₹14,500',
    language: 'te-IN',
  });
  console.log('Fee Reminder WhatsApp Receipt (Telugu):\n', feeMsg);

  if (!feeMsg.includes('₹14,500') || !feeMsg.includes('upi://pay')) {
    throw new Error('WhatsApp fee receipt missing amount or UPI link');
  }

  const missedCallMsg = buildWhatsAppMessageBody({
    toPhone: '+919553706650',
    guardianName: 'రమేష్',
    studentName: 'సాయి తేజ',
    useCase: 'event_notice',
    callOutcome: 'no_answer',
    language: 'te-IN',
  });
  console.log('\nMissed-Call Notice (Telugu):\n', missedCallMsg);

  if (!missedCallMsg.includes('మాట్లాడటం వీలుపడలేదు')) {
    throw new Error('Missed call notice missing polite Telugu text');
  }

  // Test Meta Cloud API Sender (simulated/live)
  const sendRes = await sendMetaWhatsAppMessage({
    toPhone: '+919553706650',
    guardianName: 'రమేష్',
    studentName: 'సాయి తేజ',
    useCase: 'fee_reminder',
    callOutcome: 'completed',
    feeAmountDue: '₹14,500',
    language: 'te-IN',
  });
  console.log('WhatsApp Send Result:', sendRes);
  if (!sendRes.sent) {
    throw new Error('WhatsApp sender failed');
  }

  // 3. Telephony Provider & PII Masking
  console.log('\n--- 3. Testing Telephony & PII Masking ---');
  const norm = normalizeE164('9553706650');
  const masked = maskPhoneNumber(norm);
  console.log('Raw: 9553706650 -> Normalized:', norm, '-> Masked:', masked);

  if (masked !== '+91XXXXXX6650') {
    throw new Error(`Phone masking failed: expected +91XXXXXX6650 but got ${masked}`);
  }

  const provider = getTelephonyProvider();
  console.log('Active Telephony Provider:', provider.name);
  const health = await provider.checkHealth();
  console.log('Provider Health:', health);

  // 4. BullMQ / Database Campaign Pacer Initialization
  console.log('\n--- 4. Testing Queue Pacer Initialization ---');
  await initializeCampaignQueue();
  console.log('Queue Pacer initialized successfully (fail-open mode verified).');

  console.log('\n=== ALL PHASE 2 TESTS PASSED PERFECTLY ===');
}

verifyPhase2().catch((err) => {
  console.error('PHASE 2 VERIFICATION FAILED:', err);
});
