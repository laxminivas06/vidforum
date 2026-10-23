/**
 * BullMQ + Redis Campaign Pacer & Pacing Queue Worker
 * Enforces rate-limiting (max 10 calls/sec), concurrency limits (10 concurrent calls),
 * Answering Machine Detection (AMD) with exponential backoff (45m later, max 2 retries)
 * for busy/no-answer, and strict 08:00 AM - 08:00 PM IST TRAI regulatory guard (auto-pause at 19:58 IST).
 * Fail-Open Architecture: If Redis is unavailable, automatically runs in degraded
 * PostgreSQL/memory pacer mode without crashing or blocking teammates.
 */

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '../../../config/database';
import { env } from '../../../config/env';
import {
  isInsideTraiWindow,
  isNearingCutoff,
  startTraiComplianceMonitor,
} from './traiGuard';
import { getTelephonyProvider, maskPhoneNumber } from '../telephony';

export interface CampaignJobData {
  campaignId: string;
  recipientId: string;
  phone: string;
  guardianName: string;
  studentName: string;
  language: string;
  useCase: string;
  institutionId: string;
  scriptText?: string;
  attemptNumber: number;
}

const QUEUE_NAME = 'ai-yantra-voice-campaigns';
const MAX_CONCURRENCY = 10;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_DURATION_MS = 1000;
const RETRY_BACKOFF_MS = 45 * 60 * 1000; // 45 minutes for busy/no-answer

let redisClient: IORedis | null = null;
let campaignQueue: Queue<CampaignJobData> | null = null;
let campaignWorker: Worker<CampaignJobData> | null = null;
let isRedisAvailable = false;
let isTraiPausedGlobally = false;

// Active in-memory tracking for fallback mode
const activeFallbackIntervals = new Map<string, NodeJS.Timeout>();

/**
 * Initializes Redis connection with fail-open safety
 */
function getRedisConnection(): IORedis | null {
  if (redisClient) return redisClient;

  try {
    const client = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[CAMPAIGN QUEUE:REDIS] Redis unreachable after 3 attempts. Failing open to database pacer.');
          return null;
        }
        return Math.min(times * 1000, 3000);
      },
      lazyConnect: true,
    });

    client.on('error', (err) => {
      if (isRedisAvailable) {
        console.warn('[CAMPAIGN QUEUE:REDIS ERROR] Connection dropped, degraded to fail-open mode:', err.message);
      }
      isRedisAvailable = false;
    });

    redisClient = client;
    return client;
  } catch (err: any) {
    console.warn('[CAMPAIGN QUEUE:REDIS INIT FAIL] Running in local fallback mode:', err.message);
    return null;
  }
}

/**
 * Executes a single outbound telephone call for a recipient with AMD and Retry handling
 */
async function executeRecipientDial(jobData: CampaignJobData): Promise<{ status: string; errorMessage?: string }> {
  // 1. TRAI Calling Window Guard (08:00 AM - 08:00 PM IST)
  if (!isInsideTraiWindow() || isNearingCutoff() || isTraiPausedGlobally) {
    console.log(
      `[CAMPAIGN PACER] Postponing dial to ${maskPhoneNumber(jobData.phone)}: Outside TRAI window or nearing 07:58 PM cutoff.`
    );
    return { status: 'trai_paused', errorMessage: 'Call postponed to next TRAI window (08:00 AM IST).' };
  }

  // 2. Build Call Context & URLs
  let streamUrl: string | undefined;
  let webhookUrl: string | undefined;

  if (env.PUBLIC_BASE_URL) {
    const cleanBase = env.PUBLIC_BASE_URL.replace(/\/$/, '');
    const wsHost = cleanBase.replace(/^http/, 'ws');
    streamUrl = `${wsHost}/api/v1/ai-yantra/voice/stream`;
    webhookUrl = `${cleanBase}/api/v1/ai-yantra/voice/webhook/call-ended`;
  }

  const telephony = getTelephonyProvider();

  // 3. Mark recipient status as dialing in DB
  await db.query(`UPDATE ai_voice_recipients SET status = 'dialing', last_call_at = now() WHERE id = $1`, [
    jobData.recipientId,
  ]);

  console.log(
    `[CAMPAIGN PACER:DIAL] Dialing ${maskPhoneNumber(jobData.phone)} for student ${jobData.studentName} [${jobData.language}] (Attempt ${jobData.attemptNumber + 1})`
  );

  const callResult = await telephony.placeCall(jobData.phone, {
    institutionId: jobData.institutionId,
    studentId: jobData.recipientId,
    studentName: jobData.studentName,
    guardianName: jobData.guardianName,
    language: jobData.language,
    useCase: jobData.useCase,
    campaignId: jobData.campaignId,
    streamUrl,
    webhookUrl,
    initialMessage: jobData.scriptText,
    enableAmd: true,
    amdTimeoutSeconds: 4,
  });

  // 4. Update Database based on result with AMD Retry Policy
  if (callResult.status === 'initiated' || callResult.status === 'queued') {
    await db.query(`UPDATE ai_voice_recipients SET status = 'in_progress', last_call_at = now() WHERE id = $1`, [
      jobData.recipientId,
    ]);
    return { status: 'in_progress' };
  } else {
    // Schedule retry with exponential backoff (45 minutes, max 2 retries)
    const nextAttempt = jobData.attemptNumber + 1;
    const isRetryable = nextAttempt < 2;

    await db.query(
      `UPDATE ai_voice_recipients
       SET status = $2,
           retry_count = $3,
           next_retry_at = $4,
           last_call_at = now()
       WHERE id = $1`,
      [
        jobData.recipientId,
        isRetryable ? 'no_answer' : 'failed',
        nextAttempt,
        isRetryable ? new Date(Date.now() + RETRY_BACKOFF_MS) : null,
      ]
    );

    await db.query(
      `INSERT INTO ai_voice_calls (recipient_id, status, duration_seconds, conversation_payload, started_at, ended_at)
       VALUES ($1, 'failed', 0, $2, now(), now())`,
      [
        jobData.recipientId,
        JSON.stringify({
          error: callResult.errorMessage,
          actionRequired: callResult.actionRequired,
          provider: callResult.provider,
          amdResult: callResult.amdResult || 'unknown',
        }),
      ]
    );

    return { status: 'failed', errorMessage: callResult.errorMessage };
  }
}

