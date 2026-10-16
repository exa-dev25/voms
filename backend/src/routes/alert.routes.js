const express = require("express");
const router = express.Router();
const controller = require("../controllers/alert.controller");

router.get("/", controller.listAlerts);

module.exports = router;
