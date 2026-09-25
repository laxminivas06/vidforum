"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionsRepository = exports.AdmissionsRepository = void 0;
const database_1 = require("../../config/database");
class AdmissionsRepository {
    async findApplicantsByInstitution(institutionId) {
        const query = `
      SELECT 
        a.id,
        a.applicant_name,
        c.name as grade_applying,
        a.guardian_name,
        a.guardian_phone,
        a.guardian_email,
        a.stage,
        a.created_at as applied_date,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', ad.id,
            'title', ad.document_type,
            'status', UPPER(ad.verification_status::text),
            'fileName', ad.storage_key,
            'uploadDate', to_char(ad.created_at, 'YYYY-MM-DD')
          )) FROM admission_documents ad WHERE ad.application_id = a.id),
          '[]'::json
        ) as documents_submitted
      FROM applications a
      LEFT JOIN classes c ON c.id = a.applying_for_class_id
      WHERE a.institution_id = $1
      ORDER BY a.created_at DESC
    `;
        const result = await database_1.db.query(query, [institutionId]);
        return result.rows;
    }
    async findApplicationById(id, institutionId) {
        const res = await database_1.db.query('SELECT * FROM applications WHERE id = $1 AND institution_id = $2', [id, institutionId]);
        return res.rows[0] || null;
    }
    async updateApplicationStage(id, stage) {
        const res = await database_1.db.query('UPDATE applications SET stage = $1, updated_at = now() WHERE id = $2 RETURNING *', [stage, id]);
        return res.rows[0] || null;
    }
    async executeApprovalTransaction(applicationId, institutionId, data) {
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            const appRes = await client.query('SELECT * FROM applications WHERE id = $1 AND institution_id = $2 FOR UPDATE', [applicationId, institutionId]);
            const app = appRes.rows[0];
            if (!app) {
                throw new Error('Application not found');
            }
            // Create admissions record
            const admRes = await client.query(`INSERT INTO admissions (institution_id, application_id, approved_class_id, approved_section_id, academic_year_id, decision)
         VALUES ($1, $2, $3, $4, $5, 'approved') RETURNING id`, [institutionId, app.id, app.applying_for_class_id, data.sectionId, app.academic_year_id]);
            const admissionId = admRes.rows[0].id;
            // Create student master record
            const studentRes = await client.query(`INSERT INTO students (
          institution_id, admission_number, admission_id, first_name, last_name, 
          date_of_birth, gender, current_class_id, current_section_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active') RETURNING *`, [
                institutionId,
                data.admissionNumber,
                admissionId,
                data.firstName,
                data.lastName,
                app.date_of_birth || '2011-01-01',
                app.gender || 'male',
                app.applying_for_class_id,
                data.sectionId,
            ]);
            const student = studentRes.rows[0];
            // Create guardian
            if (app.guardian_name) {
                const gRes = await client.query(`INSERT INTO guardians (institution_id, full_name, phone, email)
           VALUES ($1, $2, $3, $4) RETURNING id`, [institutionId, app.guardian_name, app.guardian_phone, app.guardian_email]);
                const guardianId = gRes.rows[0].id;
                await client.query(`INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary_contact)
           VALUES ($1, $2, 'Parent', true) ON CONFLICT DO NOTHING`, [student.id, guardianId]);
            }
            // Academic history
            await client.query(`INSERT INTO student_academic_history (
          institution_id, student_id, academic_year_id, class_id, section_id, roll_number
        ) VALUES ($1, $2, $3, $4, $5, $6)`, [institutionId, student.id, app.academic_year_id, app.applying_for_class_id, data.sectionId, data.rollNumber]);
            // Update application stage to approved
            await client.query("UPDATE applications SET stage = 'approved', updated_at = now() WHERE id = $1", [app.id]);
            await client.query('COMMIT');
            return student;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async countStudents(institutionId) {
        const res = await database_1.db.query('SELECT count(*) FROM students WHERE institution_id = $1', [institutionId]);
        return parseInt(res.rows[0].count, 10);
    }
    async findDefaultSection(classId) {
        const res = await database_1.db.query('SELECT id FROM sections WHERE class_id = $1 LIMIT 1', [classId]);
        return res.rows[0]?.id || null;
    }
}
exports.AdmissionsRepository = AdmissionsRepository;
exports.admissionsRepository = new AdmissionsRepository();
