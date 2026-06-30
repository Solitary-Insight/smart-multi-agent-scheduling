const { getDB } = require("../config/db");
const { rescheduleTimetableSlot } = require("../core/slot-rescheduling-agent");
const HttpStatusCodes = require("../development/HttpStatusCodes");
const SqlException = require("../development/SQL_EXCEPTIONS");
const { sendMessage } = require("../sockets/notification-socket");

// ======================================
// CREATE RESCHEDULE REQUEST
// ======================================
exports.createRequest = async (req, res) => {
  const { slot_id, teacher_name, course_name, day_name, teacher_id, preferred_day_id, reason } = req.body;
  if (!slot_id || !teacher_id || !preferred_day_id) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      message: "slot_id, teacher_id and preferred_day_id are required"
    });
  }

  const db = getDB();

  try {
    const [result] = await db.query(
      `INSERT INTO reschedule_requests 
        (slot_id, teacher_id, preferred_day_id, reason)
       VALUES (?, ?, ?, ?)`,
      [slot_id, teacher_id, Number(preferred_day_id), reason || null]
    );
    const logger = req.app.get('logger');

    if (logger) {
      const heading = "Reschedule Requested";
      const body = ` ${teacher_name} requested for reschedule of  ${course_name ?? "Today's"} class on ${day_name ?? "Any other day"}.`;
      logger.add(heading, body);
    }
    res.status(HttpStatusCodes.CREATED).send({
      message: "Reschedule request created",
      request_id: result.insertId,
      created_at: Date.now()
    });

  } catch (error) {
    const err = SqlException.handle(error);
    res.status(err.status || 500).json(err);
  }
};


// ======================================
// GET ALL REQUESTS
// ======================================
exports.getAllRequests = async (req, res) => {
  try {
    const db = getDB();

    const [rows] = await db.query(`
 SELECT 
  rr.id,
  rr.slot_id,
  rr.reason,
  u.name AS teacher_name,
  rr.teacher_id,

  -- ✅ ALL COURSES (merged or single)
  GROUP_CONCAT(DISTINCT c.course_name) AS course_names,
  GROUP_CONCAT(DISTINCT c.course_code) AS course_codes,

  ts.start_time,
  ts.end_time,
  ts.day_id,
  wd.name AS preferred_day,
  rr.status,
  rr.created_at

FROM reschedule_requests rr

JOIN users u ON u.id = rr.teacher_id
JOIN week_days wd ON wd.id = rr.preferred_day_id

LEFT JOIN timetable_slots ts ON ts.id = rr.slot_id

-- ✅ handle both single + merged
LEFT JOIN course_merge_partners cmp 
  ON cmp.merge_id = ts.merge_id

LEFT JOIN courses c 
  ON c.id = COALESCE(cmp.course_id, ts.course_id)

GROUP BY rr.id
ORDER BY rr.created_at DESC;
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================================
// GET ALL REQUESTS
// ======================================
exports.getAllRequestsOfTeacher = async (req, res) => {
  const { teacher_id } = req.params
  if (!teacher_id) return res.status(HttpStatusCodes.BAD_REQUEST).send({ message: "Teacher id is not provided" })

  try {
    const db = getDB();

    const [rows] = await db.query(`
SELECT 
  rr.id,
  rr.slot_id,
  rr.teacher_id,
  u.name AS teacher_name,
  rr.preferred_day_id,
  wd.name AS preferred_day,
  rr.reason,
  rr.status,
  rr.created_at,

  -- ✅ SAME WEEK COLUMN
  CASE 
    WHEN YEARWEEK(rr.created_at, 1) = YEARWEEK(CURDATE(), 1) 
    THEN 1 
    ELSE 0 
  END AS same_week

FROM reschedule_requests rr
JOIN users u ON u.id = rr.teacher_id
JOIN week_days wd ON wd.id = rr.preferred_day_id
ORDER BY rr.created_at DESC;
    `);

    res.status(HttpStatusCodes.OK).send(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================
// GET REQUEST BY ID
// ======================================
exports.getRequestById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        rr.*,
        u.name AS teacher_name,
        wd.name AS preferred_day
      FROM reschedule_requests rr
      JOIN users u ON u.id = rr.teacher_id
      JOIN week_days wd ON wd.id = rr.preferred_day_id
      WHERE rr.id = ?
    `, [id]);

    if (!rows.length) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        message: "Request not found"
      });
    }

    res.json(rows[0]);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ======================================
