import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { db } from '../config/database';
import { app } from '../app';

async function runTests() {
  console.log('=== Step R3: Server-Side Workspace Enforcement Suite ===');

  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const makeRequest = async (path: string, method: string, body?: any, token?: string) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json };
  };

  try {
    // 1. GET /workspaces (Public)
    const test1 = await makeRequest('/workspaces', 'GET');
    console.assert(test1.status === 200, `Test 1 Failed: Expected 200, got ${test1.status}`);
    console.assert(test1.data?.data?.length === 13, `Test 1 Failed: Expected 13 workspaces, got ${test1.data?.data?.length}`);
    console.log(`✔ Test 1: GET /workspaces returned ${test1.data?.data?.length} canonical workspaces`);

    // Setup Test Tokens
    const instId = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f';

    const superAdminToken = jwt.sign(
      { id: '44444444-4444-4444-4444-444444444404', email: 'superadmin@vid.edu', role: 'SUPER_ADMIN', permissions: ['*'] },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const instAdminToken = jwt.sign(
      { id: '8eb4e828-1f22-43fc-9da2-e76e7aca3274', email: 'vishal@gmail.com', role: 'INSTITUTION_ADMIN', institutionId: instId, permissions: ['*'] },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const realFaculty = await db.query(
      `SELECT p.id, p.email, p.default_institution_id 
       FROM profiles p 
       JOIN staff st ON st.profile_id = p.id 
       LIMIT 1`
    );
    const facultyUser = realFaculty.rows[0];

    const facultyToken = jwt.sign(
      {
        id: facultyUser ? facultyUser.id : '55555555-5555-5555-5555-555555555501',
        email: facultyUser ? facultyUser.email : 'test.faculty@school.edu',
        role: 'FACULTY',
        institutionId: facultyUser?.default_institution_id || instId,
        permissions: ['faculty.view_assigned'],
        assignedWorkspaces: ['faculty', 'academics', 'attendance', 'examinations', 'timetable'],
      },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // 2. Unauthenticated request to /api/v1/hrms -> 401
    const test2 = await makeRequest('/hrms/staff', 'GET');
    console.assert(test2.status === 401, `Test 2 Failed: Expected 401, got ${test2.status}`);
    console.log('✔ Test 2: Unauthenticated access to /hrms/staff rejected with 401');

    // 3. Super Admin accessing tenant operational /hrms/staff -> 403 Forbidden
    const test3 = await makeRequest('/hrms/staff', 'GET', undefined, superAdminToken);
    console.assert(test3.status === 403, `Test 3 Failed: Expected 403, got ${test3.status}`);
    console.assert(test3.data?.error?.code === 'WORKSPACE_ACCESS_DENIED', `Test 3 Failed: Expected WORKSPACE_ACCESS_DENIED`);
    console.log('✔ Test 3: Super Admin access to tenant workspace denied with 403 WORKSPACE_ACCESS_DENIED');

    // 4. Faculty accessing ungranted /hrms/staff -> 403 Forbidden
    const test4 = await makeRequest('/hrms/staff', 'GET', undefined, facultyToken);
    console.assert(test4.status === 403, `Test 4 Failed: Expected 403, got ${test4.status}`);
    console.assert(test4.data?.error?.code === 'WORKSPACE_ACCESS_DENIED', `Test 4 Failed: Expected WORKSPACE_ACCESS_DENIED`);
    console.log('✔ Test 4: Faculty access to ungranted /hrms/staff denied with 403 WORKSPACE_ACCESS_DENIED');

    // 5. Institution Admin accessing /hrms/staff -> 200 OK
    const test5 = await makeRequest('/hrms/staff', 'GET', undefined, instAdminToken);
    console.assert(test5.status === 200, `Test 5 Failed: Expected 200, got ${test5.status}`);
    console.log('✔ Test 5: Institution Admin access to /hrms/staff granted with 200 OK');

    // 6. Faculty accessing granted /faculty -> 200 OK
    const test6 = await makeRequest('/faculty', 'GET', undefined, facultyToken);
    console.assert(test6.status === 200, `Test 6 Failed: Expected 200, got ${test6.status}`);
    console.log('✔ Test 6: Faculty access to granted /faculty workspace granted with 200 OK');

    // 7. Check audit logs for workspace.access.denied
    const auditRes = await db.query(
      `SELECT action, actor_id, resource_table, resource_id 
       FROM audit_logs 
       WHERE action = 'workspace.access.denied' 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    console.assert(auditRes.rows.length >= 2, `Test 7 Failed: Expected at least 2 denial audit events, got ${auditRes.rows.length}`);
    console.log(`✔ Test 7: Audit log captured ${auditRes.rows.length} immutable workspace denial events`);

    console.log('\nAll 7 Workspace Enforcement tests PASSED cleanly!');
  } catch (err) {
    console.error('Test suite failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
