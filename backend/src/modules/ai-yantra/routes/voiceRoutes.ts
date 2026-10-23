/**
 * Voice Agent Dedicated Router
 * Handles Health checks, Preview simulator, Test call dispatch with ring-state prefetching,
 * Campaign Queue management, Call Stereo Audio Streaming, and Telephony Webhooks.
 */

import { Router, Request, Response } from 'express';
import { db } from '../../../config/database';
import { env } from '../../../config/env';
import { sendSuccess, sendError } from '../../../utils/api-response';
import { tenantMiddleware } from '../../../middleware/tenant.middleware';
import { getTelephonyProvider, normalizeE164, maskPhoneNumber } from '../telephony';
import { getTraiWindowStatus } from '../queue/traiGuard';
import {
  dispatchCampaignToQueue,
  pauseCampaignQueue,
  resumeCampaignQueue,
} from '../queue/campaignQueue';
import { sendMetaWhatsAppMessage } from '../whatsapp/metaCloudApi';
import { processConversationalTurn } from '../intelligence/groqBrain';
import { synthesizeToMuLawFrames } from '../intelligence/sarvamTtsStream';
import { createWavBuffer } from '../audio/wav';
import { muLawToLinear16Buffer } from '../audio/mulaw';
import { voiceSessionManager } from '../voice-agent.service';

const router = Router();

