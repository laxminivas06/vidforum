import { db } from '../config/database';

async function main() {
  console.log('Applying migration 014 (Admissions & Enrollment)...');

  // Phase 1: Extend student_status enum (ADD VALUE can't run inside transaction)
  await db.query(`ALTER TYPE student_status ADD VALUE IF NOT EXISTS 'alumni';`);
  console.log('Phase 1: student_status enum extended');

  // Phase 2: Extend students table
  await db.query(`
    ALTER TABLE students
      ADD COLUMN IF NOT EXISTS blood_group       TEXT,
      ADD COLUMN IF NOT EXISTS nationality       TEXT DEFAULT 'Indian',
      ADD COLUMN IF NOT EXISTS mother_tongue     TEXT,
      ADD COLUMN IF NOT EXISTS religion          TEXT,
      ADD COLUMN IF NOT EXISTS caste             TEXT,
      ADD COLUMN IF NOT EXISTS previous_school   TEXT,
      ADD COLUMN IF NOT EXISTS address_line1     TEXT,
      ADD COLUMN IF NOT EXISTS address_line2     TEXT,
      ADD COLUMN IF NOT EXISTS city              TEXT,
      ADD COLUMN IF NOT EXISTS state             TEXT,
      ADD COLUMN IF NOT EXISTS pincode           TEXT,
      ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
      ADD COLUMN IF NOT EXISTS emergency_phone   TEXT,
      ADD COLUMN IF NOT EXISTS notes             TEXT,
      ADD COLUMN IF NOT EXISTS photo_url         TEXT,
      ADD COLUMN IF NOT EXISTS aadhaar_number    TEXT,
      ADD COLUMN IF NOT EXISTS transfer_cert_no  TEXT,
      ADD COLUMN IF NOT EXISTS tc_date           DATE,
      ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT now()
  `);
  console.log('Phase 2: students table extended');

  // Phase 3: Indexes on students
  await db.query(`CREATE INDEX IF NOT EXISTS idx_students_institution ON students (institution_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_students_class_section ON students (institution_id, current_class_id, current_section_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students (institution_id, admission_number)`);
  console.log('Phase 3: student indexes created');

  // Phase 4: Enquiries table
  await db.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      applicant_name  TEXT NOT NULL,
      date_of_birth   DATE,
      gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
      grade_applying  TEXT,
      class_id        UUID REFERENCES classes(id) ON DELETE SET NULL,
      academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
      contact_name    TEXT NOT NULL,
      contact_phone   TEXT NOT NULL,
      contact_email   TEXT,
      source          TEXT DEFAULT 'walk-in',
      notes           TEXT,
      status          TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'converted', 'dropped')),
      created_at      TIMESTAMPTZ DEFAULT now(),
      updated_at      TIMESTAMPTZ DEFAULT now()
    )
  `);
  await db.query(`
    ALTER TABLE enquiries
      ADD COLUMN IF NOT EXISTS applicant_name   TEXT,
      ADD COLUMN IF NOT EXISTS date_of_birth    DATE,
      ADD COLUMN IF NOT EXISTS gender           TEXT,
      ADD COLUMN IF NOT EXISTS grade_applying   TEXT,
      ADD COLUMN IF NOT EXISTS class_id         UUID REFERENCES classes(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS contact_name     TEXT,
      ADD COLUMN IF NOT EXISTS contact_phone    TEXT,
      ADD COLUMN IF NOT EXISTS contact_email    TEXT,
      ADD COLUMN IF NOT EXISTS source           TEXT DEFAULT 'walk-in',
      ADD COLUMN IF NOT EXISTS notes            TEXT,
      ADD COLUMN IF NOT EXISTS status           TEXT DEFAULT 'open',
      ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT now();
    DO $$ BEGIN
      ALTER TABLE enquiries ALTER COLUMN full_name DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN NULL;
    END $$;
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_enquiries_institution ON enquiries (institution_id, created_at DESC)`);
  console.log('Phase 4: enquiries table created/aligned');

  // Phase 5: Extend applications table
  await db.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS enquiry_id UUID REFERENCES enquiries(id) ON DELETE SET NULL`);
  await db.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS notes TEXT`);
  await db.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS entrance_score NUMERIC(5,2)`);
  await db.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_date DATE`);
  await db.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL`);
  console.log('Phase 5: applications table extended');

  // Phase 6: Admission documents table
  await db.query(`
    CREATE TABLE IF NOT EXISTS admission_documents (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      institution_id      UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      document_type       TEXT NOT NULL,
      storage_key         TEXT,
      verification_status TEXT NOT NULL DEFAULT 'pending'
                          CHECK (verification_status IN ('pending', 'verified', 'rejected')),
      verified_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
      verified_at         TIMESTAMPTZ,
      created_at          TIMESTAMPTZ DEFAULT now()
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_admission_docs_application ON admission_documents (application_id)`);
  console.log('Phase 6: admission_documents table created');

  // Phase 7: Class capacity
  await db.query(`ALTER TABLE classes ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 40`);
  console.log('Phase 7: classes.capacity added');

  // Phase 8: Views
  await db.query(`
    CREATE OR REPLACE VIEW class_enrollment_counts AS
    SELECT
      c.id                         AS class_id,
      c.institution_id,
      c.name                       AS class_name,
      c.capacity,
      COUNT(s.id) FILTER (WHERE s.status::text = 'active') AS enrolled_count,
      c.capacity - COUNT(s.id) FILTER (WHERE s.status::text = 'active') AS available_seats
    FROM classes c
    LEFT JOIN students s ON s.current_class_id = c.id
    GROUP BY c.id, c.institution_id, c.name, c.capacity
  `);
  await db.query(`
    CREATE OR REPLACE VIEW student_class_history AS
    SELECT
      sah.id,
      sah.student_id,
      sah.institution_id,
      sah.academic_year_id,
      ay.name   AS academic_year_name,
      sah.class_id,
      c.name    AS class_name,
      sah.section_id,
      sec.name  AS section_name,
      sah.roll_number,
      sah.effective_from,
      sah.effective_to,
      CASE WHEN sah.effective_to IS NULL THEN true ELSE false END AS is_current
    FROM student_academic_history sah
    LEFT JOIN academic_years ay  ON ay.id  = sah.academic_year_id
    LEFT JOIN classes        c   ON c.id   = sah.class_id
    LEFT JOIN sections       sec ON sec.id = sah.section_id
  `);
  console.log('Phase 8: views created');

  // Phase 9: promote_student function (drop+recreate to fix parameter names)
  await db.query(`DROP FUNCTION IF EXISTS promote_student(uuid,uuid,uuid,uuid,text,uuid)`);
  await db.query(`
    CREATE OR REPLACE FUNCTION promote_student(
      p_student_id       UUID,
      p_class_id         UUID,
      p_section_id       UUID,
      p_academic_year_id UUID,
      p_decision         TEXT,
      p_actor_id         UUID
    ) RETURNS void LANGUAGE plpgsql AS $$
    DECLARE
      v_now TIMESTAMPTZ := now();
    BEGIN
      UPDATE student_academic_history
        SET effective_to = v_now
        WHERE student_id = p_student_id AND effective_to IS NULL;

      INSERT INTO student_academic_history (
        institution_id, student_id, academic_year_id,
        class_id, section_id, effective_from
      )
      SELECT institution_id, p_student_id, p_academic_year_id,
             p_class_id, p_section_id, v_now
      FROM students WHERE id = p_student_id;

      UPDATE students SET
        current_class_id   = p_class_id,
        current_section_id = p_section_id,
        status             = CASE
                               WHEN p_decision IN ('graduated','alumni') THEN 'graduated'::student_status
                               WHEN p_decision = 'transferred'           THEN 'transferred'::student_status
                               WHEN p_decision = 'dropped'              THEN 'dropped'::student_status
                               ELSE 'active'::student_status
                             END,
        updated_at         = v_now
      WHERE id = p_student_id;
    END;
    $$
  `);
  console.log('Phase 9: promote_student function created');

  // Phase 10: Sequence
  await db.query(`CREATE SEQUENCE IF NOT EXISTS admission_number_seq START 1 INCREMENT 1`);
  console.log('Phase 10: sequence created');

  // Verification
  const t = await db.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('enquiries', 'admission_documents')
    ORDER BY table_name
  `);
  console.log('\n✅ Tables:', t.rows.map(r => r.table_name));

  const c = await db.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'students' AND column_name IN ('blood_group','nationality','notes','updated_at')
    ORDER BY column_name
  `);
  console.log('✅ Student new columns:', c.rows.map(r => r.column_name));

  const v = await db.query(`
    SELECT viewname FROM pg_views WHERE schemaname='public'
    AND viewname IN ('class_enrollment_counts','student_class_history')
  `);
  console.log('✅ Views:', v.rows.map(r => r.viewname));

  console.log('\n🎉 Migration 014 complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration 014 failed:', err.message);
  process.exit(1);
});
