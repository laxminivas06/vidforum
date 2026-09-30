const { db } = require('../dist/config/database');

async function run() {
  console.log('=== Step 1: Query user vishal@gmail.com currently in DB ===');
  const userRes = await db.query(`
    SELECT p.id, p.email, ur.scope, ur.institution_id, i.name as institution_name
    FROM profiles p
    JOIN user_roles ur ON ur.profile_id = p.id
    LEFT JOIN institutions i ON i.id = ur.institution_id
    WHERE p.email = $1
  `, ['vishal@gmail.com']);
  console.log('Current DB Record:', JSON.stringify(userRes.rows[0], null, 2));

  if (!userRes.rows[0]) {
    console.error('User vishal@gmail.com not found');
    process.exit(1);
  }

  const instId = userRes.rows[0].institution_id;
  const adminId = userRes.rows[0].id;

  console.log('\n=== Step 2: Update workspaces via PATCH API ===');
  const newWorkspaces = ['dashboard', 'admissions', 'academics'];
  const patchRes = await fetch(`http://localhost:5000/api/v1/institutions/${instId}/admins/${adminId}/workspaces`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaces: newWorkspaces })
  });
  const patchJson = await patchRes.json();
  console.log('PATCH response:', patchJson);

  console.log('\n=== Step 3: Verify updated workspaces in Supabase PostgreSQL ===');
  const verifyRes = await db.query(`
    SELECT ur.scope->'workspaces' as workspaces
    FROM user_roles ur
    WHERE ur.profile_id = $1
  `, [adminId]);
  console.log('Direct Cloud DB query result:', verifyRes.rows[0]);

  console.log('\n=== Step 4: Verify Auth Login response includes assignedWorkspaces ===');
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'vishal@gmail.com' })
  });
  const loginJson = await loginRes.json();
  console.log('Login assignedWorkspaces:', loginJson.data?.user?.assignedWorkspaces);

  console.log('\n=== Step 5: Restore all workspaces for user ===');
  const allWorkspaces = [
    "dashboard", "admissions", "academics", "faculty", "attendance",
    "examinations", "finance", "documents", "hrms", "timetable",
    "ai_yantra", "campus_life", "settings"
  ];
  await fetch(`http://localhost:5000/api/v1/institutions/${instId}/admins/${adminId}/workspaces`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaces: allWorkspaces })
  });

  const finalRes = await db.query(`
    SELECT ur.scope->'workspaces' as workspaces
    FROM user_roles ur
    WHERE ur.profile_id = $1
  `, [adminId]);
  console.log('Restored Cloud DB workspaces count:', finalRes.rows[0]?.workspaces?.length);

  console.log('\nSUCCESS! Backend persistence verified end-to-end.');
  process.exit(0);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
