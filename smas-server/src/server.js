require("dotenv").config();
const app = require("./app");
const { connectMySQL } = require("./config/db");
const http = require('http');
const { Server } = require('socket.io');
const { ActivityLogger } = require("./utils/activity-logger");
const { NotificationSocketHandler } = require("./sockets/notification-socket");
const { ServerTrafficLogger } = require("./utils/server-trafic-logger");
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
  },
});
const notification_socket = io.of('socket/notifications');

// activity logs 
const activity_logger = new ActivityLogger(20);
const traffic_logger = new ServerTrafficLogger(50);

// save for later use 
app.set('notification_socket', notification_socket);
app.set('logger', activity_logger);
app.set('traffic_logger', traffic_logger);


// Connect to MySQL once
connectMySQL()
  .then(() => {
    notification_socket.on('connection',socket=>NotificationSocketHandler(socket,io))
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err);
    process.exit(1);
  });