function buildDateFilter(dateType, dateValue, startDateValue, endDateValue) {
  if (!dateType) return {};

  let startDate, endDate;

  switch (dateType) {
    case "current":
      return {};

    case "daily": {
      if (!dateValue) return {};
      const dailyDate = new Date(dateValue);
      if (isNaN(dailyDate.getTime())) return {};
      startDate = new Date(dailyDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(dailyDate);
      endDate.setHours(23, 59, 59, 999);
      return { startTime: { gte: startDate, lte: endDate } };
    }

    case "weekly": {
      if (typeof dateValue !== "string" || !dateValue.includes("Week")) return {};
      const [yearMonth, weekStr] = dateValue.split(" Week ");
      if (!yearMonth || !weekStr) return {};
      const [year, month] = yearMonth.split("-").map(Number);
      const week = parseInt(weekStr, 10);
      if (!year || !month || isNaN(week)) return {};

      startDate = new Date(year, month - 1, (week - 1) * 7 + 1, 0, 0, 0, 0);
      endDate = new Date(year, month - 1, week * 7, 23, 59, 59, 999);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return {};

      return { startTime: { gte: startDate, lte: endDate } };
    }

    case "monthly": {
      if (typeof dateValue !== "string") return {};
      const [year, month] = dateValue.split("-").map(Number);
      if (!year || !month) return {};
      startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return {};

      return { startTime: { gte: startDate, lte: endDate } };
    }

    case "custom": {
      if (!startDateValue && !endDateValue) return {};
      const filter = {};
      if (startDateValue) {
        const s = new Date(startDateValue);
        if (!isNaN(s.getTime())) {
          s.setHours(0, 0, 0, 0);
          filter.gte = s;
        }
      }
      if (endDateValue) {
        const e = new Date(endDateValue);
        if (!isNaN(e.getTime())) {
          e.setHours(23, 59, 59, 999);
          filter.lte = e;
        }
      }
      return Object.keys(filter).length ? { startTime: filter } : {};
    }

    default:
      return {};
  }
}

module.exports = { buildDateFilter };

  