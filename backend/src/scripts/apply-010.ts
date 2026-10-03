import fs from 'fs';
import path from 'path';
import { db } from '../config/database';

async function main() {
  const sqlPath = path.resolve(__dirname, '../../db/migrations/010_auth_hardening.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Applying migration 010...');
  await db.query(sql);
  console.log('Migration 010 applied successfully!');

  // Check profiles columns
  const res = await db.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name IN ('must_change_password', 'failed_login_attempts', 'locked_until')
  `);
  console.log('Verified columns on profiles:', res.rows);

  // Check remaining plain_password_hint
  const hintCheck = await db.query(`
    SELECT count(*) FROM auth.users WHERE raw_user_meta_data ? 'plain_password_hint'
  `);
  console.log('Remaining accounts with plain_password_hint:', hintCheck.rows[0].count);

  process.exit(0);
}

main().catch(err => {
  console.error('Migration 010 failed:', err);
  process.exit(1);
});
