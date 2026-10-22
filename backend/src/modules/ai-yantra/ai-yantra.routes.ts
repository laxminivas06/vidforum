import { Router, Request, Response } from 'express';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { sendSuccess, sendError } from '../../utils/api-response';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { getTelephonyProvider, normalizeE164, maskPhoneNumber } from './telephony';
import { campaignWorkerService } from './campaign-worker.service';
import {
  getStudentMarksTool,
  getStudentAttendanceTool,
  getFeeStatusTool,
  normalizeSubjectName,
} from './intelligence/tools';
import { processConversationalTurn } from './intelligence/groqBrain';

const router = Router();

// ==========================================
// Voice Agent Helper Functions
// ==========================================

export async function executeDatabaseTool(instId: string, toolName: string, parameters: any) {
  const { student_id } = parameters || {};
  const targetStudentId = student_id || 'SIA-2026-0101';

  if (toolName === 'get_student_marks') {
    const rawSubject = parameters?.subject || 'General Science';
    return await getStudentMarksTool(instId, targetStudentId, rawSubject);
  }

  if (toolName === 'get_student_attendance') {
    return await getStudentAttendanceTool(instId, targetStudentId);
  }

  if (toolName === 'get_fee_status') {
    return await getFeeStatusTool(instId, targetStudentId);
  }

  throw new Error(`Unsupported tool: ${toolName}`);
}

export async function callSarvamTTS(text: string, language = 'te-IN', speaker = 'priya'): Promise<string | null> {
  try {
    if (!env.SARVAM_API_KEY) return null;
    const res = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': env.SARVAM_API_KEY,
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: language,
        speaker: speaker,
        model: 'bulbul:v3',
        speech_sample_rate: 8000,
        enable_preprocessing: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Sarvam TTS API returned non-200:', res.status, errText);
      return null;
    }

    const data: any = await res.json();
    return data.audios && data.audios[0] ? data.audios[0] : null;
  } catch (err) {
    console.error('Sarvam TTS Error:', err);
    return null;
  }
}

let resolvedGroqModel: string | null = null;

