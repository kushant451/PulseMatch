const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const BloodStock = require('../models/BloodStock');


const isDonorEligible = (lastDonationDate) => {
  if (!lastDonationDate) return true;
  const daysSince = (Date.now() - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24);
  return daysSince >= 90;
};
const findNearestDonors = async (req, res) => {
  try {
    const { bloodGroup, longitude, latitude, maxDistanceKm } = req.query;

    if (!bloodGroup || !longitude || !latitude) {
      return res.status(400).json({
        message: 'bloodGroup, longitude, and latitude are required',
      });
    }

    const maxDistanceMeters = (maxDistanceKm ? parseFloat(maxDistanceKm) : 10) * 1000;

    const donors = await User.find({
      role: 'donor',
      bloodGroup,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    }).select('-password');

    // Filter by eligibility (90-day gap since last donation)
    const eligibleDonors = donors.filter((d) => isDonorEligible(d.lastDonationDate));

    res.json({
      count: eligibleDonors.length,
      donors: eligibleDonors,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const findNearestBloodBanks = async (req, res) => {
  try {
    const { bloodGroup, longitude, latitude, maxDistanceKm } = req.query;

    if (!bloodGroup || !longitude || !latitude) {
      return res.status(400).json({
        message: 'bloodGroup, longitude, and latitude are required',
      });
    }

    const maxDistanceMeters = (maxDistanceKm ? parseFloat(maxDistanceKm) : 15) * 1000;

 
    const nearbyBanks = await BloodBank.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    });

    const bankIds = nearbyBanks.map((b) => b._id);


    const stocks = await BloodStock.find({
      bloodBank: { $in: bankIds },
      bloodGroup,
      status: 'available',
      unitsAvailable: { $gt: 0 },
      expiryDate: { $gt: new Date() },
    }).populate('bloodBank');

    const banksWithStock = stocks.map((stock) => ({
      bloodBank: stock.bloodBank,
      unitsAvailable: stock.unitsAvailable,
      expiryDate: stock.expiryDate,
    }));

    res.json({
      count: banksWithStock.length,
      results: banksWithStock,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { findNearestDonors, findNearestBloodBanks };
