const { getDB } = require("../config/db");
const bcrypt = require("bcrypt");
const SqlException = require("../development/SQL_EXCEPTIONS");
const HttpStatusCodes = require("../development/HttpStatusCodes");

// ======================================
// GET ALL TEACHERS
// ======================================
exports.getAllTeachers = async (req, res) => {
  try {
    const db = getDB();

    const [rows] = await db.query(`SELECT 
    u.id,
    u.name,
    u.email,
    u.password_hash AS password,

    t.priority_time_start,
    t.priority_time_end,

    IFNULL(
      JSON_ARRAYAGG(DISTINCT td.department_id),
      JSON_ARRAY()
    ) AS departmentIds,

    IFNULL(
      JSON_ARRAYAGG(DISTINCT ta.day_id),
      JSON_ARRAY()
    ) AS priorityDays,

    COUNT(DISTINCT ts.id) AS classes_per_week

FROM teachers t
JOIN users u ON t.user_id = u.id

LEFT JOIN teacher_departments td 
    ON td.teacher_id = u.id

LEFT JOIN teacher_availability ta 
    ON ta.teacher_id = u.id

LEFT JOIN courses c 
    ON c.teacher_id = u.id

LEFT JOIN timetable_slots ts 
    ON ts.course_id = c.id

GROUP BY u.id
ORDER BY u.name;`);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getAllTeachersNameAndIds = async (req, res) => {
  try {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT 
        u.id,
        u.name
        
      FROM teachers as  t JOIN users as u ON u.id=t.user_id`);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================================
// GET TEACHER BY ID
// ======================================
exports.getTeacherById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        t.priority_time_start,
        t.priority_time_end,

        IFNULL(
          JSON_ARRAYAGG(DISTINCT td.department_id),
          JSON_ARRAY()
        ) AS departmentIds,

        IFNULL(
          JSON_ARRAYAGG(DISTINCT ta.day_id),
          JSON_ARRAY()
        ) AS priorityDays

      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN teacher_departments td ON td.teacher_id = u.id
      LEFT JOIN teacher_availability ta ON ta.teacher_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);

    if (!rows.length)
      return res.status(404).json({ message: "Teacher not found" });

    res.json(rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================================
// CREATE TEACHER
// ======================================
exports.createTeacher = async (req, res) => {
  const {
    name,
    email,
    password,
    departmentIds = [],
    priorityDays = [],
    priorityTimeStart,
    priorityTimeEnd
  } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "Missing required fields" });

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();


    // 1️⃣ Insert into users
    const [userResult] = await conn.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'teacher')`,
      [name, email, password]
    );

    const userId = userResult.insertId;

    // 2️⃣ Insert into teachers
    await conn.query(
      `INSERT INTO teachers (user_id, priority_time_start, priority_time_end)
       VALUES (?, ?, ?)`,
      [userId, priorityTimeStart, priorityTimeEnd]
    );

    // 3️⃣ Insert teacher_departments
    for (const deptId of departmentIds) {
      await conn.query(
        `INSERT INTO teacher_departments (teacher_id, department_id)
         VALUES (?, ?)`,
        [userId, deptId]
      );
    }

    // 4️⃣ Insert teacher_availability
    for (const dayId of priorityDays) {
      await conn.query(
        `INSERT INTO teacher_availability (teacher_id, day_id)
         VALUES (?, ?)`,
        [userId, dayId]
      );
    }

    await conn.commit();


    // 🔹 Add teacher creation log
    const logger = req.app.get('logger');

    if (logger) {
      const heading = "Teacher Created";
      const body = `Teacher ${name} (ID: ${userId}) with email ${email} was created successfully.`;

      logger.add(heading, body);
    }

    res.status(201).json({
      message: "Teacher created successfully",
      user_id: userId
    });

  } catch (error) {
    await conn.rollback();
    const err = SqlException.handle(error);
    res.status(err.status || 500).json(err);
  } finally {
    conn.release();
  }
};

// ======================================
// UPDATE TEACHER
// ======================================
exports.updateTeacher = async (req, res) => {
  const db = getDB();
  const conn = await db.getConnection();
  const { id } = req.params;

  const {
    name,
    email,
    password,
    departmentIds = [],
    priorityDays = [],
    priorityTimeStart,
    priorityTimeEnd
  } = req.body;

  try {
    await conn.beginTransaction();

    // 1️⃣ Update user
    if (password) {
      await conn.query(
        `UPDATE users SET name=?, email=?, password_hash=? WHERE id=? AND role='teacher'`,
        [name, email, password, id]
      );
    } else {
      await conn.query(
        `UPDATE users SET name=?, email=? WHERE id=? AND role='teacher'`,
        [name, email, id]
      );
    }

    // 2️⃣ Update teachers table
    await conn.query(
      `UPDATE teachers 
       SET priority_time_start=?, priority_time_end=?
       WHERE user_id=?`,
      [priorityTimeStart, priorityTimeEnd, id]
    );

    // 3️⃣ Reset departments
    await conn.query(`DELETE FROM teacher_departments WHERE teacher_id=?`, [id]);
    for (const deptId of departmentIds) {
      await conn.query(
        `INSERT INTO teacher_departments (teacher_id, department_id)
         VALUES (?, ?)`,
        [id, deptId]
      );
    }

    // 4️⃣ Reset availability
    await conn.query(`DELETE FROM teacher_availability WHERE teacher_id=?`, [id]);
    for (const dayId of priorityDays) {
      await conn.query(
        `INSERT INTO teacher_availability (teacher_id, day_id)
         VALUES (?, ?)`,
        [id, dayId]
      );
    }

    await conn.commit();

    res.json({ message: "Teacher updated successfully" });

  } catch (error) {
    await conn.rollback();
    const err = SqlException.handle(error);
    res.status(err.status || 500).json(err);
  } finally {
    conn.release();
  }
};

// ======================================
// DELETE TEACHER
// ======================================
exports.deleteTeacher = async (req, res) => {
  const db = getDB();
  const conn = await db.getConnection();
  const { id } = req.params;

  try {
    await conn.beginTransaction();

    // 🔹 Get teacher info for logging (safe add)
    const [[teacher]] = await conn.query(
      `SELECT name, email FROM users WHERE id=? AND role='teacher'`,
      [id]
    );

    await conn.query(`DELETE FROM teacher_departments WHERE teacher_id=?`, [id]);
    await conn.query(`DELETE FROM teacher_availability WHERE teacher_id=?`, [id]);
    await conn.query(`DELETE FROM teachers WHERE user_id=?`, [id]);

    const [result] = await conn.query(
      `DELETE FROM users WHERE id=? AND role='teacher'`,
      [id]
    );

    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ message: "Teacher not found" });
    }

    await conn.commit();

    // 🔹 Add log (no change to response flow)
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Teacher Deleted";
      const body = `Teacher ${teacher?.name ?? "Unknown"} (ID: ${id}, Email: ${teacher?.email ?? "N/A"}) deleted.`;
      logger.add(heading, body);
    }

    res.json({ message: "Teacher deleted successfully" });

  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};