// DELETE REQUEST
// ======================================
exports.deleteRequest = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const [result] = await db.query(
      `DELETE FROM reschedule_requests WHERE id = ?`,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({
        message: "Request not found"
      });
    }

    res.json({ message: "Request deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================
// Update REQUEST & handle reschedule
// ======================================
exports.updateStatus = async (req, res) => {
  const { request_id } = req.params;
  const { status } = req.body;

  if (!request_id || !status) {
    return res.status(400).json({ message: "Invalid request_id or status" });
  }

  try {
    const db = getDB();

    // 🔹 Fetch request info + slot + teacher + course
    const [[data]] = await db.query(`
      SELECT 
        rr.slot_id,
        u.name AS teacher_name,
        wd.name as day,
        c.course_name,
        wd.name AS day_name
      FROM reschedule_requests rr
      JOIN users u ON u.id = rr.teacher_id
      JOIN timetable_slots ts ON ts.id = rr.slot_id
      JOIN courses c ON c.id = ts.course_id
      LEFT JOIN week_days wd ON wd.id = rr.preferred_day_id
      WHERE rr.id = ?
      LIMIT 1
    `, [request_id]);

    if (!data) {
      return res.status(404).json({ message: "Request not found" });
    }

    // 🔹 Update request status
    const [updateResult] = await db.query(
      `UPDATE reschedule_requests SET status = ? WHERE id = ?`,
      [status, request_id]
    );

    if (!updateResult.affectedRows) {
      return res.status(404).json({ message: "Request not found" });
    }

    let responsePayload = { message: "Request updated successfully" };

    if (status.toLowerCase() === "rejected") {
      // 🔹 Delete any rescheduled slot linked to this request
      await db.query(
        `DELETE FROM rescheduled_slots WHERE request_id = ?`,
        [request_id]
      );
    } else if (status.toLowerCase() === "approved") {
      // 🔹 Fetch rescheduled slot info
      const [rescheduleData] = await db.query(
        `SELECT 
            rs.id,
            rs.new_day_id,
            rs.new_start_time,
            rs.new_end_time,
            rs.new_classroom_id,
            rs.reason,
            rs.request_id
         FROM rescheduled_slots rs
         WHERE rs.request_id = ?`,
        [request_id]
      );

      if (rescheduleData.length) {
        responsePayload.rescheduled_slot = rescheduleData[0];
        responsePayload.day = data?.day ?? ""
      }
    }

    // 🔹 Logging (optional)
    const logger = req.app.get("logger");
    if (logger) {
      const body = `${data.teacher_name} reschedule request for ${data.course_name}${data.day_name ? ` on ${data.day_name}` : ""
        } has been ${status.toLowerCase()}.`;
      logger.add("Reschedule Request", body);
    }
    const socket = req.app.get("notification_socket"); // your io instance

    if (socket) {
      try {
        const isApproved = status.toLowerCase() === "approved";

        // ✅ Dynamic message
        const title = "Reschedule Request Update";
        const body = isApproved
          ? `Your class for ${data.course_name || "course"} has been rescheduled${data.day_name ? ` on ${data.day_name}` : ""
          }.`
          : `${data.teacher_name || "Teacher"}'s request for ${data.course_name || "course"}${data.day_name ? ` on ${data.day_name}` : ""
          } has been rejected.`;

        // 🔹 Get teacher + students
        const [rows] = await db.query(
          `SELECT DISTINCT sc.student_id, c.teacher_id    
            FROM timetable_slots ts        
            JOIN student_courses sc ON sc.course_id = ts.course_id     
           JOIN courses c ON sc.course_id = c.id        
           join reschedule_requests rr on rr.slot_id=ts.id WHERE rr.id = ?`,
          [request_id]
        );

        let userIds = [];

        if (Array.isArray(rows) && rows.length > 0) {
          const teacherId = Number(rows[0].teacher_id);

          if (teacherId) userIds.push(teacherId);

        }

        // 👉 unique + clean
        userIds = [...new Set(userIds)].filter(Boolean);

        // 👉 send notification
        if (userIds.length > 0) {
          await sendMessage(socket, {
            title,
            body,
            userIds
          });
        }

      } catch (err) {
        console.error("Notification error:", err);
      }
    }
    res.json(responsePayload);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



// ======================================
// Run RECHEDULAR
// ======================================
exports.executeReschdeular = async (req, res) => {
  const { slot_id, teacher_id, preferred_day_id, reason } = req.body;

  if (!slot_id || !teacher_id || !preferred_day_id || !reason) {
    return res.status(400).json({ message: "Invalid request parameters or status" });
  }

  try {
    const preview = await rescheduleTimetableSlot({
      slotId: slot_id,
      teacherId: teacher_id,
      preferredDayId: preferred_day_id,        // week_days.id for e.g. Wednesday
      getDB,
      reason: reason,
      persist: false,    // default
    });
    res.json({ preview });

  } catch (error) {

    // Known rescheduling errors
    if (error.code) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details || null,
        },
      });
    }

    // Unknown / unexpected errors
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong. Please try again.",
      },
    });
  }
};