/**
 * Starts BullMQ Queue, Worker & TRAI Monitor with fail-open fallback
 */
export async function initializeCampaignQueue() {
  // Start active TRAI compliance monitor (07:58 PM auto-pause, 08:00 AM auto-resume)
  startTraiComplianceMonitor({
    onAutoPause: async () => {
      isTraiPausedGlobally = true;
      if (campaignQueue) {
        await campaignQueue.pause();
      }
      for (const [campaignId, interval] of activeFallbackIntervals.entries()) {
        clearInterval(interval);
        activeFallbackIntervals.delete(campaignId);
      }
      console.log('[CAMPAIGN QUEUE:TRAI] All active calling queues paused for regulatory cutoff.');
    },
    onAutoResume: async () => {
      isTraiPausedGlobally = false;
      if (campaignQueue) {
        await campaignQueue.resume();
      }
      console.log('[CAMPAIGN QUEUE:TRAI] Calling queues resumed for morning window.');
    },
  });

  const connection = getRedisConnection();
  if (!connection) {
    console.log('[CAMPAIGN QUEUE] Redis not configured. Using high-efficiency PostgreSQL pacer worker.');
    return;
  }

  try {
    await connection.connect();
    isRedisAvailable = true;

    campaignQueue = new Queue<CampaignJobData>(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: RETRY_BACKOFF_MS,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });

    campaignWorker = new Worker<CampaignJobData>(
      QUEUE_NAME,
      async (job) => {
        return await executeRecipientDial(job.data);
      },
      {
        connection,
        concurrency: MAX_CONCURRENCY,
        limiter: {
          max: RATE_LIMIT_MAX,
          duration: RATE_LIMIT_DURATION_MS,
        },
      }
    );

    campaignWorker.on('completed', (job) => {
      console.log(`[CAMPAIGN WORKER] Recipient ${job.data.recipientId} call processed successfully.`);
    });

    campaignWorker.on('failed', (job, err) => {
      console.warn(`[CAMPAIGN WORKER] Job for recipient ${job?.data.recipientId} failed: ${err.message}`);
    });

    console.log('[CAMPAIGN QUEUE] BullMQ Worker started with rate limit 10 calls/sec and concurrency 10.');
  } catch (err: any) {
    console.warn('[CAMPAIGN QUEUE:REDIS CONNECTION FAIL] Running in fail-open database mode:', err.message);
    isRedisAvailable = false;
    try {
      connection.disconnect();
    } catch (_) {}
  }
}

/**
 * Dispatches an entire campaign's pending recipients into the pacer queue
 */
