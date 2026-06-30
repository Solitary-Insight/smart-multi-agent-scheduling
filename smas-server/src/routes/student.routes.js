const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
router.get("/students-with-courses", studentController.getStudentsWithCourses);
router.post("/students/promote", studentController.promote);
router.post("/students/batch-remarks", studentController.batchRemarks);
router.post("/student/pass-and-promote/:student_id", studentController.passAndPromote);
router.post("/student/reset-result/:student_id", studentController.resetResult);

router.get("/", studentController.getAllStudents);
router.get("/:id", studentController.getStudentById);
router.post("/", studentController.createStudent);
router.put("/:id", studentController.updateStudent);
router.delete("/:id", studentController.deleteStudent);
module.exports = router;