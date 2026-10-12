const prisma = require("../lib/prisma");

exports.startTrip = async (assignmentId) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment || assignment.status !== "PENDING") {
    throw new Error("Invalid assignment");
  }

  const used = await prisma.trip.findUnique({ where: { assignmentId } });
  if (used) throw new Error("Assignment already started");

  const trip = await prisma.trip.create({
    data: {
      assignmentId: assignment.id,
      driverId: assignment.driverId,
      vehicleId: assignment.vehicleId,
      originId: assignment.originId,
      destinationId: assignment.destinationId,
      status: "ON_TRIP",
    },
  });

  await prisma.assignment.update({
    where: { id: assignment.id },
    data: { status: "STARTED", startedAt: new Date() },
  });

  return trip;
};

exports.updateTripDriver = async (tripId, driverId) => {
  const [trip, driver] = await Promise.all([
    prisma.trip.findUnique({ where: { id: tripId } }),
    prisma.driver.findUnique({ where: { id: driverId } }),
  ]);

  if (!trip) throw new Error("Trip not found");
  if (!driver) throw new Error("Driver not found");

  const [, updatedTrip] = await prisma.$transaction([
    prisma.assignment.update({
      where: { id: trip.assignmentId },
      data: { driverId },
    }),
    prisma.trip.update({
      where: { id: tripId },
      data: { driverId },
      include: { driver: true },
    }),
  ]);

  return updatedTrip;
};

exports.endTrip = async ({ tripId, destinationId, avgSpeed }) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip || trip.status !== "ON_TRIP") {
    throw new Error("Invalid trip");
  }

  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: "COMPLETED",
      endTime: new Date(),
      destinationId,
      avgSpeed,
    },
  });

  await prisma.assignment.update({
    where: { id: trip.assignmentId },
    data: { status: "PENDING", startedAt: null },
  });
};
