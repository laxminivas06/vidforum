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
        UPPER(p.status::text) as status,
        COALESCE(r.name, 'SUPER_ADMIN') as role,
        COALESCE(i.name, 'VID Global Platform') as institution,
        i.id as "institutionId",
        p.created_at as "createdAt"
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

// POST /api/v1/users - Directly persists to Supabase Cloud Database
router.post('/', async (req: Request, res: Response) => {
  const client = await db.getClient();
  try {
    const { name, email, role = 'FACULTY', institutionName } = req.body;

    if (!name || !email) {
      sendError(res, 'Name and email are required', 400);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = name.trim();

    // 1. Resolve institution ID
    let instId: string | null = null;
    let instName = 'VID Global Platform';
    if (institutionName && institutionName !== 'VID Global Platform') {
      const instRes = await client.query(
        'SELECT id, name FROM institutions WHERE name ILIKE $1 OR code ILIKE $1 LIMIT 1',
        [institutionName.trim()]
      );
      if (instRes.rows[0]) {
        instId = instRes.rows[0].id;
        instName = instRes.rows[0].name;
      }
    }

    // 2. Resolve Role ID
    const normalizedRole = role.trim();
    const roleRes = await client.query(
      `SELECT id, name FROM roles 
       WHERE LOWER(name) = LOWER($1) 
          OR LOWER(REPLACE(name, ' ', '_')) = LOWER($1)
          OR LOWER(name) = LOWER(REPLACE($1, '_', ' '))
       LIMIT 1`,
      [normalizedRole]
    );
    const roleId = roleRes.rows[0]?.id || '33333333-3333-3333-3333-333333333302';
    const resolvedRoleName = roleRes.rows[0]?.name || normalizedRole;

    await client.query('BEGIN');

    // 3. Ensure record in auth.users
    let userRes = await client.query('SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    let profileId = userRes.rows[0]?.id;

    if (!profileId) {
      const insertAuth = await client.query(`
        INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, now(), now())
        RETURNING id
      `, [cleanEmail, JSON.stringify({ full_name: displayName })]);
      profileId = insertAuth.rows[0].id;
    }

    // 4. Ensure record in profiles
    await client.query(`
      INSERT INTO profiles (id, full_name, email, default_institution_id, status)
      VALUES ($1, $2, $3, $4, 'active')
      ON CONFLICT (id) DO UPDATE
        SET full_name = EXCLUDED.full_name, default_institution_id = EXCLUDED.default_institution_id, updated_at = now()
    `, [profileId, displayName, cleanEmail, instId]);

    // 5. Assign role in user_roles
    await client.query(`DELETE FROM user_roles WHERE profile_id = $1`, [profileId]);
    await client.query(`
      INSERT INTO user_roles (id, profile_id, role_id, institution_id, scope, granted_at)
      VALUES (gen_random_uuid(), $1, $2, $3, '{}', now())
    `, [profileId, roleId, instId]);

    await client.query('COMMIT');

    const newUser = {
      id: profileId,
      name: displayName,
      email: cleanEmail,
      role: resolvedRoleName.toUpperCase().replace(/\s+/g, '_'),
      institution: instName,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    };

    sendSuccess(res, newUser, 'Platform user created successfully', 201);
  } catch (error: any) {
    await client.query('ROLLBACK');
    sendError(res, error.message, 500);
  } finally {
    client.release();
  }
});

// PATCH /api/v1/users/:id - Edit Platform User with Direct DB Persistence
router.patch('/:id', async (req: Request, res: Response) => {
  const client = await db.getClient();
  try {
    const id = req.params.id as string;
    const { name, email, role, institutionName, status } = req.body;

    // 1. Check if user exists and fetch current state
    const currentRes = await client.query(`
      SELECT p.*, i.name as institution_name 
      FROM profiles p 
      LEFT JOIN institutions i ON i.id = p.default_institution_id 
      WHERE p.id = $1
    `, [id]);

    if (currentRes.rowCount === 0) {
      sendError(res, 'User not found in cloud database', 404);
      return;
    }
    const current = currentRes.rows[0];

    // 2. Resolve institution ID
    let instId: string | null = current.default_institution_id;
    let instName = current.institution_name || 'VID Global Platform';

    if (institutionName !== undefined) {
      if (institutionName === 'VID Global Platform' || !institutionName) {
        instId = null;
        instName = 'VID Global Platform';
      } else {
        const instRes = await client.query(
          'SELECT id, name FROM institutions WHERE name ILIKE $1 OR code ILIKE $1 LIMIT 1',
          [institutionName.trim()]
        );
        if (instRes.rows[0]) {
          instId = instRes.rows[0].id;
          instName = instRes.rows[0].name;
        }
      }
    }

    // 3. Resolve Role ID if provided
    let roleId: string | null = null;
    let resolvedRoleName: string | null = null;
    if (role) {
      const normalizedRole = role.trim();
      const roleRes = await client.query(
        `SELECT id, name FROM roles 
         WHERE LOWER(name) = LOWER($1) 
            OR LOWER(REPLACE(name, ' ', '_')) = LOWER($1)
            OR LOWER(name) = LOWER(REPLACE($1, '_', ' '))
         LIMIT 1`,
        [normalizedRole]
      );
      if (roleRes.rows[0]) {
        roleId = roleRes.rows[0].id;
        resolvedRoleName = roleRes.rows[0].name;
      }
    }

    await client.query('BEGIN');

    const cleanEmail = email !== undefined ? email.trim().toLowerCase() : current.email;
    const displayName = name !== undefined ? name.trim() : current.full_name;
    const updatedStatus = status ? status.toLowerCase() : current.status;

    // 4. Update profiles table
    const profileUpdate = await client.query(`
      UPDATE profiles
      SET 
        full_name = $1,
        email = $2,
        default_institution_id = $3,
        status = $4,
        updated_at = now()
      WHERE id = $5
      RETURNING *
    `, [displayName, cleanEmail, instId, updatedStatus, id]);

    // 5. Update auth.users metadata if email/name provided
    if (email !== undefined || name !== undefined) {
      await client.query(`
        UPDATE auth.users
        SET 
          email = COALESCE($1, email),
          raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{full_name}', to_jsonb(COALESCE($2, ''))),
          updated_at = now()
        WHERE id = $3
      `, [cleanEmail, displayName, id]);
    }

    // 6. Update user_roles if role specified
    if (roleId) {
      await client.query(`DELETE FROM user_roles WHERE profile_id = $1`, [id]);
      await client.query(`
        INSERT INTO user_roles (id, profile_id, role_id, institution_id, scope, granted_at)
        VALUES (gen_random_uuid(), $1, $2, $3, '{}', now())
      `, [id, roleId, instId]);
    } else if (instId !== current.default_institution_id) {
      await client.query(`UPDATE user_roles SET institution_id = $1 WHERE profile_id = $2`, [instId, id]);
    }

    await client.query('COMMIT');

    const updatedUser = {
      id,
      name: profileUpdate.rows[0].full_name,
      email: profileUpdate.rows[0].email,
      role: (resolvedRoleName || role || 'FACULTY').toUpperCase().replace(/\s+/g, '_'),
      institution: instName,
      status: (profileUpdate.rows[0].status || 'ACTIVE').toUpperCase(),
      updatedAt: profileUpdate.rows[0].updated_at,
    };

    sendSuccess(res, updatedUser, 'Platform user updated successfully');
  } catch (error: any) {
    await client.query('ROLLBACK');
    sendError(res, error.message, 500);
  } finally {
    client.release();
  }
});

// GET /api/v1/users/roles
router.get('/roles', async (_req: Request, res: Response) => {
  try {
    const rolesRes = await db.query(
      `SELECT r.id, r.name, r.is_system_role as "isSystemRole", r.created_at as "createdAt",
              count(rp.permission_id) as "permissionsCount"
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       GROUP BY r.id, r.name, r.is_system_role, r.created_at
       ORDER BY r.is_system_role DESC, r.name ASC`
    );
    sendSuccess(res, rolesRes.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/users/permissions
router.get('/permissions', async (_req: Request, res: Response) => {
  try {
    const permsRes = await db.query(
      `SELECT id, code, description, module, created_at as "createdAt"
       FROM permissions
       ORDER BY module ASC, code ASC`
    );
    sendSuccess(res, permsRes.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/users/roles/:roleId/permissions
router.get('/roles/:roleId/permissions', async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const resRolePerms = await db.query(
      `SELECT p.id, p.code, p.description, p.module
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = $1
       ORDER BY p.module ASC, p.code ASC`,
      [roleId]
    );
    sendSuccess(res, resRolePerms.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/users/roles/:roleId/permissions
router.post('/roles/:roleId/permissions', async (req: Request, res: Response) => {
  const client = await db.getClient();
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      sendError(res, 'permissionIds array is required', 400);
      return;
    }

    await client.query('BEGIN');
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

    for (const pid of permissionIds) {
      await client.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [roleId, pid]
      );
    }

    await client.query('COMMIT');
    sendSuccess(res, { roleId, count: permissionIds.length }, 'Role permissions updated successfully');
  } catch (error: any) {
    await client.query('ROLLBACK');
    sendError(res, error.message, 500);
  } finally {
    client.release();
  }
});

export default router;
