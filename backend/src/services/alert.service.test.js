const { it } = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("../lib/prisma");
const { listAlerts } = require("./alert.service");

it("lists alert telemetry with bounded pagination and summary counts", async () => {
  const original = {
    findMany: prisma.telemetryMessage.findMany,
    count: prisma.telemetryMessage.count,
    groupBy: prisma.telemetryMessage.groupBy,
  };
  let listQuery;
  const countQueries = [];

  prisma.telemetryMessage.findMany = async (query) => {
    listQuery = query;
    return [{ id: 12, messageType: "ALERT" }];
  };
  prisma.telemetryMessage.count = async ({ where }) => {
    countQueries.push(where);
    return where.timestamp ? 2 : 8;
  };
  prisma.telemetryMessage.groupBy = async (query) => {
    assert.deepEqual(query, {
      by: ["vehicleId"],
      where: { messageType: "ALERT" },
    });
    return [{ vehicleId: 2 }, { vehicleId: 5 }];
  };

  try {
    const result = await listAlerts({ page: "2", limit: "500" });

    assert.equal(listQuery.where.messageType, "ALERT");
    assert.deepEqual(listQuery.orderBy, { timestamp: "desc" });
    assert.deepEqual(listQuery.include.vehicle, {
      select: { id: true, plate: true },
    });
    assert.equal(listQuery.skip, 100);
    assert.equal(listQuery.take, 100);
    assert.equal(countQueries.length, 2);
    assert.equal(result.pagination.page, 2);
    assert.equal(result.pagination.limit, 100);
    assert.equal(result.pagination.totalPages, 1);
    assert.deepEqual(result.summary, {
      total: 8,
      today: 2,
      vehiclesAffected: 2,
    });
  } finally {
    prisma.telemetryMessage.findMany = original.findMany;
    prisma.telemetryMessage.count = original.count;
    prisma.telemetryMessage.groupBy = original.groupBy;
  }
});
