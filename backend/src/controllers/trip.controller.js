const service = require("../services/trip.service");

exports.startTrip = async (req, res) => {
  try {
    const assignmentId = parseInt(req.body.assignmentId);
    if (isNaN(assignmentId))
      return res.status(400).json({ error: "Invalid assignment id" });

    res.json(await service.startTrip(assignmentId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateTripDriver = async (req, res) => {
  try {
    const tripId = Number(req.params.tripId);
    const driverId = Number(req.body.driverId);

    if (
      !Number.isSafeInteger(tripId) ||
      tripId < 1 ||
      !Number.isSafeInteger(driverId) ||
      driverId < 1
    ) {
      return res.status(400).json({ error: "Invalid trip or driver id" });
    }

    const trip = await service.updateTripDriver(tripId, driverId);
    res.json(trip);
  } catch (err) {
    if (
      err.message === "Trip not found" ||
      err.message === "Driver not found"
    ) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.endTrip = async (req, res) => {
  try {
    const { tripId, destinationId, avgSpeed } = req.body;
    await service.endTrip({
      tripId: parseInt(tripId),
      destinationId,
      avgSpeed,
    });

    res.json({ message: "Trip completed successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
