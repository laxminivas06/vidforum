import fs from 'fs';
import path from 'path';
import { db } from '../config/database';

async function main() {
  const sqlPath = path.resolve(__dirname, '../../db/migrations/013_academics_curriculum_refinements.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Applying migration 013 (Academics & Curriculum refinements)...');
  await db.query(sql);
  console.log('Migration 013 applied successfully!');

  const tablesCheck = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('grade_subjects', 'exam_estimates', 'calendar_days', 'academic_calendar_configs', 'preferred_textbooks')
    ORDER BY table_name;
  `);
  console.log('Verified created tables:', tablesCheck.rows.map(r => r.table_name));

  const ayCols = await db.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'academic_years' AND column_name = 'status'
  `);
  console.log('Verified academic_years status column:', ayCols.rows);

  const subCols = await db.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'subjects' AND column_name IN ('is_active', 'credits', 'department_id')
  `);
  console.log('Verified subjects columns:', subCols.rows);

  process.exit(0);
}

main().catch(err => {
  console.error('Migration 013 failed:', err);
  process.exit(1);
});
