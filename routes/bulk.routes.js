const express = require("express");
const multer = require("multer");
const BulkController = require('../controllers/bulk.controller');
const { authenticateToken } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

const upload = multer({
  dest: 'uploads/temp/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

router.use(authenticateToken);

// POST /api/bulk/students - Upload student data
router.post('/students', upload.single('file'), [
  body('type').optional().isString().trim().withMessage('Type must be a string'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, BulkController.uploadStudentData);

// POST /api/bulk/visitors - Upload visitor data
router.post('/visitors', upload.single('file'), [
  body('visitorCatId').isInt({ min: 1, max: 5 }).withMessage('VisitorCatId must be between 1 and 5'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, BulkController.uploadVisitorData);

// POST /api/bulk/staff - Upload staff data
router.post('/staff', upload.single('file'), [
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, BulkController.uploadStaffData);

// POST /api/bulk/buses - Upload bus data
router.post('/buses', upload.single('file'), [
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, BulkController.uploadBusData);

// GET /api/bulk/operation/:operationId/status - Get bulk operation status
// router.get('/operation/:operationId/status', [
//   param('operationId').isUUID().withMessage('OperationId must be a valid UUID'),
//   query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
// ], handleValidationErrors, BulkController.getBulkOperationStatus);

module.exports = router;