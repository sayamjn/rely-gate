const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const BusController = require('../controllers/bus.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { uploadPurposeImage, handleUploadError } = require('../middleware/upload');

const router = express.Router();


router.use(authenticateToken);

// GET /api/buses - List buses with pagination and search (legacy)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  query('search').optional().isString().trim().withMessage('Search must be a string'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, BusController.getBuses);

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
  query('tenantId').notEmpty().isNumeric().withMessage('TenantId is required and must be numeric'),
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
      throw new Error('PurposeName is required when purposeId is -1');
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

// GET /api/buses/export - Export buses
router.get('/export', [
  query('purposeId').optional().isInt().withMessage('PurposeId must be an integer'),
  query('registrationNumber').optional().isString().trim().withMessage('RegistrationNumber must be a string'),
  query('driverName').optional().isString().trim().withMessage('DriverName must be a string'),
  query('fromDate').optional().isISO8601().withMessage('FromDate must be a valid date'),
  query('toDate').optional().isISO8601().withMessage('ToDate must be a valid date'),
  query('format').optional().isIn(['csv']).withMessage('Invalid format'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, BusController.exportBuses);

// GET /api/buses/template - Download CSV template
router.get('/template', handleValidationErrors, BusController.downloadTemplate);

// GET /api/buses/pending-checkout - Get buses currently checked in (pending checkout)
router.get('/pending-checkout', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, BusController.getPendingCheckout);

// POST /api/buses/purposes - Add new purpose
router.post('/purposes', uploadPurposeImage, handleUploadError, [
  body('purposeName')
    .notEmpty()
    .withMessage('Purpose name is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage('Purpose name must be between 1 and 250 characters'),
  body('tenantId')
    .notEmpty()
    .isNumeric()
    .withMessage('TenantId is required and must be numeric'),
], handleValidationErrors, BusController.addBusPurpose);

// PUT /api/buses/purposes/:purposeId - Update purpose
router.put('/purposes/:purposeId', [
  param('purposeId')
    .notEmpty()
    .withMessage('Purpose ID is required')
    .isNumeric()
    .withMessage('Purpose ID must be numeric'),
  body('purposeName')
    .notEmpty()
    .withMessage('Purpose name is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage('Purpose name must be between 1 and 250 characters'),
  body('tenantId')
    .notEmpty()
    .isNumeric()
    .withMessage('TenantId is required and must be numeric'),
], handleValidationErrors, BusController.updateBusPurpose);

// DELETE /api/buses/purposes/:purposeId - Delete purpose
router.delete('/purposes/:purposeId', [
  param('purposeId')
    .notEmpty()
    .withMessage('Purpose ID is required')
    .isNumeric()
    .withMessage('Purpose ID must be numeric'),
  query('tenantId')
    .notEmpty()
    .isNumeric()
    .withMessage('TenantId is required and must be numeric'),
], handleValidationErrors, BusController.deleteBusPurpose);

module.exports = router;