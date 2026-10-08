const { it } = require("node:test");
const assert = require("node:assert/strict");
const service = require("../services/assignment.service");
const { createAssignment } = require("./assignment.controller");

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

it("validates assignment IDs and passes numeric IDs to the service", async () => {
  const originalCreateAssignment = service.createAssignment;
  let receivedData;
  service.createAssignment = async (data) => {
    receivedData = data;
    return { id: 42, ...data };
  };

  try {
    const invalidResponse = createResponse();
    await createAssignment(
      {
        body: {
          fullName: "Driver name",
          vehicle: "B 1234 CD",
          routeFrom: "Origin",
          routeTo: "Destination",
        },
      },
      invalidResponse,
    );

    assert.equal(invalidResponse.statusCode, 400);
    assert.equal(receivedData, undefined);

    const validResponse = createResponse();
    await createAssignment(
      {
        body: {
          driverId: "1",
          vehicleId: 2,
          originId: "3",
          destinationId: 4,
        },
      },
      validResponse,
    );

    assert.equal(validResponse.statusCode, 201);
    assert.deepEqual(receivedData, {
      driverId: 1,
      vehicleId: 2,
      originId: 3,
      destinationId: 4,
    });
  } finally {
    service.createAssignment = originalCreateAssignment;
  }
});
