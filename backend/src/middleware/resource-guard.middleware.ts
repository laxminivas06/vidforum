import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { sendError } from '../utils/api-response';

export interface ResourceGuardOptions {
  type: 'faculty' | 'parent' | 'student';
  getResourceId?: (req: Request) => string | undefined;
}

/**
 * Resource-Level Authorization Guard (Section 7, Rules 7, 8, 9, 10)
 * Evaluates whether the authenticated user has explicit rights to the specified resource instance.
 */
export function resourceGuard(options: ResourceGuardOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if (!user) {
      sendError(res, 'Authentication required for resource-level authorization', 401, 'UNAUTHORIZED');
      return;
    }

    // Super Admin and Institution Admin bypass resource-level scoping
    const isSuperOrAdmin =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'Super Admin' ||
      user.role === 'INSTITUTION_ADMIN' ||
      user.role === 'Institution Admin';

    if (isSuperOrAdmin) {
      next();
      return;
    }

    const resourceId = options.getResourceId
      ? options.getResourceId(req)
      : (req.params.id || req.params.studentId || req.params.classId || req.params.sectionId);

    // Rule 10: Student may only access own permitted data
    const isStudent = user.role === 'STUDENT' || user.role === 'Student';
    const isParent = user.role === 'PARENT' || user.role === 'Parent';

    if (options.type === 'student' || (options.type as any) === 'student_record') {
      if (isStudent) {
        if (!resourceId) {
          next();
          return;
        }
        try {
          const studentRes = await db.query(
            `SELECT id FROM students WHERE (id::text = $1 OR admission_number = $1) AND (user_id::text = $2 OR id::text = $2) LIMIT 1`,
            [resourceId, user.id]
          );

          if (studentRes.rows.length === 0) {
            sendError(res, 'Access denied: Students can only access their own educational records (Rule 10)', 403, 'RESOURCE_ACCESS_DENIED');
            return;
          }
        } catch (err) {
          console.error('Student resource guard check failed:', err);
          sendError(res, 'Authorization verification failure', 500, 'INTERNAL_ERROR');
          return;
        }
      }
    }

    // Rule 9: Parent may only access linked children
    if (options.type === 'parent' || (options.type as any) === 'student_record') {
      if (isParent) {
        if (!resourceId) {
          next();
          return;
        }
        try {
          const linkRes = await db.query(
            `SELECT sp.student_id 
             FROM student_parents sp
             JOIN parents p ON p.id = sp.parent_id
             WHERE sp.student_id::text = $1 AND p.profile_id::text = $2
             UNION
             SELECT sg.student_id
             FROM student_guardians sg
             JOIN guardians g ON g.id = sg.guardian_id
             WHERE sg.student_id::text = $1 AND (g.profile_id::text = $2 OR g.id::text = $2)
             LIMIT 1`,
            [resourceId, user.id]
          );

          if (linkRes.rows.length === 0) {
            sendError(res, 'Access denied: Parents can only access records for verified linked children (Rule 9)', 403, 'RESOURCE_ACCESS_DENIED');
            return;
          }
        } catch (err) {
          console.error('Parent resource guard check failed:', err);
          sendError(res, 'Authorization verification failure', 500, 'INTERNAL_ERROR');
          return;
        }
      }
    }

    // Rule 8: Faculty access limited to assigned classes, sections, and subjects
    if (options.type === 'faculty') {
      if (!resourceId) {
        next();
        return;
      }
      try {
        const assignmentRes = await db.query(
          `SELECT fa.id 
           FROM faculty_assignments fa
           JOIN staff s ON s.id = fa.staff_id
           LEFT JOIN sections sec ON sec.id = fa.section_id
           WHERE s.profile_id::text = $1 
             AND (fa.section_id::text = $2 OR sec.class_id::text = $2 OR fa.subject_id::text = $2)
             AND (fa.effective_to IS NULL OR fa.effective_to >= CURRENT_DATE)
           LIMIT 1`,
          [user.id, resourceId]
        );

        if (assignmentRes.rows.length === 0) {
          sendError(res, 'Access denied: Faculty access is strictly limited to assigned classes and subjects (Rule 8)', 403, 'RESOURCE_ACCESS_DENIED');
          return;
        }
      } catch (err) {
        console.error('Faculty resource guard check failed:', err);
        sendError(res, 'Authorization verification failure', 500, 'INTERNAL_ERROR');
        return;
      }
    }

    next();
  };
}
