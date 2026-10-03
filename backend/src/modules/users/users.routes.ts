import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
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

// GET /api/v1/users/faculty-accounts - Fetch faculty roster with credentials status
router.get('/faculty-accounts', async (req: Request, res: Response) => {
  try {
    const institutionId = (req.query.institutionId as string) || req.headers['x-institution-id'] as string;
    const query = `
      SELECT 
        st.id as "staffId",
        st.employee_code as "employeeCode",
        p.id as "profileId",
        p.full_name as name,
        p.email,
        p.phone,
        st.employment_status as status,
        COALESCE(d.name, 'Academic Department') as department,
        COALESCE(des.name, 'Lecturer') as designation,
        st.qualification,
        st.university,
        st.subjects,
        st.experience,
        st.address,
        st.date_of_birth as "dateOfBirth",
        st.gender,
        COALESCE(u.raw_user_meta_data->>'user_id', p.email) as "userId",
        u.raw_user_meta_data->>'plain_password_hint' as "tempPassword",
        CASE WHEN u.encrypted_password IS NOT NULL THEN true ELSE false END as "hasCredentials",
        COALESCE(
          ur.scope->'workspaces',
          u.raw_user_meta_data->'workspaces',
          '["faculty", "academics", "attendance", "examinations", "timetable"]'::jsonb
        ) as "assignedWorkspaces",
        COALESCE(r.name, 'FACULTY') as role,
        st.created_at as "createdAt"
      FROM staff st
      JOIN profiles p ON p.id = st.profile_id
      LEFT JOIN auth.users u ON u.id = p.id
      LEFT JOIN departments d ON d.id = st.department_id
      LEFT JOIN designations des ON des.id = st.designation_id
      LEFT JOIN user_roles ur ON ur.profile_id = p.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE ($1::text IS NULL OR st.institution_id::text = $1)
      ORDER BY st.created_at DESC, p.full_name ASC
    `;
    const result = await db.query(query, [institutionId || null]);
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/users/provision-faculty - Generate User ID & Password for faculty / staff
router.post('/provision-faculty', async (req: Request, res: Response) => {
  const client = await db.getClient();
  try {
    const { staffId, name, email, userId, password, role = 'FACULTY', institutionId, workspaces } = req.body;

    if (!email) {
      sendError(res, 'Email is required to provision faculty credentials', 400);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUserId = (userId || cleanEmail).trim();
    const cleanName = (name || cleanUserId).trim();
    const rawPassword = (password && password.trim()) || 'admin123';
    const hashedPassword = bcrypt.hashSync(rawPassword, 10);
    const cleanWorkspaces: string[] = Array.isArray(workspaces) && workspaces.length > 0
      ? workspaces
      : ['faculty', 'academics', 'attendance', 'examinations', 'timetable'];

    // 1. Resolve institution
    let targetInstId = institutionId;
    if (!targetInstId) {
      const instRes = await client.query("SELECT id FROM institutions WHERE status = 'active' ORDER BY created_at ASC LIMIT 1");
      targetInstId = instRes.rows[0]?.id;
    }

    // 2. Resolve Role
    const roleRes = await client.query(
      `SELECT id, name FROM roles 
       WHERE LOWER(name) = LOWER($1) 
          OR LOWER(REPLACE(name, ' ', '_')) = LOWER($1)
       LIMIT 1`,
      [role.trim()]
    );
    const roleId = roleRes.rows[0]?.id || '33333333-3333-3333-3333-333333333302';
    const resolvedRoleName = roleRes.rows[0]?.name || 'FACULTY';

    await client.query('BEGIN');

    // 3. Upsert into auth.users with encrypted_password, user_id metadata, and permitted workspaces
    let userRes = await client.query('SELECT id, raw_user_meta_data FROM auth.users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    let profileId = userRes.rows[0]?.id;

    const userMetadata = {
      full_name: cleanName,
      user_id: cleanUserId,
      userId: cleanUserId,
      plain_password_hint: rawPassword,
      workspaces: cleanWorkspaces,
    };

    if (profileId) {
      await client.query(
        `UPDATE auth.users 
         SET encrypted_password = $1,
             raw_user_meta_data = (COALESCE(raw_user_meta_data, '{}'::jsonb) || $2::jsonb),
             updated_at = now()
         WHERE id = $3`,
        [hashedPassword, JSON.stringify(userMetadata), profileId]
      );
    } else {
      const insertAuth = await client.query(
        `INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
         RETURNING id`,
        [cleanEmail, hashedPassword, JSON.stringify(userMetadata)]
      );
      profileId = insertAuth.rows[0].id;
    }

    // 4. Ensure profiles table has record
    await client.query(
      `INSERT INTO profiles (id, full_name, email, default_institution_id, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (id) DO UPDATE
         SET full_name = EXCLUDED.full_name, default_institution_id = COALESCE(EXCLUDED.default_institution_id, profiles.default_institution_id), updated_at = now()`,
      [profileId, cleanName, cleanEmail, targetInstId]
    );

    // 5. If staffId provided, link to profile_id; else ensure staff row exists
    if (staffId) {
      await client.query(`UPDATE staff SET profile_id = $1 WHERE id = $2`, [profileId, staffId]);
    } else {
      const existingStaff = await client.query('SELECT id FROM staff WHERE profile_id = $1', [profileId]);
      if (existingStaff.rowCount === 0) {
        const empCode = `FAC-EMP-${Math.floor(1000 + Math.random() * 9000)}`;
        await client.query(
          `INSERT INTO staff (id, institution_id, profile_id, employee_code, is_teaching_staff, employment_status, date_of_joining)
           VALUES (gen_random_uuid(), $1, $2, $3, true, 'active', CURRENT_DATE)`,
          [targetInstId, profileId, empCode]
        );
      }
    }

    // 6. Assign role in user_roles with permitted workspaces in scope
    await client.query('DELETE FROM user_roles WHERE profile_id = $1', [profileId]);
    await client.query(
      `INSERT INTO user_roles (id, profile_id, role_id, institution_id, scope, granted_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, now())`,
      [profileId, roleId, targetInstId, JSON.stringify({ workspaces: cleanWorkspaces })]
    );

    await client.query('COMMIT');

    sendSuccess(res, {
      profileId,
      staffId: staffId || null,
      name: cleanName,
      email: cleanEmail,
      userId: cleanUserId,
      role: resolvedRoleName,
      workspaces: cleanWorkspaces,
      hasCredentials: true,
      plainPassword: rawPassword,
    }, 'Faculty credentials provisioned successfully. User can now log in.');
  } catch (error: any) {
    await client.query('ROLLBACK');
    sendError(res, error.message, 500);
  } finally {
    client.release();
  }
});

// POST /api/v1/users/clean-test-data - Removes test staff/faculty and cleans workspaces
router.post('/clean-test-data', async (_req: Request, res: Response) => {
  try {
    const tablesRes = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    const tables = new Set(tablesRes.rows.map((r: any) => r.table_name));

    const protectedEmails = "('superadmin@vid.edu', 'vishal@gmail.com', 'admin@narayana.edu', 'vikram.sen@cga.edu')";

    // 0. Child tables of staff
    if (tables.has('staff_employment')) {
      await db.query(`
        DELETE FROM staff_employment
        WHERE staff_id IN (
          SELECT s.id FROM staff s
          LEFT JOIN profiles p ON p.id = s.profile_id
          WHERE p.email NOT IN ${protectedEmails} OR p.email IS NULL
        )
      `);
    }

    if (tables.has('faculty_assignments')) {
      await db.query(`
        DELETE FROM faculty_assignments
        WHERE staff_id IN (
          SELECT s.id FROM staff s
          LEFT JOIN profiles p ON p.id = s.profile_id
          WHERE p.email NOT IN ${protectedEmails} OR p.email IS NULL
        )
      `);
    }

    // 1. Delete test staff
    if (tables.has('staff')) {
      await db.query(`
        DELETE FROM staff
        WHERE profile_id IN (
          SELECT p.id FROM profiles p
          WHERE p.email NOT IN ${protectedEmails}
        ) OR profile_id IS NULL
      `);
    }

    // 2. Delete test user_roles
    if (tables.has('user_roles')) {
      await db.query(`
        DELETE FROM user_roles
        WHERE profile_id IN (
          SELECT p.id FROM profiles p
          WHERE p.email NOT IN ${protectedEmails}
        )
      `);
    }

    // 3. Delete test profiles
    if (tables.has('profiles')) {
      await db.query(`
        DELETE FROM profiles
        WHERE email NOT IN ${protectedEmails}
      `);
    }

    // 4. Delete test auth.users
    await db.query(`
      DELETE FROM auth.users
      WHERE email NOT IN ${protectedEmails}
    `);

    // 5. Ensure default admin accounts exist and have default password 'admin123'
    const defaultPassHash = bcrypt.hashSync('admin123', 10);

    const ngsRes = await db.query(`SELECT id FROM institutions WHERE code = 'NGS' LIMIT 1`);
    const ngsId = ngsRes.rows[0]?.id || '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f';

    const adminEmails = [
      { email: 'admin@narayana.edu', name: 'Narayana Institute Admin', userId: 'admin@narayana.edu', instId: ngsId },
      { email: 'vishal@gmail.com', name: 'NGS Administrator', userId: 'vishal@gmail.com', instId: ngsId },
    ];

    for (const adm of adminEmails) {
      let authUser = await db.query('SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1)', [adm.email]);
      let authId = authUser.rows[0]?.id;
      if (!authId) {
        const ins = await db.query(
          `INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
           RETURNING id`,
          [adm.email, defaultPassHash, JSON.stringify({ full_name: adm.name, user_id: adm.userId })]
        );
        authId = ins.rows[0].id;
      } else {
        await db.query(
          `UPDATE auth.users SET encrypted_password = $1, raw_user_meta_data = $2, updated_at = now() WHERE id = $3`,
          [defaultPassHash, JSON.stringify({ full_name: adm.name, user_id: adm.userId }), authId]
        );
      }

      await db.query(
        `INSERT INTO profiles (id, full_name, email, default_institution_id, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, default_institution_id = EXCLUDED.default_institution_id`,
        [authId, adm.name, adm.email, adm.instId]
      );

      const adminRoleRes = await db.query(`SELECT id FROM roles WHERE LOWER(name) LIKE '%institution%' LIMIT 1`);
      const adminRoleId = adminRoleRes.rows[0]?.id || '22222222-2222-2222-2222-222222222201';
      await db.query(`DELETE FROM user_roles WHERE profile_id = $1`, [authId]);
      await db.query(
        `INSERT INTO user_roles (id, profile_id, role_id, institution_id, scope, granted_at)
         VALUES (gen_random_uuid(), $1, $2, $3, '{"workspaces": ["institute-admin", "hrms", "admissions", "academics", "finance", "examinations"]}', now())`,
        [authId, adminRoleId, adm.instId]
      );
    }

    // Super Admin
    let saAuth = await db.query('SELECT id FROM auth.users WHERE LOWER(email) = $1', ['superadmin@vid.edu']);
    if (saAuth.rows[0]?.id) {
      await db.query(
        `UPDATE auth.users SET encrypted_password = $1, updated_at = now() WHERE id = $2`,
        [defaultPassHash, saAuth.rows[0].id]
      );
    }

    sendSuccess(res, { message: 'All test data purged successfully. HRMS and Institute Admin workspaces cleaned. Default password set to admin123.' });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

export default router;
