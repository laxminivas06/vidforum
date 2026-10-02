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

// POST /api/v1/hrms/staff
router.post('/staff', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const {
      profileId,
      employeeCode,
      departmentId,
      designationId,
      isTeachingStaff,
      dateOfJoining,
      qualification,
      specialization,
    } = req.body;

    if (!profileId || !employeeCode) {
      sendError(res, 'profileId and employeeCode are required', 400);
      return;
    }

    const staffRes = await db.query(
      `INSERT INTO staff (
        institution_id, profile_id, employee_code, department_id, designation_id, 
        is_teaching_staff, employment_status, date_of_joining
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
      ON CONFLICT (institution_id, employee_code) DO UPDATE 
        SET department_id = EXCLUDED.department_id, designation_id = EXCLUDED.designation_id
      RETURNING *`,
      [
        instId,
        profileId,
        employeeCode,
        departmentId || null,
        designationId || null,
        isTeachingStaff ?? true,
        dateOfJoining || new Date().toISOString().split('T')[0],
      ]
    );

    const staff = staffRes.rows[0];

    // Auto-link to faculty table if teaching staff (Decision D3)
    if (staff.is_teaching_staff) {
      await db.query(
        `INSERT INTO faculty (institution_id, staff_id, qualification, specialization)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (staff_id) DO NOTHING`,
        [instId, staff.id, qualification || 'Master of Science', specialization || 'Core Academics']
      );
    }

    sendSuccess(res, staff, 'Staff member created successfully', 201);
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

// POST /api/v1/hrms/designations
router.post('/designations', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const { name } = req.body;
    if (!name) {
      sendError(res, 'Name is required', 400);
      return;
    }
    const result = await db.query(
      `INSERT INTO designations (institution_id, name)
       VALUES ($1, $2)
       ON CONFLICT (institution_id, name) DO NOTHING
       RETURNING *`,
      [instId, name]
    );
    sendSuccess(res, result.rows[0] || { name }, 'Designation registered', 201);
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
