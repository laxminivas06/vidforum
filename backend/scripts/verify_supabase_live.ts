import { db } from '../src/config/database';
import { env } from '../src/config/env';

async function check() {
  console.log('=== Supabase PostgreSQL Live Connection Verification ===\n');
  console.log('Connected Host   :', env.DB_HOST);
  console.log('Connected DB     :', env.DB_NAME);
  console.log('Database User    :', env.DB_USER);

  const info = await db.query('SELECT current_database(), current_user, inet_server_addr(), now() as server_time;');
  console.log('PostgreSQL Server:', info.rows[0]);

  console.log('\n=== Live Row Counts in Supabase Cloud Database (Tenant: Narayana e-Techno School) ===');
  const counts = await db.query(`
    SELECT 
      (SELECT count(*) FROM classes WHERE institution_id = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f') as classes,
      (SELECT count(*) FROM sections WHERE institution_id = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f') as sections,
      (SELECT count(*) FROM students WHERE institution_id = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f') as students,
      (SELECT count(*) FROM guardians WHERE institution_id = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f') as guardians,
      (SELECT count(*) FROM marks WHERE institution_id = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f') as marks,
      (SELECT count(*) FROM attendance_records WHERE institution_id = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f') as attendance_records,
      (SELECT count(*) FROM student_fees WHERE institution_id = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f') as student_fees;
  `);
  console.table(counts.rows);

  console.log('\n=== Sample Newly Seeded Students in Supabase (Grade 3, Grade 4, Grade 5) ===');
  const sample = await db.query(`
    SELECT s.admission_number, (s.first_name || ' ' || s.last_name) as student_name, s.gender,
           c.name as grade, sec.name as section,
           g.full_name as parent_name, g.phone as parent_phone
    FROM students s
    JOIN classes c ON c.id = s.current_class_id
    JOIN sections sec ON sec.id = s.current_section_id
    JOIN student_guardians sg ON sg.student_id = s.id
    JOIN guardians g ON g.id = sg.guardian_id
    WHERE s.institution_id = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f'
      AND s.admission_number >= 'SIA-2026-0521'
    ORDER BY s.admission_number
    LIMIT 12;
  `);
  console.table(sample.rows);

  process.exit(0);
}

check().catch(e => {
  console.error('Error connecting to Supabase:', e);
  process.exit(1);
});
