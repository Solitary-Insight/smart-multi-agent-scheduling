const { getDB } = require("../config/db");
const SqlException = require("../development/SQL_EXCEPTIONS");


// ======================================
// GET ALL DEPARTMENTS OVERVIEW
// ======================================
exports.getAllDepartmentsOverview = async (req, res) => {
  try {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT 
        d.id,
        d.name,
        d.code,
        d.head_of_department,
        d.created_at,

        u.name AS head_name,

        COUNT(DISTINCT td.teacher_id) AS teachers_count,
        COUNT(DISTINCT s.user_id) AS students_count,
        COUNT(DISTINCT c.id) AS courses_count

      FROM departments d
      LEFT JOIN users u ON d.head_of_department = u.id
      LEFT JOIN teacher_departments td ON td.department_id = d.id
      LEFT JOIN students s ON s.department_id = d.id
      LEFT JOIN courses c ON c.department_id = d.id

      GROUP BY d.id
      ORDER BY d.name
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};






// ======================================
// GET ALL DEPARTMENTS
// ======================================
exports.getAllDepartments = async (req, res) => {
  try {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT * FROM departments
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



// ======================================
// GET DEPARTMENT BY ID
// ======================================
exports.getDepartmentById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        d.id,
        d.name,
        d.code,
        d.head_of_department,
        d.created_at,
        u.name AS head_name
      FROM departments d
      LEFT JOIN users u ON d.head_of_department = u.id
      WHERE d.id = ?
    `, [id]);

    if (!rows.length)
      return res.status(404).json({ message: "Department not found" });

    res.json(rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================
// CREATE DEPARTMENT
// ======================================
exports.createDepartment = async (req, res) => {

  const {
    name,
    code,
    head_of_department
  } = req.body;

  if (!name || !code)
    return res.status(400).json({ message: "Missing required fields" });

  const db = getDB();
  const conn = await db.getConnection();

  try {

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO departments (name, code, head_of_department)
       VALUES (?, ?, ?)`,
      [
        name.trim(),
        code.trim().toUpperCase(),
        head_of_department || null
      ]
    );

    await conn.commit();

    res.status(201).json({
      message: "Department created successfully",
      department_id: result.insertId
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
// UPDATE DEPARTMENT
// ======================================
exports.updateDepartment = async (req, res) => {

  const db = getDB();
  const conn = await db.getConnection();
  const { id } = req.params;

  const {
    name,
    code,
    head_of_department
  } = req.body;

  try {

    await conn.beginTransaction();

    const [result] = await conn.query(
      `UPDATE departments
       SET name = ?, code = ?, head_of_department = ?
       WHERE id = ?`,
      [
        name.trim(),
        code.trim().toUpperCase(),
        head_of_department || null,
        id
      ]
    );

    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ message: "Department not found" });
    }

    await conn.commit();
    // 🔹 Log
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Department Created";
      const body = `Department ${name} (${code.toUpperCase()}) created with ID ${result.insertId}.`;
      logger.add(heading, body);
    }
    res.json({ department_id: result.insertId, message: "Department updated successfully" });

  } catch (error) {

    await conn.rollback();

    const err = SqlException.handle(error);
    res.status(err.status || 500).json(err);

  } finally {
    conn.release();
  }
};


// ======================================
// DELETE DEPARTMENT
// ======================================
exports.deleteDepartment = async (req, res) => {

  const db = getDB();
  const conn = await db.getConnection();
  const { id } = req.params;

  try {

    await conn.beginTransaction();
    const [[dept]] = await conn.query(
      `SELECT name, code FROM departments WHERE id=?`,
      [id]
    );
    const [result] = await conn.query(
      `DELETE FROM departments WHERE id=?`,
      [id]
    );

    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ message: "Department not found" });
    }

    await conn.commit();
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Department Deleted";
      const body = `Department ${dept?.name ?? "Unknown"} (${dept?.code ?? "N/A"}) with ID ${id} deleted.`;
      logger.add(heading, body);
    }
    res.json({ message: "Department deleted successfully" });

  } catch (error) {

    await conn.rollback();

    const err = SqlException.handle(error);
    res.status(err.status || 500).json(err);

  } finally {
    conn.release();
  }
};