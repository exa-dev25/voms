const prisma = require("../lib/prisma");

function positiveInteger(value, fallback, maximum = Infinity) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

exports.listAlerts = async ({ page, limit } = {}) => {
  const currentPage = positiveInteger(page, 1);
  const pageSize = positiveInteger(limit, 20, 100);
  const where = { messageType: "ALERT" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [alerts, total, todayCount, affectedVehicles] = await Promise.all([
    prisma.telemetryMessage.findMany({
      where,
      include: {
        vehicle: { select: { id: true, plate: true } },
      },
      orderBy: { timestamp: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.telemetryMessage.count({ where }),
    prisma.telemetryMessage.count({
      where: { ...where, timestamp: { gte: today } },
    }),
    prisma.telemetryMessage.groupBy({
      by: ["vehicleId"],
      where,
    }),
  ]);

  return {
    alerts,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    summary: {
      total,
      today: todayCount,
      vehiclesAffected: affectedVehicles.length,
    },
  };
};
