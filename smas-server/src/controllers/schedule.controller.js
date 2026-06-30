const { getDB } = require("../config/db");
const HttpStatusCodes = require("../development/HttpStatusCodes");
const SqlException = require("../development/SQL_EXCEPTIONS");
const { solveTimetable: beamSearchBasedScheduling } = require("../core/beam-search-scheduling.js");
const { solveTimetableParallel: beamSearchBasedSchedulingParallel } = require("../core/beam-search-scheduling.js");
const { solveTimetable: geneticSearchWithBeamScheduling } = require("../core/genetic-search-with-beam.js");
const os = require("os");
const path = require("path");
const { sendMessage } = require("../sockets/notification-socket.js");
const { sendAnnouncementEmailToMany } = require("../utils/email-handler/email-send.js");


exports.createSchedule = async (req, res) => {
  try {
    // ✅ 1. Default options
    const DEFAULTS = {
      nSolutions: 5,
      beamWidth: 80,
      restarts: os.availableParallelism?.() || 8,
      candidateLimit: 14,
      stopOnFirstValid: false,
      requireValidSolutions: true,
      noOverlaps: false,
      applyRoomConstraint: true,
      optimizeRooms: false,
      allowTeacherPreference: false,
      enforceTeacherDepartment: false,
      usePrerequisiteOrdering: true,
      onLogResponse: (log) => {
        // You now get structured logs
        console.log("CUSTOM LOG:", log);

        // OR send to frontend / websocket / file
        // ws.send(JSON.stringify(log));
      }
    };

    // ✅ 2. Merge body params with defaults
    const options = {
      ...DEFAULTS,
      ...(req.body || {}),
    };

    // ✅ 3. Run solver
    const result = await beamSearchBasedSchedulingParallel({
      getDB,
      ...options,
    });

    const validSolutions = result.solutions.filter(
      s => s.complete && s.hardViolations === 0
    );

    // ✅ 4. If no valid solution
    if (!validSolutions.length) {
      return res.status(HttpStatusCodes.OK).json({
        success: true,
        data: {
          ...result,
          usedOptions: options, // 👈 helpful for debugging
          message: "No conflict-free timetable found",
        },
        message: "Timetable generated, but no conflict-free solution was found",
      });
    }

    // ✅ 5. Format solutions for UI
    const topSolutions = validSolutions.map(s => ({
      complete: s.complete,
      score: s.score,
      hardViolations: s.hardViolations,
      scheduledCount: s.scheduledCount,
      unscheduledCount: s.unscheduledCount,

      timetable: s.timetable,

      issues: s.issues,
    }));

    // 🔹 Simple log
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Schedule Generated";
      const body = `Timetable generated with ${validSolutions.length} valid solutions. Best score: ${topSolutions[0]?.score ?? "N/A"}`;
      logger.add(heading, body);
    }

    // ✅ 6. Success response
    return res.status(HttpStatusCodes.OK).json({
      success: true,
      data: {
        ...result,
        usedOptions: options, // 👈 helpful for debugging
        bestSolution: topSolutions[0] || null,
      },
      message: "Timetable generated successfully",
    });

  } catch (err) {
    console.error(" Scheduler failed:", err);

    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: err.message || "Scheduler failed",
    });
  }
};

const getSemesterConfig = async (conn) => {
  const [rows] = await conn.query(
    `SELECT value FROM configurations WHERE \`key\` = 'SEMESTER_CONFIGURATIONS' LIMIT 1`
  );
  if (!rows.length) throw new Error("No semester configuration found");
  return JSON.parse(rows[0].value);
};




