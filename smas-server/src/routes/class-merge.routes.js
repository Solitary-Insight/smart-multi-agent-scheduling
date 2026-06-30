const express = require("express");
const router = express.Router();
const classMerger = require("../controllers/class-merge.controller");

router.get("/", classMerger.getMergeClasses);
router.post("/", classMerger.mergeClasses);
router.delete("/:id", classMerger.deleteCourseMerge);


module.exports = router;