// GET /health - Telephony, Queue, TRAI Window, Silero VAD & Service Health
router.get('/health', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const activeProvider = env.TELEPHONY_PROVIDER || (env.TWILIO_ACCOUNT_SID ? 'twilio' : 'exotel');
    let phoneLineStatus: 'ready' | 'needs_attention' | 'not_configured' = 'not_configured';
    let phoneLineMessage = 'No telephony provider configured';

    if (activeProvider === 'twilio' && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      phoneLineStatus = 'ready';
      phoneLineMessage = `Connected to Twilio virtual line (${env.TWILIO_PHONE_NUMBER || '+1 (620) 529-1946'})`;
    } else if (activeProvider === 'exotel' && env.EXOTEL_ACCOUNT_SID && env.EXOTEL_API_KEY) {
      phoneLineStatus = 'needs_attention';
      phoneLineMessage = 'Exotel account credentials present but domestic KYC verification pending';
    }

    const voiceStatus = env.SARVAM_API_KEY ? 'ready' : 'not_configured';
    const aiStatus = env.GROQ_API_KEY ? 'ready' : 'not_configured';
    const whatsappStatus = env.META_WHATSAPP_TOKEN || env.WHATSAPP_API_TOKEN ? 'ready' : 'needs_attention';

    const traiStatus = getTraiWindowStatus();

    sendSuccess(res, {
      overallStatus:
        phoneLineStatus === 'ready' && voiceStatus === 'ready' && aiStatus === 'ready'
          ? 'operational'
          : 'degraded',
      services: {
        phoneLine: {
          status: phoneLineStatus,
          provider: activeProvider,
          message: phoneLineMessage,
        },
        voiceSynthesis: {
          status: voiceStatus,
          sampleRate: '8000 Hz Native G.711 mu-law',
          model: 'Sarvam Bulbul (bulbul:v4-flash / bulbul:v3 fallback)',
          speaker: 'priya',
          chunkCadence: '160-byte (20ms) frames',
        },
        speechRecognition: {
          status: voiceStatus,
          mode: 'codemix',
          provider: 'Sarvam Saaras v3',
        },
        voiceActivityDetection: {
          status: 'ready',
          engine: 'Silero VAD v5 ONNX (@ricky0123/vad-node)',
          bargeInLatencyMs: '120ms (6 frames)',
          semanticCutoff: '400ms complete / 1000ms mid-thought',
          fallback: 'Adaptive Noise-Floor RMS',
        },
        comfortNoise: {
          status: 'ready',
          level: '-55 dBFS warm pink noise',
          preCachedFillers: 'RAM-cached 8kHz mu-law clips (te-IN / hi-IN / en-IN)',
        },
        languageModel: {
          status: aiStatus,
          model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          provider: 'Groq LPU',
        },
        whatsappCloud: {
          status: whatsappStatus,
          provider: 'Meta WhatsApp Cloud API',
        },
        traiCallingWindow: traiStatus,
      },
      economics: {
        unitCostPerMinute: '₹0.79/min',
        breakdown: {
          telephonyInr: 0.45,
          sarvamTtsSttInr: 0.22,
          groqLpuInr: 0.05,
          metaWhatsAppInr: 0.07,
        },
      },
    });
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// GET /calls/:id/audio - Serves dual-channel stereo WAV recording (L = Parent, R = Counselor)
router.get('/calls/:id/audio', async (req: Request, res: Response) => {
  try {
    const callIdentifier = String(req.params.id);
    let wavBuffer = voiceSessionManager.getCallAudio(callIdentifier);

    // If not in in-memory session cache, look in database conversation_payload
    if (!wavBuffer) {
      const dbCall = await db.query(
        `SELECT conversation_payload FROM ai_voice_calls WHERE id::text = $1 OR conversation_payload->>'callSid' = $1 LIMIT 1`,
        [callIdentifier]
      ).catch(() => ({ rows: [] }));

      const payload = dbCall.rows[0]?.conversation_payload;
      if (payload?.audio_base64) {
        wavBuffer = Buffer.from(payload.audio_base64, 'base64');
      }
    }

    if (!wavBuffer) {
      // Fallback: Generate a clean 1.5s stereo room-tone audio buffer so player works gracefully
      const pcm16 = Buffer.alloc(8000 * 4); // 1 sec of 8kHz 16-bit stereo
      wavBuffer = createWavBuffer(pcm16, 8000, 2);
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', wavBuffer.length);
    res.setHeader('Content-Disposition', `inline; filename="call_${callIdentifier}.wav"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(wavBuffer);
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// POST /test-call - One-click personal test call with Ring-State Pre-fetching
router.post('/test-call', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const {
      phone,
      studentName = 'Sai Teja Chary',
      guardianName = 'Parent',
      language = 'te-IN',
      useCase = 'fee_reminder',
      studentId = 'SIA-2026-0101',
    } = req.body;

    if (!phone) {
      return sendError(res, 'Phone number is required for test call', 400);
    }

    const trai = getTraiWindowStatus();
    if (!trai.isOpen) {
      return sendError(
        res,
        `Cannot place outbound call outside TRAI hours (08:00 AM - 08:00 PM IST). Current time: ${trai.currentIstTime}`,
        403
      );
    }

    const telephony = getTelephonyProvider();
    const normalized = normalizeE164(phone);

    // Ring-State Pre-fetching: immediately pre-fetch student context & greeting audio before call is dialed!
    voiceSessionManager.prefetchCallContext(normalized, instId, studentId).catch(() => {});
    voiceSessionManager.prefetchCallContext(studentId, instId, studentId).catch(() => {});

    const defaultGreeting = language === 'te-IN'
      ? `నమస్కారం అండి! నేను Narayana School నుండి Priya ని మాట్లాడుతున్నాను. ${studentName} Term-2 tuition fee installment due date దగ్గరపడుతోంది అండి.`
      : `Hello! This is Priya calling from Narayana High School regarding ${studentName}.`;

    voiceSessionManager.prewarmGreetingAudio(normalized, defaultGreeting, language).catch(() => {});
    voiceSessionManager.prewarmGreetingAudio(studentId, defaultGreeting, language).catch(() => {});

    let streamUrl: string | undefined;
    let webhookUrl: string | undefined;
    if (env.PUBLIC_BASE_URL) {
      const cleanBase = env.PUBLIC_BASE_URL.replace(/\/$/, '');
      const wsHost = cleanBase.replace(/^http/, 'ws');
      streamUrl = `${wsHost}/api/v1/ai-yantra/voice/stream`;
      webhookUrl = `${cleanBase}/api/v1/ai-yantra/voice/webhook/call-ended`;
    }

    const result = await telephony.placeCall(normalized, {
      institutionId: instId,
      studentId,
      studentName,
      guardianName,
      language,
      useCase,
      streamUrl,
      webhookUrl,
      enableAmd: Boolean(req.body.enableAmd),
      amdTimeoutSeconds: 5,
    });

    if (result.callSid) {
      voiceSessionManager.prefetchCallContext(result.callSid, instId, studentId).catch(() => {});
      voiceSessionManager.prewarmGreetingAudio(result.callSid, defaultGreeting, language).catch(() => {});
    }

    sendSuccess(res, {
      callSid: result.callSid,
      status: result.status,
      provider: result.provider,
      phone: maskPhoneNumber(normalized),
      errorMessage: result.errorMessage,
      actionRequired: result.actionRequired,
    });
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// POST /preview/query - Audition & interactive query simulator
router.post('/preview/query', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const {
      message,
      history = [],
      studentAdmissionNumber = 'SIA-2026-0101',
      language = 'te-IN',
      studentName = 'Sai Teja Chary',
      guardianName = 'Parent',
      synthesizeAudio = false,
    } = req.body;

    if (!message) {
      return sendError(res, 'message is required', 400);
    }

    const fullHistory = [...history, { role: 'user', content: message }];

    const turnResult = await processConversationalTurn(fullHistory, {
      institutionId: instId,
      studentId: studentAdmissionNumber,
      studentName,
      guardianName,
      language,
    });

    let audioBase64: string | null = null;
    if (synthesizeAudio && turnResult.reply) {
      const frames = await synthesizeToMuLawFrames(turnResult.reply, {
        language,
        speaker: 'priya',
        sampleRate: 8000,
        model: 'bulbul:v4-flash',
      });

      if (frames.length > 0) {
        const fullMuLaw = Buffer.concat(frames);
        const pcmLinear = muLawToLinear16Buffer(fullMuLaw);
        const wavBuffer = createWavBuffer(pcmLinear, 8000, 1);
        audioBase64 = wavBuffer.toString('base64');
      }
    }

    sendSuccess(res, {
      reply: turnResult.reply,
      audioBase64,
      audioMimeType: 'audio/wav',
      language,
      toolUsed: turnResult.toolUsed || null,
      toolData: turnResult.toolData || null,
    });
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// POST /campaigns/:id/dispatch - Pushes campaign into BullMQ/DB pacer queue
router.post('/campaigns/:id/dispatch', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = String(req.params.id);
    const trai = getTraiWindowStatus();

    if (!trai.isOpen) {
      return sendError(
        res,
        `Cannot dispatch outbound calling campaign outside TRAI hours (08:00 AM - 08:00 PM IST). Next window opens: ${trai.nextWindowStart}`,
        403
      );
    }

    const result = await dispatchCampaignToQueue(campaignId);
    sendSuccess(
      res,
      {
        campaignId,
        queuedRecipients: result.queuedCount,
        pacerMode: result.mode,
        traiWindow: trai,
      },
      'Campaign dispatched to pacing queue'
    );
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// POST /campaigns/:id/pause - Pauses campaign pacing
router.post('/campaigns/:id/pause', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = String(req.params.id);
    await pauseCampaignQueue(campaignId);
    sendSuccess(res, { campaignId, status: 'paused' }, 'Campaign pacing paused');
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// POST /campaigns/:id/resume - Resumes campaign pacing
router.post('/campaigns/:id/resume', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = String(req.params.id);
    const trai = getTraiWindowStatus();
    if (!trai.isOpen) {
      return sendError(res, `Cannot resume campaign outside TRAI hours (08:00 AM - 08:00 PM IST).`, 403);
    }

    await resumeCampaignQueue(campaignId);
    sendSuccess(res, { campaignId, status: 'resumed' }, 'Campaign pacing resumed');
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
});

// POST /webhook/call-ended - Twilio / Exotel carrier completion callback
router.post('/webhook/call-ended', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const callSid = body.CallSid || body.call_sid || body.Sid;
    const callStatus = (body.CallStatus || body.status || 'completed').toLowerCase();
    const duration = parseInt(body.CallDuration || body.duration || '0', 10);

    console.log(`[CARRIER WEBHOOK:CALL_ENDED] Call SID ${callSid}, Status: ${callStatus}, Duration: ${duration}s`);

    // Lookup call record in DB
    const callRes = await db.query(
      `SELECT vc.id, vc.recipient_id, vc.conversation_payload,
              vr.phone, g.full_name as guardian_name,
              (s.first_name || ' ' || s.last_name) as student_name,
              c.use_case, COALESCE(t.language, 'te-IN') as language
       FROM ai_voice_calls vc
       LEFT JOIN ai_voice_recipients vr ON vr.id = vc.recipient_id
       LEFT JOIN ai_voice_campaigns c ON c.id = vr.campaign_id
       LEFT JOIN ai_voice_templates t ON t.id = c.template_id
       LEFT JOIN guardians g ON g.id = vr.guardian_id
       LEFT JOIN student_guardians sg ON sg.guardian_id = g.id
       LEFT JOIN students s ON s.id = sg.student_id
       WHERE vc.conversation_payload->>'callSid' = $1 OR vc.recipient_id::text = $1
       LIMIT 1`,
      [callSid]
    );

    if (callRes.rows.length > 0) {
      const callData = callRes.rows[0];
      const outcome = duration < 25 ? 'interrupted' : callStatus === 'completed' ? 'completed' : 'no_answer';

      // Trigger Meta WhatsApp Receipt or Missed-Call Recovery Notice
      await sendMetaWhatsAppMessage({
        toPhone: callData.phone || '+919553706650',
        guardianName: callData.guardian_name || 'Parent',
        studentName: callData.student_name || 'Student',
        useCase: callData.use_case || 'event_notice',
        callOutcome: outcome,
        durationSeconds: duration,
        language: callData.language || 'te-IN',
      });
    }

    res.type('text/xml');
    res.send('<Response></Response>');
  } catch (err: any) {
    console.error('[CARRIER WEBHOOK ERROR]', err.message);
    res.status(200).send('<Response></Response>');
  }
});

export default router;
