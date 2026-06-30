const express = require("express");
const userRoutes = require("./routes/user.routes");
const departmentRoutes = require("./routes/department.routes");
const studentRoutes = require("./routes/student.routes");
const genericRoutes = require("./routes/generic.routes");
const teacherRoutes = require("./routes/teacher.routes");
const courseRoutes = require("./routes/course.routes");
const classroomRoutes = require("./routes/classroom.routes");
const classroomMergeRoutes = require("./routes/class-merge.routes");
const configRoutes = require("./routes/configuration.routes");
const breaksRoutes = require("./routes/break.routes");
const schedulesRoutes = require("./routes/schedule.routes");
const reSchedulesRoutes = require("./routes/reschedule.routes");

const cors = require("cors");
const { BaseMiddleware } = require("./middlewares/base-middleware");
const app = express();

app.use(express.json());

app.use(cors({
    origin: true, // your frontend URL
    credentials: true, // if using cookies or sessions
}));


app.use(BaseMiddleware)




// Routes
app.use("/api/users", userRoutes);

app.use("/api/departments", departmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/generic", genericRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/class-merges", classroomMergeRoutes);
app.use("/api/config", configRoutes);
app.use("/api/breaks", breaksRoutes);
app.use("/api/schedules", schedulesRoutes);
app.use("/api/reschedule", reSchedulesRoutes);


// Health check
app.get("/", (req, res) => {
    res.json({ message: "API is running..." });
});


module.exports = app;
