const { db } = require('../dist/config/database');

async function purgeDummyData() {
  const client = await db.getClient();
  try {
    console.log('Beginning clean-up...');

    // 1. Unlink profiles and roles from institutions
    await client.query(`UPDATE profiles SET default_institution_id = NULL`);
    await client.query(`UPDATE roles SET institution_id = NULL`);
    await client.query(`UPDATE user_roles SET institution_id = NULL WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'superadmin@vid.edu')`);

    // 2. Truncate academic and school operational tables with CASCADE
    // This will safely wipe all dummy classes, sections, students, staff, fees, applications etc.
    const operationalTables = [
      'module_configurations',
      'audit_logs',
      'invoices',
      'fee_structure_items',
      'fee_structures',
      'fee_groups',
      'fee_categories',
      'student_fees',
      'faculty_assignments',
      'staff_attendance',
      'attendance_records',
      'attendance_sessions',
      'leave_requests',
      'staff',
      'designations',
      'applications',
      'admissions',
      'enquiries',
      'student_promotions',
      'student_academic_history',
      'students',
      'guardians',
      'timetable_entries',
      'timetables',
      'subjects',
      'sections',
      'classes',
      'departments',
      'academic_years',
    ];

    for (const tbl of operationalTables) {
      try {
        await client.query(`TRUNCATE TABLE "${tbl}" CASCADE`);
        console.log(`Truncated ${tbl} CASCADE`);
      } catch (e) {
        console.log(`Note for ${tbl}: ${e.message}`);
      }
    }

    // 3. Remove non-superadmin user roles
    await client.query(`
      DELETE FROM user_roles 
      WHERE profile_id NOT IN (
        SELECT id FROM profiles WHERE email = 'superadmin@vid.edu'
      )
    `);
    console.log('Cleaned non-superadmin user_roles');

    // 4. Remove non-superadmin profiles
    await client.query(`
      DELETE FROM profiles 
      WHERE email != 'superadmin@vid.edu'
    `);
    console.log('Cleaned non-superadmin profiles');

    // 5. Delete all institutions with trg_audit_log temporarily disabled
    await client.query('ALTER TABLE institutions DISABLE TRIGGER trg_audit_log');
    const delRes = await client.query('DELETE FROM institutions RETURNING id, code, name');
    await client.query('ALTER TABLE institutions ENABLE TRIGGER trg_audit_log');
    console.log('Deleted institutions:', delRes.rows);

    // 6. Verify zero duplicate institutions
    const countRes = await client.query('SELECT count(*) FROM institutions');
    console.log(`\nVerification: institutions table row count = ${countRes.rows[0].count}`);

    const profRes = await client.query('SELECT id, full_name, email FROM profiles');
    console.log(`Verification: profiles table rows =`, profRes.rows);

    const rolesRes = await client.query('SELECT count(*) FROM roles');
    console.log(`Verification: roles count = ${rolesRes.rows[0].count}`);

    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Purge error:', err);
    client.release();
    process.exit(1);
  }
}

purgeDummyData();
