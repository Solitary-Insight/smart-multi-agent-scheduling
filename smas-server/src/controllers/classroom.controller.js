const { getDB } = require("../config/db");
const HttpStatusCodes = require("../development/HttpStatusCodes");
const SqlException = require("../development/SQL_EXCEPTIONS");


// ======================================
// GET ALL CLASSROOMS
// ======================================
exports.getAllClassrooms = async (req, res) => {
  try {
    const db = getDB();

    const [rows] = await db.query(`
      SELECT 
        id,
        name,
        building,
        type,
        capacity,
        equipments
      FROM classrooms
      ORDER BY building, name
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ======================================
// GET CLASSROOM BY ID
// ======================================
exports.getClassroomById = async (req, res) => {
  try {

    const db = getDB();
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT id,name,building,type,capacity,equipments
       FROM classrooms
       WHERE id=?`,
      [id]
    );

    if (!rows.length) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ message: "Classroom not found" });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error(error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};


// ======================================
// CREATE CLASSROOM
// ======================================
exports.createClassroom = async (req, res) => {

  const {
    name,
    building = "",
    type = "",
    capacity = 0,
    equipments = ""
  } = req.body;

  if (!name) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ message: "Classroom name is required" });
  }

  const db = getDB();

  try {

    const [result] = await db.execute(
      `INSERT INTO classrooms
       (name, building, type, capacity, equipments)
       VALUES (?, ?, ?, ?, ?)`,
      [name, building, type, capacity, equipments]
    );

    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Classroom Created";
      const body = `A new classroom "${name}" was created${building ? ` in ${building}` : ""}${type ? ` (${type})` : ""} with capacity ${capacity}.`;
      logger.add(heading, body);
    }
    res.status(HttpStatusCodes.CREATED).json({
      message: "Classroom created successfully",
      classroom_id: result.insertId
    });

  } catch (error) {

    const err = SqlException.handle(error);
    res.status(err.status || 500).json(err);

  }
};


// ======================================
// UPDATE CLASSROOM
// ======================================
exports.updateClassroom = async (req, res) => {

  const { id } = req.params;

  const {
    name,
    building = "",
    type = "",
    capacity = 0,
    equipments = ""
  } = req.body;

  const db = getDB();

  try {

    const [result] = await db.execute(
      `UPDATE classrooms
       SET name=?, building=?, type=?, capacity=?, equipments=?
       WHERE id=?`,
      [name, building, type, capacity, equipments, id]
    );

    if (!result.affectedRows) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ message: "Classroom not found" });
    }

    res.json({
      message: "Classroom updated successfully",
      classroom_id: id
    });

  } catch (error) {

    const err = SqlException.handle(error);
    res.status(err.status || 500).json(err);

  }
};


// ======================================
// DELETE CLASSROOM
// ======================================
exports.deleteClassroom = async (req, res) => {

  const { id } = req.params;
  const db = getDB();

  try {
    const [[classroom]] = await db.query(
      `SELECT name, building, type FROM classrooms WHERE id=?`,
      [id]
    );

    const [result] = await db.query(
      `DELETE FROM classrooms WHERE id=?`,
      [id]
    );

    if (!result.affectedRows) {
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ message: "Classroom not found" });
    }

    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Classroom Deleted";
      const body = `Classroom "${classroom?.name ?? "Unknown"}"${classroom?.building ? ` in ${classroom.building}` : ""}${classroom?.type ? ` (${classroom.type})` : ""} was deleted.`;
      logger.add(heading, body);
    }
    res.json({
      message: "Classroom deleted successfully"
    });

  } catch (error) {

    console.error(error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error" });

  }
};