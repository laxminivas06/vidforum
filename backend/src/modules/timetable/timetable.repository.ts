import { db } from '../../config/database';

export interface RoomData {
  id: string;
  institutionId: string;
  name: string;
  capacity: number;
  roomType: string;
  createdAt: string;
}

export interface PeriodData {
  id: string;
  institutionId: string;
  name: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  sequenceOrder: number;
  createdAt: string;
}

export interface TimetableData {
  id: string;
  institutionId: string;
  academicYearId: string;
  classId?: string | null;
  sectionId?: string | null;
  name: string;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableEntryData {
  id: string;
  institutionId: string;
  timetableId: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  roomId?: string | null;
  dayOfWeek: string;
  periodId: string;
  createdAt: string;
  // Joined fields
  periodName?: string;
  startTime?: string;
  endTime?: string;
  subjectName?: string;
  subjectCode?: string;
  facultyName?: string;
  roomName?: string;
  sectionName?: string;
  className?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: Array<{
    type: 'TEACHER_DOUBLE_BOOKING' | 'ROOM_DOUBLE_BOOKING' | 'SECTION_DOUBLE_BOOKING' | 'BREAK_PERIOD_OVERLAP' | 'INVALID_ALLOCATION';
    message: string;
    details?: any;
  }>;
}

export function normalizeDayOfWeek(day: string): string {
  const d = (day || '').trim().toLowerCase();
  if (['mon', 'monday'].includes(d)) return 'mon';
  if (['tue', 'tuesday'].includes(d)) return 'tue';
  if (['wed', 'wednesday'].includes(d)) return 'wed';
  if (['thu', 'thursday'].includes(d)) return 'thu';
  if (['fri', 'friday'].includes(d)) return 'fri';
  if (['sat', 'saturday'].includes(d)) return 'sat';
  if (['sun', 'sunday'].includes(d)) return 'sun';
  return d;
}

export class TimetableRepository {
  // ================= ROOMS =================
  async listRooms(institutionId: string): Promise<RoomData[]> {
    const res = await db.query(
      `SELECT id, institution_id as "institutionId", name, capacity, room_type as "roomType", created_at as "createdAt"
       FROM rooms
       WHERE institution_id = $1
       ORDER BY name ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async getRoomById(institutionId: string, id: string): Promise<RoomData | null> {
    const res = await db.query(
      `SELECT id, institution_id as "institutionId", name, capacity, room_type as "roomType", created_at as "createdAt"
       FROM rooms
       WHERE institution_id = $1 AND id = $2`,
      [institutionId, id]
    );
    return res.rows[0] || null;
  }

  async createRoom(institutionId: string, data: { name: string; capacity?: number; roomType?: string }): Promise<RoomData> {
    const res = await db.query(
      `INSERT INTO rooms (institution_id, name, capacity, room_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id, institution_id as "institutionId", name, capacity, room_type as "roomType", created_at as "createdAt"`,
      [institutionId, data.name, data.capacity ?? 40, data.roomType ?? 'classroom']
    );
    return res.rows[0];
  }

  async updateRoom(institutionId: string, id: string, data: Partial<{ name: string; capacity: number; roomType: string }>): Promise<RoomData | null> {
    const fields: string[] = [];
    const values: any[] = [institutionId, id];

    if (data.name !== undefined) {
      values.push(data.name);
      fields.push(`name = $${values.length}`);
    }
    if (data.capacity !== undefined) {
      values.push(data.capacity);
      fields.push(`capacity = $${values.length}`);
    }
    if (data.roomType !== undefined) {
      values.push(data.roomType);
      fields.push(`room_type = $${values.length}`);
    }

    if (fields.length === 0) return this.getRoomById(institutionId, id);

    const res = await db.query(
      `UPDATE rooms SET ${fields.join(', ')}
       WHERE institution_id = $1 AND id = $2
       RETURNING id, institution_id as "institutionId", name, capacity, room_type as "roomType", created_at as "createdAt"`,
      values
    );
    return res.rows[0] || null;
  }

  async deleteRoom(institutionId: string, id: string): Promise<boolean> {
    const res = await db.query(`DELETE FROM rooms WHERE institution_id = $1 AND id = $2`, [institutionId, id]);
    return (res.rowCount || 0) > 0;
  }

  // ================= PERIODS =================
  async listPeriods(institutionId: string): Promise<PeriodData[]> {
    const res = await db.query(
      `SELECT id, institution_id as "institutionId", name, start_time as "startTime", end_time as "endTime",
              is_break as "isBreak", sequence_order as "sequenceOrder", created_at as "createdAt"
       FROM periods
       WHERE institution_id = $1
       ORDER BY sequence_order ASC, start_time ASC`,
      [institutionId]
    );
    return res.rows;
  }

  async getPeriodById(institutionId: string, id: string): Promise<PeriodData | null> {
    const res = await db.query(
      `SELECT id, institution_id as "institutionId", name, start_time as "startTime", end_time as "endTime",
              is_break as "isBreak", sequence_order as "sequenceOrder", created_at as "createdAt"
       FROM periods
       WHERE institution_id = $1 AND id = $2`,
      [institutionId, id]
    );
    return res.rows[0] || null;
  }

  async createPeriod(institutionId: string, data: { name: string; startTime: string; endTime: string; isBreak?: boolean; sequenceOrder: number }): Promise<PeriodData> {
    const res = await db.query(
      `INSERT INTO periods (institution_id, name, start_time, end_time, is_break, sequence_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, institution_id as "institutionId", name, start_time as "startTime", end_time as "endTime",
                 is_break as "isBreak", sequence_order as "sequenceOrder", created_at as "createdAt"`,
      [institutionId, data.name, data.startTime, data.endTime, data.isBreak ?? false, data.sequenceOrder]
    );
    return res.rows[0];
  }

  async updatePeriod(institutionId: string, id: string, data: Partial<{ name: string; startTime: string; endTime: string; isBreak: boolean; sequenceOrder: number }>): Promise<PeriodData | null> {
    const fields: string[] = [];
    const values: any[] = [institutionId, id];

    if (data.name !== undefined) {
      values.push(data.name);
      fields.push(`name = $${values.length}`);
    }
    if (data.startTime !== undefined) {
      values.push(data.startTime);
      fields.push(`start_time = $${values.length}`);
    }
    if (data.endTime !== undefined) {
      values.push(data.endTime);
      fields.push(`end_time = $${values.length}`);
    }
    if (data.isBreak !== undefined) {
      values.push(data.isBreak);
      fields.push(`is_break = $${values.length}`);
    }
    if (data.sequenceOrder !== undefined) {
      values.push(data.sequenceOrder);
      fields.push(`sequence_order = $${values.length}`);
    }

    if (fields.length === 0) return this.getPeriodById(institutionId, id);

    const res = await db.query(
      `UPDATE periods SET ${fields.join(', ')}
       WHERE institution_id = $1 AND id = $2
       RETURNING id, institution_id as "institutionId", name, start_time as "startTime", end_time as "endTime",
                 is_break as "isBreak", sequence_order as "sequenceOrder", created_at as "createdAt"`,
      values
    );
    return res.rows[0] || null;
  }

  async deletePeriod(institutionId: string, id: string): Promise<boolean> {
    const res = await db.query(`DELETE FROM periods WHERE institution_id = $1 AND id = $2`, [institutionId, id]);
    return (res.rowCount || 0) > 0;
  }

  // ================= TIMETABLES =================
  async listTimetables(institutionId: string, filters?: { academicYearId?: string; classId?: string; sectionId?: string; isPublished?: boolean }): Promise<TimetableData[]> {
    let query = `
      SELECT t.id, t.institution_id as "institutionId", t.academic_year_id as "academicYearId",
             t.class_id as "classId", t.section_id as "sectionId", t.name,
             t.is_published as "isPublished", t.published_at as "publishedAt",
             t.created_at as "createdAt", t.updated_at as "updatedAt"
      FROM timetables t
      WHERE t.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters?.academicYearId) {
      params.push(filters.academicYearId);
      query += ` AND t.academic_year_id = $${params.length}`;
    }
    if (filters?.classId) {
      params.push(filters.classId);
      query += ` AND t.class_id = $${params.length}`;
    }
    if (filters?.sectionId) {
      params.push(filters.sectionId);
      query += ` AND t.section_id = $${params.length}`;
    }
    if (filters?.isPublished !== undefined) {
      params.push(filters.isPublished);
      query += ` AND t.is_published = $${params.length}`;
    }

    query += ' ORDER BY t.created_at DESC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async getTimetableById(institutionId: string, id: string): Promise<TimetableData | null> {
    const res = await db.query(
      `SELECT t.id, t.institution_id as "institutionId", t.academic_year_id as "academicYearId",
              t.class_id as "classId", t.section_id as "sectionId", t.name,
              t.is_published as "isPublished", t.published_at as "publishedAt",
              t.created_at as "createdAt", t.updated_at as "updatedAt"
       FROM timetables t
       WHERE t.institution_id = $1 AND t.id = $2`,
      [institutionId, id]
    );
    return res.rows[0] || null;
  }

  async createTimetable(institutionId: string, data: { academicYearId: string; classId?: string | null; sectionId?: string | null; name: string }): Promise<TimetableData> {
    const res = await db.query(
      `INSERT INTO timetables (institution_id, academic_year_id, class_id, section_id, name, is_published)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING id, institution_id as "institutionId", academic_year_id as "academicYearId",
                 class_id as "classId", section_id as "sectionId", name,
                 is_published as "isPublished", published_at as "publishedAt",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [institutionId, data.academicYearId, data.classId || null, data.sectionId || null, data.name]
    );
    return res.rows[0];
  }

  async deleteTimetable(institutionId: string, id: string): Promise<boolean> {
    const res = await db.query(`DELETE FROM timetables WHERE institution_id = $1 AND id = $2`, [institutionId, id]);
    return (res.rowCount || 0) > 0;
  }

  // ================= TIMETABLE ENTRIES =================
  async listEntries(institutionId: string, filters: { timetableId?: string; sectionId?: string; facultyId?: string; roomId?: string; dayOfWeek?: string; periodId?: string }): Promise<TimetableEntryData[]> {
    let query = `
      SELECT 
        te.id,
        te.institution_id as "institutionId",
        te.timetable_id as "timetableId",
        te.section_id as "sectionId",
        te.subject_id as "subjectId",
        te.faculty_id as "facultyId",
        te.room_id as "roomId",
        te.day_of_week as "dayOfWeek",
        te.period_id as "periodId",
        te.created_at as "createdAt",
        p.name as "periodName",
        p.start_time as "startTime",
        p.end_time as "endTime",
        sub.name as "subjectName",
        sub.code as "subjectCode",
        prof.full_name as "facultyName",
        r.name as "roomName",
        sec.name as "sectionName",
        c.name as "className"
      FROM timetable_entries te
      JOIN periods p ON p.id = te.period_id
      JOIN subjects sub ON sub.id = te.subject_id
      JOIN sections sec ON sec.id = te.section_id
      LEFT JOIN classes c ON c.id = sec.class_id
      LEFT JOIN staff st ON st.id = te.faculty_id
      LEFT JOIN profiles prof ON prof.id = st.profile_id
      LEFT JOIN rooms r ON r.id = te.room_id
      WHERE te.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters.timetableId) {
      params.push(filters.timetableId);
      query += ` AND te.timetable_id = $${params.length}`;
    }
    if (filters.sectionId) {
      params.push(filters.sectionId);
      query += ` AND te.section_id = $${params.length}`;
    }
    if (filters.facultyId) {
      params.push(filters.facultyId);
      query += ` AND te.faculty_id = $${params.length}`;
    }
    if (filters.roomId) {
      params.push(filters.roomId);
      query += ` AND te.room_id = $${params.length}`;
    }
    if (filters.dayOfWeek) {
      params.push(normalizeDayOfWeek(filters.dayOfWeek));
      query += ` AND te.day_of_week = $${params.length}`;
    }
    if (filters.periodId) {
      params.push(filters.periodId);
      query += ` AND te.period_id = $${params.length}`;
    }

    query += ' ORDER BY te.day_of_week, p.sequence_order ASC, p.start_time ASC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async getEntryById(institutionId: string, id: string): Promise<TimetableEntryData | null> {
    const list = await this.listEntries(institutionId, {});
    return list.find((e) => e.id === id) || null;
  }

  async createEntry(institutionId: string, data: {
    timetableId: string;
    sectionId: string;
    subjectId: string;
    facultyId: string;
    roomId?: string | null;
    dayOfWeek: string;
    periodId: string;
  }): Promise<TimetableEntryData> {
    const day = normalizeDayOfWeek(data.dayOfWeek);
    const res = await db.query(
      `INSERT INTO timetable_entries (institution_id, timetable_id, section_id, subject_id, faculty_id, room_id, day_of_week, period_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, institution_id as "institutionId", timetable_id as "timetableId", section_id as "sectionId",
                 subject_id as "subjectId", faculty_id as "facultyId", room_id as "roomId", day_of_week as "dayOfWeek",
                 period_id as "periodId", created_at as "createdAt"`,
      [institutionId, data.timetableId, data.sectionId, data.subjectId, data.facultyId, data.roomId || null, day, data.periodId]
    );
    const created = await this.getEntryById(institutionId, res.rows[0].id);
    return created || res.rows[0];
  }

  async deleteEntry(institutionId: string, id: string): Promise<boolean> {
    const res = await db.query(`DELETE FROM timetable_entries WHERE institution_id = $1 AND id = $2`, [institutionId, id]);
    return (res.rowCount || 0) > 0;
  }

  // ================= CONFLICT DETECTION ENGINE =================
  async checkCandidateConflicts(institutionId: string, candidate: {
    timetableId?: string;
    sectionId: string;
    facultyId: string;
    roomId?: string | null;
    dayOfWeek: string;
    periodId: string;
    excludeEntryId?: string;
  }): Promise<ConflictResult> {
    const day = normalizeDayOfWeek(candidate.dayOfWeek);
    const conflicts: ConflictResult['conflicts'] = [];

    // 1. Break Period Check
    const periodRes = await db.query(`SELECT id, name, is_break FROM periods WHERE institution_id = $1 AND id = $2`, [institutionId, candidate.periodId]);
    if (periodRes.rows.length === 0) {
      conflicts.push({
        type: 'INVALID_ALLOCATION',
        message: 'Specified period does not exist for this institution',
      });
      return { hasConflict: true, conflicts };
    }
    if (periodRes.rows[0].is_break) {
      conflicts.push({
        type: 'BREAK_PERIOD_OVERLAP',
        message: `Cannot schedule class during break period "${periodRes.rows[0].name}"`,
        details: { periodId: candidate.periodId, periodName: periodRes.rows[0].name },
      });
    }

    // 2. Teacher Double-Booking Check
    const teacherExclude = candidate.excludeEntryId ? ` AND te.id != '${candidate.excludeEntryId}'` : '';
    const teacherConflict = await db.query(
      `SELECT te.id, te.section_id, sec.name as section_name, c.name as class_name, sub.name as subject_name,
              p.name as period_name, prof.full_name as teacher_name
       FROM timetable_entries te
       JOIN periods p ON p.id = te.period_id
       JOIN subjects sub ON sub.id = te.subject_id
       JOIN sections sec ON sec.id = te.section_id
       LEFT JOIN classes c ON c.id = sec.class_id
       JOIN staff st ON st.id = te.faculty_id
       JOIN profiles prof ON prof.id = st.profile_id
       WHERE te.institution_id = $1 AND te.faculty_id = $2 AND te.day_of_week = $3 AND te.period_id = $4${teacherExclude}`,
      [institutionId, candidate.facultyId, day, candidate.periodId]
    );

    if (teacherConflict.rows.length > 0) {
      const row = teacherConflict.rows[0];
      conflicts.push({
        type: 'TEACHER_DOUBLE_BOOKING',
        message: `Teacher ${row.teacher_name} is already assigned to ${row.class_name ? row.class_name + ' - ' : ''}${row.section_name} (${row.subject_name}) during ${row.period_name} on ${day}`,
        details: row,
      });
    }

    // 3. Room Double-Booking Check (if room assigned)
    if (candidate.roomId) {
      const roomExclude = candidate.excludeEntryId ? ` AND te.id != '${candidate.excludeEntryId}'` : '';
      const roomConflict = await db.query(
        `SELECT te.id, r.name as room_name, sec.name as section_name, c.name as class_name,
                sub.name as subject_name, p.name as period_name
         FROM timetable_entries te
         JOIN periods p ON p.id = te.period_id
         JOIN subjects sub ON sub.id = te.subject_id
         JOIN sections sec ON sec.id = te.section_id
         LEFT JOIN classes c ON c.id = sec.class_id
         JOIN rooms r ON r.id = te.room_id
         WHERE te.institution_id = $1 AND te.room_id = $2 AND te.day_of_week = $3 AND te.period_id = $4${roomExclude}`,
        [institutionId, candidate.roomId, day, candidate.periodId]
      );

      if (roomConflict.rows.length > 0) {
        const row = roomConflict.rows[0];
        conflicts.push({
          type: 'ROOM_DOUBLE_BOOKING',
          message: `Room "${row.room_name}" is already booked for ${row.class_name ? row.class_name + ' - ' : ''}${row.section_name} during ${row.period_name} on ${day}`,
          details: row,
        });
      }
    }

    // 4. Section Double-Booking Check
    const sectionExclude = candidate.excludeEntryId ? ` AND te.id != '${candidate.excludeEntryId}'` : '';
    const sectionConflict = await db.query(
      `SELECT te.id, sub.name as subject_name, p.name as period_name, sec.name as section_name
       FROM timetable_entries te
       JOIN periods p ON p.id = te.period_id
       JOIN subjects sub ON sub.id = te.subject_id
       JOIN sections sec ON sec.id = te.section_id
       WHERE te.institution_id = $1 AND te.section_id = $2 AND te.day_of_week = $3 AND te.period_id = $4${sectionExclude}`,
      [institutionId, candidate.sectionId, day, candidate.periodId]
    );

    if (sectionConflict.rows.length > 0) {
      const row = sectionConflict.rows[0];
      conflicts.push({
        type: 'SECTION_DOUBLE_BOOKING',
        message: `Section "${row.section_name}" already has ${row.subject_name} scheduled during ${row.period_name} on ${day}`,
        details: row,
      });
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  async checkTimetableConflicts(institutionId: string, timetableId: string): Promise<ConflictResult> {
    const entries = await this.listEntries(institutionId, { timetableId });
    const allConflicts: ConflictResult['conflicts'] = [];

    // Map to check duplicates among entries of this timetable
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      // Check against candidate check
      const res = await this.checkCandidateConflicts(institutionId, {
        timetableId,
        sectionId: e.sectionId,
        facultyId: e.facultyId,
        roomId: e.roomId,
        dayOfWeek: e.dayOfWeek,
        periodId: e.periodId,
        excludeEntryId: e.id,
      });

      for (const c of res.conflicts) {
        if (!allConflicts.some((existing) => existing.message === c.message)) {
          allConflicts.push(c);
        }
      }
    }

    return {
      hasConflict: allConflicts.length > 0,
      conflicts: allConflicts,
    };
  }

  // ================= PUBLISHING =================
  async setPublishStatus(institutionId: string, id: string, isPublished: boolean): Promise<TimetableData | null> {
    const res = await db.query(
      `UPDATE timetables
       SET is_published = $3,
           published_at = CASE WHEN $3 = true THEN now() ELSE NULL END,
           updated_at = now()
       WHERE institution_id = $1 AND id = $2
       RETURNING id, institution_id as "institutionId", academic_year_id as "academicYearId",
                 class_id as "classId", section_id as "sectionId", name,
                 is_published as "isPublished", published_at as "publishedAt",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [institutionId, id, isPublished]
    );
    return res.rows[0] || null;
  }

  // ================= SUBSTITUTIONS =================
  async listSubstitutions(institutionId: string, filters?: { date?: string; staffId?: string }): Promise<any[]> {
    let query = `
      SELECT sub.id, sub.institution_id as "institutionId", sub.timetable_entry_id as "timetableEntryId",
             sub.substitute_date as "substituteDate", sub.original_staff_id as "originalStaffId",
             sub.substitute_staff_id as "substituteStaffId", sub.reason, sub.status, sub.created_at as "createdAt",
             p_orig.full_name as "originalTeacherName",
             p_sub.full_name as "substituteTeacherName",
             subj.name as "subjectName",
             p.name as "periodName",
             p.start_time as "startTime",
             p.end_time as "endTime",
             sec.name as "sectionName"
      FROM substitutions sub
      JOIN timetable_entries te ON te.id = sub.timetable_entry_id
      JOIN periods p ON p.id = te.period_id
      JOIN subjects subj ON subj.id = te.subject_id
      JOIN sections sec ON sec.id = te.section_id
      JOIN staff s_orig ON s_orig.id = sub.original_staff_id
      JOIN profiles p_orig ON p_orig.id = s_orig.profile_id
      JOIN staff s_sub ON s_sub.id = sub.substitute_staff_id
      JOIN profiles p_sub ON p_sub.id = s_sub.profile_id
      WHERE sub.institution_id = $1
    `;
    const params: any[] = [institutionId];

    if (filters?.date) {
      params.push(filters.date);
      query += ` AND sub.substitute_date = $${params.length}`;
    }
    if (filters?.staffId) {
      params.push(filters.staffId);
      query += ` AND (sub.original_staff_id = $${params.length} OR sub.substitute_staff_id = $${params.length})`;
    }

    query += ' ORDER BY sub.substitute_date DESC, p.sequence_order ASC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async createSubstitution(institutionId: string, data: {
    timetableEntryId: string;
    substituteDate: string;
    originalStaffId: string;
    substituteStaffId: string;
    reason?: string;
  }): Promise<any> {
    const res = await db.query(
      `INSERT INTO substitutions (institution_id, timetable_entry_id, substitute_date, original_staff_id, substitute_staff_id, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'approved')
       RETURNING *`,
      [institutionId, data.timetableEntryId, data.substituteDate, data.originalStaffId, data.substituteStaffId, data.reason || null]
    );
    return res.rows[0];
  }

  // ================= SCOPED TIMETABLE RETRIEVAL =================
  async getScopedSchedule(institutionId: string, user: { id: string; role: string }, options: { date?: string; dayOfWeek?: string }): Promise<any> {
    const roleUpper = (user.role || '').toUpperCase();
    const day = options.dayOfWeek ? normalizeDayOfWeek(options.dayOfWeek) : undefined;
    const targetDate = options.date || new Date().toISOString().split('T')[0];

    // If Student or Parent
    if (roleUpper === 'STUDENT' || roleUpper === 'PARENT') {
      // Find student record linked to user
      const studentRes = await db.query(
        `SELECT s.id, s.current_section_id
         FROM students s
         WHERE s.institution_id = $1 AND (s.user_id = $2 OR s.id = $2 OR EXISTS (
           SELECT 1 FROM student_parent_links spl WHERE spl.student_id = s.id AND spl.parent_id = $2
         ))
         LIMIT 1`,
        [institutionId, user.id]
      );

      if (studentRes.rows.length === 0 || !studentRes.rows[0].current_section_id) {
        return { entries: [], substitutions: [], message: 'No active section enrollment found for student' };
      }

      const sectionId = studentRes.rows[0].current_section_id;

      // Get published timetable entries for this section
      let entryQuery = `
        SELECT te.*, p.name as "periodName", p.start_time as "startTime", p.end_time as "endTime",
               p.sequence_order as "sequenceOrder", sub.name as "subjectName", sub.code as "subjectCode",
               prof.full_name as "facultyName", r.name as "roomName"
        FROM timetable_entries te
        JOIN timetables t ON t.id = te.timetable_id
        JOIN periods p ON p.id = te.period_id
        JOIN subjects sub ON sub.id = te.subject_id
        JOIN staff st ON st.id = te.faculty_id
        JOIN profiles prof ON prof.id = st.profile_id
        LEFT JOIN rooms r ON r.id = te.room_id
        WHERE te.institution_id = $1 AND te.section_id = $2 AND t.is_published = true
      `;
      const params: any[] = [institutionId, sectionId];
      if (day) {
        params.push(day);
        entryQuery += ` AND te.day_of_week = $${params.length}`;
      }
      entryQuery += ` ORDER BY te.day_of_week, p.sequence_order ASC`;
      const entriesRes = await db.query(entryQuery, params);

      // Check substitutions for today
      const substitutions = await this.listSubstitutions(institutionId, { date: targetDate });

      return {
        sectionId,
        date: targetDate,
        entries: entriesRes.rows,
        substitutions,
      };
    }

    // If Faculty / Teacher
    if (roleUpper === 'TEACHER' || roleUpper === 'FACULTY') {
      const staffRes = await db.query(
        `SELECT id FROM staff WHERE institution_id = $1 AND (profile_id = $2 OR id = $2) LIMIT 1`,
        [institutionId, user.id]
      );
      if (staffRes.rows.length === 0) {
        return { entries: [], substitutions: [], message: 'Faculty profile not found' };
      }
      const staffId = staffRes.rows[0].id;

      let entryQuery = `
        SELECT te.*, p.name as "periodName", p.start_time as "startTime", p.end_time as "endTime",
               p.sequence_order as "sequenceOrder", sub.name as "subjectName", sub.code as "subjectCode",
               sec.name as "sectionName", c.name as "className", r.name as "roomName"
        FROM timetable_entries te
        JOIN timetables t ON t.id = te.timetable_id
        JOIN periods p ON p.id = te.period_id
        JOIN subjects sub ON sub.id = te.subject_id
        JOIN sections sec ON sec.id = te.section_id
        LEFT JOIN classes c ON c.id = sec.class_id
        LEFT JOIN rooms r ON r.id = te.room_id
        WHERE te.institution_id = $1 AND te.faculty_id = $2 AND t.is_published = true
      `;
      const params: any[] = [institutionId, staffId];
      if (day) {
        params.push(day);
        entryQuery += ` AND te.day_of_week = $${params.length}`;
      }
      entryQuery += ` ORDER BY te.day_of_week, p.sequence_order ASC`;
      const entriesRes = await db.query(entryQuery, params);

      // Check substitutions where this faculty is original or substitute
      const substitutions = await this.listSubstitutions(institutionId, { date: targetDate, staffId });

      return {
        staffId,
        date: targetDate,
        entries: entriesRes.rows,
        substitutions,
      };
    }

    // Admin / Institution Admin -> Full view
    return {
      message: 'Admin view: select section or faculty to inspect',
      date: targetDate,
    };
  }
}

export const timetableRepository = new TimetableRepository();
