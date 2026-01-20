const express = require("express");
const router = express.Router();
const controller = require("../controllers/tripFilter.controller");
const { authMiddleware } = require("../../middleware/auth");

router.get("/filter/cascade-options", authMiddleware, controller.getCascadeOptions);
router.get("/filter", authMiddleware, controller.filterTrips);

module.exports = router;