export async function getVerifiedGroqModel(): Promise<string> {
  if (resolvedGroqModel) return resolvedGroqModel;

  const target = env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}` },
    });
    if (res.ok) {
      const data: any = await res.json();
      const available = (data.data || []).map((m: any) => m.id);
      if (available.includes(target)) {
        resolvedGroqModel = target;
        return resolvedGroqModel;
      }
      if (available.includes('llama-3.3-70b-versatile')) {
        resolvedGroqModel = 'llama-3.3-70b-versatile';
        return resolvedGroqModel;
      }
      if (available.includes('qwen/qwen3.8-27b')) {
        resolvedGroqModel = 'qwen/qwen3.8-27b';
        return resolvedGroqModel;
      }
      resolvedGroqModel = available[0] || target;
      return resolvedGroqModel || target;
    }
  } catch (err) {
    console.warn('[GROQ MODEL RESOLUTION] Fallback to configured model:', target);
  }
  resolvedGroqModel = target;
  return resolvedGroqModel;
}

export function validateScriptPurity(text: string, language: string): { valid: boolean; reason?: string } {
  if (!text || !text.trim()) return { valid: false, reason: 'Empty text' };

  // Strip numbers, punctuation, quotes, symbols, whitespace
  const stripped = text.replace(/[\d\s.,!?'"():;\/\-–—%₹$#@*+<>\[\]]/g, '');
  if (!stripped) return { valid: true };

  if (language === 'te-IN') {
    // In pure Telugu, Latin letters (a-z, A-Z) are strictly prohibited
    const latinMatch = stripped.match(/[a-zA-Z]/g);
    if (latinMatch && latinMatch.length > 0) {
      return {
        valid: false,
        reason: `Contains ${latinMatch.length} English/Latin characters in pure Telugu mode (${latinMatch.slice(0, 5).join(', ')})`,
      };
    }
    // Check Telugu Unicode range \u0C00-\u0C7F
    const nonTelugu = stripped.replace(/[\u0C00-\u0C7F]/g, '');
    if (nonTelugu.length > 2) {
      return {
        valid: false,
        reason: `Contains non-Telugu characters: ${nonTelugu.slice(0, 5)}`,
      };
    }
    return { valid: true };
  }

  if (language === 'hi-IN') {
    const latinMatch = stripped.match(/[a-zA-Z]/g);
    if (latinMatch && latinMatch.length > 0) {
      return {
        valid: false,
        reason: `Contains Latin characters in pure Hindi mode`,
      };
    }
    const nonHindi = stripped.replace(/[\u0900-\u097F]/g, '');
    if (nonHindi.length > 2) {
      return {
        valid: false,
        reason: `Contains non-Devanagari characters: ${nonHindi.slice(0, 5)}`,
      };
    }
    return { valid: true };
  }

  if (language === 'en-IN') {
    const indicMatch = stripped.match(/[\u0C00-\u0C7F\u0900-\u097F]/g);
    if (indicMatch && indicMatch.length > 0) {
      return {
        valid: false,
        reason: `Contains Indic script in pure English mode`,
      };
    }
    return { valid: true };
  }

  return { valid: true };
}

export async function callGroqChatWithTools(
  instId: string,
  messages: Array<{ role: string; content: string }>,
  studentId?: string,
  language = 'te-IN',
  studentName = 'Sai Teja Chary'
) {
  return await processConversationalTurn(messages, {
    institutionId: instId,
    studentId,
    studentName,
    language,
  });
}

// ==========================================
// 1. Voice Agent Workspace Routes
// ==========================================

// GET /api/v1/ai-yantra/voice/health
router.get('/voice/health', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const activeProvider = env.TELEPHONY_PROVIDER || (env.TWILIO_ACCOUNT_SID ? 'twilio' : 'exotel');
    let phoneLineStatus: 'ready' | 'needs_attention' | 'not_configured' = 'not_configured';
    let phoneLineProvider = activeProvider;
    let phoneLineMessage = 'No telephony provider configured';
    let phoneLineActionRequired: string[] = ['Configure Twilio Account SID and Auth Token or Exotel credentials in environment settings.'];

    if (activeProvider === 'twilio' && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      phoneLineStatus = 'ready';
      phoneLineMessage = `Connected to Twilio virtual line (${env.TWILIO_PHONE_NUMBER || '+1 (620) 529-1946'})`;
      phoneLineActionRequired = [];
    } else if (activeProvider === 'exotel' && env.EXOTEL_ACCOUNT_SID && env.EXOTEL_API_KEY) {
      phoneLineStatus = 'needs_attention';
      phoneLineMessage = 'Exotel account credentials present but domestic KYC verification pending';
      phoneLineActionRequired = ['Complete commercial enterprise KYC on Exotel console, or switch active provider to Twilio.'];
    }

    let voiceStatus: 'ready' | 'needs_attention' | 'not_configured' = 'not_configured';
    let voiceMessage = 'Voice synthesis API key missing';
    let voiceActionRequired: string[] = ['Set SARVAM_API_KEY for multilingual audio synthesis.'];
    if (env.SARVAM_API_KEY) {
      voiceStatus = 'ready';
      voiceMessage = 'Voice synthesis active with Telugu, Hindi, English neural models';
      voiceActionRequired = [];
    }

    let aiStatus: 'ready' | 'needs_attention' | 'not_configured' = 'not_configured';
    let aiMessage = 'AI language model API key missing';
    let aiActionRequired: string[] = ['Set GROQ_API_KEY for conversational intelligence.'];
    if (env.GROQ_API_KEY) {
      aiStatus = 'ready';
      aiMessage = `Language model active (${env.GROQ_MODEL || 'qwen/qwen3.8-27b'}) for conversational tool-calling`;
      aiActionRequired = [];
    }

    let whatsappStatus: 'ready' | 'needs_attention' | 'not_configured' = 'not_configured';
    let whatsappMessage = 'WhatsApp Business API token not configured';
    let whatsappActionRequired: string[] = ['Configure WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID to deliver instant post-call summaries.'];
    if (env.WHATSAPP_API_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
      whatsappStatus = 'ready';
      whatsappMessage = 'WhatsApp Cloud API active for post-call recap delivery';
      whatsappActionRequired = [];
    }

    const allReady = phoneLineStatus === 'ready' && voiceStatus === 'ready' && aiStatus === 'ready';

    return sendSuccess(res, {
      overallStatus: allReady ? 'ready' : phoneLineStatus === 'ready' ? 'degraded' : 'blocked',
      phoneLine: {
        provider: phoneLineProvider === 'twilio' ? 'Twilio Virtual Line' : phoneLineProvider === 'exotel' ? 'Exotel' : 'None',
        status: phoneLineStatus,
        message: phoneLineMessage,
        actionRequired: phoneLineActionRequired,
      },
      voice: {
        provider: 'Sarvam AI',
        status: voiceStatus,
        message: voiceMessage,
        actionRequired: voiceActionRequired,
      },
      aiAssistant: {
        provider: 'Groq',
        status: aiStatus,
        message: aiMessage,
        actionRequired: aiActionRequired,
      },
      whatsapp: {
        provider: 'Meta WhatsApp Cloud API',
        status: whatsappStatus,
        message: whatsappMessage,
        actionRequired: whatsappActionRequired,
      },
      callingHours: '09:00 AM – 07:00 PM IST',
      dltConsentStatus: 'Standard TRAI / DoT compliant transactional tele-outreach window',
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

// GET /api/v1/ai-yantra/voice/campaigns
router.get('/voice/campaigns', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query(
      `SELECT c.id, c.institution_id, c.template_id, c.name as title, c.use_case, c.scheduled_at, c.created_at,
              t.name as template_name,
              t.language,
              t.script_text,
              (SELECT count(*)::int FROM ai_voice_recipients WHERE campaign_id = c.id) as recipients_count,
              (SELECT count(*)::int FROM ai_voice_calls vc JOIN ai_voice_recipients vr ON vr.id = vc.recipient_id WHERE vr.campaign_id = c.id AND vc.status = 'completed') as completed_calls,
              (SELECT count(*)::int FROM ai_voice_calls vc JOIN ai_voice_recipients vr ON vr.id = vc.recipient_id WHERE vr.campaign_id = c.id AND vc.status IN ('in_progress', 'ringing', 'queued')) as active_calls,
              (SELECT count(*)::int FROM ai_voice_calls vc JOIN ai_voice_recipients vr ON vr.id = vc.recipient_id WHERE vr.campaign_id = c.id AND vc.status = 'failed') as failed_calls
       FROM ai_voice_campaigns c
       LEFT JOIN ai_voice_templates t ON t.id = c.template_id
       WHERE c.institution_id = $1
       ORDER BY c.created_at DESC`,
      [instId]
    );

    const formatted = result.rows.map(row => {
      const target = row.recipients_count || 0;
      const completed = row.completed_calls || 0;
      const rate = target > 0 ? `${Math.round((completed / target) * 100)}%` : '—';
      const status = completed === target && target > 0 ? 'COMPLETED' : row.active_calls > 0 ? 'ACTIVE_DISPATCH' : 'SCHEDULED';
      return {
        id: row.id,
        title: row.title,
        trigger: (row.use_case || 'EVENT_NOTICE').toUpperCase(),
        targetCount: target,
        completedCalls: completed,
        connectedRate: rate,
        language: row.language === 'te-IN' ? 'Telugu (Tenglish)' : row.language === 'hi-IN' ? 'Hindi' : 'English',
        languageCode: row.language || 'te-IN',
        scriptTemplate: row.script_text || '',
        status,
        createdAt: row.created_at,
      };
    });

    sendSuccess(res, formatted);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/ai-yantra/voice/campaigns (Create Campaign & Queue Recipients)
router.post('/voice/campaigns', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const {
      name,
      useCase = 'event_notice',
      language = 'te-IN',
      languageMode = 'parent_preferred',
      scriptText,
      targetGradeId,
      targetSectionId,
      scheduledAt,
      singleParentTest = false,
    } = req.body;

    if (!name || !scriptText) {
      return sendError(res, 'Campaign name and scriptText are required', 400);
    }

    // 1. Create or link template
    const templateRes = await db.query(
      `INSERT INTO ai_voice_templates (institution_id, name, language, script_text)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [instId, `${name} Template`, language, scriptText]
    );
    const templateId = templateRes.rows[0].id;

    // 2. Create campaign
    const campRes = await db.query(
      `INSERT INTO ai_voice_campaigns (institution_id, template_id, name, use_case, scheduled_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [instId, templateId, name, useCase.toLowerCase(), scheduledAt ? new Date(scheduledAt) : new Date()]
    );
    const campaign = campRes.rows[0];

    // 3. Select target recipients (guardians of students) based on filter
    let query = `
      SELECT DISTINCT ON (g.id) g.id as guardian_id, g.phone, g.full_name as guardian_name,
             COALESCE(g.preferred_language, 'te-IN') as preferred_language,
             COALESCE(g.do_not_call, false) as do_not_call,
             s.id as student_id, (s.first_name || ' ' || s.last_name) as student_name, s.admission_number
      FROM students s
      JOIN student_guardians sg ON sg.student_id = s.id
      JOIN guardians g ON g.id = sg.guardian_id
      LEFT JOIN sections sec ON sec.id = s.current_section_id
      WHERE s.institution_id = $1 AND g.phone IS NOT NULL AND g.phone != ''
    `;
    const params: any[] = [instId];

    if (targetSectionId) {
      query += ` AND s.current_section_id = $2`;
      params.push(targetSectionId);
    } else if (targetGradeId) {
      query += ` AND sec.class_id = $2`;
      params.push(targetGradeId);
    }

    if (singleParentTest) {
      query += ` LIMIT 1`;
    } else {
      query += ` LIMIT 100`;
    }
    const recipientsRes = await db.query(query, params);

    // 4. Insert recipients and queued calls
    for (const r of recipientsRes.rows) {
      const rec = await db.query(
        `INSERT INTO ai_voice_recipients (campaign_id, guardian_id, phone, status)
         VALUES ($1, $2, $3, 'queued') RETURNING id`,
        [campaign.id, r.guardian_id, r.phone]
      );

      const targetLang = languageMode === 'force' ? language : (r.preferred_language || language || 'te-IN');

      const payload = {
        student_id: r.student_id,
        student_name: r.student_name,
        admission_number: r.admission_number,
        guardian_name: r.guardian_name,
        language: targetLang,
        use_case: useCase,
      };

      await db.query(
        `INSERT INTO ai_voice_calls (recipient_id, status, conversation_payload, started_at)
         VALUES ($1, 'queued', $2, now())`,
        [rec.rows[0].id, JSON.stringify(payload)]
      );
    }

    sendSuccess(res, {
      campaignId: campaign.id,
      title: campaign.name,
      recipientsQueued: recipientsRes.rows.length,
      singleParentTest,
      status: 'SCHEDULED',
    }, singleParentTest ? 'Test campaign created (1 parent queued)' : 'Campaign created and recipients queued');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/ai-yantra/voice/campaigns/:id/launch (Dispatch / Launch Campaign via Sequential Worker)
router.post('/voice/campaigns/:id/launch', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const campaignId = String(req.params.id);

    // Verify campaign belongs to institution
    const campCheck = await db.query(
      `SELECT id, name FROM ai_voice_campaigns WHERE id = $1 AND institution_id = $2`,
      [campaignId, instId]
    );
    if (campCheck.rows.length === 0) {
      return sendError(res, 'Campaign not found', 404);
    }

    // Launch real sequential dialer worker (processes 1 parent at a time)
    await campaignWorkerService.startCampaignDialer(campaignId);

    sendSuccess(res, {
      campaignId,
      status: 'ACTIVE_DISPATCH',
    }, 'Campaign launched; sequential outbound dialer started');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/ai-yantra/voice/campaigns/:id/progress (Live Campaign Dialing Progress)
router.get('/voice/campaigns/:id/progress', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = String(req.params.id);
    const progress = await campaignWorkerService.getProgress(campaignId);
    sendSuccess(res, progress);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/ai-yantra/voice/campaigns/:id/pause
router.post('/voice/campaigns/:id/pause', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = String(req.params.id);
    await campaignWorkerService.pauseCampaign(campaignId);
    sendSuccess(res, { campaignId, status: 'PAUSED' }, 'Campaign dialer paused');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/ai-yantra/voice/campaigns/:id/resume
router.post('/voice/campaigns/:id/resume', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = String(req.params.id);
    await campaignWorkerService.startCampaignDialer(campaignId);
    sendSuccess(res, { campaignId, status: 'ACTIVE_DISPATCH' }, 'Campaign dialer resumed');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/ai-yantra/voice/campaigns/:id/cancel
router.post('/voice/campaigns/:id/cancel', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = String(req.params.id);
    await campaignWorkerService.cancelCampaign(campaignId);
    sendSuccess(res, { campaignId, status: 'CANCELLED' }, 'Campaign dialer cancelled');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/ai-yantra/voice/campaigns/:id/calls (Detailed Call Logs)
router.get('/voice/campaigns/:id/calls', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const campaignId = String(req.params.id);

    const result = await db.query(
      `SELECT vc.id, vc.status, vc.duration_seconds, vc.started_at, vc.ended_at, vc.conversation_payload,
              vr.phone, g.full_name as guardian_name
       FROM ai_voice_calls vc
       JOIN ai_voice_recipients vr ON vr.id = vc.recipient_id
       JOIN ai_voice_campaigns c ON c.id = vr.campaign_id
       LEFT JOIN guardians g ON g.id = vr.guardian_id
       WHERE c.id = $1 AND c.institution_id = $2
       ORDER BY vc.created_at DESC`,
      [campaignId, instId]
    );

    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/ai-yantra/voice/calls (Global Call History across all campaigns)
router.get('/voice/calls', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;

    const result = await db.query(
      `SELECT vc.id, vc.status, vc.duration_seconds, vc.started_at, vc.ended_at, vc.conversation_payload,
              vr.phone, g.full_name as guardian_name,
              (s.first_name || ' ' || s.last_name) as student_name,
              c.id as campaign_id, c.name as campaign_name,
              COALESCE(t.language, 'te-IN') as language
       FROM ai_voice_calls vc
       JOIN ai_voice_recipients vr ON vr.id = vc.recipient_id
       JOIN ai_voice_campaigns c ON c.id = vr.campaign_id
       LEFT JOIN ai_voice_templates t ON t.id = c.template_id
       LEFT JOIN guardians g ON g.id = vr.guardian_id
       LEFT JOIN student_guardians sg ON sg.guardian_id = g.id
       LEFT JOIN students s ON s.id = sg.student_id
       WHERE c.institution_id = $1
       ORDER BY vc.created_at DESC
       LIMIT 100`,
      [instId]
    );

    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/ai-yantra/voice/synthesize-preview (Audition Sarvam AI Bulbul v2 TTS)
router.post('/voice/synthesize-preview', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { text, language = 'te-IN', speaker = 'priya' } = req.body;

    if (!text || typeof text !== 'string') {
      return sendError(res, 'text is required for speech synthesis', 400);
    }

    const audioBase64 = await callSarvamTTS(text.trim(), language, speaker);

    if (!audioBase64) {
      return sendError(res, 'Sarvam AI speech synthesis failed. Please verify API key.', 502);
    }

    sendSuccess(res, {
      audioBase64,
      audioMimeType: 'audio/wav',
      language,
      speaker,
      durationEstimateSeconds: Math.ceil(text.length / 15),
    }, 'Speech synthesized successfully');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/ai-yantra/voice/chat-preview (Interactive Agent Reasoning & Tool Calling Preview)
router.post('/voice/chat-preview', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const {
      message,
      history = [],
      studentAdmissionNumber = 'SIA-2026-0101',
      synthesizeAudio = false,
      language = 'te-IN'
    } = req.body;

    if (!message) {
      return sendError(res, 'message is required', 400);
    }

    const fullHistory = [
      ...history,
      { role: 'user', content: message },
    ];

    const result = await callGroqChatWithTools(instId, fullHistory, studentAdmissionNumber, language);

    let audioBase64: string | null = null;
    if (synthesizeAudio && result.reply) {
      audioBase64 = await callSarvamTTS(result.reply, language, 'priya');
    }

    sendSuccess(res, {
      reply: result.reply,
      audioBase64,
      language,
      toolUsed: result.toolUsed || null,
      toolData: result.toolData || null,
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

export async function sendWhatsAppRecap(toPhone: string, messageText: string): Promise<{ sent: boolean; status: string; reason?: string; messageId?: string }> {
  if (!env.WHATSAPP_API_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    console.log(`[WHATSAPP] WhatsApp NOT sent: token missing (recipient: ${maskPhoneNumber(toPhone)})`);
    return {
      sent: false,
      status: 'NOT_SENT_TOKEN_MISSING',
      reason: 'WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured in backend/.env',
    };
  }

  const cleanPhone = toPhone.replace(/[^0-9]/g, '');
  try {
    const url = `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: { preview_url: false, body: messageText },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[WHATSAPP META ERROR ${res.status}]`, errText);
      return { sent: false, status: 'FAILED', reason: `Meta API Error (${res.status}): ${errText}` };
    }

    const data: any = await res.json();
    console.log(`[WHATSAPP DISPATCHED] Message ID: ${data.messages?.[0]?.id} to ${maskPhoneNumber(toPhone)}`);
    return { sent: true, status: 'SENT', messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    console.error(`[WHATSAPP EXCEPTION]`, err.message);
    return { sent: false, status: 'FAILED', reason: err.message };
  }
}

export async function triggerPostCallRecovery(
  instId: string,
  recipientPhone: string,
  guardianName: string,
  studentName: string,
  durationSeconds: number,
  useCase: string,
  marksQueried?: { subject: string; score: string; grade: string }
) {
  let messageText = `*Narayana e-Techno School Update*\n\n`;
  messageText += `Namaskaram andi ${guardianName}! This is a quick follow-up to our call regarding *${studentName}*.\n\n`;
  messageText += `*Notice:* We attempted an automated update call that concluded in ${durationSeconds}s.\n\n`;

  if (marksQueried && marksQueried.subject) {
    messageText += `*Academic Query Answered:*\n`;
    messageText += `• Subject: ${marksQueried.subject}\n`;
    messageText += `• Score: ${marksQueried.score} (Grade: ${marksQueried.grade})\n\n`;
  }

  messageText += `For complete academic records, please visit: https://school.vidplatform.edu/parent\n\n`;
  messageText += `Have a wonderful day!`;

  return sendWhatsAppRecap(recipientPhone, messageText);
}

