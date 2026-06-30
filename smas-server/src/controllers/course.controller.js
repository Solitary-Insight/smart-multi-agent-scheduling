const { getDB } = require("../config/db");
const HttpStatusCodes = require("../development/HttpStatusCodes");
const SqlException = require("../development/SQL_EXCEPTIONS");
const { sendMessage } = require("../sockets/notification-socket");

// ======================================
// GET ALL COURSES (with prerequisites)
// ======================================
exports.getAllCourses = async (req, res) => {
  try {
    const db = getDB();

    // const [rows] = await db.query(`
    //   SELECT 
    //     c.id,
    //     c.course_name,
    //     c.course_code,
    //     c.department_id,
    //     d.name AS department_name,
    //     d.code AS department_code,

    //     c.teacher_id,
    //     u.name AS teacher_name,
    //     c.semester,
    //     c.credit_hours,
    //     c.description,
    //     IFNULL(JSON_ARRAYAGG(cp.prerequisite_id), JSON_ARRAY()) AS prerequisites
    //   FROM courses c
    //   JOIN departments d ON c.department_id = d.id
    //   JOIN users u ON c.teacher_id = u.id
    //   LEFT JOIN course_prerequisites cp ON cp.course_id = c.id

    //   GROUP BY c.id
    //   ORDER BY c.course_name
    // `);

    const [rows] = await db.query(`
      SELECT 
    c.id,
    c.course_name,
    c.course_code,
    c.department_id,

    d.name AS department_name,
    d.code AS department_code,

    c.teacher_id,
    u.name AS teacher_name,

    c.semester,
    c.credit_hours,
    c.description,

    COALESCE(
        JSON_ARRAYAGG(
            CASE 
                WHEN cp.prerequisite_id IS NOT NULL 
                THEN cp.prerequisite_id
            END
        ),
        JSON_ARRAY()
    ) AS prerequisites

FROM courses c

LEFT JOIN departments d 
    ON c.department_id = d.id

LEFT JOIN users u 
    ON c.teacher_id = u.id

LEFT JOIN course_prerequisites cp 
    ON cp.course_id = c.id

GROUP BY 
    c.id,
    c.course_name,
    c.course_code,
    c.department_id,
    d.name,
    d.code,
    c.teacher_id,
    u.name,
    c.semester,
    c.credit_hours,
    c.description

ORDER BY c.course_name;
    `);



    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getEnrollmentStats = async (req, res) => {
  try {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT
        c.id,
        c.course_name,
        c.course_code,

        COUNT(
          CASE 
            WHEN sc.status = 'requested' 
            THEN 1 
          END
        ) AS requested_students,

        COUNT(
          CASE 
            WHEN sc.status = 'enrolled' 
            THEN 1 
          END
        ) AS enrolled_students,

        COUNT(
          CASE 
            WHEN sc.status = 'completed' 
            THEN 1 
          END
        ) AS completed_students,

        COUNT(
          CASE 
            WHEN sc.status = 'failed' 
            THEN 1 
          END
        ) AS failed_students,

        COUNT(
          CASE 
            WHEN sc.status = 'dropped' 
            THEN 1 
          END
        ) AS dropped_students,

        COUNT(
          CASE 
            WHEN sc.status = 'rejected' 
            THEN 1 
          END
        ) AS rejected_students,

        COUNT(sc.student_id) AS total_records

      FROM courses c

      LEFT JOIN student_courses sc
        ON sc.course_id = c.id

      GROUP BY
        c.id,
        c.course_name,
        c.course_code

      ORDER BY c.course_name;
    `);
   const courses_map= Object.fromEntries(rows.map(r=>[r.id,r]))
    res.json(courses_map);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ======================================
// GET COURSE BY ID (with prerequisites)
// ======================================
exports.getCourseById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        c.id,
        c.course_name,
        c.course_code,
        c.department_id,
        d.name AS department_name,
        d.code AS department_code,
        c.teacher_id,
        u.name AS teacher_name,
        c.semester,
        c.credit_hours,
        c.description,
        IFNULL(JSON_ARRAYAGG(cp.prerequisite_id), JSON_ARRAY()) AS prerequisites
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      JOIN users u ON c.teacher_id = u.id
      LEFT JOIN course_prerequisites cp ON cp.course_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

    if (!rows.length) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Course not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================================
// CREATE COURSE (with prerequisites)
// ======================================
exports.createCourse = async (req, res) => {
  const {
    course_name,
    course_code,
    department_id,
    teacher_id,
    semester,
    credit_hours,
    description = "",
    prerequisites = []
  } = req.body;

  if (!course_name || !course_code || !department_id || !teacher_id || !semester || !credit_hours) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Missing required fields" });
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Insert course
    const [courseResult] = await conn.execute(
      `INSERT INTO courses
        (course_name, course_code, department_id, teacher_id, semester, credit_hours, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [course_name, course_code, department_id, teacher_id, semester, credit_hours, description]
    );

    const courseId = courseResult.insertId;

    // Validate prerequisite IDs
    if (prerequisites.length > 0) {
      const [validCourses] = await conn.query(
        `SELECT id,course_code FROM courses WHERE id IN (?)`,
        [prerequisites]
      );


      const filteredPrereqs = validCourses.map(c => c.id)



      // const validCodes = validCourses.map(c => c.course_code);

      // // Filter out invalid IDs
      // const filteredPrereqsCodes = prerequisites.filter(id => validCodes.includes(id));
      // const filteredPrereqs = validCourses.filter(id => validCodes.includes(id));

      if (filteredPrereqs.length > 0) {
        const prereqValues = filteredPrereqs.map(id => [courseId, id]);
        await conn.query(
          `INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES ${prereqValues.map(() => '(?, ?)').join(',')}`,
          prereqValues.flat()
        );
      }
    }

    await conn.commit();
    // 🔹 Log
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Course Created";
      const body = `Course ${course_name} (${course_code}) created with ID ${courseId}, Dept ${department_id}, Teacher ${teacher_id}, Semester ${semester}.`;
      logger.add(heading, body);
    }
    res.status(201).json({
      message: "Course created successfully",
      course_id: courseId
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
// UPDATE COURSE (with prerequisites)
// ======================================
exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const {
    course_name,
    course_code,
    department_id,
    teacher_id,
    semester,
    credit_hours,
    description = "",
    prerequisites = []
  } = req.body;

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Update course
    const [result] = await conn.execute(
      `UPDATE courses
       SET course_name=?, course_code=?, department_id=?, teacher_id=?, semester=?, credit_hours=?, description=?
       WHERE id=?`,
      [course_name, course_code, department_id, teacher_id, semester, credit_hours, description, id]
    );

    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Course not found" });
    }

    // Reset prerequisites
    await conn.query(`DELETE FROM course_prerequisites WHERE course_id=?`, [id]);

    if (prerequisites.length > 0) {
      const [validCourses] = await conn.query(
        `SELECT id FROM courses WHERE id IN (?)`,
        [prerequisites]
      );

      const validIds = validCourses.map(c => c.id);
      const filteredPrereqs = prerequisites.filter(p => validIds.includes(p));

      if (filteredPrereqs.length > 0) {
        const prereqValues = filteredPrereqs.map(pId => [id, pId]);
        await conn.query(
          `INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES ${prereqValues.map(() => '(?, ?)').join(',')}`,
          prereqValues.flat()
        );
      }
    }

    await conn.commit();
    res.json({ message: "Course updated successfully", course_id: id });

  } catch (error) {
    await conn.rollback();
    const err = SqlException.handle(error);
    res.status(err.status || 500).json(err);
  } finally {
    conn.release();
  }
};

// ======================================
// DELETE COURSE (with prerequisites)
// ======================================
exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    const [[course]] = await conn.query(
      `SELECT course_name, course_code FROM courses WHERE id=?`,
      [id]
    );
    // Delete prerequisites first to avoid FK issues
    await conn.query(`DELETE FROM course_prerequisites WHERE course_id=?`, [id]);

    const [result] = await conn.query(`DELETE FROM courses WHERE id=?`, [id]);

    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Course not found" });
    }

    await conn.commit();
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Course Deleted";
      const body = `Course ${course?.course_name ?? "Unknown"} (${course?.course_code ?? "N/A"}) with ID ${id} deleted.`;
      logger.add(heading, body);
    }
    res.json({ message: "Course deleted successfully" });

  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }


};


