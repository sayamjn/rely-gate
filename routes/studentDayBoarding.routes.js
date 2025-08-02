const express = require('express');
const { query, param, body } = require('express-validator');
const StudentDayBoardingController = require('../controllers/studentDayBoarding.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ================================================================================
// MULTER CONFIGURATION FOR CSV UPLOADS
// ================================================================================

const csvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'uploads', 'temp');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = path.extname(file.originalname) || '.csv';
    const filename = `student_day_boarding_${timestamp}_${random}${extension}`;
    cb(null, filename);
  }
});

const csvFileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || 
      file.mimetype === 'application/csv' ||
      file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const uploadCSV = multer({ 
  storage: csvStorage, 
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ================================================================================
// BULK UPLOAD ROUTES
// ================================================================================

// POST /api/student-day-boarding/bulk-upload - Bulk upload students via CSV
router.post('/bulk-upload', 
  uploadCSV.single('file'),
  StudentDayBoardingController.getBulkUploadValidation(),
  handleValidationErrors,
  StudentDayBoardingController.bulkUploadStudents
);

// GET /api/student-day-boarding/template - Download CSV template
router.get('/template', StudentDayBoardingController.downloadTemplate);

// ================================================================================
// STUDENT MANAGEMENT ROUTES
// ================================================================================

// GET /api/student-day-boarding/students - List students with filters
router.get('/students', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('PageSize must be between 1 and 100'),
  query('search')
    .optional()
    .isString()
    .trim()
    .withMessage('Search must be a string'),
  query('course')
    .optional()
    .isString()
    .trim()
    .withMessage('Course must be a string'),
  query('section')
    .optional()
    .isString()
    .trim()
    .withMessage('Section must be a string'),
  query('year')
    .optional()
    .isString()
    .trim()
    .withMessage('Year must be a string')
], handleValidationErrors, StudentDayBoardingController.getStudents);

// POST /api/student-day-boarding/students/:id/generate-qr - Generate QR code for student
router.post('/students/:id/generate-qr', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer')
], handleValidationErrors, StudentDayBoardingController.generateQR);

// ================================================================================
// PICKUP PASS GENERATION ROUTES
// ================================================================================

// POST /api/student-day-boarding/verify-phone - Verify guardian phone and send OTP
router.post('/verify-phone', 
  StudentDayBoardingController.getPhoneVerificationValidation(),
  handleValidationErrors,
  StudentDayBoardingController.verifyGuardianPhone
);

// POST /api/student-day-boarding/verify-otp - Verify OTP
router.post('/verify-otp',
  StudentDayBoardingController.getOTPVerificationValidation(),
  handleValidationErrors,
  StudentDayBoardingController.verifyOTP
);

// GET /api/student-day-boarding/guardian/:authMasterId/students - Get students linked to guardian
router.get('/guardian/:authMasterId/students', [
  param('authMasterId')
    .isInt({ min: 1 })
    .withMessage('Auth Master ID must be a positive integer')
], handleValidationErrors, StudentDayBoardingController.getGuardianStudents);

// POST /api/student-day-boarding/guardian/add - Add guardian to auth master
router.post('/guardian/add',
  StudentDayBoardingController.getAddGuardianValidation(),
  handleValidationErrors,
  StudentDayBoardingController.addGuardian
);

// ================================================================================
// STUDENT-GUARDIAN LINKING ROUTES
// ================================================================================

// POST /api/student-day-boarding/link-student - Link student to guardian
router.post('/link-student',
  StudentDayBoardingController.getLinkStudentValidation(),
  handleValidationErrors,
  StudentDayBoardingController.linkStudentToGuardian
);

// PUT /api/student-day-boarding/link/:linkId/inactivate - Inactivate student-guardian link
router.put('/link/:linkId/inactivate', [
  param('linkId')
    .isInt({ min: 1 })
    .withMessage('Link ID must be a positive integer')
], handleValidationErrors, StudentDayBoardingController.inactivateLink);

// ================================================================================
// CHECKOUT ROUTES
// ================================================================================

// POST /api/student-day-boarding/checkout/scan-qr - Process QR scan for checkout
router.post('/checkout/scan-qr',
  StudentDayBoardingController.getQRCheckoutValidation(),
  handleValidationErrors,
  StudentDayBoardingController.scanQRForCheckout
);

// POST /api/student-day-boarding/checkout/complete - Complete checkout after OTP verification
router.post('/checkout/complete',
  StudentDayBoardingController.getCompleteCheckoutValidation(),
  handleValidationErrors,
  StudentDayBoardingController.completeCheckout
);

// GET /api/student-day-boarding/checkout/history - Get checkout history
router.get('/checkout/history', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('PageSize must be between 1 and 100'),
  query('search')
    .optional()
    .isString()
    .trim()
    .withMessage('Search must be a string'),
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('FromDate must be a valid ISO date'),
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('ToDate must be a valid ISO date'),
  query('status')
    .optional()
    .isIn(['PENDING_OTP', 'CHECKED_OUT', 'COMPLETED'])
    .withMessage('Status must be PENDING_OTP, CHECKED_OUT, or COMPLETED')
], handleValidationErrors, StudentDayBoardingController.getCheckoutHistory);

// ================================================================================
// UTILITY ROUTES
// ================================================================================

// GET /api/student-day-boarding/filter-data - Get filter dropdown data
router.get('/filter-data', StudentDayBoardingController.getFilterData);

// ================================================================================
// ERROR HANDLING MIDDLEWARE
// ================================================================================

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        responseCode: 'E',
        responseMessage: 'File size too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        responseCode: 'E',
        responseMessage: 'Unexpected file field. Expected field name: file'
      });
    }
  }

  if (error.message === 'Only CSV files are allowed') {
    return res.status(400).json({
      responseCode: 'E',
      responseMessage: 'Only CSV files are allowed'
    });
  }

  next(error);
});

module.exports = router;