-- VID Platform: Phase 2 Step 1 Migration (Timetable Module)
-- Ensures schema compatibility for: rooms, periods, timetables, timetable_entries, substitutions

-- 1. Ensure rooms table exists and has proper indexes
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 40,
  room_type TEXT DEFAULT 'classroom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_rooms_institution_name UNIQUE (institution_id, name)
);
CREATE INDEX IF NOT EXISTS idx_rooms_institution ON rooms(institution_id);

-- 2. Ensure periods table exists and has proper indexes
CREATE TABLE IF NOT EXISTS periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_break BOOLEAN NOT NULL DEFAULT false,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_periods_institution_name UNIQUE (institution_id, name),
  CONSTRAINT chk_period_times CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_periods_institution ON periods(institution_id);

-- 3. Ensure timetables table has all required columns
CREATE TABLE IF NOT EXISTS timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE timetables ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE timetables ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
ALTER TABLE timetables ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_timetables_institution ON timetables(institution_id);
CREATE INDEX IF NOT EXISTS idx_timetables_section ON timetables(section_id);
CREATE INDEX IF NOT EXISTS idx_timetables_class ON timetables(class_id);

-- 4. Ensure timetable_entries table exists and has proper indexes
CREATE TABLE IF NOT EXISTS timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  faculty_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  day_of_week day_of_week_type NOT NULL,
  period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timetable_entries_timetable ON timetable_entries(timetable_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_faculty ON timetable_entries(faculty_id, day_of_week, period_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_room ON timetable_entries(room_id, day_of_week, period_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_section ON timetable_entries(section_id, day_of_week, period_id);

-- 5. Ensure substitutions table has all required columns
CREATE TABLE IF NOT EXISTS substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  timetable_entry_id UUID NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
  substitute_date DATE NOT NULL,
  original_staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  substitute_staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE substitutions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

CREATE INDEX IF NOT EXISTS idx_substitutions_institution ON substitutions(institution_id);
CREATE INDEX IF NOT EXISTS idx_substitutions_date ON substitutions(substitute_date);
