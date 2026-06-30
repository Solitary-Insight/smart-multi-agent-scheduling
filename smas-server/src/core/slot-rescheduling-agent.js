"use strict";

const { RescheduleError, ERROR_CODES } = require("../utils/error");

/**
 * slot-rescheduling-agent.js  (v4)
 *
 * Fixes vs v3:
 *  1. minutesToTime produces "HH:MM:SS" to match DB storage — so clash-key
 *     comparisons work correctly.
 *  2. Days for date-calculation are loaded separately (ALL week_days, not just
 *     non-holiday ones) so getBestRescheduleDate never returns null.
 *  3. Existing rescheduled_slots are injected into the existingState so the
 *     engine sees those rooms/teachers/students as occupied.
 *  4. Clash guard now correctly matches keys because time formats align.
 *  5. Search starts from preferred day; tier-2/3 sort by circular day distance.
 *  6. reschedule_date is always strictly tomorrow or later.
 */

const {
  loadData,
  getSemesterConfig,
  generateSlots,
  preprocessAvailability,
  evaluatePlacement,
  initialState,
  timeToMinutes,
  buildTeacherNameMap,
  explainBlockingForItem,
} = require("./beam-search-scheduling");

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

async function rescheduleTimetableSlot({
  slotId,
  teacherId,
  preferredDayId,
  getDB,
  rescheduledBy = null,
  reason = "manual reschedule",
  persist = false,
  referenceDate = null,
  options: userOptions = {},
}) {
  const db = getDB();

  // ── 1. Load scheduler data ──────────────────────────────────────────────
  const config = await getSemesterConfig({ getDB });
  const data   = await loadData({ getDB });
  preprocessAvailability(data);

  // ── 1b. Load ALL week_days (loadData only fetches non-holiday ones) ──────
  //  We need the full list for date calculation; we keep data.days untouched
  //  for the scheduling engine (it should only see non-holiday days).
  const [allWeekDays] = await db.execute(`SELECT * FROM week_days ORDER BY id`);

  // ── 2. Fetch the target slot ─────────────────────────────────────────────
  const [targetRows] = await db.execute(
    `SELECT ts.*, wd.name AS day_name, wd.is_holiday,
            c.course_name, c.course_code, c.credit_hours,
            cr.name AS classroom_name, cr.capacity
     FROM   timetable_slots ts
     JOIN   week_days  wd ON wd.id  = ts.day_id
     JOIN   courses    c  ON c.id   = ts.course_id
     JOIN   classrooms cr ON cr.id  = ts.classroom_id
     WHERE  ts.id = ?
     LIMIT  1`,
    [slotId]
  );

  if (!targetRows.length) {
    throw new RescheduleError(
      `Timetable slot #${slotId} not found.`,
      ERROR_CODES.SLOT_NOT_FOUND,
      { slotId }
    );
  }

  const targetRow   = targetRows[0];
  const timetableId = Number(targetRow.timetable_id);

  // ── 3. Validate teacher ──────────────────────────────────────────────────
  const [teacherCheck] = await db.execute(
    `SELECT c.teacher_id
     FROM   timetable_slots ts
     JOIN   courses c ON c.id = ts.course_id
     WHERE  ts.id = ? AND c.teacher_id = ?
     LIMIT  1`,
    [slotId, teacherId]
  );
  if (!teacherCheck.length) {
    throw new RescheduleError(
      `Teacher #${teacherId} is not assigned to slot #${slotId}.`,
      ERROR_CODES.INVALID_TEACHER,
      { slotId, teacherId }
    );
  }

  // ── 4. Sibling rows (merged slots must move together) ───────────────────
  const [allRows] = await db.execute(
    `SELECT * FROM timetable_slots WHERE timetable_id = ?`,
    [timetableId]
  );
  const siblingIds = getSiblingRowIds(allRows, targetRow);

  // ── 5. Build scheduling objects ──────────────────────────────────────────
  const targetGroup = buildGroupFromRows(
    allRows.filter(r => siblingIds.includes(Number(r.id))),
    data
  );

  // Base state = all other regular slots (siblings excluded)
  const existingState = buildStateFromRows(
    allRows.filter(r => !siblingIds.includes(Number(r.id))),
    data
  );

  // ── 6. Inject active rescheduled_slots into the state ───────────────────
  //
  // The scheduling engine only knows about timetable_slots. Any slot that
  // has already been rescheduled occupies a different (date, room, time).
  // We must mark those occupancies so the engine does not double-book them.
  //
  // We also build the clash-guard Set at the same time.
  const { alreadyRescheduledSlots } =
    await injectRescheduledSlots(db, existingState, data, referenceDate, allWeekDays);

  // ── 7. Generate time slots ───────────────────────────────────────────────
  const slots = generateSlots(config, data.days);

  // ── 8. Availability helpers ──────────────────────────────────────────────
  const teacherAvailableDayIds = getTeacherAvailableDayIds(data, teacherId);
  const nonHolidayDayIds = new Set(
    data.days.filter(d => !d.is_holiday).map(d => Number(d.id))
  );

  // ── 9. Scheduler options ─────────────────────────────────────────────────
  const options = {
    allowConflicts: false,
    noOverlaps: true,
    applyRoomConstraint: true,
    enforceTeacherDepartment: userOptions.enforceTeacherDepartment ?? false,
    allowTeacherPreference: userOptions.allowTeacherPreference ?? false,
    optimizeRooms: userOptions.optimizeRooms ?? false,
    ...userOptions,
  };

  // ── 10. Tier-based search ────────────────────────────────────────────────
  const candidate = findBestCandidate({
    existingState,
    targetGroup,
    data,
    slots,
    preferredDayId:        Number(preferredDayId),
    teacherAvailableDayIds,
    nonHolidayDayIds,
    options,
    alreadyRescheduledSlots,
    allWeekDays,
    referenceDate,
  });

  // ── 11. Nothing found ────────────────────────────────────────────────────
  if (!candidate) {
    const explanation = explainBlockingForItem(
      existingState,
      { group: targetGroup },
      data,
      slots,
      options
    );
    throw new RescheduleError(
      buildErrorMessage({ slotId, targetGroup, preferredDayId, explanation }),
      ERROR_CODES.RESCHEDULE_NOT_FOUND,
      { slotId, preferredDayId, explanation, group: targetGroup?.id }
    );
  }

  // ── 12. Build preview ────────────────────────────────────────────────────
  const preview = buildPreviewPayload({
    slotId,
    siblingIds,
    timetableId,
    targetRow,
    candidate,
    reason,
    rescheduledBy,
    data,
    allWeekDays,
  });

  // ── 13. Persist if requested ─────────────────────────────────────────────
  if (persist) {
    await persistReschedule({ db, siblingIds, preview });
  }

  return { persisted: persist, ...preview };
}

