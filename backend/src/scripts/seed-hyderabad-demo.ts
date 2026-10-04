import { db } from '../config/database';

const INSTITUTION_ID = '18b3b9a6-0791-47f4-bbd0-bf7c0221e18f'; // Narayana e-Techno School, NGS

export async function seedHyderabadDemo() {
  console.log('====================================================');
  console.log('🇮🇳 SEEDING DEMO DATA: Narayana e-Techno School, Hyderabad');
  console.log('====================================================\n');

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // -------------------------------------------------------------------------
    // 1. Institution Verification & Profile
    // -------------------------------------------------------------------------
    console.log('▶ [1/6] Verifying Institution Profile...');
    await client.query(
      `UPDATE institutions 
       SET name = 'Narayana e-Techno School', code = 'NGS'
       WHERE id = $1`,
      [INSTITUTION_ID]
    );
    console.log('✔ Institution: Narayana e-Techno School (Hyderabad, Telangana)\n');

    // -------------------------------------------------------------------------
    // 2. Departments & Designations (Staff & HRMS Foundation)
    // -------------------------------------------------------------------------
    console.log('▶ [2/6] Seeding Departments & Designations...');

    const deptConfigs = [
      { name: 'High School Wing (Grades 6-10)', code: 'DEPT-HIGH', type: 'academic' },
      { name: 'Academic Leadership & Principal Office', code: 'DEPT-ADM', type: 'academic' },
      { name: 'Department of Mathematics', code: 'DEPT-MATH', type: 'academic' },
      { name: 'Department of Natural Sciences', code: 'DEPT-SCI', type: 'academic' },
      { name: 'Department of English & Humanities', code: 'DEPT-ENG', type: 'academic' },
      { name: 'Department of Regional Languages (Telugu & Hindi)', code: 'DEPT-LANG', type: 'academic' },
      { name: 'Computer Science & Robotics Academy', code: 'DEPT-CS', type: 'academic' },
      { name: 'Physical Education & Sports Academy', code: 'DEPT-PET', type: 'academic' },
      { name: 'Finance, Accounts & Bursar', code: 'DEPT-FIN', type: 'academic' },
      { name: 'Admissions & Parent Outreach', code: 'DEPT-ADMN', type: 'academic' },
      { name: 'Human Resources & Staff Welfare', code: 'DEPT-HR', type: 'academic' },
    ];

    const deptMap: Record<string, string> = {};
    for (const d of deptConfigs) {
      let dRes = await client.query(
        `SELECT id FROM departments WHERE institution_id = $1 AND code = $2 LIMIT 1`,
        [INSTITUTION_ID, d.code]
      );
      let dId = dRes.rows[0]?.id;
      if (!dId) {
        const ins = await client.query(
          `INSERT INTO departments (institution_id, name, code, department_type) VALUES ($1, $2, $3, $4) RETURNING id`,
          [INSTITUTION_ID, d.name, d.code, d.type]
        );
        dId = ins.rows[0].id;
      } else {
        await client.query(
          `UPDATE departments SET name = $1, department_type = $2 WHERE id = $3`,
          [d.name, d.type, dId]
        );
      }
      deptMap[d.code] = dId;
    }

    const desigConfigs = [
      'Principal & Head of Institution',
      'Vice Principal & Academic Dean',
      'PGT (Post Graduate Teacher)',
      'TGT (Trained Graduate Teacher)',
      'Primary Years Teacher (PRT)',
      'Physical Education Director (PED)',
      'Senior Accountant & Bursar',
      'Head of Admissions & Outreach',
      'Human Resources Manager',
    ];

    const desigMap: Record<string, string> = {};
    for (const dName of desigConfigs) {
      let desRes = await client.query(
        `SELECT id FROM designations WHERE institution_id = $1 AND name = $2 LIMIT 1`,
        [INSTITUTION_ID, dName]
      );
      let desId = desRes.rows[0]?.id;
      if (!desId) {
        const ins = await client.query(
          `INSERT INTO designations (institution_id, name) VALUES ($1, $2) RETURNING id`,
          [INSTITUTION_ID, dName]
        );
        desId = ins.rows[0].id;
      }
      desigMap[dName] = desId;
    }
    console.log('✔ Departments (11) and Designations (9) Initialized.\n');

    // -------------------------------------------------------------------------
    // 3. Academic Years, Classes, Sections, Subjects & Curriculum
    // -------------------------------------------------------------------------
    console.log('▶ [3/6] Seeding Academic Years, Classes, Sections & Subjects...');

    // Deactivate previous active academic years
    await client.query(
      `UPDATE academic_years SET is_current = false WHERE institution_id = $1`,
      [INSTITUTION_ID]
    );

    // Current Academic Year 2026-27
    let ayRes = await client.query(
      `SELECT id FROM academic_years WHERE institution_id = $1 AND name = 'AY 2026-27 (CBSE)' LIMIT 1`,
      [INSTITUTION_ID]
    );
    let currentYearId = ayRes.rows[0]?.id;
    if (!currentYearId) {
      const newAy = await client.query(
        `INSERT INTO academic_years (institution_id, name, start_date, end_date, is_current, status)
         VALUES ($1, 'AY 2026-27 (CBSE)', '2026-06-01', '2027-04-30', true, 'active')
         RETURNING id`,
        [INSTITUTION_ID]
      );
      currentYearId = newAy.rows[0].id;
    } else {
      await client.query(
        `UPDATE academic_years SET is_current = true, status = 'active', start_date = '2026-06-01', end_date = '2027-04-30' WHERE id = $1`,
        [currentYearId]
      );
    }

    // Previous Academic Year 2025-26
    let prevAyRes = await client.query(
      `SELECT id FROM academic_years WHERE institution_id = $1 AND name = 'AY 2025-26 (CBSE)' LIMIT 1`,
      [INSTITUTION_ID]
    );
    if (prevAyRes.rows.length === 0) {
      await client.query(
        `INSERT INTO academic_years (institution_id, name, start_date, end_date, is_current, status)
         VALUES ($1, 'AY 2025-26 (CBSE)', '2025-06-01', '2026-04-30', false, 'closed')`,
        [INSTITUTION_ID]
      );
    }

    // Classes & Sections (Grade 6 to 10)
    const gradeConfigs = [
      { name: 'Grade 6', seq: 6, capacity: 40 },
      { name: 'Grade 7', seq: 7, capacity: 40 },
      { name: 'Grade 8', seq: 8, capacity: 40 },
      { name: 'Grade 9', seq: 9, capacity: 40 },
      { name: 'Grade 10', seq: 10, capacity: 40 },
    ];

    const highSchoolDeptId = deptMap['DEPT-HIGH'];
    const classMap: Record<string, { id: string; secAId: string; secBId: string }> = {};

    for (const g of gradeConfigs) {
      let cRes = await client.query(
        `SELECT id FROM classes WHERE institution_id = $1 AND name = $2 LIMIT 1`,
        [INSTITUTION_ID, g.name]
      );
      let classId = cRes.rows[0]?.id;
      if (!classId) {
        const ins = await client.query(
          `INSERT INTO classes (institution_id, academic_year_id, department_id, name, sequence_order, capacity)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [INSTITUTION_ID, currentYearId, highSchoolDeptId, g.name, g.seq, g.capacity]
        );
        classId = ins.rows[0].id;
      } else {
        await client.query(
          `UPDATE classes SET capacity = $1, academic_year_id = $2, department_id = $3, sequence_order = $4 WHERE id = $5`,
          [g.capacity, currentYearId, highSchoolDeptId, g.seq, classId]
        );
      }

      // Section A
      let sARes = await client.query(
        `SELECT id FROM sections WHERE institution_id = $1 AND class_id = $2 AND name = 'Section A' LIMIT 1`,
        [INSTITUTION_ID, classId]
      );
      let secAId = sARes.rows[0]?.id;
      if (!secAId) {
        const sIns = await client.query(
          `INSERT INTO sections (institution_id, class_id, name, capacity) VALUES ($1, $2, 'Section A', 40) RETURNING id`,
          [INSTITUTION_ID, classId]
        );
        secAId = sIns.rows[0].id;
      }

      // Section B
      let sBRes = await client.query(
        `SELECT id FROM sections WHERE institution_id = $1 AND class_id = $2 AND name = 'Section B' LIMIT 1`,
        [INSTITUTION_ID, classId]
      );
      let secBId = sBRes.rows[0]?.id;
      if (!secBId) {
        const sIns = await client.query(
          `INSERT INTO sections (institution_id, class_id, name, capacity) VALUES ($1, $2, 'Section B', 40) RETURNING id`,
          [INSTITUTION_ID, classId]
        );
        secBId = sIns.rows[0].id;
      }

      classMap[g.name] = { id: classId, secAId, secBId };
    }

    // Subjects Master
    const subjectConfigs = [
      { name: 'Mathematics', code: 'MATH-041', credits: 4.0, isElective: false },
      { name: 'General Science', code: 'SCI-086', credits: 4.0, isElective: false },
      { name: 'English Language & Literature', code: 'ENG-184', credits: 4.0, isElective: false },
      { name: 'Telugu (First Language)', code: 'TEL-007', credits: 3.0, isElective: false },
      { name: 'Hindi Course-A', code: 'HIN-002', credits: 3.0, isElective: false },
      { name: 'Social Science', code: 'SST-087', credits: 4.0, isElective: false },
      { name: 'Information Technology & Coding', code: 'IT-402', credits: 3.0, isElective: false },
      { name: 'Physical & Health Education', code: 'PHE-501', credits: 2.0, isElective: false },
    ];

    const subjectMap: Record<string, string> = {};

    for (const sub of subjectConfigs) {
      let subRes = await client.query(
        `SELECT id FROM subjects WHERE institution_id = $1 AND code = $2 LIMIT 1`,
        [INSTITUTION_ID, sub.code]
      );
      let subId = subRes.rows[0]?.id;
      if (!subId) {
        const ins = await client.query(
          `INSERT INTO subjects (institution_id, name, code, credits, is_elective, is_active)
           VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
          [INSTITUTION_ID, sub.name, sub.code, sub.credits, sub.isElective]
        );
        subId = ins.rows[0].id;
      } else {
        await client.query(
          `UPDATE subjects SET name = $1, credits = $2, is_active = true WHERE id = $3`,
          [sub.name, sub.credits, subId]
        );
      }
      subjectMap[sub.code] = subId;
    }

    // Grade-Subject Matrix for Grades 6 to 10
    const mappingGrades = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
    for (const gName of mappingGrades) {
      const cId = classMap[gName]?.id;
      if (!cId) continue;

      for (const sub of subjectConfigs) {
        const sId = subjectMap[sub.code];
        const periods = sub.code.startsWith('MATH') || sub.code.startsWith('SCI') ? 6 : sub.code.startsWith('ENG') || sub.code.startsWith('SST') ? 5 : 3;
        const maxMarks = sub.code.startsWith('PHE') || sub.code.startsWith('IT') ? 50 : 100;
        const passMarks = maxMarks === 100 ? 35 : 18;

        const checkMap = await client.query(
          `SELECT id FROM grade_subjects WHERE class_id = $1 AND subject_id = $2 LIMIT 1`,
          [cId, sId]
        );
        if (checkMap.rows.length === 0) {
          await client.query(
            `INSERT INTO grade_subjects (institution_id, class_id, subject_id, periods_per_week, max_marks, pass_marks, is_mandatory)
             VALUES ($1, $2, $3, $4, $5, $6, true)`,
            [INSTITUTION_ID, cId, sId, periods, maxMarks, passMarks]
          );
        }

        // Also ensure class_subjects linkage
        const checkCS = await client.query(
          `SELECT class_id FROM class_subjects WHERE class_id = $1 AND subject_id = $2 LIMIT 1`,
          [cId, sId]
        );
        if (checkCS.rows.length === 0) {
          await client.query(
            `INSERT INTO class_subjects (class_id, subject_id, is_mandatory) VALUES ($1, $2, true)`,
            [cId, sId]
          );
        }
      }
    }

    // Hyderabad / Telangana School Holidays (calendar_days)
    const holidays = [
      { date: '2026-06-02', type: 'holiday', desc: 'Telangana State Formation Day', isWorking: false },
      { date: '2026-07-20', type: 'holiday', desc: 'Bonalu Festival (State Holiday)', isWorking: false },
      { date: '2026-08-15', type: 'event', desc: 'Independence Day Celebrations', isWorking: true },
      { date: '2026-09-04', type: 'holiday', desc: 'Sri Krishna Janmashtami', isWorking: false },
      { date: '2026-09-14', type: 'holiday', desc: 'Vinayaka Chavithi (Ganesh Nimajjanam)', isWorking: false },
      { date: '2026-10-02', type: 'holiday', desc: 'Mahatma Gandhi Jayanti', isWorking: false },
      { date: '2026-10-18', type: 'vacation', desc: 'Bathukamma & Vijaya Dasami Vacation Begins', isWorking: false },
      { date: '2026-10-24', type: 'vacation', desc: 'Vijaya Dasami / Dasara Vacation Ends', isWorking: false },
      { date: '2026-11-08', type: 'holiday', desc: 'Deepavali / Diwali Festival', isWorking: false },
      { date: '2026-12-25', type: 'holiday', desc: 'Christmas Day', isWorking: false },
      { date: '2027-01-13', type: 'vacation', desc: 'Sankranti / Pongal Vacation Begins (Bhogi)', isWorking: false },
      { date: '2027-01-14', type: 'holiday', desc: 'Makara Sankranti', isWorking: false },
      { date: '2027-01-15', type: 'holiday', desc: 'Kanuma Festival', isWorking: false },
      { date: '2027-01-26', type: 'event', desc: 'Republic Day Celebrations & Flag Hoisting', isWorking: true },
      { date: '2027-03-07', type: 'holiday', desc: 'Maha Shivaratri', isWorking: false },
      { date: '2027-03-24', type: 'holiday', desc: 'Holi Festival of Colours', isWorking: false },
      { date: '2027-04-08', type: 'holiday', desc: 'Ugadi (Telugu New Year)', isWorking: false },
      { date: '2027-04-14', type: 'holiday', desc: 'Dr. B.R. Ambedkar Jayanti', isWorking: false },
    ];

    for (const h of holidays) {
      const exists = await client.query(
        `SELECT id FROM calendar_days WHERE institution_id = $1 AND academic_year_id = $2 AND date = $3 LIMIT 1`,
        [INSTITUTION_ID, currentYearId, h.date]
      );
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO calendar_days (institution_id, academic_year_id, date, day_type, description, is_working_day)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [INSTITUTION_ID, currentYearId, h.date, h.type, h.desc, h.isWorking]
        );
      }
    }

    // Exam Estimates
    const exams = [
      { term: 'Periodic Assessment 1 (PA-1)', start: '2026-07-15', end: '2026-07-22', status: 'completed', desc: 'First unit assessment covering Term 1 syllabus' },
      { term: 'Term 1 / Half-Yearly Examinations', start: '2026-09-21', end: '2026-09-30', status: 'scheduled', desc: 'Mid-term summative assessment across all subjects' },
      { term: 'Periodic Assessment 2 (PA-2)', start: '2026-12-08', end: '2026-12-15', status: 'scheduled', desc: 'Second unit assessment prior to winter break' },
      { term: 'Pre-Board Assessments (Grade 10)', start: '2027-01-18', end: '2027-01-28', status: 'scheduled', desc: 'Full-syllabus preparatory exam for Board candidates' },
      { term: 'Annual Board / Final Examinations', start: '2027-03-15', end: '2027-03-27', status: 'scheduled', desc: 'Final annual academic promotion examinations' },
    ];

    for (const ex of exams) {
      const exists = await client.query(
        `SELECT id FROM exam_estimates WHERE institution_id = $1 AND academic_year_id = $2 AND term_name = $3 LIMIT 1`,
        [INSTITUTION_ID, currentYearId, ex.term]
      );
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO exam_estimates (institution_id, academic_year_id, class_id, term_name, start_date, end_date, status, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [INSTITUTION_ID, currentYearId, classMap['Grade 7']?.id || null, ex.term, ex.start, ex.end, ex.status, ex.desc]
        );
      }
    }

    // Preferred Textbooks with INR Pricing
    const textbooks = [
      { title: 'NCERT Mathematics for Class 7', author: 'NCERT Textbook Committee', publisher: 'NCERT Publications, New Delhi', isbn: '978-81-7450-482-1', price: 150.00, subCode: 'MATH-041' },
      { title: 'NCERT Science - Textbook for Class 7', author: 'Prof. Rupamanjari Ghosh et al.', publisher: 'NCERT Publications, New Delhi', isbn: '978-81-7450-483-8', price: 165.00, subCode: 'SCI-086' },
      { title: 'Honeycomb: English Textbook for Class 7', author: 'NCERT English Editorial Team', publisher: 'NCERT Publications, New Delhi', isbn: '978-81-7450-484-5', price: 120.00, subCode: 'ENG-184' },
      { title: 'Vennela: Telugu Vachakam - Class 7', author: 'Telangana SCERT Committee', publisher: 'Government of Telangana SCERT, Hyderabad', isbn: '978-93-8472-102-3', price: 110.00, subCode: 'TEL-007' },
      { title: 'Vasant Bhag 2 - Hindi for Class 7', author: 'NCERT Hindi Board', publisher: 'NCERT Publications, New Delhi', isbn: '978-81-7450-485-2', price: 125.00, subCode: 'HIN-002' },
      { title: 'Our Pasts - II: Social Science for Class 7', author: 'NCERT History Team', publisher: 'NCERT Publications, New Delhi', isbn: '978-81-7450-486-9', price: 140.00, subCode: 'SST-087' },
      { title: 'Kips Cyber Beans: Computer Science (Class 7)', author: 'Kips Editorial Team', publisher: 'Kips Learning Solutions, Hyderabad', isbn: '978-93-8958-301-4', price: 295.00, subCode: 'IT-402' },
    ];

    for (const b of textbooks) {
      const sId = subjectMap[b.subCode];
      const cId = classMap['Grade 7']?.id;
      if (!sId || !cId) continue;

      const exists = await client.query(
        `SELECT id FROM preferred_textbooks WHERE institution_id = $1 AND isbn = $2 LIMIT 1`,
        [INSTITUTION_ID, b.isbn]
      );
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO preferred_textbooks (institution_id, academic_year_id, class_id, subject_id, title, author, publisher, isbn, price, is_mandatory)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
          [INSTITUTION_ID, currentYearId, cId, sId, b.title, b.author, b.publisher, b.isbn, b.price]
        );
      }
    }

    console.log('✔ Academic Hierarchy Seeded: 5 Grades (6-10), 10 Sections, 8 CBSE Subjects, 18 Holidays, 5 Exams, 7 Prescribed Textbooks.\n');

    // -------------------------------------------------------------------------
    // 4. Staff & HRMS Leadership in Hyderabad
    // -------------------------------------------------------------------------
    console.log('▶ [4/6] Seeding Staff & HRMS Leadership in Hyderabad...');

    const staffMembers = [
      {
        fullName: 'Dr. P. Venkata Subba Rao',
        email: 'principal.subbarao@narayanaschools.in',
        phone: '+91 98480 12345',
        empCode: 'EMP-HYD-0101',
        deptCode: 'DEPT-ADM',
        desig: 'Principal & Head of Institution',
        qualification: 'M.Sc (Physics), M.Ed, Ph.D (Education Management)',
        university: 'Osmania University, Hyderabad',
        expYears: 22,
        gender: 'male',
        dob: '1975-08-14',
        doj: '2015-06-01',
        address: 'Plot 14, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
        isTeaching: true,
        staffType: 'academic',
      },
      {
        fullName: 'Smt. K. Ananya Reddy',
        email: 'ananya.reddy@narayanaschools.in',
        phone: '+91 98480 23456',
        empCode: 'EMP-HYD-0102',
        deptCode: 'DEPT-SCI',
        desig: 'Vice Principal & Academic Dean',
        qualification: 'M.Sc (Chemistry), B.Ed',
        university: 'University of Hyderabad (HCU)',
        expYears: 16,
        gender: 'female',
        dob: '1981-11-20',
        doj: '2018-05-15',
        address: 'Flat 402, Silicon County, Madhapur, Hyderabad, Telangana 500081',
        isTeaching: true,
        staffType: 'academic',
      },
      {
        fullName: 'Sri T. Ramesh Chary',
        email: 'ramesh.chary@narayanaschools.in',
        phone: '+91 98480 34567',
        empCode: 'EMP-HYD-0103',
        deptCode: 'DEPT-MATH',
        desig: 'PGT (Post Graduate Teacher)',
        qualification: 'M.Sc (Mathematics), B.Ed',
        university: 'Kakatiya University, Warangal',
        expYears: 14,
        gender: 'male',
        dob: '1983-04-10',
        doj: '2019-06-01',
        address: 'House 3-2-114, KPHB Phase 3, Kukatpally, Hyderabad, Telangana 500072',
        isTeaching: true,
        staffType: 'academic',
      },
      {
        fullName: 'Smt. Meenakshi Sundaram',
        email: 'meenakshi.s@narayanaschools.in',
        phone: '+91 98480 45678',
        empCode: 'EMP-HYD-0104',
        deptCode: 'DEPT-ENG',
        desig: 'PGT (Post Graduate Teacher)',
        qualification: 'M.A. (English Literature), B.Ed, CELTA',
        university: 'The English and Foreign Languages University (EFLU), Hyderabad',
        expYears: 12,
        gender: 'female',
        dob: '1985-02-18',
        doj: '2020-07-01',
        address: 'Villa 22, Green Valley, Road No. 12, Banjara Hills, Hyderabad 500034',
        isTeaching: true,
        staffType: 'academic',
      },
      {
        fullName: 'Sri Ch. Satyanarayana',
        email: 'satyanarayana.ch@narayanaschools.in',
        phone: '+91 98480 56789',
        empCode: 'EMP-HYD-0105',
        deptCode: 'DEPT-LANG',
        desig: 'TGT (Trained Graduate Teacher)',
        qualification: 'M.A. (Telugu Literature), Pandit Training',
        university: 'Potti Sreeramulu Telugu University, Hyderabad',
        expYears: 18,
        gender: 'male',
        dob: '1979-06-25',
        doj: '2016-06-01',
        address: 'Plot 88, Chaitanyapuri Main Road, Dilsukhnagar, Hyderabad 500060',
        isTeaching: true,
        staffType: 'academic',
      },
      {
        fullName: 'Sri V. Karthik Varma',
        email: 'karthik.varma@narayanaschools.in',
        phone: '+91 98480 67890',
        empCode: 'EMP-HYD-0106',
        deptCode: 'DEPT-SCI',
        desig: 'TGT (Trained Graduate Teacher)',
        qualification: 'M.Sc (Physics), B.Ed',
        university: 'Jawaharlal Nehru Technological University (JNTUH), Hyderabad',
        expYears: 9,
        gender: 'male',
        dob: '1988-12-05',
        doj: '2021-08-01',
        address: 'Flat 503, My Home Bhooja, Gachibowli, Hyderabad 500032',
        isTeaching: true,
        staffType: 'academic',
      },
      {
        fullName: 'Smt. S. Kavitha Rao',
        email: 'kavitha.rao@narayanaschools.in',
        phone: '+91 98480 78901',
        empCode: 'EMP-HYD-0107',
        deptCode: 'DEPT-LANG',
        desig: 'TGT (Trained Graduate Teacher)',
        qualification: 'M.A. (Hindi), B.Ed, Sahitya Ratna',
        university: 'Dakshina Bharat Hindi Prachar Sabha, Hyderabad',
        expYears: 10,
        gender: 'female',
        dob: '1987-07-22',
        doj: '2022-06-15',
        address: 'House 4-1-89, Tilak Road, Abids, Hyderabad 500001',
        isTeaching: true,
        staffType: 'academic',
      },
      {
        fullName: 'Sri M. Aditya Nandan',
        email: 'aditya.nandan@narayanaschools.in',
        phone: '+91 98480 89012',
        empCode: 'EMP-HYD-0108',
        deptCode: 'DEPT-CS',
        desig: 'TGT (Trained Graduate Teacher)',
        qualification: 'Master of Computer Applications (MCA), AI Certification',
        university: 'JNTU College of Engineering, Hyderabad',
        expYears: 6,
        gender: 'male',
        dob: '1992-03-30',
        doj: '2023-01-10',
        address: 'Flat 102, Cyber Heights, Hitec City, Hyderabad 500081',
        isTeaching: true,
        staffType: 'academic',
      },
      {
        fullName: 'Sri B. Mallikarjun Rao',
        email: 'mallikarjun.pet@narayanaschools.in',
        phone: '+91 98480 90123',
        empCode: 'EMP-HYD-0109',
        deptCode: 'DEPT-PET',
        desig: 'Physical Education Director (PED)',
        qualification: 'M.P.Ed, NIS Coach Certification (Athletics & Cricket)',
        university: 'Sports Authority of Telangana / Osmania University',
        expYears: 11,
        gender: 'male',
        dob: '1986-10-12',
        doj: '2020-02-01',
        address: 'House 1-8-442, Chikkadpally, Secunderabad 500020',
        isTeaching: true,
        staffType: 'academic',
      },
      {
        fullName: 'Smt. L. Vijaya Lakshmi',
        email: 'accounts.vijaya@narayanaschools.in',
        phone: '+91 98490 12345',
        empCode: 'EMP-HYD-0110',
        deptCode: 'DEPT-FIN',
        desig: 'Senior Accountant & Bursar',
        qualification: 'M.Com, CA Inter',
        university: 'Sri Venkateswara University / ICAI',
        expYears: 10,
        gender: 'female',
        dob: '1987-05-16',
        doj: '2021-04-01',
        address: 'Flat 304, Fortune Residency, Begumpet, Hyderabad 500016',
        isTeaching: false,
        staffType: 'administrative',
      },
      {
        fullName: 'Sri D. Praveen Kumar',
        email: 'admissions.praveen@narayanaschools.in',
        phone: '+91 98490 23456',
        empCode: 'EMP-HYD-0111',
        deptCode: 'DEPT-ADMN',
        desig: 'Head of Admissions & Outreach',
        qualification: 'MBA (Marketing & Educational Management)',
        university: 'Institute of Public Enterprise (IPE), Hyderabad',
        expYears: 7,
        gender: 'male',
        dob: '1990-09-08',
        doj: '2022-03-01',
        address: 'House 12-2-710, Rethibowli, Mehdipatnam, Hyderabad 500028',
        isTeaching: false,
        staffType: 'administrative',
      },
      {
        fullName: 'Smt. R. Keerthi',
        email: 'hr.keerthi@narayanaschools.in',
        phone: '+91 98490 34567',
        empCode: 'EMP-HYD-0112',
        deptCode: 'DEPT-HR',
        desig: 'Human Resources Manager',
        qualification: 'MBA (Human Resource Management), SHRM-CP',
        university: 'Badruka College of Commerce & Arts, Hyderabad',
        expYears: 5,
        gender: 'female',
        dob: '1993-01-25',
        doj: '2023-05-02',
        address: 'Flat 601, Green Towers, Somajiguda, Hyderabad 500082',
        isTeaching: false,
        staffType: 'administrative',
      },
    ];

    const staffIdMap: Record<string, string> = {};

    for (const sm of staffMembers) {
      // 1. Auth User & Profile
      const userRes = await client.query('SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1)', [sm.email]);
      let profileId = userRes.rows[0]?.id;

      if (!profileId) {
        const defaultPassHash = '$2a$10$wE95E7t0R1K6eE8T/y.aCujyO238Wv8OmsWv20RkM7q2Z7K6qJ1jW';
        const userMeta = { full_name: sm.fullName, user_id: sm.email, must_change_password: true };
        const insertAuth = await client.query(
          `INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
           RETURNING id`,
          [sm.email.toLowerCase(), defaultPassHash, JSON.stringify(userMeta)]
        );
        profileId = insertAuth.rows[0].id;
      }

      await client.query(
        `INSERT INTO profiles (id, full_name, email, phone, default_institution_id, status, must_change_password)
         VALUES ($1, $2, $3, $4, $5, 'active', false)
         ON CONFLICT (id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           phone = EXCLUDED.phone,
           default_institution_id = EXCLUDED.default_institution_id,
           updated_at = now()`,
        [profileId, sm.fullName, sm.email.toLowerCase(), sm.phone, INSTITUTION_ID]
      );

      // 2. Staff
      let staffRes = await client.query(
        `SELECT id FROM staff WHERE institution_id = $1 AND employee_code = $2 LIMIT 1`,
        [INSTITUTION_ID, sm.empCode]
      );
      let sId = staffRes.rows[0]?.id;
      if (!sId) {
        const ins = await client.query(
          `INSERT INTO staff (
             institution_id, profile_id, employee_code, department_id, designation_id,
             is_teaching_staff, employment_status, date_of_joining,
             qualification, university, experience, experience_years,
             date_of_birth, gender, address, staff_type
           ) VALUES (
             $1, $2, $3, $4, $5,
             $6, 'active', $7,
             $8, $9, $10, $11,
             $12, $13, $14, $15
           ) RETURNING id`,
          [
            INSTITUTION_ID, profileId, sm.empCode, deptMap[sm.deptCode] || null, desigMap[sm.desig] || null,
            sm.isTeaching, sm.doj,
            sm.qualification, sm.university, `${sm.expYears} Years`, sm.expYears,
            sm.dob, sm.gender, sm.address, sm.staffType
          ]
        );
        sId = ins.rows[0].id;
      } else {
        await client.query(
          `UPDATE staff SET
             department_id = $1, designation_id = $2, is_teaching_staff = $3,
             qualification = $4, university = $5, experience = $6, experience_years = $7,
             date_of_birth = $8, gender = $9, address = $10, staff_type = $11
           WHERE id = $12`,
          [
            deptMap[sm.deptCode] || null, desigMap[sm.desig] || null, sm.isTeaching,
            sm.qualification, sm.university, `${sm.expYears} Years`, sm.expYears,
            sm.dob, sm.gender, sm.address, sm.staffType, sId
          ]
        );
      }
      staffIdMap[sm.empCode] = sId;
    }

    // Assign Class Teachers to Sections
    if (staffIdMap['EMP-HYD-0103'] && classMap['Grade 7']?.secAId) {
      // Sri T. Ramesh Chary -> Grade 7 Section A
      await client.query(
        `UPDATE sections SET class_teacher_staff_id = $1 WHERE id = $2`,
        [staffIdMap['EMP-HYD-0103'], classMap['Grade 7'].secAId]
      );
    }
    if (staffIdMap['EMP-HYD-0102'] && classMap['Grade 10']?.secAId) {
      // Smt. K. Ananya Reddy -> Grade 10 Section A
      await client.query(
        `UPDATE sections SET class_teacher_staff_id = $1 WHERE id = $2`,
        [staffIdMap['EMP-HYD-0102'], classMap['Grade 10'].secAId]
      );
    }

    console.log('✔ Staff & HRMS Leadership Seeded: 12 Real Profiles (Principal, HODs, Teachers, Bursar, Admissions, HR).\n');

    // -------------------------------------------------------------------------
    // 5. Admissions Pipeline (Enquiries & Applications in Hyderabad)
    // -------------------------------------------------------------------------
    console.log('▶ [5/6] Seeding Admissions Pipeline across Hyderabad Localities...');

    const enquiries = [
      {
        applicantName: 'Sai Pranathi Reddy',
        dob: '2014-06-18',
        gender: 'female',
        grade: 'Grade 7',
        classId: classMap['Grade 7']?.id,
        contactName: 'K. Srikanth Reddy',
        contactPhone: '+91 99490 11223',
        contactEmail: 'srikanth.reddy@techmahindra.com',
        source: 'walk-in',
        notes: 'Inquiry for Grade 7 admissions from Madhapur. Interested in integrated IIT Foundation program.',
        status: 'open',
      },
      {
        applicantName: 'Ishaan Varma',
        dob: '2013-09-24',
        gender: 'male',
        grade: 'Grade 8',
        classId: classMap['Grade 8']?.id,
        contactName: 'V. Rajesh Varma',
        contactPhone: '+91 99490 22334',
        contactEmail: 'rajesh.varma@infosys.com',
        source: 'website',
        notes: 'Relocating from Bengaluru to Kondapur, Hyderabad. Father working in IT corridor.',
        status: 'contacted',
      },
      {
        applicantName: 'Nitya Sri Rao',
        dob: '2012-04-12',
        gender: 'female',
        grade: 'Grade 9',
        classId: classMap['Grade 9']?.id,
        contactName: 'M. Anand Rao',
        contactPhone: '+91 99490 33445',
        contactEmail: 'anand.rao@apollohospitals.com',
        source: 'referral',
        notes: 'Doctor at Apollo Jubilee Hills. Inquiring for direct Grade 9 science & maths Olympiad coaching stream.',
        status: 'qualified',
      },
      {
        applicantName: 'Aarav Goud',
        dob: '2015-11-05',
        gender: 'male',
        grade: 'Grade 6',
        classId: classMap['Grade 6']?.id,
        contactName: 'G. Mohan Goud',
        contactPhone: '+91 99490 44556',
        contactEmail: 'mohan.goud@telangana.gov.in',
        source: 'newspaper',
        notes: 'Government Secretariat employee residing in Khairatabad. Needs school bus transport route.',
        status: 'open',
      },
    ];

    for (const eq of enquiries) {
      const exists = await client.query(
        `SELECT id FROM enquiries WHERE institution_id = $1 AND contact_email = $2 AND applicant_name = $3 LIMIT 1`,
        [INSTITUTION_ID, eq.contactEmail, eq.applicantName]
      );
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO enquiries (
             institution_id, applicant_name, date_of_birth, gender,
             grade_applying, class_id, interested_class_id, academic_year_id,
             contact_name, contact_phone, contact_email,
             source, notes, status
           ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            INSTITUTION_ID, eq.applicantName, eq.dob, eq.gender,
            eq.grade, eq.classId, currentYearId,
            eq.contactName, eq.contactPhone, eq.contactEmail,
            eq.source, eq.notes, eq.status
          ]
        );
      }
    }

    // Pipeline Applications (Stage 1 to 5)
    const pipelineApps = [
      {
        name: 'Vanya Kulkarni',
        dob: '2014-03-15',
        gender: 'female',
        grade: 'Grade 7',
        guardianName: 'Sanjay Kulkarni',
        guardianPhone: '+91 98850 12345',
        guardianEmail: 'sanjay.kulkarni@wipro.com',
        stage: 'enquiry',
        score: null,
        notes: 'Parent submitted online registration form from Gachibowli; pending counsellor call.',
      },
      {
        name: 'Mohammed Zayd',
        dob: '2013-11-20',
        gender: 'male',
        grade: 'Grade 8',
        guardianName: 'Mohammed Abdul Khader',
        guardianPhone: '+91 98850 23456',
        guardianEmail: 'khader.abdul@novartis.com',
        stage: 'application',
        score: null,
        notes: 'Application submitted along with previous year marksheets. Living near Tolichowki / Mehdipatnam.',
      },
      {
        name: 'Sneha Patel',
        dob: '2012-08-05',
        gender: 'female',
        grade: 'Grade 9',
        guardianName: 'Dharmesh Patel',
        guardianPhone: '+91 98850 34567',
        guardianEmail: 'dharmesh.patel@drreddys.com',
        stage: 'document_verification',
        score: 88.5,
        notes: 'All documents submitted (Aadhaar, SCERT TC, Birth Certificate). Ready for verification review.',
      },
      {
        name: 'Advaith Sharma',
        dob: '2011-05-18',
        gender: 'male',
        grade: 'Grade 10',
        guardianName: 'Dr. Suresh Sharma',
        guardianPhone: '+91 98850 45678',
        guardianEmail: 'suresh.sharma@yashodahospitals.org',
        stage: 'review',
        score: 94.0,
        notes: 'Secured 94/100 in Entrance Examination. Interview cleared with Principal. Awaiting final seat allotment.',
      },
      {
        name: 'Charvi Nanduri',
        dob: '2015-02-28',
        gender: 'female',
        grade: 'Grade 6',
        guardianName: 'N. Venkat Rao',
        guardianPhone: '+91 98850 56789',
        guardianEmail: 'venkat.nanduri@microsoft.com',
        stage: 'approved',
        score: 91.5,
        notes: 'Application Approved! Ready for 1-Click Enrollment into Grade 6 Ramanujan Wing.',
      },
    ];

    for (const pa of pipelineApps) {
      const cId = classMap[pa.grade]?.id;
      if (!cId) continue;

      let appRes = await client.query(
        `SELECT id FROM applications WHERE institution_id = $1 AND applicant_name = $2 LIMIT 1`,
        [INSTITUTION_ID, pa.name]
      );
      let appId = appRes.rows[0]?.id;
      if (!appId) {
        const ins = await client.query(
          `INSERT INTO applications (
             institution_id, applicant_name, date_of_birth, gender,
             applying_for_class_id, academic_year_id,
             guardian_name, guardian_phone, guardian_email,
             stage, notes, entrance_score
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [
            INSTITUTION_ID, pa.name, pa.dob, pa.gender,
            cId, currentYearId,
            pa.guardianName, pa.guardianPhone, pa.guardianEmail,
            pa.stage, pa.notes, pa.score
          ]
        );
        appId = ins.rows[0].id;
      }

      // Add verified documents for Sneha Patel
      if (pa.name === 'Sneha Patel' && appId) {
        const docTypes = ['Birth Certificate', 'Transfer Certificate (TC)', 'Previous Year Report Card', 'Aadhaar Card'];
        for (const dt of docTypes) {
          const docExists = await client.query(
            `SELECT id FROM admission_documents WHERE application_id = $1 AND document_type = $2 LIMIT 1`,
            [appId, dt]
          );
          if (docExists.rows.length === 0) {
            await client.query(
              `INSERT INTO admission_documents (application_id, document_type, storage_key, verification_status)
               VALUES ($1, $2, $3, 'verified')`,
              [appId, dt, `admissions/hyd_${pa.name.toLowerCase().replace(' ', '_')}_${dt.toLowerCase().replace(/[^a-z]/g, '')}.pdf`]
            );
          }
        }
      }
    }

    console.log('✔ Admissions Pipeline Seeded: 4 Enquiries + 5 Pipeline Applicants (Inquiry -> Approved with Docs).\n');

    // -------------------------------------------------------------------------
    // 6. Enrolled Students Master Directory (360° Profiles in Hyderabad)
    // -------------------------------------------------------------------------
    console.log('▶ [6/6] Seeding Students Master Directory with Hyderabad Profiles...');

    const enrolledStudents = [
      {
        admNum: 'SIA-2026-0101',
        firstName: 'Sai Teja',
        lastName: 'Chary',
        className: 'Grade 7',
        sectionType: 'secAId',
        rollNo: '07-A-01',
        dob: '2014-07-15',
        gender: 'male',
        bloodGroup: 'O+',
        guardianName: 'T. Srinivas Chary',
        guardianRel: 'Father',
        guardianPhone: '+91 97010 11223',
        guardianEmail: 'srinivas.chary@tcs.com',
        occupation: 'Lead Solutions Architect at TCS Adibatla',
        address: 'Plot 42, HMT Colony, Miyapur, Hyderabad, Telangana 500049',
      },
      {
        admNum: 'SIA-2026-0102',
        firstName: 'Ananya',
        lastName: 'Goud',
        className: 'Grade 7',
        sectionType: 'secAId',
        rollNo: '07-A-02',
        dob: '2014-04-20',
        gender: 'female',
        bloodGroup: 'B+',
        guardianName: 'G. Bhaskar Goud',
        guardianRel: 'Father',
        guardianPhone: '+91 97010 22334',
        guardianEmail: 'bhaskar.goud@cognizant.com',
        occupation: 'Senior Director at Cognizant Gachibowli',
        address: 'Villa 18, Aparna Sarovar Zenith, Nallagandla, Hyderabad 500019',
      },
      {
        admNum: 'SIA-2026-0103',
        firstName: 'Rohan',
        lastName: 'Varma',
        className: 'Grade 7',
        sectionType: 'secBId',
        rollNo: '07-B-01',
        dob: '2014-09-08',
        gender: 'male',
        bloodGroup: 'A+',
        guardianName: 'V. Kalyan Varma',
        guardianRel: 'Father',
        guardianPhone: '+91 97010 33445',
        guardianEmail: 'kalyan.varma@amazon.com',
        occupation: 'Principal SDE at Amazon Campus, Financial District',
        address: 'Flat 1204, Jayabheri The Peak, Nanakramguda, Hyderabad 500032',
      },
      {
        admNum: 'SIA-2026-0104',
        firstName: 'Tanvi',
        lastName: 'Reddy',
        className: 'Grade 7',
        sectionType: 'secBId',
        rollNo: '07-B-02',
        dob: '2014-11-12',
        gender: 'female',
        bloodGroup: 'AB+',
        guardianName: 'K. Pratap Reddy',
        guardianRel: 'Father',
        guardianPhone: '+91 97010 44556',
        guardianEmail: 'pratap.reddy@hetero.com',
        occupation: 'Vice President (Operations) at Hetero Drugs, Sanathnagar',
        address: 'House 8-2-293/82/A, Road No. 10, Jubilee Hills, Hyderabad 500033',
      },
      {
        admNum: 'SIA-2026-0105',
        firstName: 'Karthikeya',
        lastName: 'Mylavarapu',
        className: 'Grade 8',
        sectionType: 'secAId',
        rollNo: '08-A-01',
        dob: '2013-05-19',
        gender: 'male',
        bloodGroup: 'O+',
        guardianName: 'M. Sitarama Sastry',
        guardianRel: 'Father',
        guardianPhone: '+91 97010 55667',
        guardianEmail: 'sitarama.sastry@isro.gov.in',
        occupation: 'Scientist / Engineer SF at NRSC / ISRO Balanagar',
        address: 'Flat 302, Satellite Residency, Balanagar, Hyderabad 500037',
      },
      {
        admNum: 'SIA-2026-0106',
        firstName: 'Diya',
        lastName: 'Rao',
        className: 'Grade 8',
        sectionType: 'secAId',
        rollNo: '08-A-02',
        dob: '2013-08-30',
        gender: 'female',
        bloodGroup: 'B-',
        guardianName: 'Dr. Sunita Rao',
        guardianRel: 'Mother',
        guardianPhone: '+91 97010 66778',
        guardianEmail: 'sunita.rao@kims.co.in',
        occupation: 'Consultant Pediatrician at KIMS Hospitals, Secunderabad',
        address: 'House 1-10-72/5, Chikoti Gardens, Begumpet, Hyderabad 500016',
      },
      {
        admNum: 'SIA-2026-0107',
        firstName: 'Pranav',
        lastName: 'Kandula',
        className: 'Grade 9',
        sectionType: 'secAId',
        rollNo: '09-A-01',
        dob: '2012-02-14',
        gender: 'male',
        bloodGroup: 'A-',
        guardianName: 'K. Satish Kumar',
        guardianRel: 'Father',
        guardianPhone: '+91 97010 77889',
        guardianEmail: 'satish.kandula@google.com',
        occupation: 'Engineering Manager at Google Hyderabad',
        address: 'Villa 45, Boulder Hills Golf and Country Club, Gachibowli 500032',
      },
      {
        admNum: 'SIA-2026-0108',
        firstName: 'Sahithi',
        lastName: 'Potluri',
        className: 'Grade 9',
        sectionType: 'secBId',
        rollNo: '09-B-01',
        dob: '2012-10-03',
        gender: 'female',
        bloodGroup: 'O+',
        guardianName: 'P. Harish Potluri',
        guardianRel: 'Father',
        guardianPhone: '+91 97010 88990',
        guardianEmail: 'harish.potluri@deloitte.com',
        occupation: 'Partner at Deloitte USI, Hitec City',
        address: 'Flat 801, Prestige High Fields, Financial District, Hyderabad 500032',
      },
      {
        admNum: 'SIA-2026-0109',
        firstName: 'Abhinav',
        lastName: 'Bollineni',
        className: 'Grade 10',
        sectionType: 'secAId',
        rollNo: '10-A-01',
        dob: '2011-06-22',
        gender: 'male',
        bloodGroup: 'B+',
        guardianName: 'B. Krishna Mohan',
        guardianRel: 'Father',
        guardianPhone: '+91 97010 99001',
        guardianEmail: 'krishna.bollineni@medcover.com',
        occupation: 'Director of Healthcare Systems, Banjara Hills',
        address: 'House 10-3-311, Castle Hills, Masab Tank, Hyderabad 500028',
      },
      {
        admNum: 'SIA-2026-0110',
        firstName: 'Siri',
        lastName: 'Gundlapally',
        className: 'Grade 10',
        sectionType: 'secAId',
        rollNo: '10-A-02',
        dob: '2011-09-17',
        gender: 'female',
        bloodGroup: 'O-',
        guardianName: 'G. Madhusudhan Rao',
        guardianRel: 'Father',
        guardianPhone: '+91 97010 00112',
        guardianEmail: 'madhusudhan.g@qualcomm.com',
        occupation: 'Staff Hardware Engineer at Qualcomm India, Mindspace Madhapur',
        address: 'Flat 502, Rainbow Vistas Rock Garden, Moosapet, Hyderabad 500018',
      },
    ];

    for (const st of enrolledStudents) {
      const cInfo = classMap[st.className];
      if (!cInfo) continue;
      const sId = st.sectionType === 'secAId' ? cInfo.secAId : cInfo.secBId;

      // 1. Student Master Record
      let stRes = await client.query(
        `SELECT id FROM students WHERE institution_id = $1 AND admission_number = $2 LIMIT 1`,
        [INSTITUTION_ID, st.admNum]
      );
      let studentId = stRes.rows[0]?.id;

      if (!studentId) {
        const insSt = await client.query(
          `INSERT INTO students (
             institution_id, admission_number, first_name, last_name,
             date_of_birth, gender, blood_group, nationality, mother_tongue,
             current_class_id, current_section_id, status,
             address_line1, city, state, pincode, roll_number
           ) VALUES (
             $1, $2, $3, $4,
             $5, $6, $7, 'Indian', 'Telugu',
             $8, $9, 'active',
             $10, 'Hyderabad', 'Telangana', '500081', $11
           ) RETURNING id`,
          [
            INSTITUTION_ID, st.admNum, st.firstName, st.lastName,
            st.dob, st.gender, st.bloodGroup,
            cInfo.id, sId, st.address, st.rollNo
          ]
        );
        studentId = insSt.rows[0].id;
      } else {
        await client.query(
          `UPDATE students SET
             first_name = $1, last_name = $2, date_of_birth = $3, gender = $4,
             blood_group = $5, current_class_id = $6, current_section_id = $7,
             address_line1 = $8, city = 'Hyderabad', state = 'Telangana', status = 'active',
             roll_number = $9
           WHERE id = $10`,
          [
            st.firstName, st.lastName, st.dob, st.gender,
            st.bloodGroup, cInfo.id, sId, st.address, st.rollNo, studentId
          ]
        );
      }

      // 2. Guardian & Linkage
      let gRes = await client.query(
        `SELECT id FROM guardians WHERE institution_id = $1 AND full_name = $2 AND phone = $3 LIMIT 1`,
        [INSTITUTION_ID, st.guardianName, st.guardianPhone]
      );
      let guardianId = gRes.rows[0]?.id;
      if (!guardianId) {
        const insG = await client.query(
          `INSERT INTO guardians (institution_id, full_name, relationship, phone, email)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [INSTITUTION_ID, st.guardianName, st.guardianRel, st.guardianPhone, st.guardianEmail]
        );
        guardianId = insG.rows[0].id;
      }

      await client.query(
        `INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary_contact)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (student_id, guardian_id) DO UPDATE SET
           relationship = EXCLUDED.relationship,
           is_primary_contact = true`,
        [studentId, guardianId, st.guardianRel]
      );

      // 3. Academic History
      const hCheck = await client.query(
        `SELECT id FROM student_academic_history WHERE student_id = $1 AND academic_year_id = $2 LIMIT 1`,
        [studentId, currentYearId]
      );
      if (hCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO student_academic_history (institution_id, student_id, academic_year_id, class_id, section_id, roll_number, effective_from)
           VALUES ($1, $2, $3, $4, $5, $6, '2026-06-01')`,
          [INSTITUTION_ID, studentId, currentYearId, cInfo.id, sId, st.rollNo]
        );
      }
    }

    console.log('✔ Students Master Directory Seeded: 10 Real Student Master Dossiers with Guardians & History in Hyderabad.\n');

    await client.query('COMMIT');
    console.log('====================================================');
    console.log('🎉 HYDERABAD DEMO DATASET SEEDED SUCCESSFULLY (100% LIVE)');
    console.log('====================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed with error:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedHyderabadDemo()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