exports.checkSlotAvailablity = async (req, res) => {
  const { day_id, classroom_id, course_codes, timings } = req.body;
  console.log('req.body', req.body)
  if (!day_id || !classroom_id || !course_codes || !timings) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      available: false,
      message: "Required attributes missing",
    });
  }

  const [start_time, end_time] = String(timings)
    .split("-")
    .map((t) => t.trim());

  if (!start_time || !end_time) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      available: false,
      message: "Invalid timings format. Use HH:MM:SS-HH:MM:SS",
    });
  }

  const codes = String(course_codes)
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  if (codes.length === 0) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      available: false,
      message: "No valid course codes provided",
    });
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1) Load selected courses
    const [selectedCourses] = await conn.query(
      `
      SELECT
        c.id,
        c.course_code,
        c.course_name,
        c.teacher_id,
        c.department_id,
        c.semester,
        u.name AS teacher_name
      FROM courses c
      JOIN users u ON u.id = c.teacher_id
      WHERE c.course_code IN (?)
      `,
      [codes]
    );

    if (selectedCourses.length !== codes.length) {
      const found = new Set(selectedCourses.map((c) => c.course_code));
      const missing = codes.filter((c) => !found.has(c));

      await conn.rollback();
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        available: false,
        message: "Some course codes were not found",
        missing_courses: missing,
      });
    }

    const courseIds = selectedCourses.map((c) => c.id);
    const teacherIds = [...new Set(selectedCourses.map((c) => c.teacher_id))];

    // 2) Enforce single teacher for the merged slot
    if (teacherIds.length !== 1) {
      await conn.rollback();
      return res.status(HttpStatusCodes.CONFLICT).json({
        available: false,
        message: "Selected courses must belong to a single teacher",
        teachers: [...new Set(selectedCourses.map((c) => ({
          teacher_id: c.teacher_id,
          teacher_name: c.teacher_name,
          course_code: c.course_code,
        })))],
      });
    }

    const teacher = {
      teacher_id: selectedCourses[0].teacher_id,
      teacher_name: selectedCourses[0].teacher_name,
    };

    // 3) Load classroom
    const [classroomRows] = await conn.query(
      `
      SELECT id, name, capacity
      FROM classrooms
      WHERE id = ?
      LIMIT 1
      `,
      [classroom_id]
    );

    if (classroomRows.length === 0) {
      await conn.rollback();
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        available: false,
        message: "Classroom not found",
      });
    }

    const classroom = classroomRows[0];

    // 4) Get enrolled students for all selected courses
    const [studentRows] = await conn.query(
      `
      SELECT DISTINCT
        sc.student_id,
        u.name AS student_name
      FROM student_courses sc
      JOIN users u ON u.id = sc.student_id
      WHERE sc.course_id IN (?)
        AND sc.status = 'enrolled'
      `,
      [courseIds]
    );

    const studentIds = studentRows.map((s) => s.student_id);
    const totalStudents = studentIds.length;

    // 5) Classroom capacity check
    const classroomCapacityConflict =
      classroom.capacity != null && totalStudents > classroom.capacity;

    // 6) Classroom overlap check
    const [classroomConflicts] = await conn.query(
      `
      SELECT
        ts.id AS slot_id,
        ts.day_id,
        ts.start_time,
        ts.end_time,
        c.course_code,
        c.course_name,
        u.name AS teacher_name,
        cr.name AS classroom_name
      FROM timetable_slots ts
      JOIN courses c ON c.id = ts.course_id
      JOIN users u ON u.id = c.teacher_id
      JOIN classrooms cr ON cr.id = ts.classroom_id
      WHERE ts.day_id = ?
        AND ts.classroom_id = ?
        AND ts.start_time < ?
        AND ts.end_time > ?
      ORDER BY ts.start_time ASC
      `,
      [day_id, classroom_id, end_time, start_time]
    );

    // 7) Teacher day availability check
    const [teacherDayRows] = await conn.query(
      `
      SELECT id
      FROM teacher_availability
      WHERE teacher_id = ?
        AND day_id = ?
      LIMIT 1
      `,
      [teacher.teacher_id, day_id]
    );

    const teacherUnavailableOnDay = teacherDayRows.length === 0;

    // 8) Teacher time conflict check
    const [teacherConflicts] = await conn.query(
      `
      SELECT
        ts.id AS slot_id,
        ts.day_id,
        ts.start_time,
        ts.end_time,
        c.course_code,
        c.course_name,
        u.name AS teacher_name,
        cr.name AS classroom_name
      FROM timetable_slots ts
      JOIN courses c ON c.id = ts.course_id
      JOIN users u ON u.id = c.teacher_id
      JOIN classrooms cr ON cr.id = ts.classroom_id
      WHERE ts.day_id = ?
        AND c.teacher_id = ?
        AND ts.start_time < ?
        AND ts.end_time > ?
      ORDER BY ts.start_time ASC
      `,
      [day_id, teacher.teacher_id, end_time, start_time]
    );

    // 9) Optional teacher priority window check
    const [teacherPriorityRows] = await conn.query(
      `
      SELECT priority_time_start, priority_time_end
      FROM teachers
      WHERE user_id = ?
      LIMIT 1
      `,
      [teacher.teacher_id]
    );

    let teacherOutsidePriority = false;
    if (
      teacherPriorityRows.length > 0 &&
      teacherPriorityRows[0].priority_time_start &&
      teacherPriorityRows[0].priority_time_end
    ) {
      const pStart = String(teacherPriorityRows[0].priority_time_start);
      const pEnd = String(teacherPriorityRows[0].priority_time_end);

      teacherOutsidePriority = start_time < pStart || end_time > pEnd;
    }

    let studentConflictsRaw = [];

    // Only query if there are students to check; otherwise, there are zero conflicts.
    if (studentIds.length > 0) {
      [studentConflictsRaw] = await conn.query(
        `
        SELECT
          sc.student_id,
          u.name AS student_name,
          ts.id AS slot_id,
          ts.day_id,
          ts.start_time,
          ts.end_time,
          c.course_code,
          c.course_name,
          cr.name AS classroom_name
        FROM student_courses sc
        JOIN timetable_slots ts ON ts.course_id = sc.course_id
        JOIN courses c ON c.id = ts.course_id
        JOIN classrooms cr ON cr.id = ts.classroom_id
        JOIN users u ON u.id = sc.student_id
        WHERE sc.student_id IN (?)
          AND sc.status = 'enrolled'
          AND ts.day_id = ?
          AND ts.start_time < ?
          AND ts.end_time > ?
          AND sc.course_id NOT IN (?)
        ORDER BY u.name ASC, ts.start_time ASC
        `,
        [studentIds, day_id, end_time, start_time, courseIds]
      );
    }
    // group student conflicts by student
    const studentConflictMap = new Map();
    for (const row of studentConflictsRaw) {
      if (!studentConflictMap.has(row.student_id)) {
        studentConflictMap.set(row.student_id, {
          student_id: row.student_id,
          student_name: row.student_name,
          busy_count: 0,
          conflicts: [],
        });
      }

      const item = studentConflictMap.get(row.student_id);
      item.busy_count += 1;
      item.conflicts.push({
        slot_id: row.slot_id,
        course_code: row.course_code,
        course_name: row.course_name,
        classroom_name: row.classroom_name,
        day_id: row.day_id,
        start_time: row.start_time,
        end_time: row.end_time,
      });
    }

    const studentConflicts = [...studentConflictMap.values()];

    // 11) Build final conflict report
    const conflicts = {
      classroom: classroomConflicts.map((row) => ({
        slot_id: row.slot_id,
        course_code: row.course_code,
        course_name: row.course_name,
        teacher_name: row.teacher_name,
        classroom_name: row.classroom_name,
        day_id: row.day_id,
        start_time: row.start_time,
        end_time: row.end_time,
      })),
      teacher: teacherConflicts.map((row) => ({
        slot_id: row.slot_id,
        course_code: row.course_code,
        course_name: row.course_name,
        teacher_name: row.teacher_name,
        classroom_name: row.classroom_name,
        day_id: row.day_id,
        start_time: row.start_time,
        end_time: row.end_time,
      })),
      students: studentConflicts,
      teacher_availability: teacherUnavailableOnDay
        ? [{
          teacher_id: teacher.teacher_id,
          teacher_name: teacher.teacher_name,
          day_id,
        }]
        : [],
      capacity: classroomCapacityConflict
        ? [{
          classroom_id,
          classroom_name: classroom.name,
          capacity: classroom.capacity,
          required_students: totalStudents,
        }]
        : [],
      teacher_priority: teacherOutsidePriority
        ? [{
          teacher_id: teacher.teacher_id,
          teacher_name: teacher.teacher_name,
          priority_time_start: teacherPriorityRows[0].priority_time_start,
          priority_time_end: teacherPriorityRows[0].priority_time_end,
          requested_start: start_time,
          requested_end: end_time,
        }]
        : [],
    };

    const hasAnyConflict =
      conflicts.classroom.length > 0 ||
      conflicts.teacher.length > 0 ||
      conflicts.students.length > 0 ||
      conflicts.teacher_availability.length > 0 ||
      conflicts.capacity.length > 0 ||
      conflicts.teacher_priority.length > 0;


    if (hasAnyConflict) {
      await conn.rollback();
      return res.status(HttpStatusCodes.CONFLICT).json({
        available: false,
        message: "Slot is not available",
        summary: {
          total_students: totalStudents,
          classroom_capacity: classroom.capacity,
          busy_students: studentConflicts.length,
          classroom_conflicts: conflicts.classroom.length,
          teacher_conflicts: conflicts.teacher.length,
        },
        conflicts,
      });
    }

    await conn.commit();

    return res.status(HttpStatusCodes.OK).json({
      available: true,
      message: "Slot is available",
      data: {
        day_id,
        classroom_id,
        classroom_name: classroom.name,
        course_codes: codes,
        teacher_id: teacher.teacher_id,
        teacher_name: teacher.teacher_name,
        timings,
        total_students: totalStudents,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error("checkSlotAvailablity error:", error);

    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      available: false,
      message: "Internal server error",
    });
  } finally {
    conn.release();
  }
};