// ==============================
// GET SYSTEM RESOURCE STATS
// ==============================
exports.getTeacherStats = async (req, res) => {
  const db = getDB();
const {teacher_id}=req.params
  try {
    const [
      [teacher_stats],
      [departments],
      [teacher_info],
      [pending_schedules],
    ] = await Promise.all([
      db.query("SELECT    c.id,   c.course_name,   COUNT(sc.student_id) AS enrolled_students FROM courses c LEFT JOIN student_courses sc    ON sc.course_id = c.id    AND sc.status = 'enrolled' WHERE c.teacher_id = ? GROUP BY c.id, c.course_name;",[teacher_id]),
      db.query("select d.name as department_name,d.id as department_id from teacher_departments td join users u on u.id=td.teacher_id AND u.id=? join departments d on d.id=td.department_id",[teacher_id]),
      db.query("select u.id, u.name from users u join teachers t on t.user_id=u.id WHERE t.user_id=?",[teacher_id]),
      db.query("select id from reschedule_requests where teacher_id = ? AND status='pending'",[teacher_id]),
    ]);   
    return res.status(HttpStatusCodes.OK).send({
      success: true,
      data: {
        courses: teacher_stats,
        departments: departments,
        info:teacher_info[0],
        pending_schedule: pending_schedules.length,
        
      },
      message: "teacher stats fetched successfully",
    });

  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server Error",
    });
  }
};