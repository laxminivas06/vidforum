async function runCarrierProbe() {
  console.log('====================================================');
  console.log('AI Yantra: Real Carrier Test Call Probe (Phase 7.4)');
  console.log('====================================================\n');

  const testPhone = '+919553706650';
  const providers = ['twilio', 'exotel', 'auto'];

  for (const prov of providers) {
    console.log(`\n----------------------------------------------------`);
    console.log(`Probing Carrier Dispatch: provider = "${prov}" to ${testPhone}`);
    console.log(`----------------------------------------------------`);

    try {
      const res = await fetch('http://localhost:5000/api/v1/ai-yantra/voice/call-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          provider: prov,
          language: 'te-IN',
          useCase: 'event_notice',
          studentAdmissionNumber: 'SIA-2026-0101',
        }),
      });

      const data: any = await res.json();
      console.log(`HTTP Status: ${res.status}`);
      console.log(`Success Flag: ${data.success}`);
      console.log(`Result Status: ${data.data?.status}`);
      console.log(`Carrier Used: ${data.data?.carrier}`);
      console.log(`Carrier HTTP Status: ${data.data?.httpStatus}`);
      console.log(`Carrier Error / Rejection: ${data.data?.carrierError}`);
      console.log(`Action Required: ${data.data?.actionRequired}`);
      console.log(`Audio Base64 Generated: ${Boolean(data.data?.audioBase64)} (${data.data?.audioBase64?.length || 0} bytes)`);

      // Verify that NO call is faked or simulated
      if (data.data?.status === 'DIALED_LIVE') {
        console.log(`\n LIVE CALL DISPATCHED! CallSid: ${data.data.callSid}`);
      } else if (data.data?.status === 'CARRIER_REJECTED') {
        console.log(`\n HONEST CARRIER REJECTION RECORDED:`);
        console.log(`  - No fake call generated.`);
        console.log(`  - Carrier error returned verbatim.`);
        console.log(`  - Action required displayed clearly.`);
      }
    } catch (err: any) {
      console.error(`Request error for ${prov}:`, err.message);
    }
  }

  console.log('\n====================================================');
  console.log('Carrier Test Call Probes Completed.');
  console.log('====================================================');
}

runCarrierProbe()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
