import { db } from '../../config/database';
import { env } from '../../config/env';
import { getTelephonyProvider, maskPhoneNumber, normalizeE164 } from './telephony';

export interface CampaignProgress {
  campaignId: string;
  status: string;
  totalRecipients: number;
  completedCount: number;
  inProgressCount: number;
  queuedCount: number;
  failedCount: number;
  currentRecipient: {
    phone: string;
    guardianName: string;
    studentName: string;
    status: string;
  } | null;
  callingWindowOpen: boolean;
}

export class CampaignWorkerService {
  private activeCampaignJobs = new Set<string>();
  private isProcessing = false;

  // Indian Calling Window check: 9:00 AM to 7:00 PM IST
  isInsideCallingWindow(): boolean {
    const now = new Date();
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    const hours = istDate.getHours();
    return hours >= 9 && hours < 19;
  }

  // Resume all active campaigns on server restart
  async resumeRunningCampaigns() {
    try {
      // Reset any recipient stuck in 'dialing' or 'in_progress' from previous crash
      await db.query(
        `UPDATE ai_voice_recipients
         SET status = 'queued'
         WHERE status IN ('dialing', 'in_progress')`
      );

      const activeRes = await db.query(
        `SELECT c.id FROM ai_voice_campaigns c
         WHERE (SELECT count(*) FROM ai_voice_recipients WHERE campaign_id = c.id AND status IN ('queued', 'no_answer', 'busy')) > 0`
      );

      for (const row of activeRes.rows) {
        this.startCampaignDialer(row.id);
      }
      console.log(`[CAMPAIGN WORKER] Resumed ${activeRes.rows.length} pending campaigns on startup.`);
    } catch (err: any) {
      console.error('[CAMPAIGN WORKER RESUME ERROR]', err.message);
    }
  }

  // Start sequential dialer for a campaign
  async startCampaignDialer(campaignId: string) {
    if (this.activeCampaignJobs.has(campaignId)) return;
    this.activeCampaignJobs.add(campaignId);

    // Run dialer loop in background
    this.runDialerLoop(campaignId).catch((err) => {
      console.error(`[CAMPAIGN ${campaignId} DIALER ERROR]`, err.message);
      this.activeCampaignJobs.delete(campaignId);
    });
  }

  // Pause campaign
  async pauseCampaign(campaignId: string) {
    this.activeCampaignJobs.delete(campaignId);
    console.log(`[CAMPAIGN WORKER] Campaign ${campaignId} paused.`);
  }

  // Cancel campaign
  async cancelCampaign(campaignId: string) {
    this.activeCampaignJobs.delete(campaignId);
    await db.query(
      `UPDATE ai_voice_recipients
       SET status = 'cancelled'
       WHERE campaign_id = $1 AND status = 'queued'`,
      [campaignId]
    );
    console.log(`[CAMPAIGN WORKER] Campaign ${campaignId} cancelled.`);
  }