exports.applySchedule = async (req, res) => {
  const { user_id, slots } = req.body;

  if (!user_id || !Array.isArray(slots) || slots.length === 0) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Missing user_id or slots" });
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // ✅ Delete existing timetables & slots for this user
    const [existingTimetables] = await conn.query(
      `SELECT id FROM timetables WHERE created_by = ?`,
      [user_id]
    );

    if (existingTimetables.length > 0) {
      const timetableIds = existingTimetables.map(t => t.id);

      // Delete related slots
      await conn.query(
        // `DELETE FROM timetable_slots WHERE timetable_id IN (?)`,
        `DELETE FROM timetable_slots `,
        [timetableIds]
      );
      await conn.query(
        `DELETE FROM reschedule_requests `,
        []
      );
      await conn.query(
        `DELETE FROM rescheduled_slots `,
        []
      );


      // Delete timetables
      await conn.query(
        `DELETE FROM timetables WHERE id IN (?)`,
        [timetableIds]
      );
    }

    // Get semester configuration
    const config = await getSemesterConfig(conn);

    // Create new timetable
    const [timetableResult] = await conn.query(
      `INSERT INTO timetables (configuration_id, label, created_by) VALUES (?, ?, ?)`,
      [1, `${config.semesterName} - User ${user_id}`, user_id]
    );
    const timetable_id = timetableResult.insertId;

    // Prepare slots for insertion
    const dbSlots = [];
    slots.forEach(slot => {
      const {
        label,
        group_id,
        course_ids,
        department_ids,
        classroom_id,
        day_id,
        start_time,
        end_time,
        penalty
      } = slot;

      if (!day_id || !classroom_id || !start_time || !end_time) return;

      if (label === 'single') {
        dbSlots.push([
          timetable_id,
          course_ids[0] ?? null,
          department_ids[0] ?? null,
          day_id,
          classroom_id,
          null,
          label,
          start_time,
          end_time,
          penalty ?? 0
        ]);
      } else if (label === 'combined') {
        const mergeId = parseInt(group_id.split("_")[1] ?? "0", 10) || null;
        course_ids.forEach((cid, idx) => {
          dbSlots.push([
            timetable_id,
            cid,
            department_ids[idx] ?? department_ids[0] ?? null,
            day_id,
            classroom_id,
            mergeId,
            label,
            start_time,
            end_time,
            penalty ?? 0
          ]);
        });
      }
    });

    // Insert slots in bulk
    if (dbSlots.length > 0) {
      await conn.query(
        `INSERT INTO timetable_slots 
          (timetable_id, course_id, department_id, day_id, classroom_id, merge_id, label, start_time, end_time, penalty) 
          VALUES ?`,
        [dbSlots]
      );
    }

    await conn.commit();
    // 🔹 Simple log
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Schedule Applied";
      const body = `User ${user_id} applied timetable (ID: ${timetable_id}) with ${dbSlots.length} slots.`;
      logger.add(heading, body);
    }

    // 🔔 Notify all users related to this timetable
    const socket = req.app.get("notification_socket");
    if (socket) {
      // Load all user IDs associated with this timetable
      const [usersInTimetable] = await conn.query(
        `SELECT DISTINCT id,email,name  FROM users `,
        [timetable_id]
      );
      const userIds = usersInTimetable.map(u => u.id);
      if (config.autoNotify == true) {
        sendAnnouncementEmailToMany({
          users: usersInTimetable, heading: "Timetable Updated", message: `A new timetable  has been applied with ${dbSlots.length} slots.`
        })
      } else {
        console.log('--AUTO - EMAILING - DISABLED--')
      }
      if (userIds.length > 0) {
        await sendMessage(socket, {
          title: "Timetable Updated",
          body: `A new timetable  has been applied with ${dbSlots.length} slots.`,
          userIds
        });
      }
    }

    res.status(HttpStatusCodes.CREATED).json({
      message: "Timetable created with slots",
      timetable_id,
      insertedSlots: dbSlots.length
    });

  } catch (error) {
    await conn.rollback();
    const err = SqlException.handle(error);
    res.status(err.status).json(err);
  } finally {
    conn.release();
  }
};




