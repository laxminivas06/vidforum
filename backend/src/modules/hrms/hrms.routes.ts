import { Router, Request, Response } from 'express';
import { db } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/api-response';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// GET /api/v1/hrms/staff
router.get('/staff', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query(
      `SELECT st.*, p.full_name, p.email, p.phone, d.name as department_name, des.name as designation_name
       FROM staff st
       JOIN profiles p ON p.id = st.profile_id
       LEFT JOIN departments d ON d.id = st.department_id
       LEFT JOIN designations des ON des.id = st.designation_id
       WHERE st.institution_id = $1
       ORDER BY st.employee_code ASC`,
      [instId]
    );
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/hrms/designations
router.get('/designations', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query('SELECT * FROM designations WHERE institution_id = $1 ORDER BY name ASC', [instId]);
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/hrms/leaves
router.get('/leaves', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query(
      `SELECT lr.*, p.full_name as staff_name, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN staff st ON st.id = lr.staff_id
       JOIN profiles p ON p.id = st.profile_id
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.institution_id = $1
       ORDER BY lr.created_at DESC`,
      [instId]
    );
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

export default router;
