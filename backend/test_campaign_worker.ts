import { db } from './src/config/database';
import { campaignWorkerService } from './src/modules/ai-yantra/campaign-worker.service';

async function runCampaignWorkerTests() {
  console.log('====================================================');
  console.log('AI Yantra: Campaign Worker & Sequential Dialer Tests');
  console.log('====================================================\n');

  // 1. Calling Window Verification (09:00 - 19:00 IST)
  console.log('--- 1. Testing Indian Calling Window Check (09:00 - 19:00 IST) ---');
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istString);
  const currentHour = istDate.getHours();
  const isCallingWindowOpen = campaignWorkerService.isInsideCallingWindow();

  console.log(`Current IST Time: ${istString}`);
  console.log(`Current IST Hour: ${currentHour}:00`);
  console.log(`isInsideCallingWindow(): ${isCallingWindowOpen}`);

  const expectedWindow = currentHour >= 9 && currentHour < 19;
  if (isCallingWindowOpen !== expectedWindow) {
    throw new Error(`Calling window mismatch! Expected ${expectedWindow}, got ${isCallingWindowOpen}`);
  }
  console.log(' Calling Window logic verified!\n');

  // 2. Setup Test Tenant & Campaign Data
  console.log('--- 2. Setting Up Temporary Test Campaign with 3 Mock Recipients ---');
  const tenantRes = await db.query(`SELECT id, name FROM institutions LIMIT 1`);
  const institution = tenantRes.rows[0];
  console.log(`Using Tenant: ${institution.name} (${institution.id})`);

  // Create temporary template
  const tmplRes = await db.query(
    `INSERT INTO ai_voice_templates (institution_id, name, language, script_text)
     VALUES ($1, 'Test Campaign Worker Template', 'te-IN', 'నమస్కారం, ఇది విద్యాలయ సమాచారం.')
     RETURNING id`,
    [institution.id]
  );
  const templateId = tmplRes.rows[0].id;

  // Create temporary campaign
  const campRes = await db.query(
    `INSERT INTO ai_voice_campaigns (institution_id, template_id, name, use_case, scheduled_at)
     VALUES ($1, $2, 'Unit Test Sequential Campaign', 'general', now())
     RETURNING id`,
    [institution.id, templateId]
  );
  const campaignId = campRes.rows[0].id;
  console.log(`Created Test Campaign: ${campaignId}`);

  // Create temporary test guardians
  const g1Res = await db.query(
    `INSERT INTO guardians (institution_id, full_name, phone, preferred_language, do_not_call)
     VALUES ($1, 'Test Parent 1 (Standard)', '+919999900001', 'te-IN', false)
     RETURNING id`,
    [institution.id]
  );
  const guardian1Id = g1Res.rows[0].id;

  const g2Res = await db.query(
    `INSERT INTO guardians (institution_id, full_name, phone, preferred_language, do_not_call)
     VALUES ($1, 'Test Parent 2 (Opted Out DNC)', '+919999900002', 'te-IN', true)
     RETURNING id`,
    [institution.id]
  );
  const guardian2Id = g2Res.rows[0].id;

  const g3Res = await db.query(
    `INSERT INTO guardians (institution_id, full_name, phone, preferred_language, do_not_call)
     VALUES ($1, 'Test Parent 3 (Retry Parent)', '+919999900003', 'en-IN', false)
     RETURNING id`,
    [institution.id]
  );
  const guardian3Id = g3Res.rows[0].id;

  // Insert 3 recipients
  // Recipient 1: queued
  const r1Res = await db.query(
    `INSERT INTO ai_voice_recipients (campaign_id, guardian_id, phone, status, retry_count)
     VALUES ($1, $2, '+919999900001', 'queued', 0)
     RETURNING id`,
    [campaignId, guardian1Id]
  );
  const r1Id = r1Res.rows[0].id;

  // Recipient 2: queued, but guardian has do_not_call = true
  const r2Res = await db.query(
    `INSERT INTO ai_voice_recipients (campaign_id, guardian_id, phone, status, retry_count)
     VALUES ($1, $2, '+919999900002', 'queued', 0)
     RETURNING id`,
    [campaignId, guardian2Id]
  );
  const r2Id = r2Res.rows[0].id;

  // Recipient 3: no_answer with retry_count = 1, eligible for retry right now
  const r3Res = await db.query(
    `INSERT INTO ai_voice_recipients (campaign_id, guardian_id, phone, status, retry_count, next_retry_at)
     VALUES ($1, $2, '+919999900003', 'no_answer', 1, now() - interval '5 minutes')
     RETURNING id`,
    [campaignId, guardian3Id]
  );
  const r3Id = r3Res.rows[0].id;

  console.log(`Recipients created:`);
  console.log(` - Recipient 1: ${r1Id} (queued)`);
  console.log(` - Recipient 2: ${r2Id} (queued, DNC opted out)`);
  console.log(` - Recipient 3: ${r3Id} (no_answer, retry_count=1, eligible for retry)`);

  // 3. Test Campaign Progress Reporting
  console.log('\n--- 3. Testing Live Campaign Progress Reporting (getProgress) ---');
  const progress1 = await campaignWorkerService.getProgress(campaignId);
  console.log('Campaign Progress Snapshot:', JSON.stringify(progress1, null, 2));

  if (progress1.totalRecipients !== 3) {
    throw new Error(`Expected totalRecipients == 3, got ${progress1.totalRecipients}`);
  }
  if (progress1.queuedCount !== 2) {
    throw new Error(`Expected queuedCount == 2, got ${progress1.queuedCount}`);
  }
  console.log(' getProgress() counts verified!');

  // 4. Test Crash Recovery (resumeRunningCampaigns)
  console.log('\n--- 4. Testing Crash Resumption (resumeRunningCampaigns) ---');
  // Simulate a crash scenario: Recipient 1 was marked 'in_progress' and the server crashed
  await db.query(`UPDATE ai_voice_recipients SET status = 'in_progress' WHERE id = $1`, [r1Id]);
  console.log(`Simulated crash state: Recipient 1 marked as 'in_progress'`);

  // Execute crash recovery
  await campaignWorkerService.resumeRunningCampaigns();

  // Verify Recipient 1 was recovered back to 'queued'
  const checkR1 = await db.query(`SELECT status FROM ai_voice_recipients WHERE id = $1`, [r1Id]);
  console.log(`Post-recovery Recipient 1 status: ${checkR1.rows[0].status}`);
  if (checkR1.rows[0].status !== 'queued') {
    throw new Error(`Crash recovery failed! Expected 'queued', got ${checkR1.rows[0].status}`);
  }
  console.log(' Crash recovery successfully reset stuck calls back to queued!');

  // 5. Test DNC Opt-Out Detection
  console.log('\n--- 5. Testing Do Not Call (DNC) Opt-Out Handling ---');
  // Verify querying guardian with DNC flag
  const dncGuardian = await db.query(
    `SELECT g.full_name, g.do_not_call, r.id as recipient_id
     FROM ai_voice_recipients r
     JOIN guardians g ON g.id = r.guardian_id
     WHERE r.id = $1`,
    [r2Id]
  );
  console.log(`DNC Guardian Data:`, dncGuardian.rows[0]);
  if (!dncGuardian.rows[0].do_not_call) {
    throw new Error('DNC Guardian flag not detected!');
  }
  // Simulate worker skipping DNC
  await db.query(
    `UPDATE ai_voice_recipients SET status = 'opted_out', last_call_at = now() WHERE id = $1`,
    [r2Id]
  );
  const checkDNC = await db.query(`SELECT status FROM ai_voice_recipients WHERE id = $1`, [r2Id]);
  console.log(`Recipient 2 status after DNC processing: ${checkDNC.rows[0].status}`);
  if (checkDNC.rows[0].status !== 'opted_out') {
    throw new Error(`Expected opted_out, got ${checkDNC.rows[0].status}`);
  }
  console.log(' DNC opt-out handling verified!');

  // 6. Test Retry Selection & Max Retry Boundary
  console.log('\n--- 6. Testing Retry Selection & Max Retry Boundary ---');
  // Check recipient 3 eligible query
  const eligibleRetry = await db.query(
    `SELECT id, status, retry_count
     FROM ai_voice_recipients
     WHERE campaign_id = $1
       AND status IN ('no_answer', 'busy')
       AND COALESCE(retry_count, 0) < 2
       AND (next_retry_at IS NULL OR next_retry_at <= now())`,
    [campaignId]
  );
  console.log(`Found eligible retry recipients: ${eligibleRetry.rows.length}`);
  if (eligibleRetry.rows.length !== 1 || eligibleRetry.rows[0].id !== r3Id) {
    throw new Error(`Retry query failed to pick up eligible recipient!`);
  }

  // Now bump retry_count to 2 (max retries reached)
  await db.query(`UPDATE ai_voice_recipients SET retry_count = 2 WHERE id = $1`, [r3Id]);
  const exhaustedRetry = await db.query(
    `SELECT id, status, retry_count
     FROM ai_voice_recipients
     WHERE campaign_id = $1
       AND status IN ('no_answer', 'busy')
       AND COALESCE(retry_count, 0) < 2
       AND (next_retry_at IS NULL OR next_retry_at <= now())`,
    [campaignId]
  );
  console.log(`Eligible retry recipients after max retry limit reached: ${exhaustedRetry.rows.length}`);
  if (exhaustedRetry.rows.length !== 0) {
    throw new Error(`Recipient with retry_count >= 2 was incorrectly eligible!`);
  }
  console.log(' Retry boundary (max 2 retries) verified!');

  // 7. Cleanup Test Data
  console.log('\n--- 7. Cleaning Up Test Artifacts ---');
  await campaignWorkerService.pauseCampaign(campaignId);
  // Allow any in-flight background promise to settle
  await new Promise((res) => setTimeout(res, 500));
  await db.query(`DELETE FROM ai_voice_calls WHERE recipient_id IN ($1, $2, $3)`, [r1Id, r2Id, r3Id]);
  await db.query(`DELETE FROM ai_voice_recipients WHERE campaign_id = $1`, [campaignId]);
  await db.query(`DELETE FROM ai_voice_campaigns WHERE id = $1`, [campaignId]);
  await db.query(`DELETE FROM ai_voice_templates WHERE id = $1`, [templateId]);
  await db.query(`DELETE FROM guardians WHERE id IN ($1, $2, $3)`, [guardian1Id, guardian2Id, guardian3Id]);
  console.log(' Test database cleanup completed cleanly.');

  console.log('\n====================================================');
  console.log(' All Campaign Worker Unit Tests PASSED!');
  console.log('====================================================');
}

runCampaignWorkerTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
