const express = require("express");
const router = express.Router();
const schedularController = require("../controllers/schedule.controller");


// ==============================
// SCHEDULE ROUTES
// ==============================

router.post("/create", schedularController.createSchedule);
router.post("/apply", schedularController.applySchedule);
router.post("/check-slot-avaliablity", schedularController.checkSlotAvailablity);
router.get("/admin", schedularController.getAdminTimetables);
router.get("/teacher/:teacher_id", schedularController.getTeacherTimetable);
router.get("/student/:student_id", schedularController.getStudentTimetables);
router.get("/student/todays-schedule/:student_id", schedularController.getStudentTodaysSchedule);
router.get("/teacher/todays-schedule/:teacher_id", schedularController.getTeacherTodaysSchedule);

router.put("/slot/:slot_id", schedularController.updateSlot);

// router.post("/create", hitTest);




module.exports = router;