// ======================================
// GET COURSES AVAILABLE FOR STUDENT
// ======================================
exports.getCoursesOfStudent = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const [rows] = await db.query(`
      select  s.department_id, s.semester,
       c.course_name,c.credit_hours, c.course_code, sc.status ,t.name as teacher_name from users u 
        join students s on s.user_id = u.id AND u.id = ?   
        join student_courses sc on sc.student_id = u.id  
        join courses c on sc.course_id = c.id  
        join users t on t.id=c.teacher_id;

    `, [Number(id)]);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================================
// GET COURSES AVAILABLE FOR STUDENT
// ======================================
exports.getCoursesForStudent = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT
          c.id AS course_id,
          d.name AS department_name,
          d.code AS department_code,
          d.id AS department_id,
          c.course_code,
          c.course_name,
          c.semester,
          c.credit_hours,
          c.description,
          u.name AS professor_name,

          -- list of prerequisite course codes
          IFNULL(
            JSON_ARRAYAGG(DISTINCT pc.course_code),
            JSON_ARRAY()
          ) AS prerequisites,

          -- enrollment status
          CASE
              WHEN sc.status = 'completed' THEN 'cleared'
              WHEN sc.status = 'enrolled' THEN 'enrolled'
              WHEN sc.status = 'requested' THEN 'requested'
              ELSE 'new'
          END AS enrollment_status,

          -- prerequisite status
          CASE
              WHEN COUNT(cp.prerequisite_id) = 0 THEN 'cleared'
              WHEN SUM(
                CASE 
                  WHEN scp.status = 'completed' THEN 1 
                  ELSE 0 
                END
              ) = COUNT(cp.prerequisite_id)
              THEN 'cleared'
              ELSE 'pending'
          END AS prerequisite_status,

          -- can enroll
          CASE
              WHEN sc.status = 'completed' THEN 0
              WHEN COUNT(cp.prerequisite_id) = 0 THEN 1
              WHEN SUM(
                CASE 
                  WHEN scp.status = 'completed' THEN 1 
                  ELSE 0 
                END
              ) = COUNT(cp.prerequisite_id)
              THEN 1
              ELSE 0
          END AS can_enroll

      FROM students s

      JOIN departments d
        ON d.id = s.department_id

      JOIN courses c
        ON c.department_id = s.department_id

      JOIN users u
        ON u.id = c.teacher_id

      -- student's enrollment
      LEFT JOIN student_courses sc
        ON sc.course_id = c.id
        AND sc.student_id = s.user_id

      -- prerequisites
      LEFT JOIN course_prerequisites cp
        ON cp.course_id = c.id

      -- prerequisite course info
      LEFT JOIN courses pc
        ON pc.id = cp.prerequisite_id

      -- prerequisite completion
      LEFT JOIN student_courses scp
        ON scp.course_id = cp.prerequisite_id
        AND scp.student_id = s.user_id

      WHERE s.user_id = ?

      GROUP BY c.id
      ORDER BY c.semester, c.course_code
    `, [Number(id)]);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// ======================================
// Enroll COURSE
// ======================================
exports.enrollCourse = async (req, res) => {
  const { course_id, student_id, requireApproval } = req.body;

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const newStatus = requireApproval ? 'requested' : 'enrolled';

    // 1️⃣ Check existing record
    const [existing] = await conn.query(
      `SELECT status FROM student_courses 
       WHERE student_id = ? AND course_id = ?`,
      [student_id, course_id]
    );

    if (existing.length > 0) {
      const currentStatus = existing[0].status;

      // ❌ BLOCK cases
      if (["enrolled", "completed", "requested"].includes(currentStatus)) {
        await conn.rollback();
        return res.status(400).json({
          message: `Already ${currentStatus} in this course`
        });
      }

      // ✅ ALLOW RE-ENROLL (rejected / dropped / failed)
      await conn.query(
        `UPDATE student_courses
         SET status = ?
         WHERE student_id = ? AND course_id = ?`,
        [newStatus, student_id, course_id]
      );
      const socket = req.app.get("notification_socket");
      if (socket && currentStatus == 'requested') {
        const [usersInTimetable] = await conn.query(
          `SELECT DISTINCT id,email,name  FROM users role=?`, ['admin']);
        const userIds = usersInTimetable.map(u => u.id);

        if (userIds.length > 0) {

          await sendMessage(socket, {
            title: "New Enrollment Request",
            body: `A new enrollment request from student ID : ${student_id}. Response from admin panel.`,
            userIds
          });
        }

      }


    } else {
      // 2️⃣ Fresh insert
      await conn.query(
        `INSERT INTO student_courses (student_id, course_id, status)
         VALUES (?, ?, ?)`,
        [student_id, course_id, newStatus]
      );
    }

    await conn.commit();

    const socket = req.app.get("notification_socket");

    if (socket) {

      const [admins] = await conn.query(
        `SELECT id FROM users WHERE role=?`,
        ["admin"]
      );

      const adminIds = admins.map(u => Number(u.id));


      // Admin notifications
      if (adminIds.length > 0) {

        let adminTitle;
        let adminBody;

        if (newStatus === "requested") {
          adminTitle = "New Enrollment Request";
          adminBody = `Student ID ${student_id} requested enrollment in course ${course_id}. Please review.`;
        }

        else if (newStatus === "enrolled") {
          adminTitle = "Student Enrolled";
          adminBody = `Student ID ${student_id} has been successfully enrolled in course ${course_id}.`;
        }


        await sendMessage(socket, {
          userIds: adminIds,
          title: adminTitle,
          body: adminBody
        });
      }



      // Student notifications
      let studentTitle;
      let studentBody;


      if (newStatus === "requested") {

        studentTitle = "Enrollment Request Sent";
        studentBody = `Your request for course ${course_id} has been submitted and is pending approval.`;

      }

      else if (newStatus === "enrolled") {

        studentTitle = "Enrollment Successful";
        studentBody = `You are now enrolled in course ${course_id}.`;

      }


      await sendMessage(socket, {
        userIds: [Number(student_id)],
        title: studentTitle,
        body: studentBody
      });

    }
    res.json({
      message: `Course ${requireApproval ? "request submitted" : "enrolled"} successfully`
    });

  } catch (error) {
    await conn.rollback();

    console.error(error);

    res.status(500).json({
      message: "Server error",
      error
    });

  } finally {
    conn.release();
  }
};

// ======================================
// Withdraw COURSE
// ======================================
exports.withdrawCourse = async (req, res) => {
  const { course_id, student_id } = req.body;

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `DELETE FROM student_courses
       WHERE student_id=? AND course_id=?`,
      [student_id, course_id]
    );

    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({
        message: "Enrollment not found"
      });
    }

    await conn.commit();
    const socket = req.app.get("notification_socket"); // your io instance
    if (socket) {
      const messageTitle = "Course Withdrawn";
      const messageBody = `You have successfully withdrawn from course ${course_id}.`;

      // Fail-safe sending
      await sendMessage(socket, {
        userIds: [Number(student_id)],
        title: messageTitle,
        body: messageBody,
      });
    }
    res.json({
      message: "Course withdrawn successfully"
    });

  } catch (error) {

    await conn.rollback();

    res.status(500).json({
      message: "Server error",
      error
    });

  } finally {
    conn.release();
  }
};

// ======================================
// GET ALL REQUESTED ENROLLMENTS (ADMIN)
// ======================================
exports.getRequestedEnrollments = async (req, res) => {
  try {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT
        sc.student_id,
        u.name AS student_name,
        u.email,

        s.semester,
        d.name AS department_name,
        d.code AS department_code,
        d.id AS department_id,

        c.id AS course_id,
        c.course_name,
        c.course_code,
        c.semester AS course_semester,
        c.credit_hours,

        tu.name AS teacher_name,

        sc.status AS enrollment_status

      FROM student_courses sc

      JOIN students s ON s.user_id = sc.student_id
      JOIN users u ON u.id = s.user_id

      JOIN courses c ON c.id = sc.course_id
      JOIN departments d ON d.id = c.department_id

      JOIN users tu ON tu.id = c.teacher_id

      WHERE sc.status = 'requested'

      ORDER BY s.semester, d.name, u.name
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.approveEnrollment = async (req, res) => {
  try {
    const db = getDB();
    const { student_id, course_id } = req.body;

    await db.query(`
      UPDATE student_courses
      SET status = 'enrolled'
      WHERE student_id = ? AND course_id = ?
    `, [student_id, course_id]);

    res.json({ message: "Enrollment approved" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.rejectEnrollment = async (req, res) => {
  try {
    const db = getDB();
    const { student_id, course_id } = req.body;

    await db.query(`
      DELETE FROM student_courses
      WHERE student_id = ? AND course_id = ?
    `, [student_id, course_id]);

    res.json({ message: "Enrollment rejected" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================
// BULK ENROLLMENT RESPONSE (APPROVE / REJECT)
// ======================================
exports.handleEnrollmentResponse = async (req, res) => {
  const { data, action_type } = req.body;

  if (!data || !Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: "Invalid data payload" });
  }

  if (!["approve", "reject"].includes(action_type)) {
    return res.status(400).json({ message: "Invalid action_type" });
  }

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Decide status based on action
    const newStatus = action_type === "approve" ? "enrolled" : "rejected";

    // Build bulk update query
    const values = data.map(item => [item.student_id, item.course_id]);

    // Efficient bulk update using CASE
    const updateQuery = `
      UPDATE student_courses
      SET status = ?
      WHERE (student_id, course_id) IN (${values.map(() => "(?, ?)").join(",")})
      AND status = 'requested'
    `;

    const flatValues = values.flat();

    const [result] = await conn.query(updateQuery, [
      newStatus,
      ...flatValues
    ]);

    // Safety check
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(400).json({
        message: "No requested enrollments found to update"
      });
    }

    await conn.commit();
    const socket = req.app.get("notification_socket");

    if (socket) {

      const studentIds = [
        ...new Set(
          data.map(item => Number(item.student_id))
        )
      ];


      let title;
      let body;


      if (newStatus === "enrolled") {

        title = "Enrollment Approved";

        body = `Your enrollment request has been approved. You are now enrolled in the course.`;

      }
      else {

        title = "Enrollment Rejected";

        body = `Your enrollment request has been rejected by admin.`;

      }


      await sendMessage(socket, {
        userIds: studentIds,
        title,
        body
      });

    }
    res.json({
      message: `${action_type === "approve" ? "Approved" : "Rejected"} successfully`,
      affected: result.affectedRows
    });

  } catch (error) {
    await conn.rollback();

    console.error("Transaction Error:", error);

    res.status(500).json({
      message: "Transaction failed",
      error
    });

  } finally {
    conn.release();
  }
};