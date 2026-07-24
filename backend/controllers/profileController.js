const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Donation = require('../models/Donation');

const getProfile = async (req, res) => {
  
  res.json(req.user);
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, weightKg, address, longitude, latitude, password } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (weightKg != null) user.weightKg = weightKg;
    if (address != null) user.location.address = address;
    if (longitude != null && latitude != null) {
      user.location.coordinates = [parseFloat(longitude), parseFloat(latitude)];
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const updated = user.toObject();
    delete updated.password;
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const logDonation = async (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ message: 'Only donors can log donations' });
    }

    const { bloodBank, unitsGiven, donatedAt, notes } = req.body;

    const donation = await Donation.create({
      donor: req.user._id,
      bloodBank: bloodBank || undefined,
      bloodGroup: req.user.bloodGroup,
      unitsGiven: unitsGiven || 1,
      donatedAt: donatedAt || Date.now(),
      notes,
    });

   
    await User.findByIdAndUpdate(req.user._id, {
      lastDonationDate: donation.donatedAt,
    });

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDonationHistory = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate('bloodBank', 'name address')
      .sort({ donatedAt: -1 });

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, logDonation, getDonationHistory };
