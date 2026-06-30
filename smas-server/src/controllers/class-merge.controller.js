const { getDB } = require("../config/db");
const HttpStatusCodes = require("../development/HttpStatusCodes");

exports.mergeClasses = async (req, res) => {
  console.log('req.body', req.body)

  const { title, courses } = req.body; // courses should be an array of IDs: [1, 2, 3]
  if (!title || !courses || !Array.isArray(courses) || courses.length < 2) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      message: "Please provide a title and at least two courses to merge."
    });
  }

  const db = getDB();
  const conn = await db.getConnection(); // Get a dedicated connection for the transaction

  try {
    await conn.beginTransaction();

    // 1. Create the Merge Group
    const [merge_res] = await conn.query(
      'INSERT INTO course_merges (merge_name) VALUES (?)',
      [title]
    );

    const new_merge_id = merge_res.insertId;

    // 2. Prepare bulk insert for partners
    // Transform [id1, id2] into [[merge_id, id1], [merge_id, id2]]
    const partnerValues = courses.map(courseId => [new_merge_id, courseId]);

    // 3. Bulk Insert into course_merge_partners
    // The [[]] syntax is required by mysql2/mariadb for bulk inserts
    const [partner_res] = await conn.query(
      'INSERT INTO course_merge_partners (merge_id, course_id) VALUES ?',
      [partnerValues]
    );

    // 4. If everything is okay, commit
    await conn.commit();
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Classes Merged";
      const body = `A new class group "${title}" was created by merging the following courses: ${courses.join(", ")}.`;
      logger.add(heading, body);
    }
    res.status(HttpStatusCodes.CREATED).json({
      message: "Classes merged successfully",
      mergeId: new_merge_id,
      affectedRows: partner_res.affectedRows
    });

  } catch (error) {
    // Rollback on any failure to prevent "ghost" merges with no partners
    await conn.rollback();
    console.error("Merge Error:", error);

    // Check for unique constraint (already merged courses)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(HttpStatusCodes.CONFLICT).json({
        message: "One or more selected courses are already part of another merge."
      });
    }

    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Server Error during merge process"
    });
  } finally {
    // Always release the connection back to the pool
    conn.release();
  }
};


exports.getMergeClasses = async (req, res) => {
  const db = getDB();

  try {
    // This query retrieves the merge group and aggregates the course details into a single row per merge
    const query = `
      SELECT 
        cm.id, 
        cm.merge_name as title,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', c.id,
            'course_code', c.course_code,
            'course_name', c.course_name,
            'department_id', c.department_id,
            
            'teacher_name', u.name,
            'teacher_id', u.id
          )
        ) AS courses
      FROM course_merges cm
      JOIN course_merge_partners cmp ON cm.id = cmp.merge_id
      JOIN courses c ON cmp.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      GROUP BY cm.id;
    `;

    const [rows] = await db.query(query);

    // Some drivers return JSON_ARRAYAGG as a string, others as a parsed object.
    // We ensure it's parsed for the frontend.
    const formattedRows = rows.map(row => ({
      ...row,
      courses: typeof row.courses === 'string' ? JSON.parse(row.courses) : row.courses
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error("Fetch Merge Error:", error);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to retrieve merged classes"
    });
  }
};



// ======================================
// DELETE COURSE MERGE
// ======================================
exports.deleteCourseMerge = async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    const [[merge]] = await conn.query(
      `SELECT merge_name FROM course_merges WHERE id=?`,
      [id]
    );
    const [result] = await conn.query(`DELETE FROM course_merges WHERE id=?`, [id]);

    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Merge not found" });
    }

    await conn.commit();
    const logger = req.app.get('logger');
    if (logger) {
      const heading = "Course Merge Deleted";
      const body = `The merged class group "${merge?.merge_name ?? "Unknown"}" (ID: ${id}) was deleted.`;
      logger.add(heading, body);
    }
    res.json({ message: "Course Merge deleted successfully" });

  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }


};