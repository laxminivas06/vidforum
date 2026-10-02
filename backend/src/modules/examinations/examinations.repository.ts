import { db } from '../../config/database';

export interface ExamTypeData {
  id: string;
  institutionId: string;
  name: string;
  weightage?: number | null;
  createdAt: string;
}

export interface ExamData {
  id: string;
  institutionId: string;
  examTypeId: string;
  academicYearId: string;
  classId: string;
  name: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  typeName?: string;
  className?: string;
  academicYearName?: string;
  subjectsCount?: number;
}

export interface ExamSubjectData {
  id: string;
  examId: string;
  subjectId: string;
  maxMarks: number;
  passMarks: number;
  subjectName?: string;
  subjectCode?: string;
  examName?: string;
  className?: string;
}

export interface ExamScheduleData {
  id: string;
  examSubjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  subjectName?: string;
  examName?: string;
}

export interface GradeScaleData {
  id: string;
  institutionId: string;
  name: string;
  createdAt: string;
  tiers?: GradeTierData[];
}

export interface GradeTierData {
  id: string;
  gradeScaleId: string;
  label: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint?: number | null;
}

export interface MarkData {
  id: string;
  institutionId: string;
  examSubjectId: string;
  studentId: string;
  marksObtained: number;
  gradeId?: string | null;
  isAbsent: boolean;
  remarks?: string | null;
  enteredBy?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  studentName?: string;
  admissionNumber?: string;
  subjectName?: string;
  maxMarks?: number;
  passMarks?: number;
  gradeLabel?: string;
  gradePoint?: number;
}

export interface ReportCardData {
  id: string;
  institutionId: string;
  examId: string;
  studentId: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  gpa?: number | null;
  grade?: string | null;
  rank?: number | null;
  resultStatus: 'passed' | 'failed' | 'withheld';
  remarks?: string | null;
  generatedAt: string;
  publishedAt?: string | null;
  createdAt: string;
  studentName?: string;
  admissionNumber?: string;
  examName?: string;
  className?: string;
  subjectMarks?: Array<{
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    passMarks: number;
    grade?: string;
    isAbsent: boolean;
  }>;
}

export class ExaminationsRepository {
  // ================= EXAM TYPES =================
  async createExamType(institutionId: string, data: { name: string; weightage?: number | null }): Promise<ExamTypeData> {
    const res = await db.query(
      `INSERT INTO exam_types (institution_id, name, weightage)
       VALUES ($1, $2, $3)
       ON CONFLICT (institution_id, name) DO UPDATE SET weightage = EXCLUDED.weightage
       RETURNING id, institution_id as "institutionId", name, weightage::float as weightage, created_at::text as "createdAt"`,
      [institutionId, data.name, data.weightage || null]
    );
    return res.rows[0];
  }

