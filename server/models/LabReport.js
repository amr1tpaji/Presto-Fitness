const mongoose = require('mongoose');

const biomarkerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    value: {
      type: Number,
    },
    unit: {
      type: String,
    },
    normalRange: {
      min: Number,
      max: Number,
    },
    status: {
      type: String,
      enum: ['normal', 'low', 'high', 'critical'],
    },
    category: {
      type: String,
      enum: [
        'blood',
        'hormone',
        'vitamin',
        'liver',
        'kidney',
        'thyroid',
        'lipid',
        'metabolic',
      ],
    },
  },
  { _id: true }
);

const labReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Report date is required'],
    },
    fileUrl: {
      type: String, // path to uploaded PDF/image
    },
    biomarkers: [biomarkerSchema],
    overallStatus: {
      type: String,
      enum: ['normal', 'attention', 'critical'],
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LabReport', labReportSchema);
