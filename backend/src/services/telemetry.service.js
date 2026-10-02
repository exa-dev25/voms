const prisma = require("../lib/prisma");

const MESSAGE_TYPES = new Map([
  ["gps", "GPS"],
  ["position", "GPS"],
  ["ignition_start", "IGNITION_START"],
  ["heartbeat", "HEARTBEAT"],
  ["alert", "ALERT"],
  ["rfid_event", "RFID_EVENT"],
]);

const RFID_EVENT_TYPES = new Map([
  ["enter", "ENTER"],
  ["exit", "EXIT"],
  ["scan", "SCAN"],
  ["continuous", "CONTINUOUS"],
]);

function optionalNumber(value, name, { min = -Infinity, max = Infinity } = {}) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`Invalid ${name}`);
  }
  return number;
}

function optionalInteger(value, name, options) {
  const number = optionalNumber(value, name, options);
  if (number !== null && !Number.isInteger(number)) {
    throw new Error(`Invalid ${name}`);
  }
  return number;
}

function normalizeTelemetry(payload, defaultMessageType) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Telemetry payload must be a JSON object");
  }

  const device = payload.device || payload;
  const gps = payload.gps || payload;
  const vehicleState = payload.vehicle || {};
  const rawType =
    payload.message_type || payload.messageType || defaultMessageType;
  const legacyGps =
    !rawType && (gps.latitude !== undefined || gps.lat !== undefined);
  const messageType =
    MESSAGE_TYPES.get(String(rawType || "").toLowerCase()) ||
    (legacyGps ? "GPS" : null);
  const schemaVersion =
    payload.schema_version ||
    payload.schemaVersion ||
    (legacyGps ? "1.0" : null);
  const rawTimestamp = payload.timestamp || (legacyGps ? new Date() : null);
  const timestamp =
    legacyGps && rawTimestamp instanceof Date
      ? rawTimestamp
      : typeof rawTimestamp === "string" &&
          /^\d{4}-\d{2}-\d{2}T/.test(rawTimestamp)
        ? new Date(rawTimestamp)
        : null;

  if (!messageType) throw new Error("Unsupported or missing message_type");
  if (typeof schemaVersion !== "string" || !schemaVersion.trim()) {
    throw new Error("schema_version is required");
  }
  if (!timestamp || Number.isNaN(timestamp.getTime())) {
    throw new Error("A valid timestamp is required");
  }

  const identifiers = {
    deviceId: device.device_id || device.deviceId || null,
    imei: device.imei || null,
    serialNumber:
      device.serial || device.serial_number || device.serialNumber || null,
    vehicleId: optionalInteger(
      device.vehicle_id ?? device.vehicleId,
      "vehicle_id",
      { min: 1 },
    ),
  };

  if (!Object.values(identifiers).some((value) => value !== null)) {
    throw new Error(
      "Provide at least one device_id, imei, serial, or vehicle_id",
    );
  }

  const latitude = optionalNumber(gps.latitude ?? gps.lat, "latitude", {
    min: -90,
    max: 90,
  });
  const longitude = optionalNumber(
    gps.longitude ?? gps.lng ?? gps.lon,
    "longitude",
    { min: -180, max: 180 },
  );
  if ((latitude === null) !== (longitude === null)) {
    throw new Error("latitude and longitude must be provided together");
  }
  if (messageType === "GPS" && latitude === null) {
    throw new Error("GPS messages require latitude and longitude");
  }

  const rfid = payload.rfid || null;
  let rfidEventType = null;
  if (rfid) {
    rfidEventType = RFID_EVENT_TYPES.get(
      String(rfid.event || rfid.event_type || "").toLowerCase(),
    );
    if (!rfidEventType)
      throw new Error("RFID event must be enter, exit, scan, or continuous");
  }
  if (messageType === "RFID_EVENT" && !rfid) {
    throw new Error("RFID_EVENT messages require an rfid event");
  }

  const ignitionOn = vehicleState.ignition_on ?? vehicleState.ignitionOn;
  if (
    ignitionOn !== undefined &&
    ignitionOn !== null &&
    typeof ignitionOn !== "boolean"
  ) {
    throw new Error("ignition_on must be a boolean");
  }

  return {
    identifiers,
    schemaVersion,
    messageType,
    timestamp,
    gps:
      latitude === null
        ? null
        : {
            latitude,
            longitude,
            speed: optionalNumber(gps.speed, "speed", { min: 0 }),
            gpsStatus: gps.gps_status || gps.gpsStatus || null,
            accuracy: optionalNumber(gps.accuracy, "accuracy", { min: 0 }),
            hdop: optionalNumber(gps.hdop, "hdop", { min: 0 }),
          },
    vehicleState: {
      battery: optionalInteger(vehicleState.battery, "battery", {
        min: 0,
        max: 100,
      }),
      ignitionOn: ignitionOn ?? null,
      engineStatus:
        vehicleState.engine_status || vehicleState.engineStatus || null,
    },
    rfid: rfid
      ? {
          eventType: rfidEventType,
          tagId: rfid.tag_id || rfid.tagId || null,
          payload: rfid,
        }
      : null,
    payload,
  };
}

