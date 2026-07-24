const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  logDonation,
  getDonationHistory,
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getProfile);
router.patch('/', protect, updateProfile);
router.post('/donations', protect, logDonation);
router.get('/donations', protect, getDonationHistory);

module.exports = router;
