const { HttpStatusCode } = require("axios");
const { getDB } = require("../config/db");
const { capitalizeFirst } = require("../utils/generic");
const crypto = require("crypto");
const { sendOtpEmail } = require("../utils/email-handler/email-send");

// Get all users
exports.getAdmins = async (req, res) => {
  const db = getDB()
  try {
    const [rows] = await db.query("SELECT * FROM users where role=?", ['admin']);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Create user
exports.createAdmins = async (req, res) => {
  const db = getDB()

  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(HttpStatusCode.BadRequest).send({ message: "Invalid request parameters i.e. Name, Email, Password and Role." })
    const [result] = await db.query(
      "INSERT INTO users (name, email,role,password_hash) VALUES (?, ?,?,?)",
      [name, email, 'admin', password]
    );



    res.status(201).json({
      id: result.insertId,
      name,
      email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};


// ==============================
// LOGIN USER WITH OTP & SESSION
// ==============================

exports.loginUser = async (req, res) => {
  const db = getDB();

  try {
    const { email, password, role } = req.body;

    const ip_address =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress;

    const user_agent = req.headers["user-agent"] || "unknown";

    // 1️⃣ Validate
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required",
      });
    }

    // 2️⃣ Find user
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? AND role = ? LIMIT 1",
      [email, role]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    // 3️⃣ Password check (⚠️ use bcrypt in production)
    const isMatch = password == user.password_hash;
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔑 Generate session token
    const session_token = crypto.randomBytes(32).toString("hex");

    // 4️⃣ Check existing session (device-based)
    const [sessions] = await db.query(
      `SELECT * FROM login_sessions 
       WHERE user_id = ? AND user_agent = ?
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, user_agent]
    );

    let session = sessions[0];

    // ✅ If already verified & valid
    if (
      session &&
      session.is_otp_verified === 1 &&
      new Date(session.expires_at) > new Date()
    ) {
      return res.json({
        message: "Login successful (Session Active)",
        otp_verified: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          session_token: session.session_token,
          role: user.role,
          otp_verified: true,
        },
      });
    }

    // 5️⃣ Generate OTP
    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    if (session) {
      // 🔁 UPDATE existing session
      await db.query(
        `UPDATE login_sessions 
         SET otp_code = ?, expires_at = ?, is_otp_verified = 0,
             verified_at = NULL, ip_address = ?, session_token = ?
         WHERE id = ?`,
        [otp_code, expires_at, ip_address, session_token, session.id]
      );
    } else {
      // ➕ INSERT new session
      await db.query(
        `INSERT INTO login_sessions 
        (user_id, ip_address, user_agent, otp_code, expires_at, is_otp_verified, session_token) 
        VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [user.id, ip_address, user_agent, otp_code, expires_at, session_token]
      );
    }

    // Logging
    const logger = req.app.get("logger");
    if (logger) {
      logger.add(
        `${user.role.toUpperCase()} OTP Requested`,
        `OTP REQUEST FOR LOGIN | Device: ${user_agent}`
      );
    }

    await sendOtpEmail({ name: user.name, email: user.email, otp: otp_code, expiry_date: expires_at })






    // 6️⃣ Response (send token)
    return res.json({
      message: "OTP required for verification",
      otp_verified: false,
      otp_requested: true,
      session_token,
      user: {
        id: user.id,
        session_token,
        name: user.name,
        email: user.email,
        role: user.role,
        otp_verified: false,
        expires_at,
      },
    });

  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};



// ==============================
// CHECK USER SESSION (EFFICIENT)
// ==============================
exports.checkAuth = async (req, res) => {
  const db = getDB();

  try {
    const { session_token } = req.body;

    const current_ip =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress;

    const user_agent = req.headers["user-agent"] || "unknown";

    // 1️⃣ Validate
    if (!session_token) {
      return res.status(400).json({
        message: "session_token is required",
      });
    }

    // 2️⃣ Fetch session + user
    const [rows] = await db.query(
      `SELECT 
          ls.id,
          ls.user_id,
          ls.session_token,
          ls.ip_address,
          ls.user_agent,
          ls.is_otp_verified,
          ls.expires_at,
          u.name,
          u.email,
          u.role
       FROM login_sessions ls
       JOIN users u ON u.id = ls.user_id
       WHERE ls.session_token = ?
       LIMIT 1`,
      [session_token]
    );

    if (rows.length === 0) {
      return res.status(HttpStatusCode.Unauthorized).json({
        message: "Invalid session",
      });
    }

    const session = rows[0];

    // 3️⃣ Expiry check
    if (new Date(session.expires_at) < new Date()) {
      return res.status(401).json({
        message: "Session expired",
      });
    }

    // 4️⃣ Detect IP change
    const ipChanged = session.ip_address !== current_ip;

    // 5️⃣ If IP changed → require OTP again (but DO NOT break session)
    if (ipChanged) {
      // reset OTP verification
      await db.query(
        `UPDATE login_sessions 
         SET is_otp_verified = 0, ip_address = ?, verified_at = NULL
         WHERE id = ?`,
        [current_ip, session.id]
      );

      return res.json({
        logged_in: false,
        otp_verified: false,
        user: {
          id: session.user_id,
          session_token: session.session_token,
          name: session.name,
          email: session.email,
          role: session.role,
          otp_verified: false,
          expires_at: session.expires_at,
        },
        message: "IP changed, OTP required",
      });
    }

    // 6️⃣ If already verified
    if (session.is_otp_verified === 1) {
      return res.json({
        logged_in: true,
        otp_verified: true,
        user: {
          id: session.user_id,
          name: session.name,
          email: session.email,
          session_token: session.session_token,
          role: session.role,
          otp_verified: true,
        },
      });
    }

    // 7️⃣ OTP still pending
    return res.json({
      logged_in: false,
      otp_verified: false,
      user: {
        id: session.user_id,
        session_token: session.session_token,
        name: session.name,
        email: session.email,
        role: session.role,
        otp_verified: false,
        expires_at: session.expires_at,
      },
    });

  } catch (error) {
    console.error("[CHECK AUTH ERROR]", error);
    res.status(HttpStatusCode.InternalServerError).json({ message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  const db = getDB();

  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    await db.query(
      "UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?",
      [name, email, password, id]
    );

    res.json({
      id,
      name,
      email,
    });
  } catch (error) {
    console.error("[UPDATE USER ERROR]", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteUser = async (req, res) => {
  const db = getDB();

  try {
    const { id } = req.params;

    await db.query("DELETE FROM users WHERE id = ?", [id]);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("[DELETE USER ERROR]", error);
    res.status(500).json({ message: "Server Error" });
  }
};



// ==============================
// LOGOUT USER (TOKEN + IP)
// ==============================
exports.logoutUser = async (req, res) => {
  const db = getDB();

  try {
    const { session_token } = req.body;

    const ip_address =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress;

    // 1️⃣ Validate
    if (!session_token) {
      return res.status(400).json({
        message: "session_token is required",
      });
    }

    // 2️⃣ Check session exists (match token + IP)
    const [rows] = await db.query(
      `SELECT id FROM login_sessions 
       WHERE session_token = ? AND ip_address = ?
       LIMIT 1`,
      [session_token, ip_address]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid session or already logged out",
      });
    }

    const sessionId = rows[0].id;

    // 3️⃣ Delete session
    await db.query(
      `DELETE FROM login_sessions WHERE id = ?`,
      [sessionId]
    );

    // 4️⃣ Success response
    return res.json({
      message: "Logged out successfully",
      logged_out: true,
    });

  } catch (error) {
    console.error("[LOGOUT ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// VERIFY OTP (SESSION TOKEN + OTP)
// ==============================
exports.verifyOtp = async (req, res) => {
  const db = getDB();

  try {
    const { session_token, otp_code } = req.body;

    const ip_address =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress;

    const user_agent = req.headers["user-agent"] || "unknown";

    // 1️⃣ Validate input
    if (!session_token || !otp_code) {
      return res.status(400).json({
        message: "session_token and otp_code are required",
      });
    }

    // 2️⃣ Get session + user
    const [rows] = await db.query(
      `SELECT 
          ls.id,
          ls.user_id,
          ls.otp_code,
          ls.expires_at,
          ls.is_otp_verified,
          ls.session_token,
          u.name,
          u.email,
          u.role
       FROM login_sessions ls
       JOIN users u ON u.id = ls.user_id
       WHERE ls.session_token = ?
       LIMIT 1`,
      [session_token]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    const session = rows[0];

    // 3️⃣ Check expiry
    if (new Date(session.expires_at) < new Date()) {
      return res.status(401).json({
        message: "OTP expired. Please login again.",
      });
    }

    // 4️⃣ Check OTP
    if (session.otp_code !== otp_code) {
      return res.status(401).json({
        message: "Invalid OTP",
      });
    }

    await db.query(
      `UPDATE login_sessions 
       SET is_otp_verified = 1,
           verified_at = NOW(),
           expires_at = DATE_ADD(NOW(), INTERVAL 1 MONTH),
           ip_address = ?,
           user_agent = ?
       WHERE id = ?`,
      [ip_address, user_agent, session.id]
    );

    // 6️⃣ Success response
    return res.json({
      message: "OTP verified successfully",
      logged_in: true,
      otp_verified: true,
      user: {
        id: session.user_id,
        name: session.name,
        email: session.email,
        role: session.role,
        session_token: session.session_token,
        otp_verified: true,
      },
    });

  } catch (error) {
    console.error("[OTP VERIFY ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ==============================
// RESEND OTP (REPLACE OLD OTP)
// ==============================
exports.resendOtp = async (req, res) => {
  const db = getDB();

  try {
    const { session_token } = req.body;

    const ip_address =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress;

    const user_agent = req.headers["user-agent"] || "unknown";

    // 1️⃣ Validate
    if (!session_token) {
      return res.status(400).json({
        message: "session_token is required",
      });
    }

    // 2️⃣ Find session + user
    const [rows] = await db.query(
      `SELECT ls.*, u.name, u.email, u.role
       FROM login_sessions ls
       JOIN users u ON u.id = ls.user_id
       WHERE ls.session_token = ?
       LIMIT 1`,
      [session_token]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    const session = rows[0];

    // 3️⃣ Check expiry (optional safety)
    if (new Date(session.expires_at) < new Date()) {
      return res.status(401).json({
        message: "Session expired. Please login again.",
      });
    }

    // 4️⃣ Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // 5️⃣ UPDATE existing session (overwrite OTP)
    await db.query(
      `UPDATE login_sessions 
       SET otp_code = ?, 
           expires_at = ?, 
           is_otp_verified = 0,
           verified_at = NULL,
           ip_address = ?,
           user_agent = ?
       WHERE id = ?`,
      [newOtp, newExpiry, ip_address, user_agent, session.id]
    );

    // 6️⃣ Logging
    const logger = req.app.get("logger");
    if (logger) {
      logger.add(
        `${session.role.toUpperCase()} OTP RESENT`,
        `New OTP generated for ${session.email} | Device: ${user_agent}`
      );
    }
    await sendOtpEmail({
      name: session.name, email: session.email, otp: newOtp, expiry_date: newExpiry, onSuccess: () => {
        // 7️⃣ Response
        return res.json({
          message: "OTP resent successfully",
          newExpiry
        });
      },
      onFailed: (err) => {
        return res.status(HttpStatusCode.InternalServerError).send({
          message: "OTP sending failed",
          
        });
      }
    })



  } catch (error) {
    console.error("[RESEND OTP ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};