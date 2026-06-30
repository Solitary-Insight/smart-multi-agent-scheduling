const { HttpStatusCode } = require("axios");
const { getDB } = require("../config/db");
const HttpStatusCodes = require("../development/HttpStatusCodes");

// Get all users
exports.getWeekDays = async (req, res) => {
  const db = getDB()
  try {
    const [rows] = await db.query(`
      SELECT 
  id,
  name,
  is_holiday,

  -- Actual date for each weekday (current week)
  DATE_ADD(
    CURDATE(),
    INTERVAL (id - (WEEKDAY(CURDATE()) + 1)) DAY
  ) AS date,

  CASE
    WHEN id = WEEKDAY(CURDATE()) + 1 THEN 'present'
    WHEN id > WEEKDAY(CURDATE()) + 1 THEN 'future'
    ELSE 'past'
  END AS stage

FROM week_days
ORDER BY id;`);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};


// Get all users
exports.getWeekDaysWithSlots = async (req, res) => {
  const db = getDB()
  try {
    const [rows] = await db.query("SELECT wd.id as day_id,  wd.name,wd.is_holiday,ts.department_id, ts.id as slot_id ,ts.start_time,ts.end_time  FROM timetable_slots ts join week_days wd on ts.day_id=wd.id;");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getTodayInfo = async (req, res) => {
  try {
    const now = new Date();

    const todayInfo = {
      fullDate: now.toISOString(),              // full timestamp
      date: now.toLocaleDateString(),           // e.g. 4/5/2026
      time: now.toLocaleTimeString(),           // current time
      dayName: now.toLocaleDateString('en-US', { weekday: 'long' }), // Sunday
      dayNumber: now.getDay(),                  // 0 (Sunday) - 6 (Saturday)
    };

    res.json(todayInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ==============================
// GET SYSTEM RESOURCE STATS
// ==============================
exports.getSystemStats = async (req, res) => {
  const db = getDB();

  try {
    const [
      [courses],
      [teachers],
      [students],
      [departments],
      [classrooms],
      [mergedClasses],
      [workingDays],
      [scheduledClasses] // ✅ NEW
    ] = await Promise.all([
      db.query("SELECT COUNT(*) AS count FROM courses"),
      db.query("SELECT COUNT(*) AS count FROM teachers"),
      db.query("SELECT COUNT(*) AS count FROM students"),
      db.query("SELECT COUNT(*) AS count FROM departments"),
      db.query("SELECT COUNT(*) AS count FROM classrooms"),
      db.query("SELECT COUNT(*) AS count FROM course_merges"),
      db.query("SELECT COUNT(*) AS count FROM week_days WHERE is_holiday = 0"),
      db.query("SELECT COUNT(*) AS count FROM timetable_slots") // ✅ NEW
    ]);

    return res.status(HttpStatusCodes.OK).send({
      success: true,
      data: {
        courses: courses[0].count,
        teachers: teachers[0].count,
        students: students[0].count,
        departments: departments[0].count,
        classrooms: classrooms[0].count,
        mergedClasses: mergedClasses[0].count,
        workingDays: workingDays[0].count,
        scheduledClasses: scheduledClasses[0].count, // ✅ NEW
      },
      message: "System stats fetched successfully",
    });

  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getAdvancedStats = async (req, res) => {
  const db = getDB();

  try {
    const [
      [enrollmentRate],
      [roomUtilization],
      [avgClassSize],

      [coursesPerDept]
    ] = await Promise.all([

      // 1. Enrollment Rate
      db.query(`
        SELECT 
          IFNULL(ROUND(
            (COUNT(CASE WHEN status = 'enrolled' THEN 1 END) * 100.0 / COUNT(*)), 2
          ), 0) AS rate
        FROM student_courses
      `),

      // 2. Room Utilization
      db.query(`
        SELECT 
          IFNULL(ROUND(
            (COUNT(*) * 100.0 / (
              (SELECT COUNT(*) FROM classrooms) *
              (SELECT COUNT(*) FROM week_days WHERE is_holiday = 0)
            )), 2
          ), 0) AS utilization
        FROM timetable_slots
      `),

      // 3. Avg Class Size
      db.query(`
        SELECT 
          IFNULL(ROUND(AVG(student_count), 2), 0) AS avg_size
        FROM (
          SELECT course_id, COUNT(*) AS student_count
          FROM student_courses
          WHERE status = 'enrolled'
          GROUP BY course_id
        ) t
      `),



      // 5. Courses per Department
      db.query(`
        SELECT 
          IFNULL(ROUND(AVG(course_count), 2), 0) AS avg_courses
        FROM (
          SELECT department_id, COUNT(*) AS course_count
          FROM courses
          GROUP BY department_id
        ) t
      `)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        enrollmentRate: enrollmentRate[0].rate,
        roomUtilization: roomUtilization[0].utilization,
        avgClassSize: avgClassSize[0].avg_size,
        coursesPerDepartment: coursesPerDept[0].avg_courses
      },
      message: "Advanced stats fetched successfully"
    });

  } catch (error) {
    console.error("❌ Advanced stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};


exports.readLogs = async (req, res) => {
  const logger = req.app.get('logger'); // make sure you set logger in app.js
  if (!logger) {
    return res.status(500).json({ message: "Logger not initialized" });
  }

  const logs = logger.getAll();
  res.json({
    success: true,
    logs
  });
}




exports.readTrafficLogs = async (req, res) => {
  try {
    const logger = req.app.get('traffic_logger');
    if (!logger) {
      return res.status(500).json({ success: false, message: "Logger not initialized" });
    }

    const allLogs = logger.getAll() || [];

    // 1. Take only the latest 50 logs to keep the string length sane
    // 2. Map through to truncate huge response bodies
    const sanitizedLogs = allLogs.slice(-50).map(log => ({
      ...log,
      responseData: truncateData(log.responseData, 2000) // limit body to 2kb
    }));

    res.json({
      success: true,
      logs: sanitizedLogs
    });
  } catch (error) {
    console.error("Traffic Log Error:", error);
    res.status(500).json({ success: false, message: "Failed to process logs" });
  }
};

/**
 * Helper to prevent massive strings from crashing JSON.stringify
 */
function truncateData(data, maxChars) {
  if (!data) return null;
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  if (str.length > maxChars) {
    return str.substring(0, maxChars) + "... [Truncated due to size]";
  }
  return data;
}
