const express = require("express");
const router = express.Router();
const rescheduleController = require("../controllers/reschedule.controller");

// Create request
router.post("/", rescheduleController.createRequest);
// router.post("/update-status/:request_id", rescheduleController.updateStatus);

// Get all requests
router.get("/", rescheduleController.getAllRequests);
router.get("/teacher/:teacher_id", rescheduleController.getAllRequestsOfTeacher);

// router.post("/reschedule", rescheduleController.executeReschdeular);

// router.post("/reschedule-allocation", rescheduleController.createRealocationSlot);

// Get single request
router.get("/:id", rescheduleController.getRequestById);

// Delete request
router.delete("/:id", rescheduleController.deleteRequest);

module.exports = router;