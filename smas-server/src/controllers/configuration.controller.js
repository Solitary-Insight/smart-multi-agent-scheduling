const { getDB } = require("../config/db");
const HttpStatusCodes = require("../development/HttpStatusCodes");
const SqlException = require("../development/SQL_EXCEPTIONS");

// ======================================
// GET ALL CONFIGURATIONS
// ======================================
exports.getAllConfigurations = async (req, res) => {
    try {
        const db = getDB();

        const [rows] = await db.query(`
      SELECT id, \`key\`, \`value\`, description, created_at, updated_at
      FROM configurations
      ORDER BY \`key\`
    `);

        // Parse JSON safely
        const parsed = rows.map(r => ({
            ...r,
            value: typeof r.value === "string" ? JSON.parse(r.value) : r.value
        }));

        res.json(parsed);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// ======================================
// GET CONFIG BY KEY
// ======================================
exports.getConfigurationByKey = async (req, res) => {
    try {
        const db = getDB();
        const { key } = req.params;

        const [rows] = await db.query(
            `SELECT \`key\`, \`value\`, description FROM configurations WHERE \`key\` = ?`,
            [key]
        );

        if (!rows.length) {
            return res.status(HttpStatusCodes.NOT_FOUND).json({
                message: "Configuration not found"
            });
        }

        const config = rows[0];

        res.json({
            ...config,
            value: typeof config.value === "string"
                ? JSON.parse(config.value)
                : config.value
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
/**
 * Upsert configuration and update week_days in a single transaction
 */
exports.setConfiguration = async (req, res) => {
    const { key } = req.params;
    const { days_config, value, description = "" } = req.body;

    if (!key) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Key is required" });
    }

    if (value === undefined) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Value is required" });
    }

    const db = getDB();
    const conn = await db.getConnection();

    try {
        // Begin transaction
        await conn.beginTransaction();
        // ===========================
        // 1️⃣ Upsert configuration
        // ===========================
        await conn.query(
            `INSERT INTO configurations (\`key\`, \`value\`, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description)`,
            [key, JSON.stringify(value), description]
        );

        // ===========================
        // 2️⃣ Update week_days if days_config provided
        // ===========================
        if (days_config) {
            // Normalize to array of [id, is_holiday]
            const updates = Array.isArray(days_config)
                ? days_config
                : Object.entries(days_config);

            for (const [id, is_holiday] of updates) {
                await conn.query(
                    "UPDATE week_days SET is_holiday = ? WHERE id = ?",
                    [is_holiday, id]
                );
            }
        }

        // Commit transaction
        await conn.commit();
        const logger = req.app.get('logger');
        if (logger) {
            const heading = "Configuration Changed";
            const body = `The configuration "${key}" was updated successfully.${description ? ` Note: ${description}.` : ""}${days_config ? " Weekly schedule was also updated." : ""}`;
            logger.add(heading, body);
        }
        return res.json({ message: "Configuration and week days updated successfully" });
    } catch (error) {
        await conn.rollback();
        console.error("[CONFIG-UPDATE-ERROR]", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to update configuration",
            error: error.message
        });
    }
};
// ======================================
// UPDATE CONFIG (STRICT - MUST EXIST)
// ======================================
exports.updateConfiguration = async (req, res) => {
    const { key } = req.params;
    const { value, description = "" } = req.body;

    const db = getDB();

    try {
        const [result] = await db.query(`
      UPDATE configurations
      SET \`value\` = ?, description = ?
      WHERE \`key\` = ?
    `, [JSON.stringify(value), description, key]);

        if (!result.affectedRows) {
            return res.status(HttpStatusCodes.NOT_FOUND).json({
                message: "Configuration not found"
            });
        }

        res.json({
            message: "Configuration updated successfully"
        });

    } catch (error) {
        const err = SqlException.handle(error);
        res.status(err.status || HttpStatusCodes.INTERNAL_SERVER_ERROR).json(err);
    }
};

// ======================================
// DELETE CONFIGURATION
// ======================================
exports.deleteConfiguration = async (req, res) => {
    const { key } = req.params;
    const db = getDB();

    try {
        const [result] = await db.query(
            `DELETE FROM configurations WHERE \`key\` = ?`,
            [key]
        );

        if (!result.affectedRows) {
            return res.status(HttpStatusCodes.NOT_FOUND).json({
                message: "Configuration not found"
            });
        }

        res.json({
            message: "Configuration deleted successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
    }
};