  async listExamTypes(institutionId: string): Promise<ExamTypeData[]> {
    const res = await db.query(
      `SELECT id, institution_id as "institutionId", name, weightage::float as weightage, created_at::text as "createdAt"
       FROM exam_types
       WHERE institution_id = $1
       ORDER BY name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  // ================= EXAMS =================
  async createExam(
    institutionId: string,
    data: {
      examTypeId: string;
      academicYearId: string;
      classId: string;
      name: string;
      status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    }
  ): Promise<ExamData> {
    const res = await db.query(
      `INSERT INTO exams (institution_id, exam_type_id, academic_year_id, class_id, name, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, institution_id as "institutionId", exam_type_id as "examTypeId",
                 academic_year_id as "academicYearId", class_id as "classId", name,
                 status, is_published as "isPublished", published_at::text as "publishedAt",
                 created_at::text as "createdAt"`,
      [institutionId, data.examTypeId, data.academicYearId, data.classId, data.name, data.status || 'scheduled']
    );
    return res.rows[0];
  }

  async getExamById(institutionId: string, id: string): Promise<ExamData | null> {
    const res = await db.query(
      `SELECT 
         e.id,
         e.institution_id as "institutionId",
         e.exam_type_id as "examTypeId",
         e.academic_year_id as "academicYearId",
         e.class_id as "classId",
         e.name,
         e.status,
         e.is_published as "isPublished",
         e.published_at::text as "publishedAt",
         e.created_at::text as "createdAt",
         et.name as "typeName",
         c.name as "className",
         ay.name as "academicYearName",
         (SELECT count(*) FROM exam_subjects WHERE exam_id = e.id)::int as "subjectsCount"
       FROM exams e
       JOIN exam_types et ON et.id = e.exam_type_id
       JOIN classes c ON c.id = e.class_id
       JOIN academic_years ay ON ay.id = e.academic_year_id
       WHERE e.institution_id = $1 AND e.id = $2`,
      [institutionId, id]
    );
    return res.rows[0] || null;
  }

  async listExams(
    institutionId: string,
    filters?: { classId?: string; academicYearId?: string; status?: string; isPublished?: boolean }
  ): Promise<ExamData[]> {
    let query = `
      SELECT 
        e.id,
        e.institution_id as "institutionId",
        e.exam_type_id as "examTypeId",
        e.academic_year_id as "academicYearId",
        e.class_id as "classId",
        e.name,
        e.status,
        e.is_published as "isPublished",
        e.published_at::text as "publishedAt",
        e.created_at::text as "createdAt",
        et.name as "typeName",
        c.name as "className",
        ay.name as "academicYearName",
        (SELECT count(*) FROM exam_subjects WHERE exam_id = e.id)::int as "subjectsCount"
      FROM exams e
      JOIN exam_types et ON et.id = e.exam_type_id
      JOIN classes c ON c.id = e.class_id
      JOIN academic_years ay ON ay.id = e.academic_year_id
      WHERE e.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters?.classId) {
      params.push(filters.classId);
      query += ` AND e.class_id = $${params.length}`;
    }
    if (filters?.academicYearId) {
      params.push(filters.academicYearId);
      query += ` AND e.academic_year_id = $${params.length}`;
    }
    if (filters?.status) {
      params.push(filters.status);
      query += ` AND e.status = $${params.length}`;
    }
    if (filters?.isPublished !== undefined) {
      params.push(filters.isPublished);
      query += ` AND e.is_published = $${params.length}`;
    }

    query += ' ORDER BY e.created_at DESC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async updateExamStatus(institutionId: string, id: string, status: string): Promise<ExamData | null> {
    const res = await db.query(
      `UPDATE exams 
       SET status = $1, updated_at = now()
       WHERE institution_id = $2 AND id = $3
       RETURNING id, institution_id as "institutionId", name, status, is_published as "isPublished"`,
      [status, institutionId, id]
    );
    return res.rows[0] || null;
  }

  async publishExam(institutionId: string, id: string): Promise<ExamData | null> {
    const res = await db.query(
      `UPDATE exams 
       SET is_published = true, published_at = now(), status = 'completed', updated_at = now()
       WHERE institution_id = $1 AND id = $2
       RETURNING id, institution_id as "institutionId", name, status, is_published as "isPublished", published_at::text as "publishedAt"`,
      [institutionId, id]
    );

    // Also mark report cards for this exam as published
    await db.query(
      `UPDATE report_cards
       SET published_at = now(), updated_at = now()
       WHERE institution_id = $1 AND exam_id = $2 AND published_at IS NULL`,
      [institutionId, id]
    );

    return res.rows[0] || null;
  }

  // ================= EXAM SUBJECTS =================
  async addExamSubject(
    institutionId: string,
    data: { examId: string; subjectId: string; maxMarks: number; passMarks: number }
  ): Promise<ExamSubjectData> {
    // Verify exam belongs to institution
    const exam = await this.getExamById(institutionId, data.examId);
    if (!exam) throw new Error('Exam not found in this institution');

    const res = await db.query(
      `INSERT INTO exam_subjects (exam_id, subject_id, max_marks, pass_marks)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (exam_id, subject_id) DO UPDATE 
         SET max_marks = EXCLUDED.max_marks, pass_marks = EXCLUDED.pass_marks
       RETURNING id, exam_id as "examId", subject_id as "subjectId",
                 max_marks::float as "maxMarks", pass_marks::float as "passMarks"`,
      [data.examId, data.subjectId, data.maxMarks, data.passMarks]
    );
    return res.rows[0];
  }

  async listExamSubjects(institutionId: string, examId: string): Promise<ExamSubjectData[]> {
    const res = await db.query(
      `SELECT 
         es.id,
         es.exam_id as "examId",
         es.subject_id as "subjectId",
         es.max_marks::float as "maxMarks",
         es.pass_marks::float as "passMarks",
         s.name as "subjectName",
         s.code as "subjectCode",
         e.name as "examName",
         c.name as "className"
       FROM exam_subjects es
       JOIN exams e ON e.id = es.exam_id
       JOIN subjects s ON s.id = es.subject_id
       JOIN classes c ON c.id = e.class_id
       WHERE e.institution_id = $1 AND es.exam_id = $2
       ORDER BY s.name ASC`,
      [institutionId, examId]
    );
    return res.rows;
  }

  async getExamSubjectById(institutionId: string, examSubjectId: string): Promise<ExamSubjectData | null> {
    const res = await db.query(
      `SELECT 
         es.id,
         es.exam_id as "examId",
         es.subject_id as "subjectId",
         es.max_marks::float as "maxMarks",
         es.pass_marks::float as "passMarks",
         s.name as "subjectName",
         s.code as "subjectCode",
         e.name as "examName",
         c.name as "className",
         e.class_id as "classId"
       FROM exam_subjects es
       JOIN exams e ON e.id = es.exam_id
       JOIN subjects s ON s.id = es.subject_id
       JOIN classes c ON c.id = e.class_id
       WHERE e.institution_id = $1 AND es.id = $2`,
      [institutionId, examSubjectId]
    );
    return res.rows[0] || null;
  }

  // ================= EXAM SCHEDULES =================
  async createExamSchedule(
    institutionId: string,
    data: { examSubjectId: string; examDate: string; startTime: string; endTime: string }
  ): Promise<ExamScheduleData> {
    // Verify exam subject belongs to institution
    const es = await this.getExamSubjectById(institutionId, data.examSubjectId);
    if (!es) throw new Error('Exam subject not found in this institution');

    const res = await db.query(
      `INSERT INTO exam_schedules (exam_subject_id, exam_date, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING id, exam_subject_id as "examSubjectId", exam_date::text as "examDate",
                 start_time::text as "startTime", end_time::text as "endTime", created_at::text as "createdAt"`,
      [data.examSubjectId, data.examDate, data.startTime, data.endTime]
    );
    return res.rows[0];
  }

  async listExamSchedules(institutionId: string, examId: string): Promise<ExamScheduleData[]> {
    const res = await db.query(
      `SELECT 
         sch.id,
         sch.exam_subject_id as "examSubjectId",
         sch.exam_date::text as "examDate",
         sch.start_time::text as "startTime",
         sch.end_time::text as "endTime",
         sch.created_at::text as "createdAt",
         sub.name as "subjectName",
         e.name as "examName"
       FROM exam_schedules sch
       JOIN exam_subjects es ON es.id = sch.exam_subject_id
       JOIN subjects sub ON sub.id = es.subject_id
       JOIN exams e ON e.id = es.exam_id
       WHERE e.institution_id = $1 AND es.exam_id = $2
       ORDER BY sch.exam_date ASC, sch.start_time ASC`,
      [institutionId, examId]
    );
    return res.rows;
  }

  // ================= EXAM ROOMS & SEATING ALLOCATION =================
  async createExamRoom(
    institutionId: string,
    data: { examSubjectId: string; roomId?: string | null; capacity?: number | null }
  ) {
    const res = await db.query(
      `INSERT INTO exam_rooms (institution_id, exam_subject_id, room_id, capacity)
       VALUES ($1, $2, $3, $4)
       RETURNING id, institution_id as "institutionId", exam_subject_id as "examSubjectId",
                 room_id as "roomId", capacity, created_at::text as "createdAt"`,
      [institutionId, data.examSubjectId, data.roomId || null, data.capacity || 40]
    );
    return res.rows[0];
  }

  async allocateSeating(
    institutionId: string,
    examRoomId: string,
    allocations: Array<{ studentId: string; seatNumber?: string | null }>
  ) {
    return await db.transaction(async (client) => {
      // Check room and capacity
      const roomRes = await client.query(
        'SELECT id, capacity FROM exam_rooms WHERE id = $1 AND institution_id = $2',
        [examRoomId, institutionId]
      );
      if (roomRes.rows.length === 0) throw new Error('Exam room not found');
      const capacity = roomRes.rows[0].capacity;

      const currentCountRes = await client.query(
        'SELECT count(*) FROM exam_room_allocations WHERE exam_room_id = $1',
        [examRoomId]
      );
      const currentCount = parseInt(currentCountRes.rows[0].count, 10);
      if (currentCount + allocations.length > capacity) {
        throw new Error(`EXAM_ROOM_CAPACITY_EXCEEDED: Room capacity is ${capacity}, already has ${currentCount}`);
      }

      const results = [];
      for (const alloc of allocations) {
        const insRes = await client.query(
          `INSERT INTO exam_room_allocations (exam_room_id, student_id, seat_number)
           VALUES ($1, $2, $3)
           ON CONFLICT (exam_room_id, student_id) DO UPDATE SET seat_number = EXCLUDED.seat_number
           RETURNING id, exam_room_id as "examRoomId", student_id as "studentId", seat_number as "seatNumber"`,
          [examRoomId, alloc.studentId, alloc.seatNumber || null]
        );
        results.push(insRes.rows[0]);
      }
      return results;
    });
  }

  async assignInvigilator(institutionId: string, examRoomId: string, staffId: string) {
    // Check room
    const roomRes = await db.query(
      'SELECT id FROM exam_rooms WHERE id = $1 AND institution_id = $2',
      [examRoomId, institutionId]
    );
    if (roomRes.rows.length === 0) throw new Error('Exam room not found');

    const res = await db.query(
      `INSERT INTO invigilators (exam_room_id, staff_id)
       VALUES ($1, $2)
       ON CONFLICT (exam_room_id, staff_id) DO NOTHING
       RETURNING id, exam_room_id as "examRoomId", staff_id as "staffId"`,
      [examRoomId, staffId]
    );
    return res.rows[0] || { examRoomId, staffId, status: 'already_assigned' };
  }

  // ================= GRADE SCALES & GRADES =================
  async createGradeScale(institutionId: string, data: { name: string }): Promise<GradeScaleData> {
    const res = await db.query(
      `INSERT INTO grade_scales (institution_id, name)
       VALUES ($1, $2)
       ON CONFLICT (institution_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, institution_id as "institutionId", name, created_at::text as "createdAt"`,
      [institutionId, data.name]
    );
    return res.rows[0];
  }

  async listGradeScales(institutionId: string): Promise<GradeScaleData[]> {
    const scalesRes = await db.query(
      `SELECT id, institution_id as "institutionId", name, created_at::text as "createdAt"
       FROM grade_scales
       WHERE institution_id = $1
       ORDER BY name ASC`,
      [institutionId]
    );

    const result: GradeScaleData[] = [];
    for (const scale of scalesRes.rows) {
      const tiersRes = await db.query(
        `SELECT id, grade_scale_id as "gradeScaleId", label, min_percentage::float as "minPercentage",
                max_percentage::float as "maxPercentage", grade_point::float as "gradePoint"
         FROM grades
         WHERE grade_scale_id = $1
         ORDER BY min_percentage DESC`,
        [scale.id]
      );
      result.push({
        ...scale,
        tiers: tiersRes.rows,
      });
    }
    return result;
  }

  async addGradeTier(
    institutionId: string,
    gradeScaleId: string,
    data: { label: string; minPercentage: number; maxPercentage: number; gradePoint?: number | null }
  ): Promise<GradeTierData> {
    // Verify scale belongs to institution
    const scaleRes = await db.query(
      'SELECT id FROM grade_scales WHERE id = $1 AND institution_id = $2',
      [gradeScaleId, institutionId]
    );
    if (scaleRes.rows.length === 0) throw new Error('Grade scale not found');

    const res = await db.query(
      `INSERT INTO grades (grade_scale_id, label, min_percentage, max_percentage, grade_point)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (grade_scale_id, label) DO UPDATE 
         SET min_percentage = EXCLUDED.min_percentage,
             max_percentage = EXCLUDED.max_percentage,
             grade_point = EXCLUDED.grade_point
       RETURNING id, grade_scale_id as "gradeScaleId", label,
                 min_percentage::float as "minPercentage", max_percentage::float as "maxPercentage",
                 grade_point::float as "gradePoint"`,
      [gradeScaleId, data.label, data.minPercentage, data.maxPercentage, data.gradePoint || null]
    );
    return res.rows[0];
  }

  async resolveGrade(
    institutionId: string,
    percentage: number,
    gradeScaleId?: string | null
  ): Promise<{ label: string; gradePoint: number | null; gradeId: string } | null> {
    let scaleId = gradeScaleId;
    if (!scaleId) {
      // Find the first available grade scale for the institution
      const firstScale = await db.query(
        'SELECT id FROM grade_scales WHERE institution_id = $1 ORDER BY created_at ASC LIMIT 1',
        [institutionId]
      );
      if (firstScale.rows.length > 0) {
        scaleId = firstScale.rows[0].id;
      } else {
        return null;
      }
    }

    const res = await db.query(
      `SELECT id, label, grade_point::float as "gradePoint"
       FROM grades
       WHERE grade_scale_id = $1 
         AND $2 >= min_percentage 
         AND $2 <= max_percentage
       ORDER BY min_percentage DESC
       LIMIT 1`,
      [scaleId, percentage]
    );

    if (res.rows.length === 0) return null;
    return {
      gradeId: res.rows[0].id,
      label: res.rows[0].label,
      gradePoint: res.rows[0].gradePoint !== null ? parseFloat(res.rows[0].gradePoint) : null,
    };
  }

  // ================= MARKS ENTRY & BATCH UPSERT =================
  async upsertMarksBatch(
    institutionId: string,
    examSubjectId: string,
    records: Array<{ studentId: string; marksObtained: number; isAbsent?: boolean; remarks?: string | null }>,
    enteredBy?: string | null
  ): Promise<MarkData[]> {
    const es = await this.getExamSubjectById(institutionId, examSubjectId);
    if (!es) throw new Error('Exam subject not found');

    return await db.transaction(async (client) => {
      const results: MarkData[] = [];

      for (const rec of records) {
        const isAbsent = !!rec.isAbsent;
        const marksObtained = isAbsent ? 0 : Number(rec.marksObtained);

        // Validate bounds
        if (!isAbsent && (marksObtained < 0 || marksObtained > es.maxMarks)) {
          throw new Error(`Marks ${marksObtained} out of bounds (0 - ${es.maxMarks})`);
        }

        // Calculate percentage for this subject
        const subjectPct = es.maxMarks > 0 ? (marksObtained / es.maxMarks) * 100 : 0;
        const gradeInfo = await this.resolveGrade(institutionId, subjectPct);

        const upsertRes = await client.query(
          `INSERT INTO marks (
             institution_id, exam_subject_id, student_id, marks_obtained,
             grade_id, is_absent, remarks, entered_by, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
           ON CONFLICT (exam_subject_id, student_id) DO UPDATE SET
             marks_obtained = EXCLUDED.marks_obtained,
             grade_id = EXCLUDED.grade_id,
             is_absent = EXCLUDED.is_absent,
             remarks = EXCLUDED.remarks,
             entered_by = COALESCE(EXCLUDED.entered_by, marks.entered_by),
             updated_at = now()
           RETURNING 
             id, institution_id as "institutionId", exam_subject_id as "examSubjectId",
             student_id as "studentId", marks_obtained::float as "marksObtained",
             grade_id as "gradeId", is_absent as "isAbsent", remarks,
             entered_by as "enteredBy", verified_by as "verifiedBy",
             verified_at::text as "verifiedAt", created_at::text as "createdAt",
             updated_at::text as "updatedAt"`,
          [
            institutionId,
            examSubjectId,
            rec.studentId,
            marksObtained,
            gradeInfo ? gradeInfo.gradeId : null,
            isAbsent,
            rec.remarks || null,
            enteredBy || null,
          ]
        );

        results.push(upsertRes.rows[0]);
      }

      return results;
    });
  }

  async listMarks(
    institutionId: string,
    filters: { examSubjectId?: string; examId?: string; studentId?: string; classId?: string }
  ): Promise<MarkData[]> {
    let query = `
      SELECT 
        m.id,
        m.institution_id as "institutionId",
        m.exam_subject_id as "examSubjectId",
        m.student_id as "studentId",
        m.marks_obtained::float as "marksObtained",
        m.grade_id as "gradeId",
        m.is_absent as "isAbsent",
        m.remarks,
        m.entered_by as "enteredBy",
        m.verified_by as "verifiedBy",
        m.verified_at::text as "verifiedAt",
        m.created_at::text as "createdAt",
        m.updated_at::text as "updatedAt",
        s.admission_number as "admissionNumber",
        (s.first_name || ' ' || s.last_name) as "studentName",
        sub.name as "subjectName",
        es.max_marks::float as "maxMarks",
        es.pass_marks::float as "passMarks",
        g.label as "gradeLabel",
        g.grade_point::float as "gradePoint"
      FROM marks m
      JOIN students s ON s.id = m.student_id
      JOIN exam_subjects es ON es.id = m.exam_subject_id
      JOIN subjects sub ON sub.id = es.subject_id
      JOIN exams e ON e.id = es.exam_id
      LEFT JOIN grades g ON g.id = m.grade_id
      WHERE m.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters.examSubjectId) {
      params.push(filters.examSubjectId);
      query += ` AND m.exam_subject_id = $${params.length}`;
    }
    if (filters.examId) {
      params.push(filters.examId);
      query += ` AND es.exam_id = $${params.length}`;
    }
    if (filters.studentId) {
      params.push(filters.studentId);
      query += ` AND m.student_id = $${params.length}`;
    }
    if (filters.classId) {
      params.push(filters.classId);
      query += ` AND e.class_id = $${params.length}`;
    }

    query += ' ORDER BY s.admission_number ASC, sub.name ASC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async verifyMarks(institutionId: string, examSubjectId: string, verifiedBy: string): Promise<number> {
    const res = await db.query(
      `UPDATE marks
       SET verified_by = $1, verified_at = now(), updated_at = now()
       WHERE institution_id = $2 AND exam_subject_id = $3
       RETURNING id`,
      [verifiedBy, institutionId, examSubjectId]
    );
    return res.rows.length;
  }

  // ================= EXCEL IMPORT ENGINE (EXIT GATE PRE-COMMIT VALIDATION) =================
  async validateImportBatch(
    institutionId: string,
    examSubjectId: string,
    rows: Array<{ admissionNumber: string; marks: any; isAbsent?: boolean }>
  ) {
    const es = await this.getExamSubjectById(institutionId, examSubjectId);
    if (!es) throw new Error('Exam subject not found');

    const validationResults: Array<{
      admissionNumber: string;
      studentName?: string;
      studentId?: string;
      marks?: number;
      isAbsent?: boolean;
      status: 'VALID' | 'ERROR';
      message?: string;
    }> = [];

    let validCount = 0;
    let errorCount = 0;
    const seenAdmissionNumbers = new Set<string>();

    for (const row of rows) {
      const admNo = String(row.admissionNumber || '').trim();

      // Check duplicate in sheet
      if (seenAdmissionNumbers.has(admNo)) {
        validationResults.push({
          admissionNumber: admNo,
          marks: row.marks,
          status: 'ERROR',
          message: `Duplicate student entry in import sheet for admission number '${admNo}'`,
        });
        errorCount++;
        continue;
      }
      seenAdmissionNumbers.add(admNo);

      // Student Lookup: must exist and be enrolled in this exam's class
      const studentRes = await db.query(
        `SELECT s.id, s.admission_number, (s.first_name || ' ' || s.last_name) as name
         FROM students s
         JOIN sections sec ON sec.id = s.current_section_id
         JOIN exams e ON e.class_id = sec.class_id
         WHERE s.admission_number = $1 
           AND s.institution_id = $2
           AND e.id = (SELECT exam_id FROM exam_subjects WHERE id = $3)`,
        [admNo, institutionId, examSubjectId]
      );

      if (studentRes.rows.length === 0) {
        validationResults.push({
          admissionNumber: admNo,
          marks: row.marks,
          status: 'ERROR',
          message: `Student '${admNo}' not found in class roster for this examination`,
        });
        errorCount++;
        continue;
      }

      const student = studentRes.rows[0];
      const isAbsent = !!row.isAbsent;

      if (isAbsent) {
        validationResults.push({
          admissionNumber: admNo,
          studentName: student.name,
          studentId: student.id,
          marks: 0,
          isAbsent: true,
          status: 'VALID',
        });
        validCount++;
        continue;
      }

      // Numeric & Bounds Check
      const numMarks = Number(row.marks);
      if (isNaN(numMarks) || numMarks < 0 || numMarks > es.maxMarks) {
        validationResults.push({
          admissionNumber: admNo,
          studentName: student.name,
          studentId: student.id,
          marks: row.marks,
          status: 'ERROR',
          message: `Marks ${row.marks} outside valid bounds (0 - ${es.maxMarks})`,
        });
        errorCount++;
      } else {
        validationResults.push({
          admissionNumber: admNo,
          studentName: student.name,
          studentId: student.id,
          marks: numMarks,
          isAbsent: false,
          status: 'VALID',
        });
        validCount++;
      }
    }

    return {
      summary: {
        total: rows.length,
        valid: validCount,
        errors: errorCount,
        canCommit: errorCount === 0 && validCount > 0,
      },
      preview: validationResults,
    };
  }

  async commitImportBatch(
    institutionId: string,
    examSubjectId: string,
    rows: Array<{ admissionNumber: string; marks: any; isAbsent?: boolean }>,
    committedBy?: string | null
  ) {
    const validation = await this.validateImportBatch(institutionId, examSubjectId, rows);
    if (!validation.summary.canCommit) {
      throw new Error(
        `CANNOT_COMMIT_INVALID_DATA: Excel import contains ${validation.summary.errors} errors. Invalid data is never committed.`
      );
    }

    const recordsToUpsert = validation.preview
      .filter((p) => p.status === 'VALID' && p.studentId)
      .map((p) => ({
        studentId: p.studentId!,
        marksObtained: p.marks || 0,
        isAbsent: !!p.isAbsent,
      }));

    return await this.upsertMarksBatch(institutionId, examSubjectId, recordsToUpsert, committedBy);
  }

  // ================= REPORT CARDS & RESULTS SUMMARY ENGINE =================
  async calculateExamResults(institutionId: string, examId: string): Promise<ReportCardData[]> {
    const exam = await this.getExamById(institutionId, examId);
    if (!exam) throw new Error('Exam not found in this institution');

    const examSubjects = await this.listExamSubjects(institutionId, examId);
    if (examSubjects.length === 0) throw new Error('No subjects defined for this exam');

    const totalExamMaxMarks = examSubjects.reduce((acc, s) => acc + Number(s.maxMarks), 0);

    // Get all students enrolled in this exam's class
    const studentsRes = await db.query(
      `SELECT s.id, s.admission_number, (s.first_name || ' ' || s.last_name) as name
       FROM students s
       JOIN sections sec ON sec.id = s.current_section_id
       WHERE sec.class_id = $1 AND s.institution_id = $2
       ORDER BY s.admission_number ASC`,
      [exam.classId, institutionId]
    );

    const calculatedReports: Array<{
      studentId: string;
      studentName: string;
      admissionNumber: string;
      totalMarksObtained: number;
      totalMaxMarks: number;
      percentage: number;
      gpa: number | null;
      grade: string | null;
      resultStatus: 'passed' | 'failed';
    }> = [];

    for (const student of studentsRes.rows) {
      // Fetch marks for this student across all subjects in this exam
      const studentMarks = await db.query(
        `SELECT es.id as "examSubjectId", es.pass_marks::float as "passMarks", es.max_marks::float as "maxMarks",
                COALESCE(m.marks_obtained, 0)::float as "marksObtained",
                COALESCE(m.is_absent, false) as "isAbsent"
         FROM exam_subjects es
         LEFT JOIN marks m ON m.exam_subject_id = es.id AND m.student_id = $1
         WHERE es.exam_id = $2`,
        [student.id, examId]
      );

      let totalObtained = 0;
      let hasFailedSubject = false;

      for (const sm of studentMarks.rows) {
        const obtained = Number(sm.marksObtained);
        const passMarks = Number(sm.passMarks);
        const isAbsent = Boolean(sm.isAbsent);

        totalObtained += obtained;
        if (isAbsent || obtained < passMarks) {
          hasFailedSubject = true;
        }
      }

      const percentage = totalExamMaxMarks > 0 ? Math.round((totalObtained / totalExamMaxMarks) * 10000) / 100 : 0;
      const gradeInfo = await this.resolveGrade(institutionId, percentage);

      calculatedReports.push({
        studentId: student.id,
        studentName: student.name,
        admissionNumber: student.admission_number,
        totalMarksObtained: totalObtained,
        totalMaxMarks: totalExamMaxMarks,
        percentage,
        gpa: gradeInfo?.gradePoint !== undefined ? gradeInfo.gradePoint : null,
        grade: gradeInfo?.label || null,
        resultStatus: hasFailedSubject ? 'failed' : 'passed',
      });
    }

    // Sort by percentage descending to assign class ranks
    calculatedReports.sort((a, b) => b.percentage - a.percentage);

    return await db.transaction(async (client) => {
      const results: ReportCardData[] = [];

      for (let i = 0; i < calculatedReports.length; i++) {
        const r = calculatedReports[i];
        const rank = i + 1;

        const upsertRes = await client.query(
          `INSERT INTO report_cards (
             institution_id, exam_id, student_id, total_marks_obtained,
             total_max_marks, percentage, gpa, grade, rank, result_status,
             generated_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
           ON CONFLICT (exam_id, student_id) DO UPDATE SET
             total_marks_obtained = EXCLUDED.total_marks_obtained,
             total_max_marks = EXCLUDED.total_max_marks,
             percentage = EXCLUDED.percentage,
             gpa = EXCLUDED.gpa,
             grade = EXCLUDED.grade,
             rank = EXCLUDED.rank,
             result_status = EXCLUDED.result_status,
             generated_at = now(),
             updated_at = now()
           RETURNING 
             id, institution_id as "institutionId", exam_id as "examId",
             student_id as "studentId", total_marks_obtained::float as "totalMarksObtained",
             total_max_marks::float as "totalMaxMarks", percentage::float as percentage,
             gpa::float as gpa, grade, rank,
             result_status as "resultStatus", generated_at::text as "generatedAt",
             published_at::text as "publishedAt", created_at::text as "createdAt"`,
          [
            institutionId,
            examId,
            r.studentId,
            r.totalMarksObtained,
            r.totalMaxMarks,
            r.percentage,
            r.gpa,
            r.grade,
            rank,
            r.resultStatus,
          ]
        );

        results.push({
          ...upsertRes.rows[0],
          studentName: r.studentName,
          admissionNumber: r.admissionNumber,
          examName: exam.name,
          className: exam.className,
        });
      }

      return results;
    });
  }

  async getStudentReportCard(institutionId: string, examId: string, studentId: string): Promise<ReportCardData | null> {
    const res = await db.query(
      `SELECT 
         rc.id,
         rc.institution_id as "institutionId",
         rc.exam_id as "examId",
         rc.student_id as "studentId",
         rc.total_marks_obtained::float as "totalMarksObtained",
         rc.total_max_marks::float as "totalMaxMarks",
         rc.percentage::float as percentage,
         rc.gpa::float as gpa,
         rc.grade,
         rc.rank,
         rc.result_status as "resultStatus",
         rc.remarks,
         rc.generated_at::text as "generatedAt",
         rc.published_at::text as "publishedAt",
         rc.created_at::text as "createdAt",
         s.admission_number as "admissionNumber",
         (s.first_name || ' ' || s.last_name) as "studentName",
         e.name as "examName",
         c.name as "className"
       FROM report_cards rc
       JOIN students s ON s.id = rc.student_id
       JOIN exams e ON e.id = rc.exam_id
       JOIN classes c ON c.id = e.class_id
       WHERE rc.institution_id = $1 AND rc.exam_id = $2 AND rc.student_id = $3`,
      [institutionId, examId, studentId]
    );

    if (res.rows.length === 0) return null;
    const card = res.rows[0];

    // Fetch individual subject marks
    const marksRes = await db.query(
      `SELECT 
         sub.name as "subjectName",
         COALESCE(m.marks_obtained, 0)::float as "marksObtained",
         es.max_marks::float as "maxMarks",
         es.pass_marks::float as "passMarks",
         g.label as grade,
         COALESCE(m.is_absent, false) as "isAbsent"
       FROM exam_subjects es
       JOIN subjects sub ON sub.id = es.subject_id
       LEFT JOIN marks m ON m.exam_subject_id = es.id AND m.student_id = $1
       LEFT JOIN grades g ON g.id = m.grade_id
       WHERE es.exam_id = $2
       ORDER BY sub.name ASC`,
      [studentId, examId]
    );

    return {
      ...card,
      subjectMarks: marksRes.rows,
    };
  }

  async listStudentReportCards(institutionId: string, studentId: string): Promise<ReportCardData[]> {
    const res = await db.query(
      `SELECT 
         rc.id,
         rc.institution_id as "institutionId",
         rc.exam_id as "examId",
         rc.student_id as "studentId",
         rc.total_marks_obtained::float as "totalMarksObtained",
         rc.total_max_marks::float as "totalMaxMarks",
         rc.percentage::float as percentage,
         rc.gpa::float as gpa,
         rc.grade,
         rc.rank,
         rc.result_status as "resultStatus",
         rc.generated_at::text as "generatedAt",
         rc.published_at::text as "publishedAt",
         rc.created_at::text as "createdAt",
         e.name as "examName",
         c.name as "className"
       FROM report_cards rc
       JOIN exams e ON e.id = rc.exam_id
       JOIN classes c ON c.id = e.class_id
       WHERE rc.institution_id = $1 AND rc.student_id = $2
       ORDER BY rc.generated_at DESC`,
      [institutionId, studentId]
    );
    return res.rows;
  }

  // ================= SCOPED ACCESS VERIFICATIONS =================
  async verifyFacultySubjectAllocation(
    institutionId: string,
    facultyProfileId: string,
    examSubjectId: string
  ): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM faculty_assignments fa
       JOIN staff s ON s.id = fa.staff_id
       JOIN exam_subjects es ON es.subject_id = fa.subject_id
       JOIN exams e ON e.id = es.exam_id
       JOIN sections sec ON sec.id = fa.section_id
       WHERE s.profile_id = $1 
         AND s.institution_id = $2
         AND es.id = $3
         AND sec.class_id = e.class_id
       LIMIT 1`,
      [facultyProfileId, institutionId, examSubjectId]
    );
    return res.rows.length > 0;
  }

  async verifyParentChildLink(parentId: string, studentId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM student_parents sp
       JOIN parents p ON p.id = sp.parent_id
       WHERE p.profile_id = $1 AND sp.student_id = $2
       LIMIT 1`,
      [parentId, studentId]
    );
    return res.rows.length > 0;
  }
}

export const examinationsRepository = new ExaminationsRepository();
