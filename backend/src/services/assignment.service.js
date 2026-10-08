const prisma = require("../lib/prisma");

exports.createAssignment = (data) => {
  return prisma.assignment.create({
    data: {
      driverId: data.driverId,
      vehicleId: data.vehicleId,
      originId: data.originId,
      destinationId: data.destinationId,
      status: "PENDING",
    },
    include: {
      driver: true,
      vehicle: true,
      origin: true,
      destination: true,
    },
  });
};

exports.getAssignments = () => {
  return prisma.assignment.findMany({
    include: {
      driver: true,
      vehicle: true,
      origin: true,
      destination: true,
      trip: true,
    },
  });
};
