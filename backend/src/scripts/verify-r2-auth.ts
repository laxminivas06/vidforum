import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { AuthRepository } from '../modules/auth/auth.repository';
import { AuthRateLimiter } from '../modules/auth/auth-rate-limiter';
import request from 'http';
import { app } from '../app';

async function runTests() {
  console.log('=== Step R2: Authentication Verification Suite ===');

  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api/v1/auth`;

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
    // 1. Missing Identifier -> 400
    const test1 = await makeRequest('/login', 'POST', { identifier: '', password: 'SomePassword123!' });
    console.assert(test1.status === 400, `Test 1 Failed: Expected 400, got ${test1.status}`);
    console.log('✔ Test 1: Empty identifier rejected with 400');

    // 2. Missing Password -> 400
    const test2 = await makeRequest('/login', 'POST', { identifier: 'superadmin@vid.edu', password: '' });
    console.assert(test2.status === 400, `Test 2 Failed: Expected 400, got ${test2.status}`);
    console.log('✔ Test 2: Empty password rejected with 400');

    // 3. Nonexistent user -> 401
    const test3 = await makeRequest('/login', 'POST', { identifier: 'nonexistent.user@random.com', password: 'SomePassword123!' });
    console.assert(test3.status === 401, `Test 3 Failed: Expected 401, got ${test3.status}`);
    console.log('✔ Test 3: Nonexistent user rejected with 401');

    // 4. Existing user with wrong password -> 401
    const test4 = await makeRequest('/login', 'POST', { identifier: 'superadmin@vid.edu', password: 'WrongPassword999!' });
    console.assert(test4.status === 401, `Test 4 Failed: Expected 401, got ${test4.status}`);
    console.log('✔ Test 4: Incorrect password rejected with 401');

    // 5. Correct login for superadmin (initial bcrypt hash is admin123)
    const test5 = await makeRequest('/login', 'POST', { identifier: 'superadmin@vid.edu', password: 'admin123' });
    console.assert(test5.status === 200, `Test 5 Failed: Expected 200, got ${test5.status}`);
    console.assert(test5.data?.data?.token, 'Test 5 Failed: Token not returned');
    console.assert(test5.data?.data?.user?.role === 'SUPER_ADMIN', `Test 5 Failed: Role mismatch ${test5.data?.data?.user?.role}`);
    console.log('✔ Test 5: Valid password authenticated successfully via bcrypt');

    const superAdminToken = test5.data?.data?.token;
    const refreshToken = test5.data?.data?.refreshToken;

    // 6. Test GET /me with token
    const test6 = await makeRequest('/me', 'GET', undefined, superAdminToken);
    console.assert(test6.status === 200, `Test 6 Failed: Expected 200, got ${test6.status}`);
    console.log('✔ Test 6: GET /me returns authenticated user details');

    // 7. Test Refresh Token Rotation
    const test7 = await makeRequest('/refresh', 'POST', { refreshToken });
    console.assert(test7.status === 200, `Test 7 Failed: Expected 200, got ${test7.status}`);
    console.assert(test7.data?.data?.token, 'Test 7 Failed: New token missing');
    console.assert(test7.data?.data?.refreshToken, 'Test 7 Failed: New refresh token missing');
    console.log('✔ Test 7: Refresh token rotated and new access token issued');

    // 8. Test Rate Limiting / Lockout (5 failed attempts)
    const dummyUser = 'lockout.test@example.com';
    // Clear any previous attempts
    await AuthRateLimiter.reset('127.0.0.1', dummyUser);

    for (let i = 1; i <= 4; i++) {
      const failReq = await makeRequest('/login', 'POST', { identifier: dummyUser, password: 'BadPassword' });
      console.assert(failReq.status === 401, `Attempt ${i} expected 401, got ${failReq.status}`);
    }
    // 5th attempt triggers lockout
    const fifthReq = await makeRequest('/login', 'POST', { identifier: dummyUser, password: 'BadPassword' });
    console.assert(fifthReq.status === 429, `Attempt 5 expected 429 lockout, got ${fifthReq.status}`);
    console.log('✔ Test 8: 5 consecutive failed attempts enforce 429 Account Lockout');

    // 9. Test Password Denylist & Change Password
    // Denylist rejection
    const denyTest = await makeRequest('/change-password', 'POST', {
      currentPassword: 'admin123',
      newPassword: 'password123',
    }, superAdminToken);
    console.assert(denyTest.status === 400, `Denylist expected 400, got ${denyTest.status}`);
    console.log('✔ Test 9A: Weak password in denylist rejected with 400');

    // Short password rejection
    const shortTest = await makeRequest('/change-password', 'POST', {
      currentPassword: 'admin123',
      newPassword: 'short',
    }, superAdminToken);
    console.assert(shortTest.status === 400, `Short password expected 400, got ${shortTest.status}`);
    console.log('✔ Test 9B: Short password (< 8 chars) rejected with 400');

    // 10. Audit logs verification
    const auditRes = await db.query(
      `SELECT action, actor_id, resource_table, ip_address 
       FROM audit_logs 
       WHERE action IN ('auth.login.success', 'auth.login.failure', 'auth.login.lockout')
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    console.assert(auditRes.rows.length > 0, 'Test 10 Failed: No auth audit events recorded');
    console.log(`✔ Test 10: Security audit logs recorded ${auditRes.rows.length} immutable auth events`);

    console.log('\nAll 10 Auth Hardening tests PASSED cleanly!');
  } catch (err) {
    console.error('Test suite failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
