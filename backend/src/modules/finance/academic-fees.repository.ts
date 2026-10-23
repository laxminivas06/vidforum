import { db } from '../../config/database';

export interface FeeComponentInput {
  componentName: string;
  amount: number;
}

export interface AcademicFeeStructureInput {
  academicYearId: string;
  academicConfigurationId: string;
  tuitionFee: number;
  components: FeeComponentInput[];
  status?: 'active' | 'draft' | 'archived';
}

export class AcademicFeeRepository {
  async listStructures(institutionId: string, filters?: {
    academicYearId?: string;
    classId?: string;
    boardId?: string;
    streamId?: string;
    status?: string;
  }) {
    const values: any[] = [institutionId];
    let idx = 2;
    let where = 'afs.institution_id = $1';

    if (filters?.academicYearId) {
      where += ` AND afs.academic_year_id = $${idx++}`;
      values.push(filters.academicYearId);
    }
    if (filters?.classId) {
      where += ` AND ac.class_id = $${idx++}`;
      values.push(filters.classId);
    }
    if (filters?.boardId) {
      where += ` AND ac.board_id = $${idx++}`;
      values.push(filters.boardId);
    }
    if (filters?.streamId) {
      where += ` AND ac.stream_id = $${idx++}`;
      values.push(filters.streamId);
    }
    if (filters?.status && filters.status !== 'all') {
      where += ` AND afs.status = $${idx++}`;
      values.push(filters.status);
    }

    const res = await db.query(
      `SELECT 
        afs.id,
        afs.institution_id,
        afs.academic_year_id,
        ay.name as academic_year_name,
        afs.academic_configuration_id,
        c.id as class_id,
        c.name as class_name,
        c.sequence_order as class_sequence,
        b.id as board_id,
        b.code as board_code,
        b.name as board_name,
        s.id as stream_id,
        COALESCE(s.code, 'NONE') as stream_code,
        COALESCE(s.name, 'General') as stream_name,
        afs.tuition_fee,
        afs.other_fees,
        afs.total_fee,
        afs.status,
        afs.created_at,
        afs.updated_at,
        COALESCE(
          (SELECT json_agg(json_build_object('id', comp.id, 'componentName', comp.component_name, 'amount', comp.amount))
           FROM academic_fee_components comp
           WHERE comp.fee_structure_id = afs.id),
          '[]'::json
        ) as components
       FROM academic_fee_structures afs
       JOIN academic_configurations ac ON ac.id = afs.academic_configuration_id
       JOIN academic_years ay ON ay.id = afs.academic_year_id
       JOIN classes c ON c.id = ac.class_id
       JOIN academic_boards b ON b.id = ac.board_id
       LEFT JOIN academic_streams s ON s.id = ac.stream_id
       WHERE ${where}
       ORDER BY c.sequence_order ASC, b.code ASC, s.name ASC NULLS FIRST`,
      values
    );
    return res.rows;
  }

  async getStructureById(institutionId: string, id: string) {
    const res = await db.query(
      `SELECT 
        afs.*,
        ay.name as academic_year_name,
        c.name as class_name,
        b.code as board_code,
        COALESCE(s.name, 'General') as stream_name,
        COALESCE(
          (SELECT json_agg(json_build_object('id', comp.id, 'componentName', comp.component_name, 'amount', comp.amount))
           FROM academic_fee_components comp
           WHERE comp.fee_structure_id = afs.id),
          '[]'::json
        ) as components
       FROM academic_fee_structures afs
       JOIN academic_configurations ac ON ac.id = afs.academic_configuration_id
       JOIN academic_years ay ON ay.id = afs.academic_year_id
       JOIN classes c ON c.id = ac.class_id
       JOIN academic_boards b ON b.id = ac.board_id
       LEFT JOIN academic_streams s ON s.id = ac.stream_id
       WHERE afs.institution_id = $1 AND afs.id = $2`,
      [institutionId, id]
    );
    return res.rows[0] || null;
  }

  async upsertStructure(institutionId: string, data: AcademicFeeStructureInput) {
    return await db.transaction(async (client) => {
      // Calculate other fees and total fee
      const tuitionFee = Number(data.tuitionFee || 0);
      let otherFees = 0;
      for (const comp of data.components || []) {
        if (comp.componentName.toLowerCase() !== 'tuition fee') {
          otherFees += Number(comp.amount || 0);
        }
      }
      const totalFee = tuitionFee + otherFees;

      // 1. Upsert academic_fee_structures
      const structRes = await client.query(
        `INSERT INTO academic_fee_structures (
          institution_id, academic_year_id, academic_configuration_id,
          tuition_fee, other_fees, total_fee, status, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'active'), now())
         ON CONFLICT (institution_id, academic_year_id, academic_configuration_id) DO UPDATE SET
          tuition_fee = EXCLUDED.tuition_fee,
          other_fees = EXCLUDED.other_fees,
          total_fee = EXCLUDED.total_fee,
          status = EXCLUDED.status,
          updated_at = now()
         RETURNING *`,
        [
          institutionId,
          data.academicYearId,
          data.academicConfigurationId,
          tuitionFee,
          otherFees,
          totalFee,
          data.status || 'active',
        ]
      );
      const structure = structRes.rows[0];

      // 2. Clear and recreate fee components
      await client.query(
        `DELETE FROM academic_fee_components WHERE fee_structure_id = $1`,
        [structure.id]
      );

      // Re-insert tuition fee component
      await client.query(
        `INSERT INTO academic_fee_components (institution_id, fee_structure_id, component_name, amount)
         VALUES ($1, $2, 'Tuition Fee', $3)`,
        [institutionId, structure.id, tuitionFee]
      );

      // Insert additional dynamic fee components
      for (const comp of data.components || []) {
        if (comp.componentName.toLowerCase() !== 'tuition fee' && Number(comp.amount) > 0) {
          await client.query(
            `INSERT INTO academic_fee_components (institution_id, fee_structure_id, component_name, amount)
             VALUES ($1, $2, $3, $4)`,
            [institutionId, structure.id, comp.componentName.trim(), Number(comp.amount)]
          );
        }
      }

      return await this.getStructureById(institutionId, structure.id);
    });
  }
}

export const academicFeeRepository = new AcademicFeeRepository();
