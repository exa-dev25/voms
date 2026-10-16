const alertService = require("../services/alert.service");

exports.listAlerts = async (req, res) => {
  try {
    res.json(await alertService.listAlerts(req.query));
  } catch (error) {
    console.error("Alert list error:", error);
    res.status(500).json({ error: "Unable to load alerts" });
  }
};