// ---------------------------------------------------------------------------
// Inject active rescheduled_slots into the existing state
// ---------------------------------------------------------------------------

/**
 * Reads all ACTIVE rows from rescheduled_slots and:
 *   a) Marks their (room, teacher-implied, student-implied) occupancy in `state`
 *      using the WEEKLY day_id key (not the calendar date) so the scheduling
 *      engine's slot-key format matches.
 *   b) Builds a Set of "date|classroomId|HH:MM:SS|HH:MM:SS" keys for the
 *      clash guard (exact date + room + time).
 *
 * The state occupancy prevents the engine from picking the same weekly slot
 * again. The clash-guard Set prevents picking a slot whose projected calendar
 * date is already booked.
 */
async function injectRescheduledSlots(db, state, data, referenceDate, allWeekDays) {
  const [rows] = await db.execute(
    `SELECT rs.*, ts.course_id, ts.merge_id
     FROM   rescheduled_slots rs
     JOIN   timetable_slots   ts ON ts.id = rs.slot_id
     WHERE  rs.status = 'active'`
  );

  const alreadyRescheduledSlots = new Set();

  for (const r of rows) {
    const dayId    = Number(r.new_day_id);
    const roomId   = Number(r.new_classroom_id);
    const startMin = timeToMinutes(r.new_start_time);
    const endMin   = timeToMinutes(r.new_end_time);

    if (startMin == null || endMin == null) continue;

    const slotKey = `${dayId}_${startMin}_${endMin}`;

    // Mark room as occupied for this weekly slot
    state.occupiedRooms[`${roomId}_${slotKey}`] = true;

    // Mark teacher(s) for the course as occupied
    const course = data.courseById.get(Number(r.course_id));
    if (course) {
      const teacherId = Number(course.teacher_id);
      state.occupiedTeachers[`${teacherId}_${slotKey}`] = true;

      // Mark enrolled students
      const students = data.courseStudentsMap.get(Number(r.course_id));
      if (students) {
        for (const sid of students) {
          state.occupiedStudents[`${sid}_${slotKey}`] = true;
        }
      }
    }

    // Clash guard: exact calendar date + room + time
    const dateStr = toDateString(r.reschedule_date);
    const startT  = ensureSeconds(r.new_start_time);
    const endT    = ensureSeconds(r.new_end_time);
    alreadyRescheduledSlots.add(`${dateStr}|${roomId}|${startT}|${endT}`);
  }

  return { alreadyRescheduledSlots };
}

