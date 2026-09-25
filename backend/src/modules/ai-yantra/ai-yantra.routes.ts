import { Router, Request, Response } from 'express';
import { db } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/api-response';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// ==========================================
// 1. Voice Agent Workspace
// ==========================================

// GET /api/v1/ai-yantra/voice/campaigns
router.get('/voice/campaigns', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query(
      `SELECT c.*, 
              (SELECT count(*) FROM ai_voice_recipients WHERE campaign_id = c.id) as recipients_count,
              (SELECT count(*) FROM ai_voice_calls vc JOIN ai_voice_recipients vr ON vr.id = vc.recipient_id WHERE vr.campaign_id = c.id AND vc.status = 'completed') as completed_calls
       FROM ai_voice_campaigns c
       WHERE c.institution_id = $1
       ORDER BY c.created_at DESC`,
      [instId]
    );

    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/ai-yantra/voice/dispatch (Telephony Campaign Dispatch Simulator)
router.post('/voice/dispatch', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, scriptTemplate, targetFilter } = req.body;
    const instId = req.institutionId!;

    const campRes = await db.query(
      `INSERT INTO ai_voice_campaigns (institution_id, title, script_template, status)
       VALUES ($1, $2, $3, 'running') RETURNING *`,
      [instId, title, scriptTemplate]
    );

    const campaign = campRes.rows[0];

    // Find sample recipients (guardians of students)
    const guardRes = await db.query(
      'SELECT id, phone FROM guardians WHERE institution_id = $1 AND phone IS NOT NULL LIMIT 5',
      [instId]
    );

    for (const g of guardRes.rows) {
      const recRes = await db.query(
        'INSERT INTO ai_voice_recipients (campaign_id, guardian_id, phone) VALUES ($1, $2, $3) RETURNING id',
        [campaign.id, g.id, g.phone]
      );
      // Simulate completed call
      await db.query(
        "INSERT INTO ai_voice_calls (recipient_id, status, duration_seconds, transcript) VALUES ($1, 'completed', 45, 'Automated parent notification delivered successfully')",
        [recRes.rows[0].id]
      );
    }

    sendSuccess(res, {
      campaignId: campaign.id,
      recipientsQueued: guardRes.rows.length,
      status: 'DISPATCHED',
    }, 'Voice outreach campaign initiated');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// ==========================================
// 2. AI Attendance Workspace
// ==========================================

// GET /api/v1/ai-yantra/attendance/events
router.get('/attendance/events', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query(
      `SELECT ae.*, s.admission_number, (s.first_name || ' ' || s.last_name) as student_name
       FROM ai_attendance_events ae
       LEFT JOIN students s ON s.id = ae.student_id
       WHERE ae.institution_id = $1
       ORDER BY ae.detected_at DESC LIMIT 50`,
      [instId]
    );

    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// ==========================================
// 3. AI Tutor Workspace
// ==========================================

// POST /api/v1/ai-yantra/tutor/chat
router.post('/tutor/chat', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { studentId, message, subject = 'Mathematics' } = req.body;

    // Simulated contextual RAG response based on syllabus and inquiry
    let reply = `Here is a step-by-step breakdown for ${subject}: To solve this problem, first identify the given variables, apply the standard theorem, and simplify the algebraic terms carefully. Would you like a practice problem to test your understanding?`;

    if (message.toLowerCase().includes('calculus') || message.toLowerCase().includes('derivative')) {
      reply = `In differential calculus, the derivative represents the instantaneous rate of change of a function. For polynomial f(x) = x^n, using the power rule d/dx[x^n] = n*x^(n-1). Let me know if you would like to differentiate a specific equation together!`;
    }

    sendSuccess(res, {
      reply,
      suggestedQuestions: [
        'Can you show me an example problem?',
        'What are the real-world applications of this?',
        'Give me a 3-question quiz on this topic.',
      ],
      subject,
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

export default router;
