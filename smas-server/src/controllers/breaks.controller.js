const { getDB } = require("../config/db");
const HttpStatusCodes = require("../development/HttpStatusCodes");
const SqlException = require("../development/SQL_EXCEPTIONS");
// ==============================
// GET ALL BREAKS
// ==============================
exports.getBreaks = async (req, res) => {
  try {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT 
        b.id,
        b.label,
        b.start,
        b.end,

        -- days array
        (
          SELECT JSON_ARRAYAGG(day_id)
          FROM break_days bd
          WHERE bd.break_id = b.id
        ) AS days,

        -- departments array
        (
          SELECT JSON_ARRAYAGG(department_id)
          FROM break_departments bd
          WHERE bd.break_id = b.id
        ) AS departments

      FROM breaks b
      ORDER BY b.start
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

// ==============================
// CREATE BREAK
// ==============================
exports.createBreak = async (req, res) => {
  const { label, start, end, days = [], departments = [] } = req.body;

  if (!label || !start || !end)
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Missing required fields" });

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ insert break
    const [result] = await conn.query(
      `INSERT INTO breaks (label, start, end) VALUES (?, ?, ?)`,
      [label, start, end]
    );

    const breakId = result.insertId;

    // 2️⃣ insert days
    if (days.length > 0) {
      const dayValues = days.map(d => [breakId, d]);
      await conn.query(
        `INSERT INTO break_days (break_id, day_id) VALUES ?`,
        [dayValues]
      );
    }

    // 3️⃣ insert departments
    if (departments.length > 0) {
      const depValues = departments.map(d => [breakId, d]);
      await conn.query(
        `INSERT INTO break_departments (break_id, department_id) VALUES ?`,
        [depValues]
      );
    }

    await conn.commit();
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Break Created";
      const body = `A new break "${label}" was scheduled from ${start} to ${end}${days.length ? ` on days: ${days.join(", ")}` : ""}${departments.length ? ` for departments: ${departments.join(", ")}` : ""}.`;
      logger.add(heading, body);
    }
    res.status(HttpStatusCodes.CREATED).json({
      message: "Break created",
      id: breakId
    });

  } catch (error) {
    await conn.rollback();
    const err = SqlException.handle(error);
    res.status(err.status).json(err);
  } finally {
    conn.release();
  }
};

// ==============================
// UPDATE BREAK
// ==============================
exports.updateBreak = async (req, res) => {
  const { id } = req.params;
  const { label, start, end, days = [], departments = [] } = req.body;

  if (!id) return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Break ID required" });

  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ update break
    const [result] = await conn.query(
      `UPDATE breaks SET label=?, start=?, end=? WHERE id=?`,
      [label, start, end, id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Break not found" });
    }

    // 2️⃣ delete old relations
    await conn.query(`DELETE FROM break_days WHERE break_id=?`, [id]);
    await conn.query(`DELETE FROM break_departments WHERE break_id=?`, [id]);

    // 3️⃣ insert new days
    if (days.length > 0) {
      const dayValues = days.map(d => [id, d]);
      await conn.query(
        `INSERT INTO break_days (break_id, day_id) VALUES ?`,
        [dayValues]
      );
    }

    // 4️⃣ insert new departments
    if (departments.length > 0) {
      const depValues = departments.map(d => [id, d]);
      await conn.query(
        `INSERT INTO break_departments (break_id, department_id) VALUES ?`,
        [depValues]
      );
    }

    await conn.commit();

    res.json({ message: "Break updated" });

  } catch (error) {
    await conn.rollback();
    const err = SqlException.handle(error);
    res.status(err.status).json(err);
  } finally {
    conn.release();
  }
};

// ==============================
// DELETE BREAK
// ==============================
exports.deleteBreak = async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    const [[breakInfo]] = await conn.query(
      `SELECT label, start, end FROM breaks WHERE id = ?`,
      [id]
    );
    const [result] = await conn.query(
      `DELETE FROM breaks WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Break not found" });
    }

    await conn.commit();
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Break Deleted";
      const body = `The break "${breakInfo?.label ?? "Unknown"}" scheduled from ${breakInfo?.start ?? "N/A"} to ${breakInfo?.end ?? "N/A"} was deleted.`;
      logger.add(heading, body);
    }
    res.json({ message: "Break deleted" });

  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};