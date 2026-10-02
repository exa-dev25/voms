const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { normalizeTelemetry } = require("./telemetry.service");

describe("normalizeTelemetry", () => {
  it("normalizes a versioned message with GPS, RFID, and vehicle state", () => {
    const message = normalizeTelemetry({
      schema_version: "1.0",
      message_type: "heartbeat",
      timestamp: "2026-10-01T10:00:00.000Z",
      device: { device_id: "tracker-17", vehicle_id: 17 },
      gps: {
        latitude: -6.2,
        longitude: 106.8,
        gps_status: "fix",
        accuracy: 4.5,
        speed: 38.2,
        hdop: 0.8,
      },
      rfid: { event: "enter", tag_id: "gate-3" },
      vehicle: { ignition_on: true, engine_status: "running", battery: 86 },
    });

    assert.equal(message.messageType, "HEARTBEAT");
    assert.equal(message.identifiers.deviceId, "tracker-17");
    assert.equal(message.gps.gpsStatus, "fix");
    assert.equal(message.gps.hdop, 0.8);
    assert.equal(message.rfid.eventType, "ENTER");
    assert.equal(message.vehicleState.ignitionOn, true);
  });

  it("accepts the legacy GPS shape with a server timestamp", () => {
    const message = normalizeTelemetry({
      vehicleId: 17,
      latitude: -6.2,
      longitude: 106.8,
      speed: 38,
    });

    assert.equal(message.messageType, "GPS");
    assert.equal(message.schemaVersion, "1.0");
    assert.equal(message.identifiers.vehicleId, 17);
    assert.ok(message.timestamp instanceof Date);
  });

  it("rejects missing identifiers, invalid coordinates, fractional battery, and unsupported RFID events", () => {
    assert.throws(
      () =>
        normalizeTelemetry({
          schema_version: "1.0",
          message_type: "gps",
          timestamp: "2026-10-01T10:00:00.000Z",
        }),
      /device_id/,
    );
    assert.throws(
      () =>
        normalizeTelemetry({
          schema_version: "1.0",
          message_type: "gps",
          timestamp: 1790848800000,
          vehicle_id: 17,
          gps: { latitude: -6.2, longitude: 106.8 },
        }),
      /timestamp/,
    );
    assert.throws(
      () =>
        normalizeTelemetry({
          schema_version: "1.0",
          message_type: "gps",
          timestamp: "2026-10-01T10:00:00.000Z",
          vehicle_id: 17,
          gps: { latitude: 120, longitude: 106.8 },
        }),
      /latitude/,
    );
    assert.throws(
      () =>
        normalizeTelemetry({
          schema_version: "1.0",
          message_type: "heartbeat",
          timestamp: "2026-10-01T10:00:00.000Z",
          vehicle_id: 17,
          vehicle: { battery: 86.5 },
        }),
      /battery/,
    );
    assert.throws(
      () =>
        normalizeTelemetry({
          schema_version: "1.0",
          message_type: "rfid_event",
          timestamp: "2026-10-01T10:00:00.000Z",
          vehicle_id: 17,
          rfid: { event: "swipe" },
        }),
      /RFID event/,
    );
  });
});