exports.getAdminTimetables = async (req, res) => {
  const db = getDB();
  try {
    const [rows] = await db.query(`SELECT 
    ts.id AS slot_id,
    ts.course_id ,
    ts.department_id,
    ts.classroom_id,

      TIMESTAMP(
  COALESCE(
    rs.reschedule_date,  -- if rescheduled, use that date
    DATE_ADD(
      CURDATE(),
      INTERVAL (
        ( (COALESCE(rs.new_day_id, ts.day_id) - 1) - WEEKDAY(CURDATE()) + 7 ) % 7
      ) DAY
    )
  ),
  COALESCE(rs.new_start_time, ts.start_time)
) AS slot_datetime,
    -- Day + Time
    COALESCE(wd_new.name, wd.name) AS day_name,
    COALESCE(rs.new_day_id, ts.day_id) AS day_id,
    COALESCE(rs.new_start_time, ts.start_time) AS start_time,
    COALESCE(rs.new_end_time, ts.end_time) AS end_time,

    -- Course info
    GROUP_CONCAT(DISTINCT c.course_name) AS course_names,
    GROUP_CONCAT(DISTINCT c.course_code) AS course_codes,


    -- Teacher info
    GROUP_CONCAT(DISTINCT u_teacher.name) AS teacher_names,

    -- Classroom info
    COALESCE(cr_new.name, cr.name) AS classroom_name,

    -- Merge info
    ts.merge_id,
    cm.merge_name,
    ts.label AS slot_label,

    -- Student count
    COUNT(DISTINCT sc.student_id) AS student_count,

    -- Reschedule info
    rs.id AS reschedule_id,
    rs.reschedule_date	as reschedule_date	,
    rs.reason,
    rs.status AS reschedule_status

FROM timetable_slots ts

-- Optional: timetable start dates if needed
LEFT JOIN (
    SELECT t.id AS timetable_id, MIN(ts1.start_time) AS start_date
    FROM timetables t
    JOIN timetable_slots ts1 ON ts1.timetable_id = t.id
    GROUP BY t.id
) ts_start_dates ON ts_start_dates.timetable_id = ts.timetable_id

-- Latest active reschedule per slot (current week)
LEFT JOIN (
    SELECT rs1.*
    FROM rescheduled_slots rs1
    WHERE rs1.status = 'active'
      AND YEARWEEK(rs1.reschedule_date, 1) = YEARWEEK(CURDATE(), 1)
      AND rs1.id = (
          SELECT MAX(rs2.id)
          FROM rescheduled_slots rs2
          WHERE rs2.slot_id = rs1.slot_id
            AND rs2.reschedule_date = rs1.reschedule_date
      )
) rs ON rs.slot_id = ts.id

-- Days
LEFT JOIN week_days wd ON wd.id = ts.day_id
LEFT JOIN week_days wd_new ON wd_new.id = rs.new_day_id

-- Classrooms
LEFT JOIN classrooms cr ON cr.id = ts.classroom_id
LEFT JOIN classrooms cr_new ON cr_new.id = rs.new_classroom_id

-- Merges
LEFT JOIN course_merges cm ON cm.id = ts.merge_id
LEFT JOIN course_merge_partners cmp ON cmp.merge_id = ts.merge_id
LEFT JOIN courses c ON c.id = COALESCE(cmp.course_id, ts.course_id)

-- Teacher
LEFT JOIN users u_teacher ON u_teacher.id = c.teacher_id

-- Students
LEFT JOIN student_courses sc ON sc.course_id = c.id AND sc.status = 'enrolled'

GROUP BY ts.id, rs.reschedule_date

ORDER BY COALESCE(rs.new_day_id, ts.day_id), COALESCE(rs.new_start_time, ts.start_time);
    `);

    res.json({ success: true, timetables: rows });
  } catch (err) {
    console.error("Error fetching admin timetables:", err);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};



exports.getTeacherTimetable = async (req, res) => {
  const { teacher_id } = req.params;
  if (!teacher_id) return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "teacher_id required" });

  const db = getDB();

  try {
    const [rows] = await db.query(`SELECT 
    ts.id AS slot_id,
    ts.course_id ,
    ts.department_id,
    ts.classroom_id,
    c.teacher_id,

    -- Date (reschedule overrides original)
 TIMESTAMP(
  COALESCE(
    rs.reschedule_date,  -- if rescheduled, use that date
    DATE_ADD(
      CURDATE(),
      INTERVAL (
        ( (COALESCE(rs.new_day_id, ts.day_id) - 1) - WEEKDAY(CURDATE()) + 7 ) % 7
      ) DAY
    )
  ),
  COALESCE(rs.new_start_time, ts.start_time)
) AS slot_datetime,
    -- Day + Time
    COALESCE(wd_new.name, wd.name) AS day_name,
    COALESCE(rs.new_day_id, ts.day_id) AS day_id,
    COALESCE(rs.new_start_time, ts.start_time) AS start_time,
    COALESCE(rs.new_end_time, ts.end_time) AS end_time,

    -- Course info
    GROUP_CONCAT(DISTINCT c.course_name) AS course_names,
    GROUP_CONCAT(DISTINCT c.course_code) AS course_codes,


    -- Teacher info
    GROUP_CONCAT(DISTINCT u_teacher.name) AS teacher_names,

    -- Classroom info
    COALESCE(cr_new.name, cr.name) AS classroom_name,

    -- Merge info
    ts.merge_id,
    cm.merge_name,
    ts.label AS slot_label,

    -- Student count
    COUNT(DISTINCT sc.student_id) AS student_count,

    -- Reschedule info
    rs.id AS reschedule_id,
TIMESTAMP(rs.reschedule_date, '00:00:00') AS reschedule_date,
    rs.reason,
    rs.status AS reschedule_status

FROM timetable_slots ts

-- Optional: timetable start dates if needed
LEFT JOIN (
    SELECT t.id AS timetable_id, MIN(ts1.start_time) AS start_date
    FROM timetables t
    JOIN timetable_slots ts1 ON ts1.timetable_id = t.id
    GROUP BY t.id
) ts_start_dates ON ts_start_dates.timetable_id = ts.timetable_id

-- Latest active reschedule per slot (current week)
LEFT JOIN (
    SELECT rs1.*
    FROM rescheduled_slots rs1
    WHERE rs1.status = 'active'
      AND YEARWEEK(rs1.reschedule_date, 1) = YEARWEEK(CURDATE(), 1)
      AND rs1.id = (
          SELECT MAX(rs2.id)
          FROM rescheduled_slots rs2
          WHERE rs2.slot_id = rs1.slot_id
            AND rs2.reschedule_date = rs1.reschedule_date
      )
) rs ON rs.slot_id = ts.id

-- Days
LEFT JOIN week_days wd ON wd.id = ts.day_id
LEFT JOIN week_days wd_new ON wd_new.id = rs.new_day_id

-- Classrooms
LEFT JOIN classrooms cr ON cr.id = ts.classroom_id
LEFT JOIN classrooms cr_new ON cr_new.id = rs.new_classroom_id

-- Merges
LEFT JOIN course_merges cm ON cm.id = ts.merge_id
LEFT JOIN course_merge_partners cmp ON cmp.merge_id = ts.merge_id
LEFT JOIN courses c ON c.id = COALESCE(cmp.course_id, ts.course_id) 

-- Teacher
LEFT JOIN users u_teacher ON u_teacher.id = c.teacher_id 

-- Students
LEFT JOIN student_courses sc ON sc.course_id = c.id AND sc.status = 'enrolled'
  WHERE c.teacher_id = ? 
GROUP BY ts.id, rs.reschedule_date

ORDER BY COALESCE(rs.new_day_id, ts.day_id), COALESCE(rs.new_start_time, ts.start_time);
    `, [teacher_id]);

    res.json({ success: true, timetables: rows });
  } catch (err) {
    console.error("Error fetching admin timetables:", err);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};


