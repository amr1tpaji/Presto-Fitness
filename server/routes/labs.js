const express = require('express');
const { body, validationResult } = require('express-validator');
const LabReport = require('../models/LabReport');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { evaluateReport } = require('../services/labEvaluator');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── POST /api/labs ──────────────────────────────────────────────────────────
// Upload a lab report with optional file and biomarkers array.
// Biomarkers are auto-evaluated via the labEvaluator service.
router.post('/', (req, res, next) => {
  // Handle file upload first, then process
  uploadSingle(req, res, async (uploadErr) => {
    if (uploadErr) return next(uploadErr);

    try {
      const { title, date, biomarkers, userId: bodyUserId } = req.body;

      if (!title || !date) {
        return res.status(400).json({
          success: false,
          message: 'Title and date are required',
        });
      }

      // Determine which user this report belongs to
      let userId = req.user._id;
      if (bodyUserId && req.user.role === 'admin') {
        userId = bodyUserId;
      }

      // Get user's gender for gender-aware biomarker evaluation
      const user = await User.findById(userId);
      const gender = user?.gender || 'male';

      // Parse biomarkers if sent as a JSON string (common with multipart/form-data)
      let parsedBiomarkers = [];
      if (biomarkers) {
        parsedBiomarkers =
          typeof biomarkers === 'string'
            ? JSON.parse(biomarkers)
            : biomarkers;
      }

      // Auto-evaluate biomarkers
      let evaluatedBiomarkers = [];
      let overallStatus = 'normal';

      if (parsedBiomarkers.length > 0) {
        const evaluation = evaluateReport(parsedBiomarkers, gender);
        evaluatedBiomarkers = evaluation.evaluatedBiomarkers;
        overallStatus = evaluation.overallStatus;
      }

      const labReport = await LabReport.create({
        userId,
        title,
        date: new Date(date),
        fileUrl: req.file ? req.file.filename : undefined,
        biomarkers: evaluatedBiomarkers,
        overallStatus,
        uploadedBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: 'Lab report uploaded and evaluated successfully',
        data: { labReport },
      });
    } catch (error) {
      next(error);
    }
  });
});

// ── GET /api/labs ───────────────────────────────────────────────────────────
// Get all lab reports for the current user
router.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const labReports = await LabReport.find(filter)
      .sort({ date: -1 })
      .populate('userId', 'name')
      .select('-biomarkers');

    res.json({
      success: true,
      data: { labReports },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/labs/client/:clientId ──────────────────────────────────────────
// Admin: get a client's lab reports
router.get('/client/:clientId', adminOnly, async (req, res, next) => {
  try {
    const labReports = await LabReport.find({
      userId: req.params.clientId,
    })
      .sort({ date: -1 })
      .populate('uploadedBy', 'name');

    res.json({
      success: true,
      data: { labReports },
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/labs/:id ───────────────────────────────────────────────────────
// Get single lab report with full biomarker details
router.get('/:id', async (req, res, next) => {
  try {
    const labReport = await LabReport.findById(req.params.id)
      .populate('userId', 'name phone gender')
      .populate('uploadedBy', 'name');

    if (!labReport) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found',
      });
    }

    // Clients can only view their own reports
    if (
      req.user.role !== 'admin' &&
      labReport.userId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this report',
      });
    }

    res.json({
      success: true,
      data: { labReport },
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/labs/:id/notes ─────────────────────────────────────────────────
// Admin: add or update notes on a lab report
router.put(
  '/:id/notes',
  adminOnly,
  [body('adminNotes').trim().notEmpty().withMessage('Notes are required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const labReport = await LabReport.findByIdAndUpdate(
        req.params.id,
        { adminNotes: req.body.adminNotes },
        { new: true }
      );

      if (!labReport) {
        return res.status(404).json({
          success: false,
          message: 'Lab report not found',
        });
      }

      res.json({
        success: true,
        message: 'Notes updated successfully',
        data: { labReport },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
