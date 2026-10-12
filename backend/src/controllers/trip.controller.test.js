const { it } = require("node:test");
const assert = require("node:assert/strict");
const service = require("../services/trip.service");
const { updateTripDriver } = require("./trip.controller");

const createResponse = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

it("validates trip and driver IDs before updating the trip", async () => {
  const originalUpdateTripDriver = service.updateTripDriver;
  let receivedIds;
  service.updateTripDriver = async (tripId, driverId) => {
    receivedIds = [tripId, driverId];
    return { id: tripId, driverId };
  };

  try {
    const invalidResponse = createResponse();
    await updateTripDriver(
      { params: { tripId: "invalid" }, body: { driverId: "2" } },
      invalidResponse,
    );

    assert.equal(invalidResponse.statusCode, 400);
    assert.equal(receivedIds, undefined);

    const validResponse = createResponse();
    await updateTripDriver(
      { params: { tripId: "12" }, body: { driverId: "2" } },
      validResponse,
    );

    assert.deepEqual(receivedIds, [12, 2]);
    assert.deepEqual(validResponse.body, { id: 12, driverId: 2 });
  } finally {
    service.updateTripDriver = originalUpdateTripDriver;
  }
});

it("returns not found when the trip or driver does not exist", async () => {
  const originalUpdateTripDriver = service.updateTripDriver;
  service.updateTripDriver = async () => {
    throw new Error("Driver not found");
  };

  try {
    const response = createResponse();
    await updateTripDriver(
      { params: { tripId: "12" }, body: { driverId: "999" } },
      response,
    );

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, { error: "Driver not found" });
  } finally {
    service.updateTripDriver = originalUpdateTripDriver;
  }
});
