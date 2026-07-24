const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    contactPhone: {
      type: String,
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    operatingHours: {
      type: String,
      default: '9:00 AM - 6:00 PM',
    },
  },
  { timestamps: true }
);

bloodBankSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('BloodBank', bloodBankSchema);