// POST /api/v1/ai-yantra/voice/call-test (Dispatch Single Outbound Test Call via Telephony Provider)
router.post('/voice/call-test', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      phone = '+919876543210',
      studentAdmissionNumber = 'SIA-2026-0101',
      useCase = 'event_notice',
      language = 'te-IN',
      provider: requestedProvider,
    } = req.body;

    const normalizedPhone = normalizeE164(phone);
    const telephonyProvider = getTelephonyProvider(requestedProvider);

    let streamUrl: string | undefined;
    let webhookUrl: string | undefined;
    // Only attach live WebSocket media streaming if explicitly requested and a valid public tunnel is present
    if (req.body.interactiveStream && env.PUBLIC_BASE_URL) {
      const cleanBase = env.PUBLIC_BASE_URL.replace(/\/$/, '');
      const wsHost = cleanBase.replace(/^http/, 'ws');
      streamUrl = `${wsHost}/api/v1/ai-yantra/voice/stream`;
      webhookUrl = `${cleanBase}/api/v1/ai-yantra/voice/webhook/call-ended`;
    }

    const speechScript = language === 'te-IN'
      ? 'నమస్కారం అండి! నారాయణ స్కూల్ నుంచి ప్రియ మాట్లాడుతున్నాను. వచ్చే శనివారం మన పాఠశాలలో వార్షిక క్రీడా దినోత్సవం జరుగుతుంది. మీకు ఏవైనా సందేహాలు ఉంటే నన్ను అడగవచ్చు అండి.'
      : language === 'hi-IN'
      ? 'नमस्ते! मैं नारायण स्कूल से प्रिया बोल रही हूँ। अगले शनिवार हमारे स्कूल में वार्षिक खेल दिवस आयोजित किया जा रहा है। यदि आपके कोई प्रश्न हैं तो आप मुझसे पूछ सकते हैं।'
      : 'Hello! This is Priya calling from Narayana e-Techno School regarding our upcoming Annual Sports Day celebration. Please let me know if you have any questions.';

    // Synthesize clean audio for in-browser playback preview
    const audioBase64 = await callSarvamTTS(speechScript, language, 'priya');

    // Resolve real student name and guardian name from database
    const studentRes = await db.query(
      `SELECT s.id, (s.first_name || ' ' || s.last_name) as student_name, g.full_name as guardian_name
       FROM students s
       LEFT JOIN student_guardians sg ON sg.student_id = s.id
       LEFT JOIN guardians g ON g.id = sg.guardian_id
       WHERE (s.admission_number = $1 OR s.id::text = $1)
       LIMIT 1`,
      [studentAdmissionNumber]
    );
    const studentName = studentRes.rows[0]?.student_name || 'Sai Teja Chary';
    const guardianName = studentRes.rows[0]?.guardian_name || 'Jagan Garu';

    // Place call through selected Telephony Provider
    const callResult = await telephonyProvider.placeCall(normalizedPhone, {
      institutionId: req.institutionId!,
      studentId: studentAdmissionNumber,
      studentName,
      guardianName,
      language,
      useCase,
      initialMessage: speechScript,
      streamUrl,
      webhookUrl,
    });

    const isLive = callResult.status === 'initiated';

    sendSuccess(res, {
      status: isLive ? 'DIALED_LIVE' : 'CARRIER_REJECTED',
      carrier: callResult.provider,
      callSid: callResult.callSid,
      phone: callResult.phone || maskPhoneNumber(normalizedPhone),
      studentAdmissionNumber,
      useCase,
      language,
      carrierError: callResult.errorMessage || null,
      carrierMessage: callResult.errorMessage || null,
      actionRequired: callResult.actionRequired || null,
      httpStatus: callResult.httpStatus || (isLive ? 200 : 400),
      audioBase64,
      audioScript: speechScript,
      initialMessage: speechScript,
      timestamp: new Date().toISOString(),
    }, isLive ? 'Live phone call dispatched successfully' : (callResult.errorMessage || 'Carrier rejected call dispatch'));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/ai-yantra/voice/tools/execute (Live Database Tool Calling for Voice Agent)
