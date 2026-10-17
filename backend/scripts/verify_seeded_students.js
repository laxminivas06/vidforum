const { db } = require('../dist/config/database');

async function check() {
  const instId = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f';

  // 1. Student count per section
  const secCounts = await db.query(`
    SELECT c.name as class_name, sec.name as section_name, count(s.id)::int as student_count
    FROM sections sec
    JOIN classes c ON c.id = sec.class_id
    LEFT JOIN students s ON s.current_section_id = sec.id
    WHERE sec.institution_id = $1
    GROUP BY c.name, sec.name
    ORDER BY c.name, sec.name
  `, [instId]);

  console.log('--- SECTION STUDENT COUNTS ---');
  secCounts.rows.forEach(r => console.log(`  ${r.class_name} - ${r.section_name}: ${r.student_count} students`));

  // 2. Class enrollment counts from view
  const classCounts = await db.query(`
    SELECT class_name, capacity, enrolled_count, available_seats
    FROM class_enrollment_counts
    WHERE institution_id = $1
    ORDER BY class_name
  `, [instId]);

  console.log('\n--- CLASS ENROLLMENT VIEW ---');
  classCounts.rows.forEach(r => console.log(`  ${r.class_name}: Enrolled ${r.enrolled_count}/${r.capacity} (Available: ${r.available_seats})`));

  // 3. Total students
  const total = await db.query('SELECT count(*)::int as count FROM students WHERE institution_id = $1', [instId]);
  console.log('\nTOTAL STUDENTS IN INSTITUTION:', total.rows[0].count);

  // 4. Uniqueness audit on the 260 new students
  const dupCheck = await db.query(`
    SELECT 
      count(*) as total_new,
      count(DISTINCT admission_number) as unique_admn,
      count(DISTINCT aadhaar_number) as unique_aadhaar,
      count(DISTINCT emergency_phone) as unique_phone,
      count(DISTINCT date_of_birth) as unique_dob,
      count(DISTINCT roll_number) as distinct_rolls
    FROM students
    WHERE admission_number >= 'SIA-2026-0201' AND admission_number <= 'SIA-2026-0460'
  `);
  console.log('\n--- UNIQUENESS AUDIT FOR 260 NEW STUDENTS ---');
  console.log(dupCheck.rows[0]);

  // 5. Sample student details
  const sample = await db.query(`
    SELECT 
      s.admission_number, s.first_name, s.last_name, s.gender, s.date_of_birth,
      s.blood_group, s.nationality, s.mother_tongue, s.religion, s.caste,
      s.address_line1, s.address_line2, s.city, s.state, s.pincode,
      s.emergency_contact, s.emergency_phone, s.aadhaar_number, s.roll_number,
      c.name as class_name, sec.name as section_name,
      g.full_name as guardian_name, g.relationship as guardian_relationship, g.phone as guardian_phone, g.email as guardian_email
    FROM students s
    JOIN classes c ON c.id = s.current_class_id
    JOIN sections sec ON sec.id = s.current_section_id
    JOIN student_guardians sg ON sg.student_id = s.id AND sg.is_primary_contact = true
    JOIN guardians g ON g.id = sg.guardian_id
    WHERE s.admission_number IN ('SIA-2026-0201', 'SIA-2026-0250', 'SIA-2026-0320', 'SIA-2026-0450')
    ORDER BY s.admission_number
  `);

  console.log('\n--- SAMPLE STUDENT PROFILES ---');
  sample.rows.forEach(s => {
    console.log(`\n[${s.admission_number}] ${s.first_name} ${s.last_name} (${s.gender.toUpperCase()})`);
    console.log(`  Class: ${s.class_name} | Section: ${s.section_name} | Roll: ${s.roll_number}`);
    console.log(`  DOB: ${s.date_of_birth.toISOString().slice(0, 10)} | Blood: ${s.blood_group} | Mother Tongue: ${s.mother_tongue} | Religion: ${s.religion} | Caste: ${s.caste}`);
    console.log(`  Address: ${s.address_line1}, ${s.address_line2}, ${s.city}, ${s.state} - ${s.pincode}`);
    console.log(`  Aadhaar: ${s.aadhaar_number} | Nationality: ${s.nationality}`);
    console.log(`  Guardian: ${s.guardian_name} (${s.guardian_relationship}) | Phone: ${s.guardian_phone} | Email: ${s.guardian_email}`);
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
