const express = require('express');
const router = express.Router();
const { addStock, getStock, getExpiringSoon, updateStock } = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getStock);
router.get('/expiring-soon', protect, authorize('admin'), getExpiringSoon);
router.post('/', protect, authorize('admin'), addStock);
router.patch('/:id', protect, authorize('admin'), updateStock);

module.exports = router;