export async function dispatchCampaignToQueue(
  campaignId: string
): Promise<{ queuedCount: number; mode: 'bullmq' | 'database_fallback' }> {
  // Fetch pending recipients from database
  const res = await db.query(
    `SELECT r.id, r.phone, r.retry_count,
            g.full_name as guardian_name,
            COALESCE(g.preferred_language, t.language, 'te-IN') as preferred_language,
            COALESCE(g.do_not_call, false) as do_not_call,
            (s.first_name || ' ' || s.last_name) as student_name,
            c.institution_id, c.use_case,
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
         OR (r.status IN ('no_answer', 'busy') AND COALESCE(r.retry_count, 0) < 2)
       )
     ORDER BY r.created_at ASC`,
    [campaignId]
  );

  let queuedCount = 0;

  for (const row of res.rows) {
    if (row.do_not_call) {
      await db.query(`UPDATE ai_voice_recipients SET status = 'opted_out' WHERE id = $1`, [row.id]);
      continue;
    }

    const jobData: CampaignJobData = {
      campaignId,
      recipientId: row.id,
      phone: row.phone,
      guardianName: row.guardian_name || 'Parent',
      studentName: row.student_name || 'Student',
      language: row.preferred_language || 'te-IN',
      useCase: row.use_case || 'event_notice',
      institutionId: row.institution_id,
      scriptText: row.script_text,
      attemptNumber: row.retry_count || 0,
    };

    if (isRedisAvailable && campaignQueue) {
      await campaignQueue.add(`dial_${row.id}`, jobData, {
        jobId: `recipient_${row.id}_${Date.now()}`,
      });
      queuedCount++;
    } else {
      queuedCount++;
    }
  }

  // If running in database fallback mode, trigger the sequential pacer loop
  if (!isRedisAvailable || !campaignQueue) {
    startFallbackDatabasePacer(campaignId);
    return { queuedCount, mode: 'database_fallback' };
  }

  return { queuedCount, mode: 'bullmq' };
}

/**
 * Fallback Database Pacer for environments without Redis
 */
function startFallbackDatabasePacer(campaignId: string) {
  if (activeFallbackIntervals.has(campaignId)) return;

  console.log(`[CAMPAIGN PACER:FALLBACK] Starting database pacer loop for ${campaignId}`);

  const interval = setInterval(async () => {
    // 1. TRAI Window check
    if (!isInsideTraiWindow() || isNearingCutoff() || isTraiPausedGlobally) {
      return;
    }

    // 2. Fetch 1 next recipient
    const recipientRes = await db.query(
      `SELECT r.id, r.phone, r.retry_count,
              g.full_name as guardian_name,
              COALESCE(g.preferred_language, t.language, 'te-IN') as preferred_language,
              (s.first_name || ' ' || s.last_name) as student_name,
              c.institution_id, c.use_case,
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
           OR (
             r.status IN ('no_answer', 'busy')
             AND COALESCE(r.retry_count, 0) < 2
             AND (r.next_retry_at IS NULL OR r.next_retry_at <= now())
           )
         )
       ORDER BY r.created_at ASC
       LIMIT 1`,
      [campaignId]
    );

    if (recipientRes.rows.length === 0) {
      const remaining = await db.query(
        `SELECT count(*) FROM ai_voice_recipients WHERE campaign_id = $1 AND status IN ('queued', 'dialing', 'in_progress')`,
        [campaignId]
      );
      if (parseInt(remaining.rows[0].count, 10) === 0) {
        clearInterval(interval);
        activeFallbackIntervals.delete(campaignId);
        console.log(`[CAMPAIGN PACER:FALLBACK] Campaign ${campaignId} completed!`);
      }
      return;
    }

    const row = recipientRes.rows[0];
    await executeRecipientDial({
      campaignId,
      recipientId: row.id,
      phone: row.phone,
      guardianName: row.guardian_name || 'Parent',
      studentName: row.student_name || 'Student',
      language: row.preferred_language || 'te-IN',
      useCase: row.use_case || 'event_notice',
      institutionId: row.institution_id,
      scriptText: row.script_text,
      attemptNumber: row.retry_count || 0,
    });
  }, 2500); // 2.5s pacing interval per dial

  activeFallbackIntervals.set(campaignId, interval);
}

/**
 * Pauses campaign execution
 */
export async function pauseCampaignQueue(campaignId: string) {
  if (activeFallbackIntervals.has(campaignId)) {
    clearInterval(activeFallbackIntervals.get(campaignId)!);
    activeFallbackIntervals.delete(campaignId);
  }

  if (isRedisAvailable && campaignQueue) {
    await campaignQueue.pause();
  }
}

/**
 * Resumes campaign execution
 */
export async function resumeCampaignQueue(campaignId: string) {
  if (isRedisAvailable && campaignQueue) {
    await campaignQueue.resume();
  } else {
    startFallbackDatabasePacer(campaignId);
  }
}