async function findVehicle(transaction, identifiers) {
  const lookups = [];
  if (identifiers.deviceId) {
    lookups.push(
      transaction.vehicle.findUnique({
        where: { deviceId: String(identifiers.deviceId) },
      }),
    );
  }
  if (identifiers.imei) {
    lookups.push(
      transaction.vehicle.findUnique({
        where: { imei: String(identifiers.imei) },
      }),
    );
  }
  if (identifiers.serialNumber) {
    lookups.push(
      transaction.vehicle.findUnique({
        where: { serialNumber: String(identifiers.serialNumber) },
      }),
    );
  }
  if (identifiers.vehicleId) {
    lookups.push(
      transaction.vehicle.findUnique({ where: { id: identifiers.vehicleId } }),
    );
  }

  const vehicles = (await Promise.all(lookups)).filter(Boolean);
  if (!vehicles.length)
    throw new Error("No vehicle matches the supplied device identifiers");
  if (vehicles.some((vehicle) => vehicle.id !== vehicles[0].id)) {
    throw new Error("Device identifiers resolve to different vehicles");
  }
  return vehicles[0];
}

async function findActiveTrip(transaction, vehicleId) {
  const assignment = await transaction.assignment.findFirst({
    where: { vehicleId, status: "STARTED" },
    include: { trip: true },
  });
  return assignment?.trip?.status === "ON_TRIP" ? assignment.trip : null;
}

async function ingestTelemetry(payload, defaultMessageType) {
  const message = normalizeTelemetry(payload, defaultMessageType);

  return prisma.$transaction(async (transaction) => {
    const vehicle = await findVehicle(transaction, message.identifiers);
    const activeTrip = await findActiveTrip(transaction, vehicle.id);

    const storedMessage = await transaction.telemetryMessage.create({
      data: {
        vehicleId: vehicle.id,
        schemaVersion: message.schemaVersion,
        messageType: message.messageType,
        timestamp: message.timestamp,
        payload: message.payload,
      },
    });

    const position = message.gps
      ? await transaction.position.create({
          data: {
            vehicleId: vehicle.id,
            tripId: activeTrip?.id ?? null,
            ...message.gps,
            timestamp: message.timestamp,
          },
        })
      : null;

    const vehicleStatus = await transaction.vehicleStatus.create({
      data: {
        vehicleId: vehicle.id,
        isOnline: true,
        ...message.vehicleState,
        timestamp: message.timestamp,
      },
    });

    const rfidEvent = message.rfid
      ? await transaction.rFIDEvent.create({
          data: {
            vehicleId: vehicle.id,
            tripId: activeTrip?.id ?? null,
            eventType: message.rfid.eventType,
            tagId: message.rfid.tagId,
            timestamp: message.timestamp,
            payload: message.rfid.payload,
          },
        })
      : null;

    return { message: storedMessage, position, vehicleStatus, rfidEvent };
  });
}

module.exports = { ingestTelemetry, normalizeTelemetry };