router.post('/voice/tools/execute', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const { toolName, parameters } = req.body;

    if (!toolName) {
      return sendError(res, 'toolName is required', 400);
    }

    const toolResult = await executeDatabaseTool(instId, toolName, parameters);
    sendSuccess(res, toolResult);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/ai-yantra/voice/webhook/call-ended (Interruption & Disconnect Webhook Recovery)
router.post('/voice/webhook/call-ended', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const {
      callId,
      recipientPhone = '+919876543210',
      studentName = 'Sai Teja Chary',
      eventTitle = 'Annual Sports Day 2026',
      durationSeconds = 18,
      status = 'interrupted',
      transcript = 'Call disconnected prematurely by network drop',
      marksQueried,
    } = req.body;

    const isInterrupted = status === 'interrupted' || durationSeconds < 25;

    // Log call event in database if callId provided
    if (callId) {
      await db.query(
        `UPDATE ai_voice_calls
         SET duration_seconds = $1, status = $2, conversation_payload = $3, ended_at = now()
         WHERE id = $4`,
        [
          durationSeconds,
          isInterrupted ? 'failed' : 'completed',
          JSON.stringify({ transcript, marksQueried, isInterrupted }),
          callId,
        ]
      );
    }

    // Synthesize structured WhatsApp recap
    let messageText = `*Narayana e-Techno School Update*\n\n`;
    messageText += `Namaskaram andi! This is a quick follow-up to our call regarding *${studentName}*.\n\n`;
    messageText += `*Event Announcement:* ${eventTitle}\n`;
    messageText += `*Date & Time:* Saturday, Nov 5th @ 09:00 AM\n`;
    messageText += `*Venue:* Main Campus Sports Complex\n\n`;

    if (marksQueried && marksQueried.subject) {
      messageText += `*Academic Query Answered:*\n`;
      messageText += `• Subject: ${marksQueried.subject}\n`;
      messageText += `• Score: ${marksQueried.score} (Grade: ${marksQueried.grade})\n\n`;
    }

    messageText += `For complete schedules and report cards, please visit the parent mobile portal: https://school.vidplatform.edu/parent\n\n`;
    messageText += `Have a wonderful day!`;

    // Dispatch WhatsApp recap if call dropped early (<25s) or was interrupted
    let whatsappResult: { sent: boolean; status: string; reason?: string; messageId?: string } = {
      sent: false,
      status: 'NOT_APPLICABLE',
    };
    if (isInterrupted) {
      whatsappResult = await sendWhatsAppRecap(recipientPhone, messageText);
    }

    sendSuccess(res, {
      recoveryDispatched: isInterrupted,
      channel: 'WHATSAPP_CLOUD_API',
      recipientPhone: maskPhoneNumber(recipientPhone),
      isInterrupted,
      durationSeconds,
      deliveredMessage: messageText,
      whatsapp: whatsappResult,
    }, isInterrupted ? 'Post-call interruption recovery evaluated' : 'Call completed normally');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/ai-yantra/voice/inbound (Inbound Guardian Call Webhook)
router.post('/voice/inbound', async (req: Request, res: Response) => {
  try {
    const fromPhone = req.body.From || req.body.Caller || req.query.From || '';
    const cleanFrom = (fromPhone as string).replace(/[^0-9]/g, '');
    const last10 = cleanFrom.slice(-10);

    // Look up caller in guardians by phone
    const guardianRes = await db.query(
      `SELECT g.id as guardian_id, g.full_name as guardian_name,
              COALESCE(g.preferred_language, 'te-IN') as preferred_language,
              s.id as student_id, (s.first_name || ' ' || s.last_name) as student_name, s.admission_number,
              s.institution_id, i.name as institution_name
       FROM guardians g
       JOIN student_guardians sg ON sg.guardian_id = g.id
       JOIN students s ON s.id = sg.student_id
       JOIN institutions i ON i.id = s.institution_id
       WHERE g.phone LIKE '%' || $1 || '%'
       LIMIT 1`,
      [last10 || cleanFrom]
    );

    let streamUrl: string | undefined;
    if (env.PUBLIC_BASE_URL) {
      const cleanBase = env.PUBLIC_BASE_URL.replace(/\/$/, '');
      const wsHost = cleanBase.replace(/^http/, 'ws');
      streamUrl = `${wsHost}/api/v1/ai-yantra/voice/stream`;
    }

    if (guardianRes.rows.length > 0) {
      const g = guardianRes.rows[0];
      const lang = g.preferred_language || 'te-IN';
      const greeting = lang === 'te-IN'
        ? `నమస్కారం ${g.guardian_name} గారు! ${g.institution_name} నుండి ప్రియను మాట్లాడుతున్నాను. మీ బిడ్డ ${g.student_name} గురించి మీకు ఏ సమాచారం కావాలండి?`
        : lang === 'hi-IN'
        ? `नमस्ते ${g.guardian_name} जी! मैं ${g.institution_name} से प्रिया बोल रही हूँ। आपके बच्चे ${g.student_name} के बारे में आपको क्या जानकारी चाहिए?`
        : `Hello ${g.guardian_name}! This is Priya from ${g.institution_name}. How can I assist you regarding your child ${g.student_name}?`;

      if (streamUrl) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="institutionId" value="${g.institution_id}" />
      <Parameter name="studentId" value="${g.admission_number}" />
      <Parameter name="studentName" value="${g.student_name}" />
      <Parameter name="guardianId" value="${g.guardian_id}" />
      <Parameter name="guardianName" value="${g.guardian_name}" />
      <Parameter name="language" value="${lang}" />
      <Parameter name="useCase" value="inbound_query" />
      <Parameter name="initialGreeting" value="${greeting}" />
    </Stream>
  </Connect>
</Response>`;
        res.type('text/xml');
        return res.send(twiml);
      } else {
        const say = lang === 'te-IN'
          ? `<Say voice="Google.te-IN-Standard-A" language="te-IN">${greeting}</Say>`
          : `<Say voice="Polly.Aditi" language="${lang === 'hi-IN' ? 'hi-IN' : 'en-IN'}">${greeting}</Say>`;
        const twiml = `<Response><Pause length="1"/>${say}</Response>`;
        res.type('text/xml');
        return res.send(twiml);
      }
    } else {
      // Unknown caller: ask for admission number
      const greeting = 'నమస్కారం అండి! నారాయణ విద్యా సంస్థలకు స్వాగతం. మీ విద్యార్థి వివరాల కోసం దయచేసి అడ్మిషన్ నంబర్ చెప్పండి.';
      if (streamUrl) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="institutionId" value="${env.DEFAULT_TENANT_ID}" />
      <Parameter name="studentId" value="unknown" />
      <Parameter name="language" value="te-IN" />
      <Parameter name="useCase" value="inbound_unknown" />
      <Parameter name="initialGreeting" value="${greeting}" />
    </Stream>
  </Connect>
</Response>`;
        res.type('text/xml');
        return res.send(twiml);
      } else {
        const twiml = `<Response><Pause length="1"/><Say voice="Google.te-IN-Standard-A" language="te-IN">${greeting}</Say></Response>`;
        res.type('text/xml');
        return res.send(twiml);
      }
    }
  } catch (err: any) {
    console.error('[INBOUND CALL ERROR]', err.message);
    const twiml = `<Response><Say>An error occurred connecting your call. Please try again later.</Say></Response>`;
    res.type('text/xml');
    res.send(twiml);
  }
});

// AI Attendance lives in the attendance module: /api/v1/attendance/face/*
// AI Tutor lives in ./tutor (mounted at /api/v1/ai-yantra/tutor)

export default router;
