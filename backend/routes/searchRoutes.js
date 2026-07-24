const express = require('express');
const router = express.Router();
const { findNearestDonors, findNearestBloodBanks } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache');

// 30s cache: these are the highest-traffic, most repeated queries in the app
// (same blood group + rough location gets searched by many users during a shortage)
router.get('/donors', protect, cacheMiddleware(30), findNearestDonors);
router.get('/blood-banks', protect, cacheMiddleware(30), findNearestBloodBanks);

module.exports = router;
