import { db } from '../config/database';

async function seedAIAttendance() {
  console.log('[*] Seeding AI Biometric Vision Attendance for Today...');
  const today = new Date().toISOString().split('T')[0];
  const institutionId = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f'; // Narayana e-Techno School

  // 1. Get our 10 students
  const studentAdmissions = [
    'SIA-2026-0109', 'SIA-2026-0110', 'SIA-2026-0111', 'SIA-2026-0112', 'SIA-2026-0113', // 10-A
    'SIA-2026-0114', 'SIA-2026-0115', 'SIA-2026-0116',                                     // 10-B
    'SIA-2026-0107', 'SIA-2026-0117'                                                       // 09-A
  ];

  const studentsRes = await db.query(
    `SELECT s.id, s.admission_number, s.first_name, s.last_name, s.current_section_id,
            sec.name as section_name, c.name as class_name
     FROM students s
     JOIN sections sec ON sec.id = s.current_section_id
     JOIN classes c ON c.id = sec.class_id
     WHERE s.institution_id = $1 AND s.admission_number = ANY($2)`,
    [institutionId, studentAdmissions]
  );

  console.log(`[+] Found ${studentsRes.rows.length} students in database.`);

  // Group by section
  const sectionMap: Record<string, any[]> = {};
  for (const s of studentsRes.rows) {
    if (!sectionMap[s.current_section_id]) sectionMap[s.current_section_id] = [];
    sectionMap[s.current_section_id].push(s);
  }

  // 2. For each section, ensure today's session exists and mark attendance with source = 'ai_face'
  for (const [secId, studentsList] of Object.entries(sectionMap)) {
    const className = studentsList[0].class_name;
    const sectionName = studentsList[0].section_name;
    console.log(`\n[*] Processing ${className} ${sectionName} (${studentsList.length} students)...`);

    // Get or create session
    let sessionRes = await db.query(
      `SELECT id FROM attendance_sessions
       WHERE institution_id = $1 AND section_id = $2 AND session_date = $3`,
      [institutionId, secId, today]
    );

    let sessionId: string;
    if (sessionRes.rows.length > 0) {
      sessionId = sessionRes.rows[0].id;
      console.log(`    [i] Existing session: ${sessionId}`);
    } else {
      const newSession = await db.query(
        `INSERT INTO attendance_sessions (institution_id, section_id, session_date, period_number, created_at)
         VALUES ($1, $2, $3, 1, now()) RETURNING id`,
        [institutionId, secId, today]
      );
      sessionId = newSession.rows[0].id;
      console.log(`    [+] Created session for today: ${sessionId}`);
    }

    // Upsert attendance records with source = 'ai_face'
    for (const st of studentsList) {
      const conf = (98.0 + Math.random() * 1.9).toFixed(1);
      await db.query(
        `INSERT INTO attendance_records (institution_id, session_id, student_id, status, source, is_final, remarks, updated_at)
         VALUES ($1, $2, $3, 'present'::attendance_status, 'ai_face'::attendance_source, true, $4, now())
         ON CONFLICT (session_id, student_id)
         DO UPDATE SET status = 'present'::attendance_status,
                       source = 'ai_face'::attendance_source,
                       remarks = EXCLUDED.remarks,
                       updated_at = now()`,
        [institutionId, sessionId, st.id, `AI Facial Recognition Verified (${conf}%)`]
      );
      console.log(`    [OK] Marked Present: ${st.first_name} ${st.last_name} (${st.admission_number}) [${conf}%]`);
    }
  }

  console.log('\n[SUCCESS] AI Biometric Attendance fully recorded in database for today!');
  process.exit(0);
}

seedAIAttendance().catch(err => {
  console.error(err);
  process.exit(1);
});
