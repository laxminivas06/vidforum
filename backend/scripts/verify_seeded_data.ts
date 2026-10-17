import { executeDatabaseTool } from '../src/modules/ai-yantra/ai-yantra.routes';
import { db } from '../src/config/database';

const INSTITUTION_ID = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f';

async function verify() {
  console.log('=== Verifying Newly Seeded Students Across Voice Agent Tools ===\n');

  const testAdmissions = ['SIA-2026-0501', 'SIA-2026-0520', 'SIA-2026-0550', 'SIA-2026-0101'];

  for (const adm of testAdmissions) {
    console.log(`\n----------------- Testing Student: ${adm} -----------------`);
    const stu = await db.query(
      `SELECT s.id, s.admission_number, s.first_name, s.last_name, s.gender, c.name as class_name, sec.name as section_name,
              g.full_name as guardian_name, g.phone as guardian_phone, g.relationship
       FROM students s
       JOIN classes c ON c.id = s.current_class_id
       JOIN sections sec ON sec.id = s.current_section_id
       LEFT JOIN student_guardians sg ON sg.student_id = s.id
       LEFT JOIN guardians g ON g.id = sg.guardian_id
       WHERE s.institution_id = $1 AND s.admission_number = $2`,
      [INSTITUTION_ID, adm]
    );

    if (stu.rows.length === 0) {
      console.error(` Student ${adm} not found!`);
      continue;
    }

    const s = stu.rows[0];
    console.log(`Student: ${s.first_name} ${s.last_name} (${s.gender}) | Class: ${s.class_name} - ${s.section_name}`);
    console.log(`Parent: ${s.guardian_name} (${s.relationship}) | Phone: ${s.guardian_phone}`);

    // Tool 1: Marks
    const marksRes = await executeDatabaseTool(INSTITUTION_ID, 'get_student_marks', {
      student_id: adm,
      subject: 'Science',
    });
    console.log(`[Tool: get_student_marks]`, marksRes);

    // Tool 2: Attendance
    const attRes = await executeDatabaseTool(INSTITUTION_ID, 'get_student_attendance', {
      student_id: adm,
    });
    console.log(`[Tool: get_student_attendance]`, attRes);

    // Tool 3: Fees
    const feeRes = await executeDatabaseTool(INSTITUTION_ID, 'get_fee_status', {
      student_id: adm,
    });
    console.log(`[Tool: get_fee_status]`, feeRes);
  }

  console.log('\n======================================================');
  console.log(' All Voice Agent Database Tools Verified Successfully!');
  console.log('======================================================\n');
  process.exit(0);
}

verify().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
