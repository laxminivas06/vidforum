import fs from 'node:fs';
import path from 'node:path';
import { db } from '../src/config/database';

async function main() {
  const target = process.argv[2] || '003_phase2_timetable.sql';
  const file = path.join(__dirname, '../db/migrations', target);
  if (!fs.existsSync(file)) {
    console.error(`Migration file not found: ${file}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(file, 'utf8');
  console.log(`Applying migration ${target}...`);
  await db.query(sql);
  console.log(`✅ Migration ${target} applied successfully!`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
