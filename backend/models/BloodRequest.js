const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // hospital user
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    unitsNeeded: {
      type: Number,
      required: true,
      min: 1,
    },
    urgency: {
      type: String,
      enum: ['normal', 'urgent', 'critical'],
      default: 'normal',
    },
    patientDetails: {
      type: String, // brief note, no need for full PII in a project
    },
    // Location the blood needs to reach — used to find nearest bank/donors
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: String,
    },
    status: {
      type: String,
      enum: ['pending', 'matched', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodBank',
    },
    // Donor who volunteered to fulfil this request (separate from fulfilledBy,
    // which tracks a BloodBank fulfilling it via stock).
    respondedDonor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

bloodRequestSchema.index({ location: '2dsphere' });
bloodRequestSchema.index({ status: 1, urgency: 1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);