// ======================================
// COMMIT RESCHEDULE (Transaction Based)
// ======================================
exports.createRealocationSlot = async (req, res) => {
  const {
    slot_id,
    new_day_id,
    new_start_time,
    new_end_time,
    new_classroom_id,
    reschedule_date,
    reason,
    request_id,
    rescheduled_by
  } = req.body;

  // Validation
  if (!slot_id || !request_id || !new_day_id || !new_start_time || !reschedule_date) {
    return res.status(400).json({ message: "Missing required allocation data." });
  }

  const db = getDB();
  const connection = await db.getConnection(); // Get connection for transaction

  try {
    await connection.beginTransaction();

    // 1. Insert into rescheduled_slots
    const [insertResult] = await connection.query(
      `INSERT INTO rescheduled_slots 
        (slot_id,request_id, reschedule_date, new_day_id, new_start_time, new_end_time, new_classroom_id, reason, rescheduled_by, status)
       VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [slot_id, request_id, reschedule_date, new_day_id, new_start_time, new_end_time, new_classroom_id, reason, rescheduled_by || null]
    );

    // 2. Update the original request status to 'approved'
    const [updateResult] = await connection.query(
      `UPDATE reschedule_requests SET status = 'approved' WHERE id = ?`,
      [request_id]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error("Original reschedule request not found.");
    }


    const socket = req.app.get("notification_socket");

if (socket) {
  try {
    // ✅ Get course + teacher + students
    const [rows] = await connection.query(`
      SELECT DISTINCT 
        u.id AS user_id,
        c.course_name
      FROM reschedule_requests rr

      JOIN timetable_slots ts 
        ON ts.id = rr.slot_id

      -- course(s)
      LEFT JOIN course_merge_partners cmp 
        ON cmp.merge_id = ts.merge_id

      LEFT JOIN courses c 
        ON c.id = COALESCE(cmp.course_id, ts.course_id)

      -- teacher
      JOIN users u_teacher 
        ON u_teacher.id = c.teacher_id

      -- students
      LEFT JOIN student_courses sc 
        ON sc.course_id = c.id AND sc.status = 'enrolled'

      LEFT JOIN users u 
        ON u.id = sc.student_id

      WHERE rr.id = ?
    `, [request_id]);

    let userIds = [];
    let courseName = null;

    if (rows.length > 0) {
      courseName = rows[0].course_name;

      // 👉 collect student ids
      rows.forEach(r => {
        if (r.user_id) userIds.push(Number(r.user_id));
      });

      // 👉 ALSO add teacher separately
      const [teacherRow] = await connection.query(`
        SELECT teacher_id 
        FROM reschedule_requests 
        WHERE id = ?
      `, [request_id]);

      if (teacherRow.length > 0) {
        userIds.push(Number(teacherRow[0].teacher_id));
      }
    }

    // 👉 unique clean list
    userIds = [...new Set(userIds)].filter(Boolean);

    // ✅ Notification message (ONLY APPROVED)
    const title = "Class Rescheduled";
    const body = `Your class for ${courseName || "course"} has been rescheduled. Please check timetable.`;

    if (userIds.length > 0) {
      await sendMessage(socket, {
        title,
        body,
        userIds
      });
    }

  } catch (err) {
    console.error("Notification error:", err);
  }
}

    // 3. Commit Transaction
    await connection.commit();

    // Optional: Log the success
    const logger = req.app.get('logger');
    if (logger) {
      logger.add("Slot Rescheduled", `Slot #${slot_id} moved to ${reschedule_date} at ${new_start_time}`);
    }

    res.status(201).json({
      message: "Slot successfully reallocated and request approved.",
      rescheduled_slot_id: insertResult.insertId,
    });

  } catch (error) {
    // Rollback on any failure
    await connection.rollback();
    console.error("Transaction Error:", error);
    res.status(500).json({
      message: "Failed to finalize reschedule. Database rolled back.",
      error: error.message
    });
  } finally {
    connection.release(); // Always release connection back to pool
  }
};