exports.getStudentTimetables = async (req, res) => {
  const { student_id } = req.params;
  const db = getDB();

  if (!student_id) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Missing student_id" });
  }

  try {
    const [rows] = await db.query(`
      SELECT 
        ts.id AS slot_id,
        ts.course_id,
        ts.department_id,
        ts.classroom_id,
        c.teacher_id,

        -- Date (same logic as teacher)
        TIMESTAMP(
          COALESCE(
            rs.reschedule_date,
            DATE_ADD(
              CURDATE(),
              INTERVAL (
                ((COALESCE(rs.new_day_id, ts.day_id) - 1) - WEEKDAY(CURDATE()) + 7) % 7
              ) DAY
            )
          ),
          COALESCE(rs.new_start_time, ts.start_time)
        ) AS slot_datetime,

        -- Day + Time
        COALESCE(wd_new.name, wd.name) AS day_name,
        COALESCE(rs.new_day_id, ts.day_id) AS day_id,
        COALESCE(rs.new_start_time, ts.start_time) AS start_time,
        COALESCE(rs.new_end_time, ts.end_time) AS end_time,

        -- Course info
        GROUP_CONCAT(DISTINCT c.course_name) AS course_names,
        GROUP_CONCAT(DISTINCT c.course_code) AS course_codes,

        -- Teacher info
        GROUP_CONCAT(DISTINCT u_teacher.name) AS teacher_names,

        -- Classroom
        COALESCE(cr_new.name, cr.name) AS classroom_name,

        -- Merge
        ts.merge_id,
        cm.merge_name,
        ts.label AS slot_label,

        -- Total enrolled students (ALL students, not just this one)
        COUNT(DISTINCT sc_all.student_id) AS student_count,

        -- Reschedule
        rs.id AS reschedule_id,
        rs.reschedule_date,
        rs.reason,
        rs.status AS reschedule_status

      FROM timetable_slots ts

      -- Latest active reschedule
      LEFT JOIN (
          SELECT rs1.*
          FROM rescheduled_slots rs1
          WHERE rs1.status = 'active'
            AND YEARWEEK(rs1.reschedule_date, 1) = YEARWEEK(CURDATE(), 1)
            AND rs1.id = (
                SELECT MAX(rs2.id)
                FROM rescheduled_slots rs2
                WHERE rs2.slot_id = rs1.slot_id
                  AND rs2.reschedule_date = rs1.reschedule_date
            )
      ) rs ON rs.slot_id = ts.id

      -- Days
      LEFT JOIN week_days wd ON wd.id = ts.day_id
      LEFT JOIN week_days wd_new ON wd_new.id = rs.new_day_id

      -- Classrooms
      LEFT JOIN classrooms cr ON cr.id = ts.classroom_id
      LEFT JOIN classrooms cr_new ON cr_new.id = rs.new_classroom_id

      -- Merge logic (FIXED)
      LEFT JOIN course_merges cm ON cm.id = ts.merge_id
      LEFT JOIN course_merge_partners cmp ON cmp.merge_id = ts.merge_id

      -- Courses
      LEFT JOIN courses c ON c.id = COALESCE(cmp.course_id, ts.course_id)

      -- Teacher
      LEFT JOIN users u_teacher ON u_teacher.id = c.teacher_id

      -- ✅ Filter: only student's enrolled courses
      INNER JOIN student_courses sc_filter 
        ON sc_filter.course_id = c.id 
        AND sc_filter.status = 'enrolled'
        AND sc_filter.student_id = ?

      -- ✅ Count ALL students separately
      LEFT JOIN student_courses sc_all 
        ON sc_all.course_id = c.id 
        AND sc_all.status = 'enrolled'

      GROUP BY ts.id, rs.reschedule_date

      ORDER BY 
        COALESCE(rs.new_day_id, ts.day_id), 
        COALESCE(rs.new_start_time, ts.start_time);
    `, [student_id]);

    res.json({ success: true, timetables: rows });

  } catch (err) {
    console.error("Error fetching student timetables:", err);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};