// ---------------------------------------------------------------------------
// Clash-guard key helpers
// ---------------------------------------------------------------------------

function makeRescheduleKey(dateStr, classroomId, startTime, endTime) {
  return `${dateStr}|${classroomId}|${ensureSeconds(startTime)}|${ensureSeconds(endTime)}`;
}

/** Ensure "HH:MM:SS" — minutesToTime returns "HH:MM", DB stores "HH:MM:SS" */
function ensureSeconds(t) {
  if (!t) return "";
  const s = String(t).trim();
  // Already has seconds
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  // HH:MM → HH:MM:SS
  if (/^\d{2}:\d{2}$/.test(s)) return s + ":00";
  return s;
}

function toDateString(d) {
  if (!d) return "";
  if (typeof d === "string") return d.slice(0, 10);
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return String(d).slice(0, 10);
}

// ---------------------------------------------------------------------------
// Calendar date: strictly future (tomorrow at earliest)
// ---------------------------------------------------------------------------

/**
 * Returns the next calendar date STRICTLY AFTER TODAY whose weekday = dayId.
 *
 * week_days schema:  1=Mon … 6=Sat, 7=Sun
 * JS Date.getDay():  0=Sun, 1=Mon … 6=Sat
 * Mapping: jsDow = dayId % 7
 *
 * Uses allWeekDays (full table) so it works for any day_id.
 * Returns "YYYY-MM-DD" in local time.
 */
