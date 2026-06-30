const express = require("express");
const router = express.Router();
const classroomController = require("../controllers/classroom.controller");

router.get("/", classroomController.getAllClassrooms);
router.get("/:id", classroomController.getClassroomById);
router.post("/", classroomController.createClassroom);
router.put("/:id", classroomController.updateClassroom);
router.delete("/:id", classroomController.deleteClassroom);

module.exports = router;