exports.getStudentTodaysSchedule = async (req, res) => {
  const { student_id } = req.params;
  const db = getDB();

  if (!student_id) {
    return res.status(400).json({ message: "Missing student_id" });
  }

  try {
    const [rows] = await db.query(`
    SELECT 
  ts.id,

  
  -- Course Names
  CASE 
    WHEN ts.label = 'combined' THEN 
      GROUP_CONCAT(DISTINCT c2.course_name SEPARATOR ', ')
    ELSE 
      c.course_name
  END AS course_names,

  -- Course Codes
  CASE 
    WHEN ts.label = 'combined' THEN 
      GROUP_CONCAT(DISTINCT c2.course_code SEPARATOR ', ')
    ELSE 
      c.course_code
  END AS course_codes,
 TIMESTAMP(
          COALESCE(
            rs.reschedule_date,
            DATE_ADD(
              CURDATE(),
              INTERVAL (
                ((COALESCE(rs.new_day_id, ts.day_id) - 1) - WEEKDAY(CURDATE()) + 7) % 7
              ) DAY
            )
          ),
          COALESCE(rs.new_start_time, ts.start_time)
        ) AS slot_datetime,
  CURDATE() as 'current_date',
  t.name AS teacher_name,
  cr.name AS classroom,
  cr.building AS building,
  wd.name AS day,
  ts.start_time,
  ts.end_time,
  ts.classroom_id,
  ts.department_id,
 

  CASE 
    WHEN wd.name = DAYNAME(CURDATE()) THEN 1
    ELSE 0
  END AS isScheduledToday,

  CASE 
    WHEN rs.id IS NOT NULL THEN 'rescheduled'
    ELSE 'normal'
  END AS class_type,

  COUNT(DISTINCT sc.student_id) AS total_students

FROM timetable_slots ts

JOIN courses c 
  ON c.id = ts.course_id

JOIN users t 
  ON t.id = c.teacher_id

JOIN classrooms cr 
  ON cr.id = ts.classroom_id

JOIN week_days wd 
  ON wd.id = ts.day_id

-- Merge handling
LEFT JOIN course_merge_partners cmp 
  ON cmp.merge_id = ts.merge_id

LEFT JOIN courses c2 
  ON c2.id = cmp.course_id

-- 🔥 EXISTING (for counting الطلاب)
LEFT JOIN student_courses sc 
  ON (
    (ts.label = 'single' AND sc.course_id = ts.course_id)
    OR
    (ts.label = 'combined' AND sc.course_id = c2.id)
  )
  AND sc.status = 'enrolled'

-- ✅ NEW: filter for specific student
INNER JOIN student_courses sc_filter
  ON (
    (ts.label = 'single' AND sc_filter.course_id = ts.course_id)
    OR
    (ts.label = 'combined' AND sc_filter.course_id = c2.id)
  )
  AND sc_filter.student_id = ?
  AND sc_filter.status = 'enrolled'

LEFT JOIN rescheduled_slots rs 
  ON rs.slot_id = ts.id   

GROUP BY ts.id;
    `, [student_id]);

    res.json({
      success: true,
      classes: rows
    });

  } catch (err) {
    console.error("Error fetching student stats:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getTeacherTodaysSchedule = async (req, res) => {
  const { teacher_id } = req.params;
  const db = getDB();

  if (!teacher_id) {
    return res.status(400).json({ message: "Missing teacher_id" });
  }

  try {
    const [rows] = await db.query(`
  SELECT 
  ts.id,

  -- Course Names
  CASE 
    WHEN ts.label = 'combined' THEN 
      GROUP_CONCAT(DISTINCT c2.course_name SEPARATOR ', ')
    ELSE 
      c.course_name
  END AS course_names,

  -- Course Codes
  CASE 
    WHEN ts.label = 'combined' THEN 
      GROUP_CONCAT(DISTINCT c2.course_code SEPARATOR ', ')
    ELSE 
      c.course_code
  END AS course_codes,

  rs.reschedule_date,
  t.name AS teacher_name,
  cr.name AS classroom,
  cr.building AS building,
  wd.name AS day,
  ts.start_time,
  ts.end_time,
  ts.classroom_id,
  ts.department_id,
  CURDATE() AS 'current_date',

 TIMESTAMP(
          COALESCE(
            rs.reschedule_date,
            DATE_ADD(
              CURDATE(),
              INTERVAL (
                ((COALESCE(rs.new_day_id, ts.day_id) - 1) - WEEKDAY(CURDATE()) + 7) % 7
              ) DAY
            )
          ),
          COALESCE(rs.new_start_time, ts.start_time)
        ) AS slot_datetime,

          CASE 
    WHEN wd.name = DAYNAME(CURDATE()) THEN 1
    ELSE 0
  END AS isScheduledToday,

  CASE 
    WHEN rs.id IS NOT NULL THEN 'rescheduled'
    ELSE 'normal'
  END AS class_type,

  -- 🔥 Student Count (handles both single & combined)
  COUNT(DISTINCT sc.student_id) AS total_students

FROM timetable_slots ts

JOIN courses c 
  ON c.id = ts.course_id

JOIN users t 
  ON t.id = c.teacher_id

JOIN classrooms cr 
  ON cr.id = ts.classroom_id

JOIN week_days wd 
  ON wd.id = ts.day_id

-- Merge handling
LEFT JOIN course_merge_partners cmp 
  ON cmp.merge_id = ts.merge_id

LEFT JOIN courses c2 
  ON c2.id = cmp.course_id

-- 🔥 Student join (important part)
LEFT JOIN student_courses sc 
  ON (
    (ts.label = 'single' AND sc.course_id = ts.course_id)
    OR
    (ts.label = 'combined' AND sc.course_id = c2.id)
  )
  AND sc.status = 'enrolled'

LEFT JOIN rescheduled_slots rs 
  ON rs.slot_id = ts.id
  AND rs.status = 'active'
  AND YEARWEEK(rs.reschedule_date, 1) = YEARWEEK(CURDATE(), 1)
  AND rs.id = (
    SELECT MAX(rs2.id)
    FROM rescheduled_slots rs2
    WHERE rs2.slot_id = ts.id
      AND rs2.reschedule_date = rs.reschedule_date
  ) 

WHERE c.teacher_id = ?

GROUP BY ts.id;
;

    `, [teacher_id]);

    res.json({
      success: true,
      classes: rows
    });

  } catch (err) {
    console.error("Error fetching teacher schedule:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.updateSlot = async (req, res) => {
  const { slot_id } = req.params;
  const { day_id, start_time, end_time, classroom_id } = req.body;


  console.log('---', { day_id, start_time, end_time, classroom_id ,slot_id})
  // return res.send()
  if (!slot_id) {
    return res.status(400).json({ message: "slot_id is required" });
  }

  const db = getDB();

  try {
    const [result] = await db.query(
      `UPDATE timetable_slots
       SET 
         day_id = COALESCE(?, day_id),
         start_time = COALESCE(?, start_time),
         end_time = COALESCE(?, end_time),
         classroom_id = COALESCE(?, classroom_id)
       WHERE id = ?`,
      [day_id, start_time, end_time, classroom_id, slot_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Slot not found" });
    }

    res.json({
      message: "Slot updated (forcefully)",
      slot_id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};