import { Router, Request, Response } from 'express';
import { db } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/api-response';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// GET /api/v1/examinations/exams
router.get('/exams', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;

    const query = `
      SELECT 
        e.id,
        e.name,
        e.status,
        et.name as "typeName",
        c.name as "className",
        ay.name as "academicYear",
        (SELECT count(*) FROM exam_subjects WHERE exam_id = e.id) as "subjectsCount",
        e.created_at as "createdAt"
      FROM exams e
      JOIN exam_types et ON et.id = e.exam_type_id
      JOIN classes c ON c.id = e.class_id
      JOIN academic_years ay ON ay.id = e.academic_year_id
      WHERE e.institution_id = $1
      ORDER BY e.created_at DESC
    `;

    const result = await db.query(query, [instId]);
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/examinations/marks
router.get('/marks', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const { examId, subjectId } = req.query;

    let query = `
      SELECT 
        m.id,
        s.admission_number as "admissionNumber",
        (s.first_name || ' ' || s.last_name) as "studentName",
        c.name as "className",
        sub.name as "subjectName",
        m.marks_obtained as "marksObtained",
        es.max_marks as "maxMarks",
        es.pass_marks as "passMarks",
        g.label as grade
      FROM marks m
      JOIN students s ON s.id = m.student_id
      JOIN exam_subjects es ON es.id = m.exam_subject_id
      JOIN subjects sub ON sub.id = es.subject_id
      JOIN exams e ON e.id = es.exam_id
      JOIN classes c ON c.id = e.class_id
      LEFT JOIN grades g ON g.id = m.grade_id
      WHERE m.institution_id = $1
    `;

    const params: any[] = [instId];
    if (examId) {
      params.push(examId);
      query += ` AND es.exam_id = $${params.length}`;
    }
    if (subjectId) {
      params.push(subjectId);
      query += ` AND es.subject_id = $${params.length}`;
    }

    const result = await db.query(query, params);
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// POST /api/v1/examinations/import-excel (Pre-Commit Validation Engine)
router.post('/import-excel', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { examId, subjectId, rows } = req.body;
    // rows: Array of { admissionNumber, marks }

    if (!Array.isArray(rows) || rows.length === 0) {
      sendError(res, 'No import rows provided', 400);
      return;
    }

    // Step 1: Validate Student Matching & Marks Bounds
    const validationResults = [];
    let validCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      const studentRes = await db.query(
        'SELECT id, first_name, last_name FROM students WHERE admission_number = $1 AND institution_id = $2',
        [row.admissionNumber, req.institutionId]
      );

      if (studentRes.rows.length === 0) {
        validationResults.push({
          admissionNumber: row.admissionNumber,
          marks: row.marks,
          status: 'ERROR',
          message: 'Student Admission Number not found in institutional roster',
        });
        errorCount++;
      } else if (isNaN(row.marks) || row.marks < 0 || row.marks > 100) {
        validationResults.push({
          admissionNumber: row.admissionNumber,
          marks: row.marks,
          status: 'ERROR',
          message: `Marks ${row.marks} outside valid bounds (0 - 100)`,
        });
        errorCount++;
      } else {
        validationResults.push({
          admissionNumber: row.admissionNumber,
          studentName: `${studentRes.rows[0].first_name} ${studentRes.rows[0].last_name}`,
          marks: parseFloat(row.marks),
          status: 'VALID',
        });
        validCount++;
      }
    }

    sendSuccess(res, {
      summary: {
        total: rows.length,
        valid: validCount,
        errors: errorCount,
        canCommit: errorCount === 0,
      },
      preview: validationResults,
    }, 'Excel sheet validated successfully');
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

export default router;
