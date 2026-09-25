import { Router, Request, Response } from 'express';
import { db } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/api-response';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// GET /api/v1/documents
router.get('/', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query(
      `SELECT d.*, dt.name as document_type_name
       FROM documents d
       JOIN document_types dt ON dt.id = d.document_type_id
       WHERE d.institution_id = $1
       ORDER BY d.created_at DESC`,
      [instId]
    );
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/documents/types
router.get('/types', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM document_types ORDER BY name ASC');
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/documents/bonafide
router.post('/bonafide', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { studentId, purpose = 'General Purpose' } = req.body;
    const instId = req.institutionId!;

    const sRes = await db.query(
      `SELECT s.*, c.name as class_name, sec.name as section_name, i.name as institution_name
       FROM students s
       JOIN institutions i ON i.id = s.institution_id
       LEFT JOIN classes c ON c.id = s.current_class_id
       LEFT JOIN sections sec ON sec.id = s.current_section_id
       WHERE s.id = $1 AND s.institution_id = $2`,
      [studentId, instId]
    );

    if (sRes.rows.length === 0) {
      sendError(res, 'Student not found', 404);
      return;
    }

    const student = sRes.rows[0];
    const certificateId = `BONA-${Date.now().toString().slice(-6)}`;
    const verificationUrl = `https://verify.vid.edu/cert/${certificateId}`;

    sendSuccess(res, {
      certificateId,
      studentName: `${student.first_name} ${student.last_name}`,
      admissionNumber: student.admission_number,
      className: student.class_name,
      institutionName: student.institution_name,
      purpose,
      issuedDate: new Date().toISOString().split('T')[0],
      verificationUrl,
      qrPayload: JSON.stringify({
        cert: certificateId,
        student: student.admission_number,
        inst: student.institution_id,
      }),
    }, 'Bonafide certificate generated with QR verification');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

export default router;
