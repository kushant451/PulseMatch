const mongoose = require('mongoose');

const bloodStockSchema = new mongoose.Schema(
  {
    bloodBank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodBank',
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    unitsAvailable: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    // Each batch of blood collected has its own expiry (whole blood ~42 days shelf life)
    collectedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'expired', 'used'],
      default: 'available',
    },
  },
  { timestamps: true }
);

// Auto-calculate expiry date (42 days from collection) if not explicitly set
bloodStockSchema.pre('validate', function (next) {
  if (!this.expiryDate && this.collectedDate) {
    const expiry = new Date(this.collectedDate);
    expiry.setDate(expiry.getDate() + 42);
    this.expiryDate = expiry;
  }
  next();
});

// Index for fast queries by blood group + bank
bloodStockSchema.index({ bloodBank: 1, bloodGroup: 1 });
bloodStockSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('BloodStock', bloodStockSchema);