function getBestRescheduleDate(dayId, allWeekDays, referenceDate) {
  // Verify the day exists in the DB (use allWeekDays, not just non-holiday)
  const dayRow = allWeekDays.find(d => Number(d.id) === Number(dayId));
  if (!dayRow) return null;

  const targetDow = Number(dayId) % 7; // 1→1 Mon … 6→6 Sat, 7→0 Sun

  // Base = tomorrow so result is always strictly in the future
  const base = referenceDate ? new Date(referenceDate) : new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + 1); // start from tomorrow

  const tomorrowDow = base.getDay();
  const diff = (targetDow - tomorrowDow + 7) % 7; // 0 = tomorrow is already that weekday

  const result = new Date(base);
  result.setDate(base.getDate() + diff);

  const yyyy = result.getFullYear();
  const mm   = String(result.getMonth() + 1).padStart(2, "0");
  const dd   = String(result.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// Tier-based candidate search
// ---------------------------------------------------------------------------

function findBestCandidate({
  existingState,
  targetGroup,
  data,
  slots,
  preferredDayId,
  teacherAvailableDayIds,
  nonHolidayDayIds,
  options,
  alreadyRescheduledSlots,
  allWeekDays,
  referenceDate,
}) {
  // Hard violations that can never be relaxed
  const ALWAYS_HARD = new Set([
    "break_conflict",
    "teacher_overlap",
    "room_overlap",
    "student_overlap",
    "group_overlap",
    "capacity_insufficient",
    "class_too_large",
  ]);

  function hasHardViolation(evalResult, relaxTeacher) {
    for (const v of evalResult.violations) {
      if (ALWAYS_HARD.has(v.code)) return true;
      if (!relaxTeacher && v.code === "teacher_unavailable") return true;
      if (options.enforceTeacherDepartment && v.code === "teacher_department_mismatch") return true;
    }
    return false;
  }

  /** Circular distance between two day_ids on a 7-day week (result 0–3). */
  function dayDistance(a, b) {
    const diff = Math.abs(Number(a) - Number(b));
    return Math.min(diff, 7 - diff);
  }

  /**
   * Collect all valid candidates for a tier, sorted by:
   *   1. circular distance from preferredDayId (preferred day = distance 0, wins)
   *   2. penalty score (lowest first)
   *   3. earliest start time
   *   4. room id (tie-break)
   */
  function collectTier(filterFn, relaxTeacher) {
    const results = [];
    for (const slot of slots) {
      if (!filterFn(slot)) continue;
      for (const room of data.classrooms) {
        const evalResult = evaluatePlacement(
          existingState,
          targetGroup,
          room,
          slot,
          data,
          { ...options, allowConflicts: relaxTeacher }
        );
        if (hasHardViolation(evalResult, relaxTeacher)) continue;
        results.push({ slot, room, evalResult, relaxTeacher });
      }
    }
    results.sort((a, b) => {
      const dA = dayDistance(a.slot.day_id, preferredDayId);
      const dB = dayDistance(b.slot.day_id, preferredDayId);
      if (dA !== dB) return dA - dB;
      if (a.evalResult.score !== b.evalResult.score) return a.evalResult.score - b.evalResult.score;
      if (a.slot.startMin !== b.slot.startMin) return a.slot.startMin - b.slot.startMin;
      return Number(a.room.id) - Number(b.room.id);
    });
    return results;
  }

  /**
   * Walk sorted candidates; return the first whose projected calendar
   * date + room + time is NOT already in alreadyRescheduledSlots.
   */
  function pickNonClashing(candidates, tier) {
    for (const c of candidates) {
      const date = getBestRescheduleDate(c.slot.day_id, allWeekDays, referenceDate);
      if (!date) continue;

      // Key uses ensureSeconds to match how the DB stores times
      const key = makeRescheduleKey(date, c.room.id, c.slot.start, c.slot.end);
      if (alreadyRescheduledSlots.has(key)) continue;

      return { ...c, tier, rescheduleDate: date };
    }
    return null;
  }

  // Tier 1 – preferred day, all hard constraints enforced
  const t1 = pickNonClashing(
    collectTier(s => Number(s.day_id) === preferredDayId, false),
    1
  );
  if (t1) return t1;

  // Tier 2 – any teacher-available day (not preferred), hard constraints
  const t2 = pickNonClashing(
    collectTier(
      s => Number(s.day_id) !== preferredDayId &&
           teacherAvailableDayIds.has(Number(s.day_id)),
      false
    ),
    2
  );
  if (t2) return t2;

  // Tier 3 – any non-holiday day, teacher availability relaxed
  const t3 = pickNonClashing(
    collectTier(s => nonHolidayDayIds.has(Number(s.day_id)), true),
    3
  );
  if (t3) return t3;

  return null;
}

// ---------------------------------------------------------------------------
// Preview payload builder
// ---------------------------------------------------------------------------

function buildPreviewPayload({
  slotId,
  siblingIds,
  timetableId,
  targetRow,
  candidate,
  reason,
  rescheduledBy,
  data,
  allWeekDays,
}) {
  const dayRow = allWeekDays.find(d => Number(d.id) === Number(candidate.slot.day_id));
  const room   = candidate.room;

  return {
    // what changes
    slot_id:          Number(slotId),
    sibling_slot_ids: siblingIds,
    timetable_id:     Number(timetableId),

    // from
    old_day_id:       Number(targetRow.day_id),
    old_start_time:   String(targetRow.start_time),
    old_end_time:     String(targetRow.end_time),
    old_classroom_id: Number(targetRow.classroom_id),

    // to
    new_day_id:         Number(candidate.slot.day_id),
    new_day_name:       dayRow?.name ?? null,
    new_start_time:     ensureSeconds(candidate.slot.start),
    new_end_time:       ensureSeconds(candidate.slot.end),
    new_classroom_id:   Number(room.id),
    new_classroom_name: room.name     ?? null,
    new_classroom_cap:  room.capacity ?? null,

    // calendar (always future, clash-free)
    reschedule_date: candidate.rescheduleDate, // "YYYY-MM-DD"

    // quality
    penalty:                      Number(candidate.evalResult.score || 0),
    tier:                         candidate.tier,  // 1=preferred 2=avail 3=relaxed
    teacher_availability_relaxed: !!candidate.relaxTeacher,
    violations:                   candidate.evalResult.violations,

    // meta
    reason,
    rescheduled_by: rescheduledBy,
  };
}

// ---------------------------------------------------------------------------
// DB persistence
// ---------------------------------------------------------------------------

async function persistReschedule({ db, siblingIds, preview }) {
  await db.beginTransaction();
  try {
    for (const rowId of siblingIds) {
      await db.execute(
        `INSERT INTO rescheduled_slots
           (slot_id, reschedule_date, new_day_id, new_start_time, new_end_time,
            new_classroom_id, reason, status, rescheduled_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
          Number(rowId),
          preview.reschedule_date,
          preview.new_day_id,
          preview.new_start_time,
          preview.new_end_time,
          preview.new_classroom_id,
          preview.reason,
          preview.rescheduled_by,
        ]
      );
    }
    await db.commit();
  } catch (e) {
    await db.rollback();
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSiblingRowIds(allRows, targetRow) {
  const mergeId = targetRow.merge_id ? Number(targetRow.merge_id) : null;
  if (mergeId != null) {
    return allRows
      .filter(r => Number(r.merge_id) === mergeId)
      .map(r => Number(r.id));
  }
  return [Number(targetRow.id)];
}

function buildGroupFromRows(rows, data) {
  if (!rows.length) throw new Error("buildGroupFromRows: no rows provided.");

  const courses       = [];
  const courseIds     = [];
  const courseNames   = [];
  const courseCodes   = [];
  const teacherIds    = new Set();
  const departmentIds = new Set();
  const studentIds    = new Set();
  const creditList    = [];
  let mergeId = null;

  for (const row of rows) {
    const course = data.courseById.get(Number(row.course_id));
    if (!course) continue;

    if (row.merge_id != null) mergeId = Number(row.merge_id);

    courses.push(course);
    courseIds.push(Number(course.id));
    courseNames.push(course.course_name);
    courseCodes.push(course.course_code);
    teacherIds.add(Number(course.teacher_id));
    departmentIds.add(Number(course.department_id));
    creditList.push(Number(course.credit_hours || 0));

    const students = data.courseStudentsMap.get(Number(course.id));
    if (students) students.forEach(sid => studentIds.add(Number(sid)));
  }

  if (!courses.length) throw new Error("buildGroupFromRows: no valid courses found.");

  const mergeName = mergeId != null
    ? (data.mergeNameMap?.get(mergeId) || `merge_${mergeId}`)
    : null;

  return {
    id:               mergeId != null ? `merge_${mergeId}` : `course_${courseIds[0]}`,
    type:             mergeId != null ? "combined" : "single",
    mergeId,
    mergeName,
    courses,
    courseIds,
    courseNames,
    courseCodes,
    teacherIds:       [...teacherIds],
    departmentIds:    [...departmentIds],
    studentIds:       [...studentIds],
    demand:           studentIds.size,
    creditHours:      Math.max(...creditList),
    courseCreditHours: creditList,
    _teacherNameMap:  buildTeacherNameMap(data),
  };
}

function buildStateFromRows(rows, data) {
  const state = initialState();

  for (const row of rows) {
    const course = data.courseById.get(Number(row.course_id));
    if (!course) continue;

    const teacherId = Number(course.teacher_id);
    const roomId    = Number(row.classroom_id);
    const dayId     = Number(row.day_id);
    const startMin  = timeToMinutes(row.start_time);
    const endMin    = timeToMinutes(row.end_time);
    const slotKey   = `${dayId}_${startMin}_${endMin}`;
    const groupKey  = row.merge_id != null
      ? `merge_${Number(row.merge_id)}`
      : `course_${Number(row.course_id)}`;

    state.occupiedTeachers[`${teacherId}_${slotKey}`] = true;
    state.occupiedRooms[`${roomId}_${slotKey}`]       = true;
    state.groupSlotMap[`${groupKey}_${slotKey}`]      = true;

    if (!state.groupDayMap[groupKey]) state.groupDayMap[groupKey] = new Set();
    state.groupDayMap[groupKey].add(dayId);

    const students = data.courseStudentsMap.get(Number(course.id));
    if (students) {
      students.forEach(sid => {
        state.occupiedStudents[`${sid}_${slotKey}`] = true;
      });
    }
  }

  return state;
}

function getTeacherAvailableDayIds(data, teacherId) {
  const set = data.availabilityMap?.get(Number(teacherId));
  return set ? new Set([...set].map(Number)) : new Set();
}

function buildErrorMessage({ slotId, targetGroup, preferredDayId, explanation }) {
  const topBlockers = (explanation?.reasons || [])
    .slice(0, 3)
    .map(r => `${r.key} (${r.count})`)
    .join(", ");

  const nearMiss = explanation?.bestNearMiss
    ? ` Nearest option: day ${explanation.bestNearMiss.day_id} ` +
      `${explanation.bestNearMiss.start_time}–${explanation.bestNearMiss.end_time}, ` +
      `room ${explanation.bestNearMiss.room_id}.`
    : "";

  return (
    `Unable to reschedule slot #${slotId} ` +
    `(${targetGroup?.mergeName || targetGroup?.courseNames?.[0] || targetGroup?.id}) ` +
    `to preferred day ${preferredDayId} or any available alternative.` +
    (topBlockers ? ` Top blockers: ${topBlockers}.` : "") +
    nearMiss
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { rescheduleTimetableSlot };