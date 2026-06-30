const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course.controller");

const hitTest = async (req, res) => {
    console.log('req.body', req.body)
    return res.send({ message: "Ok" })
}



// ----for admin---
router.get("/", courseController.getAllCourses);
router.get("/erollment-stats", courseController.getEnrollmentStats);
router.get("/:id", courseController.getCourseById);
router.post("/", courseController.createCourse);
router.put("/:id", courseController.updateCourse);
router.delete("/:id", courseController.deleteCourse);
router.get("/enrollments/requested", courseController.getRequestedEnrollments);
router.post("/enrollments/response",courseController.handleEnrollmentResponse );

// ----for student---
router.get("/available/:id", courseController.getCoursesForStudent);
router.get("/student/:id", courseController.getCoursesOfStudent);
router.post("/enroll-course/", courseController.enrollCourse);
router.post("/withdraw-course/", courseController.withdrawCourse);

module.exports = router;