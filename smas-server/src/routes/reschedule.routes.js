const express = require("express");
const router = express.Router();
const rescheduleController = require("../controllers/reschedule.controller");

// Create request
router.post("/", rescheduleController.createRequest);

// Get all requests
router.get("/", rescheduleController.getAllRequests);
router.get("/teacher/:teacher_id", rescheduleController.getAllRequestsOfTeacher);



// Get single request
router.get("/:id", rescheduleController.getRequestById);

// Delete request
router.delete("/:id", rescheduleController.deleteRequest);

module.exports = router;