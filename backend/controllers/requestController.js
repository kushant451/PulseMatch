const BloodRequest = require('../models/BloodRequest');
const { getIO } = require('../config/socket');


const createRequest = async (req, res) => {
  try {
    const { bloodGroup, unitsNeeded, urgency, patientDetails, longitude, latitude, address } =
      req.body;

    if (!bloodGroup || !unitsNeeded || !longitude || !latitude) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const request = await BloodRequest.create({
      requestedBy: req.user._id,
      bloodGroup,
      unitsNeeded,
      urgency: urgency || 'normal',
      patientDetails,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
      },
    });

    const io = getIO();
    if (io) {
      io.to('admin-room').emit('request:created', request);
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getRequests = async (req, res) => {
  try {
    const filter = req.user.role === 'hospital' ? { requestedBy: req.user._id } : {};
    const requests = await BloodRequest.find(filter)
      .populate('requestedBy', 'name phone')
      .populate('fulfilledBy', 'name address')
      .sort({ urgency: -1, createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const { status, fulfilledBy } = req.body;
    if (status) request.status = status;
    if (fulfilledBy) request.fulfilledBy = fulfilledBy;

    await request.save();

    const io = getIO();
    if (io) {
      io.to('admin-room').emit('request:updated', request);
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createRequest, getRequests, updateRequestStatus };
