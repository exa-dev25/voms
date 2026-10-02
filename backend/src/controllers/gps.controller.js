const telemetryService = require("../services/telemetry.service");

exports.pushGPS = async (req, res) => {
  try {
    const result = await telemetryService.ingestTelemetry(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
