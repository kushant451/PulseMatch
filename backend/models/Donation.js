const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bloodBank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodBank',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    unitsGiven: {
      type: Number,
      default: 1,
    },
    donatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

donationSchema.index({ donor: 1, donatedAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
