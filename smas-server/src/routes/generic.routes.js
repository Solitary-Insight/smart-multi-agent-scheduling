const express = require("express");
const router = express.Router();
const genericController = require("../controllers/generic.controller");

router.get("/week-days", genericController.getWeekDays);
router.get("/week-days-with-slots", genericController.getWeekDaysWithSlots);
router.get("/today_info", genericController.getTodayInfo);

router.get("/resourses-stats", genericController.getSystemStats);
router.get("/advanced-stats", genericController.getAdvancedStats);
router.get("/admin-logs", genericController.readLogs);
router.get("/server-traffic-logs", genericController.readTrafficLogs);
router.get("/today_info", genericController.readLogs);

module.exports = router;