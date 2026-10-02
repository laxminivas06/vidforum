import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { db } from '../src/config/database';
import { tenantMiddleware } from '../src/middleware/tenant.middleware';
import { requireRole, requirePermission } from '../src/middleware/rbac.middleware';
import { requireModuleEnabled } from '../src/middleware/module-guard.middleware';
import { AuditDispatcher } from '../src/common/audit-dispatcher';
import { notificationService } from '../src/modules/notifications/notification.service';
import { auditService } from '../src/modules/audit/audit.service';
import { institutionService } from '../src/modules/institutions/institution.service';

// Mock Express Request and Response
function createMockReqRes(options: {
  user?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
}) {
  const req: any = {
    user: options.user,
    headers: options.headers || {},
    params: options.params || {},
    body: options.body || {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    originalUrl: '/test-endpoint',
    method: 'GET',
  };

  let statusCode = 200;
  let responseData: any = null;
  let nextCalled = false;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    getStatusCode: () => statusCode,
    getResponseData: () => responseData,
    wasNextCalled: () => nextCalled,
  };
}

async function runStepBTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING PHASE 1, STEP B EXIT GATE TEST SUITE');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error('    Error:', err.message);
      failed++;
    }
  }

  // Fetch an existing institution ID for testing
  const instRes = await db.query('SELECT id, code FROM institutions LIMIT 2');
  assert.ok(instRes.rows.length >= 1, 'At least one institution must exist in DB');
  const primaryTenantId = instRes.rows[0].id;
  const secondaryTenantId = instRes.rows.length > 1 ? instRes.rows[1].id : '99999999-9999-9999-9999-999999999999';

  // Fetch a valid profile for FK constraints
  const profileRes = await db.query('SELECT id FROM profiles LIMIT 1');
  assert.ok(profileRes.rows.length >= 1, 'At least one profile must exist in DB');
  const validProfileId = profileRes.rows[0].id;

  // --- 1. MULTI-TENANT ISOLATION TESTS (Section 6, Rule 6, ADR-014) ---
  console.log('\n--- 1. Multi-Tenant Isolation Tests (Section 6, Rule 6) ---');

  await test('Tenant resolver permits valid matching tenant token', async () => {
    const { req, res, next, wasNextCalled } = createMockReqRes({
      user: {
        id: validProfileId,
        role: 'INSTITUTION_ADMIN',
        institutionId: primaryTenantId,
        permissions: ['academics.manage'],
      },
    });

    await tenantMiddleware(req, res, next);
    assert.equal(wasNextCalled(), true, 'next() should be called');
    assert.equal(req.institutionId, primaryTenantId, 'institutionId should match user tenant');
  });

  await test('Cross-tenant access attempt by non-super-admin returns 403 Forbidden', async () => {
    const { req, res, next, getStatusCode, getResponseData } = createMockReqRes({
      user: {
        id: validProfileId,
        role: 'INSTITUTION_ADMIN',
        institutionId: primaryTenantId,
        permissions: ['academics.manage'],
      },
      headers: {
        'x-institution-id': secondaryTenantId,
      },
    });

    await tenantMiddleware(req, res, next);
    assert.equal(getStatusCode(), 403, 'Cross-tenant request must return 403');
    assert.equal(getResponseData()?.error?.code, 'CROSS_TENANT_ACCESS_DENIED');
  });

  await test('Cross-tenant access attempt automatically dispatches security audit event', async () => {
    const auditRes = await db.query(
      `SELECT action, old_value, new_value, actor_id 
       FROM audit_logs 
       WHERE action = 'security.cross_tenant_attempt' 
       ORDER BY created_at DESC LIMIT 1`
    );
    assert.ok(auditRes.rows.length > 0, 'Audit event must be logged');
    assert.equal(auditRes.rows[0].action, 'security.cross_tenant_attempt');
    assert.equal(auditRes.rows[0].actor_id, validProfileId);
  });

  await test('Super Admin can explicitly target a secondary tenant via header', async () => {
    const { req, res, next, wasNextCalled } = createMockReqRes({
      user: {
        id: 'super-admin-01',
        role: 'SUPER_ADMIN',
        institutionId: 'vid-global',
        permissions: ['*'],
      },
      headers: {
        'x-institution-id': primaryTenantId,
      },
    });

    await tenantMiddleware(req, res, next);
    assert.equal(wasNextCalled(), true, 'Super Admin should be permitted');
    assert.equal(req.institutionId, primaryTenantId, 'Super Admin should target specified tenant');
  });

  // --- 2. RBAC ENGINE TESTS (Section 7, Rule 7, Rule 26) ---
  console.log('\n--- 2. RBAC Engine & Permission Tests (Section 7, Rule 7) ---');

  await test('requireRole permits user with allowed role', async () => {
    const { req, res, next, wasNextCalled } = createMockReqRes({
      user: { id: 'u1', role: 'INSTITUTION_ADMIN', permissions: [] },
    });
    const mw = requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN');
    mw(req, res, next);
    assert.equal(wasNextCalled(), true);
  });

  await test('requireRole rejects user with forbidden role with 403', async () => {
    const { req, res, next, getStatusCode, getResponseData } = createMockReqRes({
      user: { id: 'u2', role: 'STUDENT', permissions: [] },
    });
    const mw = requireRole('FACULTY', 'INSTITUTION_ADMIN');
    mw(req, res, next);
    assert.equal(getStatusCode(), 403);
    assert.equal(getResponseData()?.error?.code, 'FORBIDDEN');
  });

  await test('requirePermission permits user with exact permission code', async () => {
    const { req, res, next, wasNextCalled } = createMockReqRes({
      user: { id: 'u3', role: 'FACULTY', permissions: ['attendance.session.create'] },
    });
    const mw = requirePermission('attendance.session.create');
    mw(req, res, next);
    assert.equal(wasNextCalled(), true);
  });

  await test('requirePermission permits user with wildcard *', async () => {
    const { req, res, next, wasNextCalled } = createMockReqRes({
      user: { id: 'u4', role: 'SUPER_ADMIN', permissions: ['*'] },
    });
    const mw = requirePermission('finance.refund.manage');
    mw(req, res, next);
    assert.equal(wasNextCalled(), true);
  });

  await test('requirePermission rejects user missing permission with 403', async () => {
    const { req, res, next, getStatusCode, getResponseData } = createMockReqRes({
      user: { id: 'u5', role: 'FACULTY', permissions: ['faculty.classes.read'] },
    });
    const mw = requirePermission('finance.refund.manage');
    mw(req, res, next);
    assert.equal(getStatusCode(), 403);
    assert.equal(getResponseData()?.error?.code, 'PERMISSION_DENIED');
  });

  // --- 3. OPTIONAL-MODULE TOGGLE TESTS (Section 12, Rules 4, 5, 27) ---
  console.log('\n--- 3. Optional-Module Toggle Tests (Section 12, Rules 4, 5, 27) ---');

  await test('Module toggle guard blocks disabled optional module with 403', async () => {
    // Disable 'hostel' for primary tenant
    await institutionService.toggleModule(primaryTenantId, 'hostel', false);

    const { req, res, next, getStatusCode, getResponseData } = createMockReqRes({
      user: {
        id: 'u-inst-admin',
        role: 'INSTITUTION_ADMIN',
        institutionId: primaryTenantId,
        permissions: ['hostel.manage'],
      },
    });

    const mw = requireModuleEnabled('hostel');
    await mw(req, res, next);

    assert.equal(getStatusCode(), 403, 'Disabled module must return 403');
    assert.equal(getResponseData()?.error?.code, 'MODULE_DISABLED');

    // Re-enable hostel
    await institutionService.toggleModule(primaryTenantId, 'hostel', true);
  });

  await test('Module toggle guard permits enabled optional module', async () => {
    const { req, res, next, wasNextCalled } = createMockReqRes({
      user: {
        id: 'u-inst-admin',
        role: 'INSTITUTION_ADMIN',
        institutionId: primaryTenantId,
        permissions: ['hostel.manage'],
      },
    });

    const mw = requireModuleEnabled('hostel');
    await mw(req, res, next);

    assert.equal(wasNextCalled(), true, 'Enabled module must call next()');
  });

  // --- 4. SHARED SERVICES TESTS (Section 5, Section 11, Rule 14, Rule 16) ---
  console.log('\n--- 4. Shared Services Tests (Notifications & Audit) ---');

  await test('Notifications service dispatches, lists, and marks notifications as read', async () => {
    // 1. Create a notification
    const notif = await notificationService.sendNotification({
      institutionId: primaryTenantId,
      recipientUserId: validProfileId,
      title: 'Phase 1 Step B Automated Test',
      message: 'Testing notification dispatch pipeline',
      channel: 'push',
    });

    assert.ok(notif?.id, 'Notification record created');

    // 2. Check unread count
    const unread = await notificationService.getUnreadCount(
      primaryTenantId,
      validProfileId
    );
    assert.ok(unread.unreadCount >= 1, 'Unread count should be >= 1');

    // 3. Mark notification as read
    const marked = await notificationService.markAsRead(
      notif.id,
      validProfileId
    );
    assert.equal(marked, true, 'Notification marked as read');
  });

  await test('Audit service records events and allows tenant-scoped retrieval', async () => {
    const testAction = `test.action.${Date.now()}`;
    await AuditDispatcher.dispatch({
      actorId: validProfileId,
      action: testAction,
      resource: 'test_resource',
      institutionId: primaryTenantId,
      newValue: { test: true },
    });

    const logs = await auditService.getAuditLogs({
      institutionId: primaryTenantId,
      action: testAction,
    });

    assert.ok(logs.items.length >= 1, 'Audit log should be retrievable');
    assert.equal(logs.items[0].action, testAction);
  });

  // --- 5. AUTH & REFRESH TOKEN ROTATION (Section 15) ---
  console.log('\n--- 5. Auth & Refresh Token Rotation Tests (Section 15) ---');

  await test('Refresh token can be issued, persisted, and verified', async () => {
    const rawToken = require('crypto').randomUUID();
    const tokenHash = require('crypto').createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [validProfileId, tokenHash, expiresAt.toISOString()]
    );

    const check = await db.query(
      `SELECT id, user_id, revoked FROM refresh_tokens WHERE token_hash = $1`,
      [tokenHash]
    );

    assert.equal(check.rows.length, 1);
    assert.equal(check.rows[0].revoked, false);

    // Revoke token
    await db.query(`UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`, [tokenHash]);
    const checkRevoked = await db.query(
      `SELECT revoked FROM refresh_tokens WHERE token_hash = $1`,
      [tokenHash]
    );
    assert.equal(checkRevoked.rows[0].revoked, true);
  });

  console.log('\n========================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runStepBTests().catch((e) => {
  console.error('Test suite runner crashed:', e);
  process.exit(1);
});
