import { db } from '../../config/database';

export class AcademicsRepository {
  // =========================================================================
  // ACADEMIC YEARS
  // =========================================================================

  async listAcademicYears(institutionId: string) {
    const res = await db.query(
      `SELECT ay.*,
              (SELECT count(*) FROM classes WHERE academic_year_id = ay.id) as classes_count,
              (SELECT count(DISTINCT s.id) 
               FROM students s 
               JOIN classes c ON c.id = s.current_class_id 
               WHERE c.academic_year_id = ay.id AND s.status = 'active') as students_count
       FROM academic_years ay
       WHERE ay.institution_id = $1 
       ORDER BY ay.start_date DESC`,
      [institutionId]
    );
    return res.rows;
  }

  async getAcademicYearById(institutionId: string, id: string) {
    const res = await db.query(
      `SELECT * FROM academic_years WHERE institution_id = $1 AND id = $2`,
      [institutionId, id]
    );
    return res.rows[0] || null;
  }

  async createAcademicYear(institutionId: string, data: { 
    name: string; 
    startDate: string; 
    endDate: string; 
    isCurrent?: boolean;
    status?: 'planning' | 'active' | 'closed';
  }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      if (data.isCurrent) {
        await client.query(
          `UPDATE academic_years SET is_current = false WHERE institution_id = $1`,
          [institutionId]
        );
      }

      const res = await client.query(
        `INSERT INTO academic_years (institution_id, name, start_date, end_date, is_current, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (institution_id, name) DO UPDATE 
         SET start_date = EXCLUDED.start_date, 
             end_date = EXCLUDED.end_date, 
             is_current = EXCLUDED.is_current,
             status = EXCLUDED.status
         RETURNING *`,
        [institutionId, data.name, data.startDate, data.endDate, data.isCurrent ?? false, data.status || 'active']
      );

      // Initialize default academic calendar configuration (Mon-Fri)
      await client.query(
        `INSERT INTO academic_calendar_configs (institution_id, academic_year_id, working_days_of_week)
         VALUES ($1, $2, '{1,2,3,4,5}')
         ON CONFLICT (institution_id, academic_year_id) DO NOTHING`,
        [institutionId, res.rows[0].id]
      );

      await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateAcademicYear(institutionId: string, id: string, data: {
    name?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    status?: 'planning' | 'active' | 'closed';
  }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      if (data.isCurrent) {
        await client.query(
          `UPDATE academic_years SET is_current = false WHERE institution_id = $1 AND id != $2`,
          [institutionId, id]
        );
      }

      const fields: string[] = [];
      const values: any[] = [institutionId, id];
      let idx = 3;

      if (data.name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(data.name);
      }
      if (data.startDate !== undefined) {
        fields.push(`start_date = $${idx++}`);
        values.push(data.startDate);
      }
      if (data.endDate !== undefined) {
        fields.push(`end_date = $${idx++}`);
        values.push(data.endDate);
      }
      if (data.isCurrent !== undefined) {
        fields.push(`is_current = $${idx++}`);
        values.push(data.isCurrent);
      }
      if (data.status !== undefined) {
        fields.push(`status = $${idx++}`);
        values.push(data.status);
      }

      if (fields.length === 0) {
        await client.query('ROLLBACK');
        return this.getAcademicYearById(institutionId, id);
      }

      const res = await client.query(
        `UPDATE academic_years 
         SET ${fields.join(', ')} 
         WHERE institution_id = $1 AND id = $2 
         RETURNING *`,
        values
      );

      await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async setCurrentAcademicYear(institutionId: string, id: string) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE academic_years SET is_current = false WHERE institution_id = $1`,
        [institutionId]
      );
      const res = await client.query(
        `UPDATE academic_years SET is_current = true WHERE institution_id = $1 AND id = $2 RETURNING *`,
        [institutionId, id]
      );
      if (res.rows.length === 0) {
        throw new Error('Academic year not found');
      }
      await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async closeAcademicYear(institutionId: string, id: string) {
    const res = await db.query(
      `UPDATE academic_years 
       SET status = 'closed', is_current = false 
       WHERE institution_id = $1 AND id = $2 
       RETURNING *`,
      [institutionId, id]
    );
    if (res.rows.length === 0) {
      throw new Error('Academic year not found');
    }
    return res.rows[0];
  }

  async cloneAcademicYear(institutionId: string, sourceYearId: string, data: {
    name: string;
    startDate: string;
    endDate: string;
    cloneClasses?: boolean;
    cloneSubjects?: boolean;
    cloneTextbooks?: boolean;
  }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Create target year
      const newYearRes = await client.query(
        `INSERT INTO academic_years (institution_id, name, start_date, end_date, is_current, status)
         VALUES ($1, $2, $3, $4, false, 'planning')
         RETURNING *`,
        [institutionId, data.name, data.startDate, data.endDate]
      );
      const newYear = newYearRes.rows[0];

      // Clone calendar config if available
      const sourceConfig = await client.query(
        `SELECT working_days_of_week FROM academic_calendar_configs WHERE institution_id = $1 AND academic_year_id = $2`,
        [institutionId, sourceYearId]
      );
      const days = sourceConfig.rows[0]?.working_days_of_week || [1, 2, 3, 4, 5];
      await client.query(
        `INSERT INTO academic_calendar_configs (institution_id, academic_year_id, working_days_of_week)
         VALUES ($1, $2, $3)`,
        [institutionId, newYear.id, days]
      );

      let clonedClassesCount = 0;
      let clonedSectionsCount = 0;
      let clonedSubjectsCount = 0;
      let clonedTextbooksCount = 0;

      if (data.cloneClasses !== false) {
        // Fetch source classes
        const sourceClasses = await client.query(
          `SELECT * FROM classes WHERE institution_id = $1 AND academic_year_id = $2 ORDER BY sequence_order ASC`,
          [institutionId, sourceYearId]
        );

        for (const cls of sourceClasses.rows) {
          // Insert new class
          const newClassRes = await client.query(
            `INSERT INTO classes (institution_id, academic_year_id, department_id, course_id, name, sequence_order)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [institutionId, newYear.id, cls.department_id, cls.course_id, cls.name, cls.sequence_order]
          );
          const newCls = newClassRes.rows[0];
          clonedClassesCount++;

          // Clone sections under this class
          const sourceSections = await client.query(
            `SELECT * FROM sections WHERE class_id = $1 ORDER BY name ASC`,
            [cls.id]
          );
          for (const sec of sourceSections.rows) {
            await client.query(
              `INSERT INTO sections (institution_id, class_id, name, capacity)
               VALUES ($1, $2, $3, $4)`,
              [institutionId, newCls.id, sec.name, sec.capacity || 40]
            );
            clonedSectionsCount++;
          }

          // Clone grade subjects if requested
          if (data.cloneSubjects !== false) {
            const sourceSubjects = await client.query(
              `SELECT * FROM grade_subjects WHERE class_id = $1`,
              [cls.id]
            );
            for (const gs of sourceSubjects.rows) {
              await client.query(
                `INSERT INTO grade_subjects (institution_id, class_id, subject_id, periods_per_week, max_marks, pass_marks, is_mandatory)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (class_id, subject_id) DO NOTHING`,
                [institutionId, newCls.id, gs.subject_id, gs.periods_per_week, gs.max_marks, gs.pass_marks, gs.is_mandatory]
              );
              // Also sync with class_subjects
              await client.query(
                `INSERT INTO class_subjects (class_id, subject_id, is_mandatory)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (class_id, subject_id) DO NOTHING`,
                [newCls.id, gs.subject_id, gs.is_mandatory]
              );
              clonedSubjectsCount++;
            }
          }

          // Clone preferred textbooks if requested
          if (data.cloneTextbooks !== false) {
            const sourceBooks = await client.query(
              `SELECT * FROM preferred_textbooks WHERE class_id = $1 AND academic_year_id = $2`,
              [cls.id, sourceYearId]
            );
            for (const book of sourceBooks.rows) {
              await client.query(
                `INSERT INTO preferred_textbooks (
                  institution_id, academic_year_id, class_id, subject_id, title, author, publisher, edition, isbn, price, is_mandatory, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                  institutionId,
                  newYear.id,
                  newCls.id,
                  book.subject_id,
                  book.title,
                  book.author,
                  book.publisher,
                  book.edition,
                  book.isbn,
                  book.price,
                  book.is_mandatory,
                  book.notes,
                ]
              );
              clonedTextbooksCount++;
            }
          }
        }
      }

      await client.query('COMMIT');
      return {
        newAcademicYear: newYear,
        clonedClassesCount,
        clonedSectionsCount,
        clonedSubjectsCount,
        clonedTextbooksCount,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // =========================================================================
  // HIERARCHY, CLASSES & SECTIONS
  // =========================================================================

  async getClassesByInstitution(institutionId: string, academicYearId?: string) {
    let query = `
      SELECT c.id, c.name, c.sequence_order, c.academic_year_id, c.department_id,
             ay.name as academic_year, d.name as department_name,
             (SELECT count(*) FROM sections WHERE class_id = c.id) as sections_count,
             (SELECT count(*) FROM students WHERE current_class_id = c.id AND status = 'active') as enrolled_count,
             (SELECT COALESCE(sum(capacity), 0) FROM sections WHERE class_id = c.id) as total_capacity
      FROM classes c
      JOIN academic_years ay ON ay.id = c.academic_year_id
      LEFT JOIN departments d ON d.id = c.department_id
      WHERE c.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (academicYearId) {
      query += ` AND c.academic_year_id = $2`;
      params.push(academicYearId);
    }

    query += ` ORDER BY c.sequence_order ASC, c.name ASC`;
    const res = await db.query(query, params);
    return res.rows;
  }

  async getSectionsByClass(classId: string) {
    const res = await db.query(
      `SELECT s.id, s.name, s.capacity, s.class_teacher_staff_id,
              COALESCE(p.full_name, 'Unassigned') as "classTeacher",
              (SELECT count(*) FROM students WHERE current_section_id = s.id AND status = 'active') as enrolled
       FROM sections s
       LEFT JOIN staff st ON st.id = s.class_teacher_staff_id
       LEFT JOIN profiles p ON p.id = st.profile_id
       WHERE s.class_id = $1
       ORDER BY s.name ASC`,
      [classId]
    );
    return res.rows;
  }

  async getSubjectsByClass(classId: string) {
    const res = await db.query(
      `SELECT sub.id, sub.name, sub.code, sub.is_elective, sub.credits,
              COALESCE(gs.periods_per_week, 5) as periods_per_week,
              COALESCE(gs.max_marks, 100) as max_marks,
              COALESCE(gs.pass_marks, 35) as pass_marks,
              COALESCE(gs.is_mandatory, cs.is_mandatory, true) as is_mandatory
       FROM class_subjects cs
       JOIN subjects sub ON sub.id = cs.subject_id
       LEFT JOIN grade_subjects gs ON gs.class_id = cs.class_id AND gs.subject_id = cs.subject_id
       WHERE cs.class_id = $1
       ORDER BY sub.name ASC`,
      [classId]
    );
    return res.rows;
  }

  async getHierarchy(institutionId: string) {
    const [years, depts, classes, subjects] = await Promise.all([
      db.query('SELECT * FROM academic_years WHERE institution_id = $1 ORDER BY start_date DESC', [institutionId]),
      db.query('SELECT * FROM departments WHERE institution_id = $1 ORDER BY name ASC', [institutionId]),
      db.query('SELECT * FROM classes WHERE institution_id = $1 ORDER BY sequence_order ASC', [institutionId]),
      db.query('SELECT * FROM subjects WHERE institution_id = $1 ORDER BY name ASC', [institutionId]),
    ]);

    return {
      academicYears: years.rows,
      departments: depts.rows,
      classes: classes.rows,
      subjects: subjects.rows,
    };
  }

  async createClass(institutionId: string, data: { 
    name: string; 
    academicYearId: string; 
    departmentId: string; 
    sequenceOrder?: number;
  }) {
    const res = await db.query(
      `INSERT INTO classes (institution_id, name, academic_year_id, department_id, sequence_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (institution_id, academic_year_id, department_id, name) 
       DO UPDATE SET sequence_order = EXCLUDED.sequence_order
       RETURNING *`,
      [institutionId, data.name, data.academicYearId, data.departmentId, data.sequenceOrder || 1]
    );
    return res.rows[0];
  }

  async updateClass(institutionId: string, id: string, data: {
    name?: string;
    departmentId?: string;
    sequenceOrder?: number;
  }) {
    const fields: string[] = [];
    const values: any[] = [institutionId, id];
    let idx = 3;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.departmentId !== undefined) {
      fields.push(`department_id = $${idx++}`);
      values.push(data.departmentId);
    }
    if (data.sequenceOrder !== undefined) {
      fields.push(`sequence_order = $${idx++}`);
      values.push(data.sequenceOrder);
    }

    if (fields.length === 0) {
      const existing = await db.query('SELECT * FROM classes WHERE institution_id = $1 AND id = $2', [institutionId, id]);
      return existing.rows[0];
    }

    const res = await db.query(
      `UPDATE classes SET ${fields.join(', ')} WHERE institution_id = $1 AND id = $2 RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async isClassInUse(institutionId: string, classId: string): Promise<boolean> {
    const [students, sections] = await Promise.all([
      db.query(`SELECT 1 FROM students WHERE current_class_id = $1 AND institution_id = $2 LIMIT 1`, [classId, institutionId]),
      db.query(`SELECT 1 FROM sections WHERE class_id = $1 AND institution_id = $2 LIMIT 1`, [classId, institutionId]),
    ]);
    return students.rows.length > 0 || sections.rows.length > 0;
  }

  async deleteClass(institutionId: string, classId: string) {
    const inUse = await this.isClassInUse(institutionId, classId);
    if (inUse) {
      const err: any = new Error('Cannot delete class: active sections or students are associated with this class.');
      err.statusCode = 409;
      err.code = 'CLASS_IN_USE';
      throw err;
    }
    await db.query(`DELETE FROM grade_subjects WHERE class_id = $1 AND institution_id = $2`, [classId, institutionId]);
    await db.query(`DELETE FROM class_subjects WHERE class_id = $1`, [classId]);
    const res = await db.query(`DELETE FROM classes WHERE id = $1 AND institution_id = $2 RETURNING *`, [classId, institutionId]);
    return res.rows[0];
  }

  async generateClassMatrix(institutionId: string, data: {
    academicYearId: string;
    departmentId: string;
    gradeNames: string[];
    sectionNames: string[];
    defaultCapacity?: number;
  }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const capacity = data.defaultCapacity || 40;
      const createdClasses: any[] = [];
      let totalSectionsCreated = 0;

      for (let i = 0; i < data.gradeNames.length; i++) {
        const gradeName = data.gradeNames[i].trim();
        const seqOrder = i + 1;

        const classRes = await client.query(
          `INSERT INTO classes (institution_id, academic_year_id, department_id, name, sequence_order)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (institution_id, academic_year_id, department_id, name)
           DO UPDATE SET sequence_order = EXCLUDED.sequence_order
           RETURNING *`,
          [institutionId, data.academicYearId, data.departmentId, gradeName, seqOrder]
        );
        const cls = classRes.rows[0];

        const sectionsForClass: any[] = [];
        for (const secName of data.sectionNames) {
          const secRes = await client.query(
            `INSERT INTO sections (institution_id, class_id, name, capacity)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (class_id, name)
             DO UPDATE SET capacity = EXCLUDED.capacity
             RETURNING *`,
            [institutionId, cls.id, secName.trim(), capacity]
          );
          sectionsForClass.push(secRes.rows[0]);
          totalSectionsCreated++;
        }

        createdClasses.push({
          ...cls,
          sections: sectionsForClass,
        });
      }

      await client.query('COMMIT');
      return {
        classes: createdClasses,
        totalClasses: createdClasses.length,
        totalSections: totalSectionsCreated,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async createSection(institutionId: string, classId: string, data: { 
    name: string; 
    capacity?: number; 
    classTeacherStaffId?: string;
  }) {
    const res = await db.query(
      `INSERT INTO sections (institution_id, class_id, name, capacity, class_teacher_staff_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (class_id, name) 
       DO UPDATE SET capacity = EXCLUDED.capacity, class_teacher_staff_id = EXCLUDED.class_teacher_staff_id
       RETURNING *`,
      [institutionId, classId, data.name, data.capacity || 40, data.classTeacherStaffId || null]
    );
    return res.rows[0];
  }

  async updateSection(institutionId: string, sectionId: string, data: {
    name?: string;
    capacity?: number;
    classTeacherStaffId?: string | null;
  }) {
    const fields: string[] = [];
    const values: any[] = [institutionId, sectionId];
    let idx = 3;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.capacity !== undefined) {
      fields.push(`capacity = $${idx++}`);
      values.push(data.capacity);
    }
    if (data.classTeacherStaffId !== undefined) {
      fields.push(`class_teacher_staff_id = $${idx++}`);
      values.push(data.classTeacherStaffId);
    }

    const res = await db.query(
      `UPDATE sections SET ${fields.join(', ')} WHERE institution_id = $1 AND id = $2 RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async isSectionInUse(institutionId: string, sectionId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM students WHERE current_section_id = $1 AND institution_id = $2 LIMIT 1`,
      [sectionId, institutionId]
    );
    return res.rows.length > 0;
  }

  async deleteSection(institutionId: string, sectionId: string) {
    const inUse = await this.isSectionInUse(institutionId, sectionId);
    if (inUse) {
      const err: any = new Error('Cannot delete section: active students are enrolled in this section.');
      err.statusCode = 409;
      err.code = 'SECTION_IN_USE';
      throw err;
    }
    const res = await db.query(
      `DELETE FROM sections WHERE id = $1 AND institution_id = $2 RETURNING *`,
      [sectionId, institutionId]
    );
    return res.rows[0];
  }

  // =========================================================================
  // SUBJECTS MASTER
  // =========================================================================

  async listSubjects(institutionId: string) {
    const res = await db.query(
      `SELECT s.*, d.name as department_name,
              (SELECT count(DISTINCT class_id) FROM grade_subjects WHERE subject_id = s.id) as classes_count
       FROM subjects s
       LEFT JOIN departments d ON d.id = s.department_id
       WHERE s.institution_id = $1 
       ORDER BY s.name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async createSubject(institutionId: string, data: { 
    name: string; 
    code: string; 
    isElective?: boolean;
    credits?: number;
    departmentId?: string;
  }) {
    const check = await db.query(
      `SELECT id FROM subjects WHERE institution_id = $1 AND LOWER(code) = LOWER($2)`,
      [institutionId, data.code]
    );
    if (check.rows.length > 0) {
      const err: any = new Error(`Subject with code "${data.code}" already exists in this institution.`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_SUBJECT_CODE';
      throw err;
    }

    const res = await db.query(
      `INSERT INTO subjects (institution_id, name, code, is_elective, credits, department_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [
        institutionId, 
        data.name, 
        data.code.toUpperCase().trim(), 
        data.isElective ?? false, 
        data.credits ?? 4.0, 
        data.departmentId || null
      ]
    );
    return res.rows[0];
  }

  async updateSubject(institutionId: string, id: string, data: {
    name?: string;
    code?: string;
    isElective?: boolean;
    credits?: number;
    departmentId?: string | null;
    isActive?: boolean;
  }) {
    if (data.code) {
      const check = await db.query(
        `SELECT id FROM subjects WHERE institution_id = $1 AND LOWER(code) = LOWER($2) AND id != $3`,
        [institutionId, data.code, id]
      );
      if (check.rows.length > 0) {
        const err: any = new Error(`Subject with code "${data.code}" already exists.`);
        err.statusCode = 409;
        err.code = 'DUPLICATE_SUBJECT_CODE';
        throw err;
      }
    }

    const fields: string[] = [];
    const values: any[] = [institutionId, id];
    let idx = 3;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.code !== undefined) {
      fields.push(`code = $${idx++}`);
      values.push(data.code.toUpperCase().trim());
    }
    if (data.isElective !== undefined) {
      fields.push(`is_elective = $${idx++}`);
      values.push(data.isElective);
    }
    if (data.credits !== undefined) {
      fields.push(`credits = $${idx++}`);
      values.push(data.credits);
    }
    if (data.departmentId !== undefined) {
      fields.push(`department_id = $${idx++}`);
      values.push(data.departmentId);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(data.isActive);
    }

    const res = await db.query(
      `UPDATE subjects SET ${fields.join(', ')} WHERE institution_id = $1 AND id = $2 RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async isSubjectInUse(institutionId: string, subjectId: string): Promise<boolean> {
    const [gs, fa] = await Promise.all([
      db.query(`SELECT 1 FROM grade_subjects WHERE subject_id = $1 AND institution_id = $2 LIMIT 1`, [subjectId, institutionId]),
      db.query(`SELECT 1 FROM faculty_assignments WHERE subject_id = $1 AND institution_id = $2 LIMIT 1`, [subjectId, institutionId]),
    ]);
    return gs.rows.length > 0 || fa.rows.length > 0;
  }

  async deleteSubject(institutionId: string, subjectId: string) {
    const inUse = await this.isSubjectInUse(institutionId, subjectId);
    if (inUse) {
      const err: any = new Error('Cannot delete subject: it is assigned to classes or faculty.');
      err.statusCode = 409;
      err.code = 'SUBJECT_IN_USE';
      throw err;
    }
    const res = await db.query(
      `DELETE FROM subjects WHERE id = $1 AND institution_id = $2 RETURNING *`,
      [subjectId, institutionId]
    );
    return res.rows[0];
  }

  // =========================================================================
  // GRADE -> SUBJECT MAPPING
  // =========================================================================

  async getGradeSubjects(institutionId: string, classId: string) {
    const res = await db.query(
      `SELECT gs.*, sub.name as subject_name, sub.code as subject_code, sub.is_elective, sub.credits
       FROM grade_subjects gs
       JOIN subjects sub ON sub.id = gs.subject_id
       WHERE gs.class_id = $1 AND gs.institution_id = $2
       ORDER BY sub.name ASC`,
      [classId, institutionId]
    );
    return res.rows;
  }

  async mapSubjectToGrade(institutionId: string, data: {
    classId: string;
    subjectId: string;
    periodsPerWeek?: number;
    maxMarks?: number;
    passMarks?: number;
    isMandatory?: boolean;
  }) {
    const periods = data.periodsPerWeek ?? 5;
    const maxMarks = data.maxMarks ?? 100;
    const passMarks = data.passMarks ?? 35;
    const isMandatory = data.isMandatory ?? true;

    // Insert or update grade_subjects
    const res = await db.query(
      `INSERT INTO grade_subjects (institution_id, class_id, subject_id, periods_per_week, max_marks, pass_marks, is_mandatory)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (class_id, subject_id)
       DO UPDATE SET periods_per_week = EXCLUDED.periods_per_week,
                     max_marks = EXCLUDED.max_marks,
                     pass_marks = EXCLUDED.pass_marks,
                     is_mandatory = EXCLUDED.is_mandatory
       RETURNING *`,
      [institutionId, data.classId, data.subjectId, periods, maxMarks, passMarks, isMandatory]
    );

    // Sync legacy class_subjects table
    await db.query(
      `INSERT INTO class_subjects (class_id, subject_id, is_mandatory)
       VALUES ($1, $2, $3)
       ON CONFLICT (class_id, subject_id)
       DO UPDATE SET is_mandatory = EXCLUDED.is_mandatory`,
      [data.classId, data.subjectId, isMandatory]
    );

    return res.rows[0];
  }

  async removeSubjectFromGrade(institutionId: string, classId: string, subjectId: string) {
    await db.query(
      `DELETE FROM grade_subjects WHERE class_id = $1 AND subject_id = $2 AND institution_id = $3`,
      [classId, subjectId, institutionId]
    );
    await db.query(
      `DELETE FROM class_subjects WHERE class_id = $1 AND subject_id = $2`,
      [classId, subjectId]
    );
    return { success: true };
  }

  async copySubjectMatrix(institutionId: string, sourceClassId: string, targetClassIds: string[]) {
    const sourceSubjects = await db.query(
      `SELECT * FROM grade_subjects WHERE class_id = $1 AND institution_id = $2`,
      [sourceClassId, institutionId]
    );

    if (sourceSubjects.rows.length === 0) {
      throw new Error('No subjects mapped in source class to copy.');
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      let totalCopied = 0;

      for (const targetId of targetClassIds) {
        for (const sub of sourceSubjects.rows) {
          await client.query(
            `INSERT INTO grade_subjects (institution_id, class_id, subject_id, periods_per_week, max_marks, pass_marks, is_mandatory)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (class_id, subject_id)
             DO UPDATE SET periods_per_week = EXCLUDED.periods_per_week,
                           max_marks = EXCLUDED.max_marks,
                           pass_marks = EXCLUDED.pass_marks,
                           is_mandatory = EXCLUDED.is_mandatory`,
            [institutionId, targetId, sub.subject_id, sub.periods_per_week, sub.max_marks, sub.pass_marks, sub.is_mandatory]
          );

          await client.query(
            `INSERT INTO class_subjects (class_id, subject_id, is_mandatory)
             VALUES ($1, $2, $3)
             ON CONFLICT (class_id, subject_id) DO UPDATE SET is_mandatory = EXCLUDED.is_mandatory`,
            [targetId, sub.subject_id, sub.is_mandatory]
          );
          totalCopied++;
        }
      }

      await client.query('COMMIT');
      return { totalCopied, targetClassesCount: targetClassIds.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // =========================================================================
  // EXAM ESTIMATED SCHEDULE (A2)
  // =========================================================================

  async listExamEstimates(institutionId: string, academicYearId: string, classId?: string) {
    let query = `
      SELECT ee.*, c.name as class_name, ay.name as academic_year_name
      FROM exam_estimates ee
      JOIN academic_years ay ON ay.id = ee.academic_year_id
      LEFT JOIN classes c ON c.id = ee.class_id
      WHERE ee.institution_id = $1 AND ee.academic_year_id = $2
    `;
    const params: any[] = [institutionId, academicYearId];

    if (classId) {
      query += ` AND (ee.class_id = $3 OR ee.class_id IS NULL)`;
      params.push(classId);
    }

    query += ` ORDER BY ee.start_date ASC, ee.term_name ASC`;
    const res = await db.query(query, params);
    return res.rows;
  }

  async createExamEstimate(institutionId: string, data: {
    academicYearId: string;
    classId?: string;
    termName: string;
    startDate: string;
    endDate: string;
    description?: string;
    status?: 'draft' | 'scheduled' | 'completed';
  }) {
    if (new Date(data.startDate) > new Date(data.endDate)) {
      const err: any = new Error('End date must be greater than or equal to start date.');
      err.statusCode = 400;
      throw err;
    }

    const res = await db.query(
      `INSERT INTO exam_estimates (institution_id, academic_year_id, class_id, term_name, start_date, end_date, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        institutionId,
        data.academicYearId,
        data.classId || null,
        data.termName,
        data.startDate,
        data.endDate,
        data.description || null,
        data.status || 'scheduled',
      ]
    );
    return res.rows[0];
  }

  async updateExamEstimate(institutionId: string, id: string, data: {
    termName?: string;
    startDate?: string;
    endDate?: string;
    classId?: string | null;
    description?: string;
    status?: 'draft' | 'scheduled' | 'completed';
  }) {
    const fields: string[] = [];
    const values: any[] = [institutionId, id];
    let idx = 3;

    if (data.termName !== undefined) {
      fields.push(`term_name = $${idx++}`);
      values.push(data.termName);
    }
    if (data.startDate !== undefined) {
      fields.push(`start_date = $${idx++}`);
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      fields.push(`end_date = $${idx++}`);
      values.push(data.endDate);
    }
    if (data.classId !== undefined) {
      fields.push(`class_id = $${idx++}`);
      values.push(data.classId);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    const res = await db.query(
      `UPDATE exam_estimates SET ${fields.join(', ')} WHERE institution_id = $1 AND id = $2 RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async deleteExamEstimate(institutionId: string, id: string) {
    const res = await db.query(
      `DELETE FROM exam_estimates WHERE id = $1 AND institution_id = $2 RETURNING *`,
      [id, institutionId]
    );
    return res.rows[0];
  }

  // =========================================================================
  // YEAR SCHEDULE & WORKING DAYS
  // =========================================================================

  async getCalendarConfig(institutionId: string, academicYearId: string) {
    const res = await db.query(
      `SELECT * FROM academic_calendar_configs WHERE institution_id = $1 AND academic_year_id = $2`,
      [institutionId, academicYearId]
    );
    return res.rows[0] || { working_days_of_week: [1, 2, 3, 4, 5] };
  }

  async saveCalendarConfig(institutionId: string, academicYearId: string, workingDaysOfWeek: number[]) {
    const res = await db.query(
      `INSERT INTO academic_calendar_configs (institution_id, academic_year_id, working_days_of_week)
       VALUES ($1, $2, $3)
       ON CONFLICT (institution_id, academic_year_id)
       DO UPDATE SET working_days_of_week = EXCLUDED.working_days_of_week
       RETURNING *`,
      [institutionId, academicYearId, workingDaysOfWeek]
    );
    return res.rows[0];
  }

  async listCalendarDays(institutionId: string, academicYearId: string) {
    const res = await db.query(
      `SELECT * FROM calendar_days WHERE institution_id = $1 AND academic_year_id = $2 ORDER BY date ASC`,
      [institutionId, academicYearId]
    );
    return res.rows;
  }

  async createCalendarDay(institutionId: string, data: {
    academicYearId: string;
    date: string;
    dayType: 'working' | 'holiday' | 'vacation' | 'event' | 'exam';
    description?: string;
    isWorkingDay?: boolean;
  }) {
    const isWorking = data.isWorkingDay ?? (data.dayType === 'working');
    const res = await db.query(
      `INSERT INTO calendar_days (institution_id, academic_year_id, date, day_type, description, is_working_day)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (institution_id, academic_year_id, date)
       DO UPDATE SET day_type = EXCLUDED.day_type,
                     description = EXCLUDED.description,
                     is_working_day = EXCLUDED.is_working_day
       RETURNING *`,
      [institutionId, data.academicYearId, data.date, data.dayType, data.description || null, isWorking]
    );
    return res.rows[0];
  }

  async deleteCalendarDay(institutionId: string, id: string) {
    const res = await db.query(
      `DELETE FROM calendar_days WHERE id = $1 AND institution_id = $2 RETURNING *`,
      [id, institutionId]
    );
    return res.rows[0];
  }

  async isWorkingDay(institutionId: string, academicYearId: string, dateStr: string): Promise<{
    date: string;
    isWorkingDay: boolean;
    dayType: string;
    reason: string;
  }> {
    // 1. Check explicit calendar day override
    const override = await db.query(
      `SELECT * FROM calendar_days WHERE institution_id = $1 AND academic_year_id = $2 AND date = $3`,
      [institutionId, academicYearId, dateStr]
    );

    if (override.rows.length > 0) {
      const row = override.rows[0];
      return {
        date: dateStr,
        isWorkingDay: row.is_working_day,
        dayType: row.day_type,
        reason: row.description || `Special ${row.day_type}`,
      };
    }

    // 2. Fallback to weekly configuration
    const config = await this.getCalendarConfig(institutionId, academicYearId);
    const workingDays: number[] = config.working_days_of_week || [1, 2, 3, 4, 5];

    // ISO Day: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
    const dateObj = new Date(dateStr + 'T00:00:00Z');
    let day = dateObj.getUTCDay();
    if (day === 0) day = 7;

    const isWorking = workingDays.includes(day);
    return {
      date: dateStr,
      isWorkingDay: isWorking,
      dayType: isWorking ? 'working' : 'holiday',
      reason: isWorking ? 'Regular Working Day' : 'Weekend',
    };
  }

  async getWorkingDaysCount(institutionId: string, academicYearId: string, startDate?: string, endDate?: string) {
    // Determine bounds
    let sDate = startDate;
    let eDate = endDate;

    if (!sDate || !eDate) {
      const year = await this.getAcademicYearById(institutionId, academicYearId);
      if (!year) {
        throw new Error('Academic year not found');
      }
      sDate = sDate || new Date(year.start_date).toISOString().split('T')[0];
      eDate = eDate || new Date(year.end_date).toISOString().split('T')[0];
    }

    const config = await this.getCalendarConfig(institutionId, academicYearId);
    const workingDaysOfWeek: number[] = config.working_days_of_week || [1, 2, 3, 4, 5];

    const overrides = await db.query(
      `SELECT date::text, day_type, is_working_day FROM calendar_days 
       WHERE institution_id = $1 AND academic_year_id = $2 
         AND date >= $3 AND date <= $4`,
      [institutionId, academicYearId, sDate, eDate]
    );

    const overrideMap = new Map<string, { is_working_day: boolean; day_type: string }>();
    for (const r of overrides.rows) {
      const dStr = r.date.split('T')[0];
      overrideMap.set(dStr, { is_working_day: r.is_working_day, day_type: r.day_type });
    }

    let totalDays = 0;
    let workingDays = 0;
    let holidays = 0;
    let vacationDays = 0;

    const current = new Date(sDate + 'T00:00:00Z');
    const end = new Date(eDate + 'T00:00:00Z');

    while (current <= end) {
      totalDays++;
      const dStr = current.toISOString().split('T')[0];

      if (overrideMap.has(dStr)) {
        const item = overrideMap.get(dStr)!;
        if (item.is_working_day) {
          workingDays++;
        } else {
          if (item.day_type === 'vacation') {
            vacationDays++;
          } else {
            holidays++;
          }
        }
      } else {
        let day = current.getUTCDay();
        if (day === 0) day = 7;

        if (workingDaysOfWeek.includes(day)) {
          workingDays++;
        } else {
          holidays++;
        }
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return {
      startDate: sDate,
      endDate: eDate,
      totalDays,
      workingDays,
      holidays,
      vacationDays,
    };
  }

  // =========================================================================
  // PREFERRED TEXTBOOKS (A1)
  // =========================================================================

  async listTextbooks(institutionId: string, academicYearId: string, classId?: string, subjectId?: string) {
    let query = `
      SELECT pt.*, c.name as class_name, c.sequence_order as class_sequence,
             sub.name as subject_name, sub.code as subject_code
      FROM preferred_textbooks pt
      JOIN classes c ON c.id = pt.class_id
      JOIN subjects sub ON sub.id = pt.subject_id
      WHERE pt.institution_id = $1 AND pt.academic_year_id = $2
    `;
    const params: any[] = [institutionId, academicYearId];

    if (classId) {
      query += ` AND pt.class_id = $${params.length + 1}`;
      params.push(classId);
    }
    if (subjectId) {
      query += ` AND pt.subject_id = $${params.length + 1}`;
      params.push(subjectId);
    }

    query += ` ORDER BY c.sequence_order ASC, sub.name ASC, pt.title ASC`;
    const res = await db.query(query, params);
    return res.rows;
  }

  async createTextbook(institutionId: string, data: {
    academicYearId: string;
    classId: string;
    subjectId: string;
    title: string;
    author: string;
    publisher: string;
    edition?: string;
    isbn?: string;
    price?: number;
    isMandatory?: boolean;
    notes?: string;
  }) {
    const res = await db.query(
      `INSERT INTO preferred_textbooks (
        institution_id, academic_year_id, class_id, subject_id, 
        title, author, publisher, edition, isbn, price, is_mandatory, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        institutionId,
        data.academicYearId,
        data.classId,
        data.subjectId,
        data.title,
        data.author,
        data.publisher,
        data.edition || null,
        data.isbn || null,
        data.price || null,
        data.isMandatory ?? true,
        data.notes || null,
      ]
    );
    return res.rows[0];
  }

  async updateTextbook(institutionId: string, id: string, data: {
    title?: string;
    author?: string;
    publisher?: string;
    edition?: string;
    isbn?: string;
    price?: number;
    isMandatory?: boolean;
    notes?: string;
  }) {
    const fields: string[] = [];
    const values: any[] = [institutionId, id];
    let idx = 3;

    if (data.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(data.title);
    }
    if (data.author !== undefined) {
      fields.push(`author = $${idx++}`);
      values.push(data.author);
    }
    if (data.publisher !== undefined) {
      fields.push(`publisher = $${idx++}`);
      values.push(data.publisher);
    }
    if (data.edition !== undefined) {
      fields.push(`edition = $${idx++}`);
      values.push(data.edition);
    }
    if (data.isbn !== undefined) {
      fields.push(`isbn = $${idx++}`);
      values.push(data.isbn);
    }
    if (data.price !== undefined) {
      fields.push(`price = $${idx++}`);
      values.push(data.price);
    }
    if (data.isMandatory !== undefined) {
      fields.push(`is_mandatory = $${idx++}`);
      values.push(data.isMandatory);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes);
    }

    const res = await db.query(
      `UPDATE preferred_textbooks SET ${fields.join(', ')} WHERE institution_id = $1 AND id = $2 RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async deleteTextbook(institutionId: string, id: string) {
    const res = await db.query(
      `DELETE FROM preferred_textbooks WHERE id = $1 AND institution_id = $2 RETURNING *`,
      [id, institutionId]
    );
    return res.rows[0];
  }

  async getBooklist(institutionId: string, academicYearId: string, classId: string) {
    const books = await this.listTextbooks(institutionId, academicYearId, classId);
    const cls = await db.query(`SELECT name FROM classes WHERE id = $1 AND institution_id = $2`, [classId, institutionId]);
    const year = await this.getAcademicYearById(institutionId, academicYearId);

    const mandatory = books.filter(b => b.is_mandatory);
    const optional = books.filter(b => !b.is_mandatory);
    const totalEstimatedCost = books.reduce((acc, b) => acc + (parseFloat(b.price) || 0), 0);

    return {
      className: cls.rows[0]?.name || 'Unknown Class',
      academicYear: year?.name || 'Unknown Year',
      totalBooks: books.length,
      mandatoryCount: mandatory.length,
      optionalCount: optional.length,
      totalEstimatedCost: parseFloat(totalEstimatedCost.toFixed(2)),
      books,
    };
  }

  // =========================================================================
  // DEPARTMENTS & ALLOCATIONS (PRESERVED)
  // =========================================================================

  async listDepartments(institutionId: string, departmentType?: string) {
    if (departmentType) {
      const res = await db.query(
        'SELECT * FROM departments WHERE institution_id = $1 AND department_type = $2 ORDER BY name ASC',
        [institutionId, departmentType]
      );
      return res.rows;
    }
    const res = await db.query(
      'SELECT * FROM departments WHERE institution_id = $1 ORDER BY name ASC',
      [institutionId]
    );
    return res.rows;
  }

  async createDepartment(institutionId: string, data: { name: string; code: string; departmentType?: string }) {
    const res = await db.query(
      `INSERT INTO departments (institution_id, name, code, department_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name, department_type = EXCLUDED.department_type
       RETURNING *`,
      [institutionId, data.name, data.code, data.departmentType || 'academic']
    );
    return res.rows[0];
  }

  async linkSubjectToClass(classId: string, subjectId: string, isMandatory = true) {
    const res = await db.query(
      `INSERT INTO class_subjects (class_id, subject_id, is_mandatory)
       VALUES ($1, $2, $3)
       ON CONFLICT (class_id, subject_id) DO UPDATE SET is_mandatory = EXCLUDED.is_mandatory
       RETURNING *`,
      [classId, subjectId, isMandatory]
    );
    return res.rows[0];
  }

  async listAllocations(institutionId: string) {
    const res = await db.query(
      `SELECT fa.id, fa.staff_id as "staffId", fa.section_id as "sectionId", fa.subject_id as "subjectId", fa.academic_year_id as "academicYearId",
              p.full_name as "teacherName", st.employee_code as "employeeCode",
              c.id as "classId", c.name as "className", sec.name as "sectionName", sub.name as "subjectName"
       FROM faculty_assignments fa
       JOIN staff st ON st.id = fa.staff_id
       JOIN profiles p ON p.id = st.profile_id
       JOIN sections sec ON sec.id = fa.section_id
       JOIN classes c ON c.id = sec.class_id
       JOIN subjects sub ON sub.id = fa.subject_id
       WHERE fa.institution_id = $1 AND (fa.effective_to IS NULL OR fa.effective_to >= CURRENT_DATE)
       ORDER BY c.sequence_order, sec.name, sub.name`,
      [institutionId]
    );
    return res.rows;
  }

  async createAllocation(institutionId: string, data: { staffId: string; sectionId: string; subjectId: string; academicYearId: string }) {
    const res = await db.query(
      `INSERT INTO faculty_assignments (institution_id, staff_id, section_id, subject_id, academic_year_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (staff_id, subject_id, section_id, academic_year_id) WHERE effective_to IS NULL
       DO UPDATE SET effective_to = NULL
       RETURNING *`,
      [institutionId, data.staffId, data.sectionId, data.subjectId, data.academicYearId]
    );
    return res.rows[0];
  }
}

export const academicsRepository = new AcademicsRepository();
