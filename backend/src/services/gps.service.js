const telemetryService = require("./telemetry.service");

exports.pushGPS = async ({ vehicleId, latitude, longitude, speed }) => {
  return telemetryService.ingestTelemetry({
    schema_version: "1.0",
    message_type: "gps",
    timestamp: new Date().toISOString(),
    vehicle_id: vehicleId,
    gps: { latitude, longitude, speed },
  });
};
