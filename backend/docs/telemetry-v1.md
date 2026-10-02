# Telemetry message v1

All telemetry requests must be authenticated with an account bearer token and identify a registered vehicle with at least one of `device_id`, `imei`, `serial`, or `vehicle_id`. Register device identifiers when creating the vehicle with `POST /api/vehicles`. Timestamps must be ISO-8601 values.

```json
{
  "schema_version": "1.0",
  "message_type": "gps",
  "timestamp": "2026-10-01T10:15:30.000Z",
  "device": {
    "device_id": "tracker-017",
    "imei": "356938035643809",
    "serial": "TRK-017",
    "vehicle_id": 17
  },
  "gps": {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "gps_status": "fix",
    "accuracy": 4.5,
    "speed": 38.2,
    "hdop": 0.8
  },
  "rfid": {
    "event": "enter",
    "tag_id": "warehouse-gate-3"
  },
  "vehicle": {
    "ignition_on": true,
    "engine_status": "running",
    "battery": 86
  }
}
```

Supported `message_type` values are `gps`, `ignition_start`, `heartbeat`, `alert`, and `rfid_event`. RFID event values are `enter`, `exit`, `scan`, and `continuous`. A message can carry GPS, RFID, and vehicle-state data together; the raw JSON is retained with the normalized message type and schema version.

For migration only, the old GPS shape with `vehicleId` and `latitude`/`longitude` (or `lat`/`lng`) is accepted and stored as schema version `1.0` using the server receive time. New integrations should always send the full versioned format.
