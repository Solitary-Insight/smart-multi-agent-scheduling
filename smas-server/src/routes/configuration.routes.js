

const express = require("express");
const router = express.Router();
const configRoutes = require("../controllers/configuration.controller");

router.get("/", configRoutes.getAllConfigurations);
router.get("/:key", configRoutes.getConfigurationByKey);
router.post("/:key",configRoutes. setConfiguration);     // UPSERT
router.put("/:key", configRoutes.updateConfiguration);   // STRICT UPDATE
router.delete("/:key", configRoutes.deleteConfiguration);

module.exports = router;