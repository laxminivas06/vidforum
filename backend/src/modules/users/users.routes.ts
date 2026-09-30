import { Router, Request, Response } from 'express';
import { db } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/api-response';

const router = Router();

// GET /api/v1/users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id,
        p.full_name as name,
        p.email,
        p.status,
        COALESCE(r.name, 'INSTITUTION_ADMIN') as role,
        COALESCE(i.name, 'Springfield International Academy') as institution
      FROM profiles p
      LEFT JOIN institutions i ON i.id = p.default_institution_id
      LEFT JOIN user_roles ur ON ur.profile_id = p.id
      LEFT JOIN roles r ON r.id = ur.role_id
      ORDER BY p.created_at DESC
    `);
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/users
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, role = 'FACULTY', institutionName } = req.body;

    if (!name || !email) {
      sendError(res, 'Name and email are required', 400);
      return;
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role.toUpperCase().replace(/\s+/g, '_'),
      institution: institutionName || 'Springfield International Academy',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    sendSuccess(res, newUser, 'Platform user created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

export default router;
