const { it } = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("../lib/prisma");
const { filterTrips } = require("./tripFilter.service");

it("loads only the latest position by default and the full ordered track on request", async () => {
  const originalFindMany = prisma.trip.findMany;
  const earlyPosition = {
    timestamp: new Date("2026-01-01T10:00:00Z"),
    speed: 12,
  };
  const latestPosition = {
    timestamp: new Date("2026-01-01T10:10:00Z"),
    speed: 24,
  };
  let positionQuery;

  prisma.trip.findMany = async (query) => {
    positionQuery = query.include.positions;
    return [
      {
        id: 1,
        avgSpeed: null,
        positions: positionQuery.take
          ? [latestPosition]
          : [earlyPosition, latestPosition],
      },
    ];
  };

  try {
    const regularTrips = await filterTrips({});
    assert.deepEqual(positionQuery, {
      orderBy: { timestamp: "desc" },
      take: 1,
    });
    assert.equal(regularTrips[0].latestPosition, latestPosition);

    const trackedTrips = await filterTrips({ includeTrack: "true" });
    assert.deepEqual(positionQuery, {
      orderBy: { timestamp: "asc" },
    });
    assert.deepEqual(trackedTrips[0].positions, [
      earlyPosition,
      latestPosition,
    ]);
    assert.equal(trackedTrips[0].latestPosition, latestPosition);
  } finally {
    prisma.trip.findMany = originalFindMany;
  }
});
