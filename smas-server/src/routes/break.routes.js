const express = require("express");
const router = express.Router();
const breaksController = require("../controllers/breaks.controller");

// ==============================
// BREAKS ROUTES
// ==============================

// Get all breaks
router.get("/", breaksController.getBreaks);

// Create a new break
router.post("/", breaksController.createBreak);

// Update a break by ID
router.put("/:id", breaksController.updateBreak);

// Delete a break by ID
router.delete("/:id", breaksController.deleteBreak);

module.exports = router;