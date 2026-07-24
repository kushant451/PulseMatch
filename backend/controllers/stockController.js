const BloodStock = require('../models/BloodStock');
const { getIO } = require('../config/socket');

const addStock = async (req, res) => {
  try {
    const { bloodBank, bloodGroup, unitsAvailable, collectedDate } = req.body;

    if (!bloodBank || !bloodGroup || unitsAvailable == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const stock = await BloodStock.create({
      bloodBank,
      bloodGroup,
      unitsAvailable,
      collectedDate: collectedDate || Date.now(),
    });

    const io = getIO();
    if (io) {
      io.to('admin-room').emit('stock:updated', stock);
    }

    res.status(201).json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getStock = async (req, res) => {
  try {
    const filter = { status: 'available' };
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
    if (req.query.bloodBank) filter.bloodBank = req.query.bloodBank;

    const stock = await BloodStock.find(filter)
      .populate('bloodBank', 'name address contactPhone')
      .sort({ expiryDate: 1 }); // FEFO: first-expiry-first-out

    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getExpiringSoon = async (req, res) => {
  try {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringStock = await BloodStock.find({
      status: 'available',
      expiryDate: { $lte: sevenDaysFromNow, $gt: new Date() },
    }).populate('bloodBank', 'name address');

    res.json(expiringStock);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const stock = await BloodStock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock entry not found' });
    }

    const { unitsAvailable, status } = req.body;
    if (unitsAvailable != null) stock.unitsAvailable = unitsAvailable;
    if (status) stock.status = status;

    await stock.save();

    const io = getIO();
    if (io) {
      io.to('admin-room').emit('stock:updated', stock);
    }

    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { addStock, getStock, getExpiringSoon, updateStock };
