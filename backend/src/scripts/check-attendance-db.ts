import { db } from '../config/database';

async function check() {
  const r = await db.query(`
    SELECT sec.id, sec.name as section_name, c.name as class_name, sec.institution_id
    FROM sections sec
    JOIN classes c ON c.id = sec.class_id
    WHERE sec.id IN (
      'cc0b3fe5-010f-44db-9d54-46b359bd9a6d',
      '151de959-4b60-4cc4-98f4-cbe85f4493ee',
      '5510ac4d-56ea-4437-9875-b1820ff54a6e'
    )
  `);
  console.log(r.rows);
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
