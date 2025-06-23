const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const BusController = require('../controllers/bus.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      responseCode: 'E',
      responseMessage: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

router.use(authenticateToken);

// POST /api/buses/list - List buses with filters
router.post('/list', [
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  body('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  body('search').optional().isString().trim().withMessage('Search must be a string'),
  body('purposeId').optional().isInt().withMessage('PurposeId must be an integer'),
  body('busNumber').optional().isString().trim().withMessage('BusNumber must be a string'),
  body('registrationNumber').optional().isString().trim().withMessage('RegistrationNumber must be a string'),
  body('driverName').optional().isString().trim().withMessage('DriverName must be a string'),
  body('fromDate').optional().isISO8601().withMessage('FromDate must be a valid date'),
  body('toDate').optional().isISO8601().withMessage('ToDate must be a valid date'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, BusController.listBuses);

// GET /api/buses/purposes - Get available purposes for buses
router.get('/purposes', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('purposeCatId').optional().isInt({ min: 1 }).withMessage('PurposeCatId must be a positive integer')
], handleValidationErrors, BusController.getBusPurposes);

// GET /api/buses/pending-checkin - Get buses currently checked out (pending check-in)
router.get('/pending-checkin', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, BusController.getPendingCheckin);

// GET /api/buses/:busId/status - Get bus's current status
router.get('/:busId/status', [
  param('busId').isInt({ min: 1 }).withMessage('Bus ID must be a positive integer'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, BusController.getBusStatus);

// POST /api/buses/:busId/checkout - Checkout bus with purpose support
router.post('/:busId/checkout', [
  param('busId').isInt({ min: 1 }).withMessage('Bus ID must be a positive integer'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  body('purposeId').optional().isInt().withMessage('PurposeId must be an integer'),
  body('purposeName').optional().isString().trim().withMessage('PurposeName must be a string'),
  // Custom validation for purpose logic
  body().custom((value) => {
    const { purposeId, purposeName } = value;
    
    // If purposeId is -1, purposeName is required
    if (purposeId === -1 && (!purposeName || purposeName.trim() === '')) {
      throw new Error('PurposeName is required when purposeId is -1 (custom purpose)');
    }
    
    // If purposeId is provided and not -1, it should be positive
    if (purposeId !== undefined && purposeId !== -1 && purposeId <= 0) {
      throw new Error('PurposeId must be positive or -1 for custom purpose');
    }
    
    return true;
  })
], handleValidationErrors, BusController.checkoutBus);

// POST /api/buses/:busId/checkin - Checkin bus
router.post('/:busId/checkin', [
  param('busId').isInt({ min: 1 }).withMessage('Bus ID must be a positive integer'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, BusController.checkinBus);

// GET /api/buses/:busId/history - Get bus's visit history
router.get('/:busId/history', [
  param('busId').isInt({ min: 1 }).withMessage('Bus ID must be a positive integer'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, BusController.getBusHistory);

module.exports = router;