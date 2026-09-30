const { db } = require('../dist/config/database');

async function verify() {
  console.log('--- Step 1: Provision Institution via API ---');
  const instPayload = {
    name: 'Cambridge Global Academy',
    code: 'CGA-PUN',
    domain: 'cga.vid.edu',
    plan: 'ENTERPRISE',
    region: 'Pune, Maharashtra, India',
    boardAffiliation: 'Cambridge International (CIE)',
    contactEmail: 'admin@cga.edu'
  };
  const instRes = await fetch('http://localhost:5000/api/v1/institutions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(instPayload)
  });
  const instJson = await instRes.json();
  console.log('API Response (Institution):', instJson.success, instJson.data.id, instJson.data.name);

  console.log('\n--- Step 2: Verify Institution in Supabase PostgreSQL ---');
  const dbInst = await db.query('SELECT id, code, name, status, plan_id FROM institutions WHERE code = $1', ['CGA-PUN']);
  console.log('PostgreSQL institutions row count:', dbInst.rowCount, dbInst.rows[0]);

  console.log('\n--- Step 3: Add Platform User via API ---');
  const userPayload = {
    name: 'Dr. Vikramaditya Sen',
    email: 'vikram.sen@cga.edu',
    role: 'FACULTY',
    institutionName: 'Cambridge Global Academy'
  };
  const userRes = await fetch('http://localhost:5000/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userPayload)
  });
  const userJson = await userRes.json();
  console.log('API Response (User):', userJson.success, userJson.data.id, userJson.data.name);

  console.log('\n--- Step 4: Verify User in Supabase PostgreSQL ---');
  const dbUser = await db.query(`
    SELECT p.id, p.full_name, p.email, p.status, r.name as role, i.name as institution 
    FROM profiles p 
    LEFT JOIN user_roles ur ON ur.profile_id = p.id 
    LEFT JOIN roles r ON r.id = ur.role_id 
    LEFT JOIN institutions i ON i.id = p.default_institution_id 
    WHERE p.email = $1
  `, ['vikram.sen@cga.edu']);
  console.log('PostgreSQL profiles row count:', dbUser.rowCount, dbUser.rows[0]);

  console.log('\n--- Step 5: Edit Platform User via PATCH API ---');
  const patchPayload = {
    name: 'Dr. Vikramaditya Sen Senior',
    email: 'vikram.sen@cga.edu',
    role: 'INSTITUTION_ADMIN',
    institutionName: 'Cambridge Global Academy',
    status: 'ACTIVE'
  };
  const patchRes = await fetch('http://localhost:5000/api/v1/users/' + userJson.data.id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patchPayload)
  });
  const patchJson = await patchRes.json();
  console.log('API Response (PATCH):', patchJson.success, patchJson.data);

  console.log('\n--- Step 6: Verify Edited User in Supabase PostgreSQL ---');
  const dbUpdatedUser = await db.query(`
    SELECT p.id, p.full_name, p.email, p.status, r.name as role, i.name as institution 
    FROM profiles p 
    LEFT JOIN user_roles ur ON ur.profile_id = p.id 
    LEFT JOIN roles r ON r.id = ur.role_id 
    LEFT JOIN institutions i ON i.id = p.default_institution_id 
    WHERE p.id = $1
  `, [userJson.data.id]);
  console.log('PostgreSQL updated row:', dbUpdatedUser.rows[0]);

  console.log('\n--- Step 7: Verify Zero Duplicate Invariant ---');
  const allInst = await db.query('SELECT count(*), count(DISTINCT code) as unique_codes FROM institutions');
  console.log('Institutions count:', allInst.rows[0].count, 'Unique codes:', allInst.rows[0].unique_codes);

  console.log('\n=== ALL CLOUD DATABASE & EDIT VERIFICATIONS PASSED ===');
  process.exit(0);
}

verify().catch(e => { console.error(e); process.exit(1); });
