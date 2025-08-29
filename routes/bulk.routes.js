const express = require("express");
const multer = require("multer");
const BulkController = require('../controllers/bulk.controller');
const { authenticateToken } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { bulkOperationLimit } = require('../middleware/rateLimit');

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
router.post('/students', bulkOperationLimit, upload.single('file'), [
  body('type').optional().isString().trim().withMessage('Type must be a string'),
], handleValidationErrors, BulkController.uploadStudentData);

// POST /api/bulk/visitors - Upload visitor data
router.post('/visitors', bulkOperationLimit, upload.single('file'), [
], handleValidationErrors, BulkController.uploadVisitorData);

// POST /api/bulk/staff - Upload staff data
router.post('/staff', bulkOperationLimit, upload.single('file'), [
], handleValidationErrors, BulkController.uploadStaffData);

// POST /api/bulk/buses - Upload bus data
router.post('/buses', bulkOperationLimit, upload.single('file'), [
], handleValidationErrors, BulkController.uploadBusData);

// GET /api/bulk/operation/:operationId/status - Get bulk operation status
// router.get('/operation/:operationId/status', [
//   param('operationId').isUUID().withMessage('OperationId must be a valid UUID'),
//   query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
// ], handleValidationErrors, BulkController.getBulkOperationStatus);

module.exports = router;