import { db } from '../../config/database';

export interface BoardInput {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface StreamInput {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface ConfigurationInput {
  academicYearId: string;
  classId: string;
  boardId: string;
  streamId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CustomGradeInput {
  name: string;
  academicYearId: string;
  boardId: string;
  streamId?: string | null;
  displayOrder?: number;
  optionalSections?: string[];
}

export class AcademicConfigRepository {
  // Boards
  async listBoards(institutionId: string) {
    const res = await db.query(
      `SELECT * FROM academic_boards 
       WHERE institution_id = $1 
       ORDER BY code ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async createBoard(institutionId: string, data: BoardInput) {
    const res = await db.query(
      `INSERT INTO academic_boards (institution_id, code, name, description, is_active)
       VALUES ($1, $2, $3, $4, COALESCE($5, true))
       ON CONFLICT (institution_id, code) DO UPDATE 
       SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active, updated_at = now()
       RETURNING *`,
      [institutionId, data.code.trim().toUpperCase(), data.name.trim(), data.description || null, data.isActive]
    );
    return res.rows[0];
  }

  async updateBoard(institutionId: string, id: string, data: Partial<BoardInput>) {
    const res = await db.query(
      `UPDATE academic_boards 
       SET name = COALESCE($3, name), 
           description = COALESCE($4, description), 
           is_active = COALESCE($5, is_active), 
           updated_at = now()
       WHERE institution_id = $1 AND id = $2
       RETURNING *`,
      [institutionId, id, data.name?.trim(), data.description, data.isActive]
    );
    return res.rows[0];
  }

  // Streams
  async listStreams(institutionId: string) {
    const res = await db.query(
      `SELECT * FROM academic_streams 
       WHERE institution_id = $1 
       ORDER BY name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async createStream(institutionId: string, data: StreamInput) {
    const res = await db.query(
      `INSERT INTO academic_streams (institution_id, code, name, description, is_active)
       VALUES ($1, $2, $3, $4, COALESCE($5, true))
       ON CONFLICT (institution_id, code) DO UPDATE 
       SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active, updated_at = now()
       RETURNING *`,
      [institutionId, data.code.trim().toUpperCase(), data.name.trim(), data.description || null, data.isActive]
    );
    return res.rows[0];
  }

  async updateStream(institutionId: string, id: string, data: Partial<StreamInput>) {
    const res = await db.query(
      `UPDATE academic_streams 
       SET name = COALESCE($3, name), 
           description = COALESCE($4, description), 
           is_active = COALESCE($5, is_active), 
           updated_at = now()
       WHERE institution_id = $1 AND id = $2
       RETURNING *`,
      [institutionId, id, data.name?.trim(), data.description, data.isActive]
    );
    return res.rows[0];
  }

  // Composite Academic Configurations
  async listConfigurations(institutionId: string, academicYearId?: string) {
    const res = await db.query(
      `SELECT 
        ac.id,
        ac.institution_id,
        ac.academic_year_id,
        ay.name as academic_year_name,
        ac.class_id,
        c.name as class_name,
        c.sequence_order as class_sequence,
        ac.display_order,
        ac.board_id,
        b.code as board_code,
        b.name as board_name,
        ac.stream_id,
        COALESCE(s.code, 'NONE') as stream_code,
        COALESCE(s.name, 'No Stream') as stream_name,
        ac.is_active,
        ac.created_at,
        ac.updated_at,
        (SELECT COUNT(*)::int FROM sections sec WHERE sec.class_id = c.id) as section_count,
        (SELECT requires_exam FROM admission_configurations adm WHERE adm.academic_configuration_id = ac.id LIMIT 1) as requires_exam
       FROM academic_configurations ac
       JOIN academic_years ay ON ay.id = ac.academic_year_id
       JOIN classes c ON c.id = ac.class_id
       JOIN academic_boards b ON b.id = ac.board_id
       LEFT JOIN academic_streams s ON s.id = ac.stream_id
       WHERE ac.institution_id = $1
         AND ($2::uuid IS NULL OR ac.academic_year_id = $2::uuid)
       ORDER BY c.sequence_order ASC, b.code ASC, s.name ASC NULLS FIRST`,
      [institutionId, academicYearId || null]
    );
    return res.rows;
  }

  async createConfiguration(institutionId: string, data: ConfigurationInput) {
    const res = await db.query(
      `INSERT INTO academic_configurations (
        institution_id, academic_year_id, class_id, board_id, stream_id, display_order, is_active
       ) VALUES ($1, $2, $3, $4, $5, COALESCE($6, 1), COALESCE($7, true))
       ON CONFLICT (institution_id, academic_year_id, class_id, board_id, COALESCE(stream_id, '00000000-0000-0000-0000-000000000000'::uuid))
       DO UPDATE SET display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active, updated_at = now()
       RETURNING *`,
      [
        institutionId,
        data.academicYearId,
        data.classId,
        data.boardId,
        data.streamId || null,
        data.displayOrder || 1,
        data.isActive !== undefined ? data.isActive : true,
      ]
    );
    return res.rows[0];
  }

  async updateConfiguration(institutionId: string, id: string, data: Partial<ConfigurationInput>) {
    const fields: string[] = ['updated_at = now()'];
    const values: any[] = [institutionId, id];
    let idx = 3;

    if (data.displayOrder !== undefined) {
      fields.push(`display_order = $${idx++}`);
      values.push(data.displayOrder);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(data.isActive);
    }

    const res = await db.query(
      `UPDATE academic_configurations 
       SET ${fields.join(', ')} 
       WHERE institution_id = $1 AND id = $2 
       RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async deleteConfiguration(institutionId: string, id: string) {
    // Soft deactivate to preserve historical records per Rule 2 & PRD
    const res = await db.query(
      `UPDATE academic_configurations 
       SET is_active = false, updated_at = now() 
       WHERE institution_id = $1 AND id = $2 
       RETURNING *`,
      [institutionId, id]
    );
    return res.rows[0];
  }

  async createCustomGrade(institutionId: string, data: CustomGradeInput) {
    return await db.transaction(async (client) => {
      // Find or create default department
      let deptRes = await client.query(
        `SELECT id FROM departments WHERE institution_id = $1 LIMIT 1`,
        [institutionId]
      );
      let departmentId = deptRes.rows[0]?.id;
      if (!departmentId) {
        const newDept = await client.query(
          `INSERT INTO departments (institution_id, name, code)
           VALUES ($1, 'Academics General', 'ACAD')
           RETURNING id`,
          [institutionId]
        );
        departmentId = newDept.rows[0].id;
      }

      // Check max sequence order
      const seqRes = await client.query(
        `SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_seq FROM classes WHERE institution_id = $1`,
        [institutionId]
      );
      const sequenceOrder = data.displayOrder || seqRes.rows[0]?.next_seq || 1;

      // Create Class
      const classRes = await client.query(
        `INSERT INTO classes (institution_id, academic_year_id, department_id, name, sequence_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [institutionId, data.academicYearId, departmentId, data.name.trim(), sequenceOrder]
      );
      const newClass = classRes.rows[0];

      // Create optional sections
      const sections = data.optionalSections && data.optionalSections.length > 0 
        ? data.optionalSections 
        : ['A'];
      for (const secName of sections) {
        await client.query(
          `INSERT INTO sections (institution_id, class_id, name, capacity)
           VALUES ($1, $2, $3, 40)
           ON CONFLICT DO NOTHING`,
          [institutionId, newClass.id, secName.trim()]
        );
      }

      // Create Academic Configuration
      const configRes = await client.query(
        `INSERT INTO academic_configurations (
          institution_id, academic_year_id, class_id, board_id, stream_id, display_order, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING *`,
        [institutionId, data.academicYearId, newClass.id, data.boardId, data.streamId || null, sequenceOrder]
      );

      return {
        class: newClass,
        configuration: configRes.rows[0],
      };
    });
  }
}

export const academicConfigRepository = new AcademicConfigRepository();