  // Sequential dialer loop: 1 parent at a time
  private async runDialerLoop(campaignId: string) {
    console.log(`[CAMPAIGN WORKER] Starting sequential dialer for Campaign: ${campaignId}`);

    while (this.activeCampaignJobs.has(campaignId)) {
      // 1. Check Calling Window (9:00 - 19:00 IST)
      if (!this.isInsideCallingWindow()) {
        console.log(`[CAMPAIGN WORKER] Outside calling window (09:00 - 19:00 IST). Pausing campaign ${campaignId}.`);
        await new Promise((resolve) => setTimeout(resolve, 60000));
        continue;
      }

      // 2. Fetch NEXT eligible recipient
      const recipientRes = await db.query(
        `SELECT r.id, r.campaign_id, r.phone, r.retry_count, r.status,
                g.id as guardian_id, g.full_name as guardian_name,
                COALESCE(g.preferred_language, t.language, 'te-IN') as preferred_language,
                COALESCE(g.do_not_call, false) as do_not_call,
                s.id as student_id, (s.first_name || ' ' || s.last_name) as student_name, s.admission_number,
                c.institution_id, c.use_case, c.name as campaign_name,
                t.script_text
         FROM ai_voice_recipients r
         JOIN ai_voice_campaigns c ON c.id = r.campaign_id
         LEFT JOIN ai_voice_templates t ON t.id = c.template_id
         LEFT JOIN guardians g ON g.id = r.guardian_id
         LEFT JOIN student_guardians sg ON sg.guardian_id = g.id
         LEFT JOIN students s ON s.id = sg.student_id
         WHERE r.campaign_id = $1
           AND (
             r.status = 'queued'
             OR (r.status IN ('no_answer', 'busy') AND COALESCE(r.retry_count, 0) < 2 AND (r.next_retry_at IS NULL OR r.next_retry_at <= now()))
           )
         ORDER BY r.created_at ASC
         LIMIT 1`,
        [campaignId]
      );

      if (recipientRes.rows.length === 0) {
        // Check if all recipients have finished
        const remainingRes = await db.query(
          `SELECT count(*) FROM ai_voice_recipients
           WHERE campaign_id = $1 AND status IN ('queued', 'dialing', 'in_progress')`,
          [campaignId]
        );

        if (parseInt(remainingRes.rows[0].count, 10) === 0) {
          console.log(`[CAMPAIGN WORKER] Campaign ${campaignId} completed! All recipients processed.`);
          this.activeCampaignJobs.delete(campaignId);
          break;
        }

        // Wait for retry cooldown
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      const recipient = recipientRes.rows[0];

      // 3. Honor Do Not Call (DNC) opt-out
      if (recipient.do_not_call) {
        console.log(`[CAMPAIGN WORKER] Skipping ${maskPhoneNumber(recipient.phone)} — Opted out (do_not_call = true)`);
        await db.query(
          `UPDATE ai_voice_recipients SET status = 'opted_out', last_call_at = now() WHERE id = $1`,
          [recipient.id]
        );
        continue;
      }

      // 4. Mark recipient as dialing
      await db.query(
        `UPDATE ai_voice_recipients SET status = 'dialing', last_call_at = now() WHERE id = $1`,
        [recipient.id]
      );

      // 5. Build Call Context & URLs
      let streamUrl: string | undefined;
      let webhookUrl: string | undefined;

      if (env.PUBLIC_BASE_URL) {
        const cleanBase = env.PUBLIC_BASE_URL.replace(/\/$/, '');
        const wsHost = cleanBase.replace(/^http/, 'ws');
        streamUrl = `${wsHost}/api/v1/ai-yantra/voice/stream`;
        webhookUrl = `${cleanBase}/api/v1/ai-yantra/voice/webhook/call-ended`;
      }

      const telephonyProvider = getTelephonyProvider();

      console.log(
        `[CAMPAIGN WORKER] Dialing parent: ${recipient.guardian_name || 'Parent'} (${maskPhoneNumber(recipient.phone)}) for student ${recipient.student_name} [${recipient.preferred_language}]`
      );

      const callResult = await telephonyProvider.placeCall(recipient.phone, {
        institutionId: recipient.institution_id,
        studentId: recipient.student_id,
        studentName: recipient.student_name,
        guardianId: recipient.guardian_id,
        guardianName: recipient.guardian_name,
        language: recipient.preferred_language,
        useCase: recipient.use_case,
        campaignId,
        streamUrl,
        webhookUrl,
        initialMessage: recipient.script_text,
      });

      // 6. Handle Carrier Response
      if (callResult.status === 'carrier_rejected' || callResult.status === 'failed') {
        const currentRetry = (recipient.retry_count || 0) + 1;
        const willRetry = currentRetry < 2 && callResult.httpStatus !== 403;

        console.warn(
          `[CAMPAIGN WORKER] Call to ${maskPhoneNumber(recipient.phone)} rejected by carrier: ${callResult.errorMessage}`
        );

        await db.query(
          `UPDATE ai_voice_recipients
           SET status = $2,
               retry_count = $3,
               next_retry_at = $4,
               last_call_at = now()
           WHERE id = $1`,
          [
            recipient.id,
            willRetry ? 'no_answer' : 'failed',
            currentRetry,
            willRetry ? new Date(Date.now() + 30 * 60 * 1000) : null,
          ]
        );

        // Record failed call log
        await db.query(
          `INSERT INTO ai_voice_calls (recipient_id, status, duration_seconds, conversation_payload, started_at, ended_at)
           VALUES ($1, 'failed', 0, $2, now(), now())`,
          [
            recipient.id,
            JSON.stringify({
              error: callResult.errorMessage,
              actionRequired: callResult.actionRequired,
              provider: callResult.provider,
            }),
          ]
        );
      } else {
        // Call placed successfully! Mark as in_progress
        await db.query(
          `UPDATE ai_voice_recipients SET status = 'in_progress', last_call_at = now() WHERE id = $1`,
          [recipient.id]
        );

        // Wait for call completion (or max 6-minute timeout per call)
        await this.waitForCallCompletion(recipient.id);
      }

      // 7. Mandatory 3-second pacing between calls
      console.log(`[CAMPAIGN WORKER] Call turn finished. Waiting 3 seconds before next call...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Poll until active call concludes or reaches 6-minute timeout
  private async waitForCallCompletion(recipientId: string, maxWaitSeconds = 360): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < maxWaitSeconds * 1000) {
      const res = await db.query(
        `SELECT status FROM ai_voice_recipients WHERE id = $1`,
        [recipientId]
      );
      const st = res.rows[0]?.status;
      if (st === 'completed' || st === 'failed' || st === 'interrupted' || st === 'no_answer') {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Timed out: mark completed
    await db.query(
      `UPDATE ai_voice_recipients SET status = 'completed' WHERE id = $1`,
      [recipientId]
    );
  }

  // Get Live Campaign Progress for UI
  async getProgress(campaignId: string): Promise<CampaignProgress> {
    const statsRes = await db.query(
      `SELECT count(*)::int as total,
              count(*) filter (where status = 'completed')::int as completed,
              count(*) filter (where status IN ('dialing', 'in_progress'))::int as in_progress,
              count(*) filter (where status = 'queued')::int as queued,
              count(*) filter (where status = 'failed')::int as failed
       FROM ai_voice_recipients
       WHERE campaign_id = $1`,
      [campaignId]
    );

    const currentRes = await db.query(
      `SELECT r.phone, r.status, g.full_name as guardian_name, (s.first_name || ' ' || s.last_name) as student_name
       FROM ai_voice_recipients r
       LEFT JOIN guardians g ON g.id = r.guardian_id
       LEFT JOIN student_guardians sg ON sg.guardian_id = g.id
       LEFT JOIN students s ON s.id = sg.student_id
       WHERE r.campaign_id = $1 AND r.status IN ('dialing', 'in_progress')
       LIMIT 1`,
      [campaignId]
    );

    const stats = statsRes.rows[0] || {};
    const curr = currentRes.rows[0];

    const isRunning = this.activeCampaignJobs.has(campaignId);
    let campaignStatus = isRunning ? 'ACTIVE_DISPATCH' : 'SCHEDULED';
    if (stats.total > 0 && stats.completed === stats.total) {
      campaignStatus = 'COMPLETED';
    }

    return {
      campaignId,
      status: campaignStatus,
      totalRecipients: stats.total || 0,
      completedCount: stats.completed || 0,
      inProgressCount: stats.in_progress || 0,
      queuedCount: stats.queued || 0,
      failedCount: stats.failed || 0,
      currentRecipient: curr ? {
        phone: maskPhoneNumber(curr.phone),
        guardianName: curr.guardian_name || 'Parent',
        studentName: curr.student_name || 'Student',
        status: curr.status,
      } : null,
      callingWindowOpen: this.isInsideCallingWindow(),
    };
  }
}

export const campaignWorkerService = new CampaignWorkerService();
