const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  respondToRequest,
  updateRequestStatus,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('hospital'), createRequest);
router.get('/', protect, getRequests);
router.patch('/:id/respond', protect, authorize('donor'), respondToRequest);
router.patch('/:id', protect, authorize('admin'), updateRequestStatus);

module.exports = router;