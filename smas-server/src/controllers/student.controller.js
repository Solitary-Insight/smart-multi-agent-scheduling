const { getDB } = require("../config/db");
const bcrypt = require("bcrypt");
const SqlException = require("../development/SQL_EXCEPTIONS");
const HttpStatusCodes = require("../development/HttpStatusCodes");

// ==============================
// GET ALL STUDENTS
// ==============================
exports.getAllStudents = async (req, res) => {
  try {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.password_hash AS password,

        s.department_id,
        s.semester,

        d.name AS department_name,
        d.code AS department_code,

        -- enrolled courses
        (
          SELECT JSON_ARRAYAGG(c.course_code)
          FROM student_courses sc
          JOIN courses c ON c.id = sc.course_id
          WHERE sc.student_id = s.user_id
          AND sc.status = 'enrolled'
        ) AS enrolledCourses,

        -- completed courses
        (
          SELECT JSON_ARRAYAGG(c.course_code)
          FROM student_courses sc
          JOIN courses c ON c.id = sc.course_id
          WHERE sc.student_id = s.user_id
          AND sc.status = 'completed'
        ) AS completedCourses,

        -- counts
        (
          SELECT COUNT(*)
          FROM student_courses sc
          WHERE sc.student_id = s.user_id
          AND sc.status = 'enrolled'
        ) AS enrolledCount,

        (
          SELECT COUNT(*)
          FROM student_courses sc
          WHERE sc.student_id = s.user_id
          AND sc.status = 'completed'
        ) AS completedCount

      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN departments d ON s.department_id = d.id

      ORDER BY u.name
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// ==============================
// GET STUDENT BY ID
// ==============================
exports.getStudentById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT 
         u.id,
         u.name,
         u.email,
         s.department_id,
         s.semester,
         d.name as department_name
       FROM students s
       JOIN departments d  ON s.department_id = d.id
       JOIN users u ON s.user_id = u.id  
       
       WHERE u.id = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Student not found" });

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// CREATE STUDENT (WITH TRANSACTION)
// ==============================
exports.createStudent = async (req, res) => {
  const { name, email, department_id, semester, password } = req.body;
  if (!name || !email || !department_id || !semester || !password) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2️⃣ Insert into users
    const [userResult] = await conn.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'student')`,
      [name, email, password]
    );

    const userId = userResult.insertId;

    // 3️⃣ Insert into students
    await conn.query(
      `INSERT INTO students (user_id, department_id, semester)
       VALUES (?, ?, ?)`,
      [userId, department_id, semester]
    );

    await conn.commit();
    // 🔹 Add log
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Student Created";
      const body = `Student ${name} (ID: ${userId}, Email: ${email}) created in Department ${department_id}, Semester ${semester}.`;
      logger.add(heading, body);
    }
    res.status(201).json({
      message: "Student created successfully",
      user_id: userId,
    });

  } catch (error) {
    const err = SqlException.handle(error)
    console.log('err', err)
    await conn.rollback();
    console.error(error);
    res.status(err.status).json(err);
  } finally {
    conn.release();
  }
};


// ==============================
// GET STUDENTS WITH ENROLLED COURSES
// ==============================
exports.getStudentsWithCourses = async (req, res) => {

  try {
    const db = getDB();
    const [rows] = await db.query(`
      SELECT
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        s.semester,
        s.department_id,

        JSON_ARRAYAGG(
          JSON_OBJECT(
            'course_id', c.id,
            'course_code', c.course_code,
            'course_name', c.course_name,
            'course_status', sc.status
          )
        ) AS enrolled_courses 

      FROM students s JOIN users u ON u.id = s.user_id LEFT JOIN student_courses sc 
        ON sc.student_id = s.user_id 
        AND sc.status = 'enrolled'  

      LEFT JOIN courses c 
        ON c.id = sc.course_id
where sc.status = 'enrolled'
      GROUP BY u.id, u.name, s.semester
      ORDER BY u.name ;
    `);

    res.json(rows);

  } catch (error) {
    const err = SqlException.handle(error)
    res.status(err.code).json(
      {
        message: "Server error",
        err
      });
  }
};



// ==============================
// PROMOTE STUDENTS 
// ==============================
exports.promote = async (req, res) => {

  const students_info = req.body
  if (!students_info) return res.status(HttpStatusCodes.BAD_REQUEST).send({ message: "Students info not provided" })
  const student_ids_flat = students_info.map(s => s.student_id)
  try {
    const db = getDB();

    const [result] = await db.query(`
      update students set semester= semester + 1 where user_id in (?)
    `, [student_ids_flat]);
    if (result.affectedRows > 0) {
      res.send({
        message: "students promoted",
        student_ids: student_ids_flat,
        promotion_count: result.affectedRows,
      })
    } else {
      res.status(HttpStatusCodes.NOT_FOUND).send({ message: "No student promoted" })
    }

  } catch (error) {
    const err = SqlException.handle(error)
    res.status(err.code).json(
      {
        message: "Server error",
        err
      });
  }
};



// ==============================
// PASS AND  PROMOTE STUDENTS 
// ==============================
exports.passAndPromote = async (req, res) => {
  const { student_id } = req.params
  const student_info = req.body

  if (!student_info || !student_id) return res.status(HttpStatusCodes.BAD_REQUEST).send({ message: "Students info or id not provided" })
  const db = getDB()
  const conn = await db.getConnection();
  let isPromoted = student_info.should_promote
  try {
    await conn.beginTransaction()
    if (student_info.should_promote) {
      const [result] = await db.query(`
        update students set semester= semester + 1 where user_id =?
      `, [student_info.student_id]);
      if (result.affectedRows == 0) {
        isPromoted = false
      }
    }

    const [upd_res] = await db.query(`
      update student_courses set status= 'completed' where student_id = ? AND course_id in (?)
    `, [student_info.student_id, student_info.enrolled_courses]);
    if (upd_res.affectedRows == 0) {
      res.status(HttpStatusCodes.NOT_FOUND).send({
        message: "No course status updated"
      })
      conn.rollback()
    }

    await conn.commit();

    return res.send({
      message: "Student promoted and cleared",
      promoted: isPromoted,
      student_id: student_info.student_id
    })
  } catch (error) {
    const err = SqlException.handle(error)
    res.status(err.code).json(
      {
        message: "Server error",
        err
      });
    conn.rollback()
  } finally {

    conn.release()
  }



};



// ==============================
// BATCH REMARKS 
// ==============================
exports.batchRemarks = async (req, res) => {
  const { student_id } = req.params
  const student_info = req.body
  if (!student_info || student_info.length == 0) return res.status(HttpStatusCodes.BAD_REQUEST).send({ message: "Students info or id not provided" })
  const db = getDB()
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction()

    for (const info of req.body) {
      const { student_id, enrolled_courses, remark } = info
      const query = `update student_courses set status= ? where student_id= ? AND course_id in (?)`;
      const values = [remark, student_id, enrolled_courses]
      // console.log('values', values)
      const [result] = await conn.query(query, values)
      if (result.affectedRows == 0) {
        conn.rollback()
      }
    }



    await conn.commit();

    return res.send({
      message: `Batch ${student_info[0].remark} saved `
    })
  } catch (error) {
    const err = SqlException.handle(error)
    res.status(err.code).json(
      {
        message: "Server error",
        err
      });
    conn.rollback()
  } finally {

    conn.release()
  }



};



// ==============================
// RESET STUDENT RESULT 
// ==============================
exports.resetResult = async (req, res) => {
  const { student_id } = req.params
  const student_info = req.body

  if (!student_info || !student_id) return res.status(HttpStatusCodes.BAD_REQUEST).send({ message: "Students info or id not provided" })
  const db = getDB()
  const conn = await db.getConnection();
  let isDeproved = student_info.shouldSetBack
  try {
    await conn.beginTransaction()
    if (student_info.shouldSetBack) {
      const [result] = await db.query(`
        update students set semester= semester - 1 where user_id =? and semester>1
      `, [student_info.student_id]);
      if (result.affectedRows == 0) {
        isDeproved = false
      }
    }

    const [upd_res] = await db.query(`
      update student_courses set status= 'enrolled' where student_id = ? AND course_id in (?)
    `, [student_info.student_id, student_info.enrolled_courses]);
    if (upd_res.affectedRows == 0) {
      res.status(HttpStatusCodes.NOT_FOUND).send({
        message: "No course status reset"
      })
      conn.rollback()
    }

    await conn.commit();
    return res.send({
      message: "Student result has been reset",
      isDeproved: isDeproved,
      student_id: student_info.student_id
    })

  } catch (error) {
    const err = SqlException.handle(error)
    res.status(err.code).json(
      {
        message: "Server error",
        err
      });
    conn.rollback()
  } finally {

    conn.release()
  }



};
// ==============================
// UPDATE STUDENT
// ==============================
exports.updateStudent = async (req, res) => {
  const db = getDB();
  const conn = await db.getConnection();
  const { id } = req.params;
  const { name, email, department_id, semester, password } = req.body;

  if (!id) return res.status(400).json({ message: "Student ID required" });

  try {
    await conn.beginTransaction();

    // 1️⃣ Update users table (name, email, password if provided)
    if (password) {
      await conn.query(
        `UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ? AND role='student'`,
        [name, email, password, id]
      );
    } else {
      await conn.query(
        `UPDATE users SET name = ?, email = ? WHERE id = ? AND role='student'`,
        [name, email, id]
      );
    }

    // 2️⃣ Update students table
    await conn.query(
      `UPDATE students
       SET department_id = ?, semester = ?
       WHERE user_id = ?`,
      [department_id, semester, id]
    );

    // 3️⃣ Fetch updated student with empty courses arrays
    const [rows] = await conn.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.password_hash AS password,
        s.department_id,
        s.semester,
        JSON_ARRAY() AS enrolledCourses,
        JSON_ARRAY() AS completedCourses,
        d.name AS department_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN departments d ON s.department_id = d.id
      WHERE u.id = ?
    `, [id]);

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Student not found after update" });
    }

    await conn.commit();
    res.json({
      message: "Student updated successfully",
      student: rows[0]
    });

  } catch (error) {
    await conn.rollback();
    const err = SqlException.handle(error);
    console.error(error);
    res.status(err.status || 500).json(err);
  } finally {
    conn.release();
  }
};

// ==============================
// DELETE STUDENT
// ==============================
exports.deleteStudent = async (req, res) => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    await conn.beginTransaction();

    // 🔹 Get student info before delete
    const [[student]] = await conn.query(
      `SELECT name, email FROM users WHERE id = ? AND role = 'student'`,
      [id]
    );

    // delete from users (students will cascade delete)
    const [result] = await conn.query(
      `DELETE FROM users WHERE id = ? AND role = 'student'`,
      [id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Student not found" });
    }

    await conn.commit();

    // 🔹 Add log after success
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Student Deleted";
      const body = `Student ${student?.name ?? "Unknown"} (ID: ${id}, Email: ${student?.email ?? "N/A"}) deleted.`;
      logger.add(heading, body);
    }

    res.json({ message: "Student deleted successfully" });

  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};