import fs from 'fs';
import path from 'path';
import { db } from '../config/database';

async function main() {
  const sqlPath = path.resolve(__dirname, '../../db/migrations/012_staff_hrms_refinements.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Applying migration 012 (HRMS refinements)...');
  await db.query(sql);
  console.log('Migration 012 applied successfully!');

  const check = await db.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name IN ('experience_years', 'staff_type')
  `);
  console.log('Verified columns on staff:', check.rows);

  process.exit(0);
}

main().catch(err => {
  console.error('Migration 012 failed:', err);
  process.exit(1);
});
