const { getDB } = require("../config/db");
const { formatTimeAgo } = require("../utils/generic");

const users = new Map(); // userId => socketId(s)

// ==============================
// Socket handler
// ==============================
function NotificationSocketHandler(socket, io) {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join", async (user) => {
    if (!user?.id) return;

    console.log(`Socket ${socket.id} joined user: ${user.id}`);
    users.set(user.id, socket.id);

    const db = getDB();
    try {
      // Load all messages for this user (unread first)
      const [messages] = await db.query(
        `SELECT m.id, m.title, m.body, mr.is_read, mr.read_at, m.created_at
         FROM messages m
         JOIN message_recipients mr ON mr.message_id = m.id
         WHERE mr.user_id = ? OR mr.role = ?
         ORDER BY m.created_at DESC`,
        [user.id, user.role]
      );

      messages.forEach((msg) => socket.emit("new_message", {...msg,timesAgo:formatTimeAgo(msg.created_at)}));
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    for (const [uid, sid] of users.entries()) {
      if (sid === socket.id) users.delete(uid);
    }
  });

  // Mark single message read
  socket.on("mark_read", async ({ messageId, userId }) => {
    const db = getDB();
    try {
      await db.query(
        `UPDATE message_recipients 
         SET is_read = 1, read_at = NOW() 
         WHERE message_id = ? AND user_id = ?`,
        [messageId, userId]
      );
      socket.emit("message_read", { id: messageId, userId });
    } catch (err) {
      console.error("Error marking message read:", err);
    }
  });

  // Mark all messages read
  socket.on("mark_all_read", async ({ userId }) => {
    const db = getDB();
    try {
      await db.query(
        `UPDATE message_recipients 
         SET is_read = 1, read_at = NOW() 
         WHERE user_id = ?`,
        [userId]
      );
      socket.emit("all_messages_read", { userId });
    } catch (err) {
      console.error("Error marking all messages read:", err);
    }
  });
}

// ==============================
// Send message to users or roles
// ==============================
async function sendMessage(io, { title, body, userIds = [], roles = [] }) {
  const db = getDB();

  try {
    // Save message content
    const [result] = await db.query(
      `INSERT INTO messages (title, body) VALUES (?, ?)`,
      [title, body]
    );

    const messageId = result.insertId;

    // Build recipients
    const recipients = [];
    userIds.forEach((uid) => recipients.push([messageId, uid, null]));
    roles.forEach((role) => recipients.push([messageId, null, role]));

    if (recipients.length > 0) {
      try {
        await db.query(
          `INSERT INTO message_recipients (message_id, user_id, role) VALUES ${recipients
            .map(() => "(?, ?, ?)")
            .join(",")}`,
          recipients.flat()
        );
        const [rows] = await db.query(`SELECT NOW() AS db_time`);

        const dbTime = rows[0].db_time;

        // Emit to online users
        userIds.forEach((uid) => {
          const socketId = users.get(uid);
          if (socketId) {
            io.to(socketId).emit("new_message", {
              id: messageId,
              title,
              body,
              is_read: 0,
              timesAgo:formatTimeAgo(dbTime),
              created_at:dbTime,
            });

            console.log(`New Notification : ${messageId} generated for user : ${uid}.`)
          }
        });

        // Roles: emit to all connected users matching the role
        roles.forEach((role) => {
          for (const [uid, sid] of users.entries()) {
            if (sid && users.get(uid) && roles.includes(role)) {
              io.to(sid).emit("new_message", {
                id: messageId,
                title,
                body,
                is_read: 0,
                created_at: dbTime,
                timesAgo:formatTimeAgo(dbTime)
              });
            }
          }
        });

      } catch (error) {

      }




    }


  } catch (err) {
    console.error("Error sending message:", err);
  }

}



module.exports = {
  NotificationSocketHandler,
  sendMessage,
  users,
};