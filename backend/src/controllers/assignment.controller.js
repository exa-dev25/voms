const service = require("../services/assignment.service");

const parseId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const createAssignment = async (req, res) => {
  try {
    const driverId = parseId(req.body.driverId);
    const vehicleId = parseId(req.body.vehicleId);
    const originId = parseId(req.body.originId);
    const destinationId = parseId(req.body.destinationId);

    if (
      [driverId, vehicleId, originId, destinationId].some((id) => id === null)
    ) {
      return res.status(400).json({ error: "Invalid assignment data" });
    }

    const assignment = await service.createAssignment({
      driverId,
      vehicleId,
      originId,
      destinationId,
    });

    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAssignments = async (req, res) => {
  try {
    res.json(await service.getAssignments());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
};
