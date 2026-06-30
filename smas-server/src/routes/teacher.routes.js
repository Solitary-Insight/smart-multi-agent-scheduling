const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacher.controller");

router.get("/", teacherController.getAllTeachers);
router.get("/names-and-ids", teacherController.getAllTeachersNameAndIds);
router.get("/:id", teacherController.getTeacherById);
router.get("/stats/:teacher_id", teacherController.getTeacherStats);

router.post("/", teacherController.createTeacher);
router.put("/:id", teacherController.updateTeacher);
router.delete("/:id", teacherController.deleteTeacher);

module.exports = router;