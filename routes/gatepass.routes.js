const express = require('express');
const { body, query, param } = require('express-validator');
const GatepassController = require('../controllers/gatepass.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);

// POST /api/gatepass - Create new gatepass
router.post('/', [
  body('fname').notEmpty().withMessage('First name is required'),
  body('mobile')
    .notEmpty()
    .withMessage('Mobile is required')
    .matches(/^\d{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('visitDate')
    .notEmpty()
    .withMessage('Visit date is required')
    .isISO8601()
    .withMessage('Visit date must be a valid ISO date'),
  body('purposeId')
    .notEmpty()
    .withMessage('Purpose ID is required')
    .isNumeric()
    .withMessage('Purpose ID must be numeric'),
  body('purposeName').notEmpty().withMessage('Purpose name is required'),
  body('statusId')
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage('Status ID must be 1 (Pending) or 2 (Approved)'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  body('remark').optional().isString().trim().withMessage('Remark must be a string')
], handleValidationErrors, GatepassController.createGatepass);

// GET /api/gatepass - List gatepasses
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  query('search').optional().isString().trim().withMessage('Search must be a string'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, GatepassController.listGatepasses);

// POST /api/gatepass/list - List gatepasses with advanced filtering
router.post('/list', [
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  body('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  body('search').optional().isString().trim().withMessage('Search must be a string'),
  body('purposeId').optional().isInt().withMessage('PurposeId must be an integer'),
  body('statusId').optional().isInt().withMessage('StatusId must be an integer'),
  body('fromDate').optional().isISO8601().withMessage('FromDate must be a valid date'),
  body('toDate').optional().isISO8601().withMessage('ToDate must be a valid date'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, GatepassController.listGatepassesAdvanced);

// PUT /api/gatepass/:visitorId/approve - Approve gatepass (NO auto check-in)
router.put('/:visitorId/approve', [
  param('visitorId')
    .notEmpty()
    .withMessage('Visitor ID is required')
    .isNumeric()
    .withMessage('Visitor ID must be numeric'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, GatepassController.approveGatepass);

// POST /api/gatepass/:visitorId/checkin - Check-in gatepass (sets INTime)
router.post('/:visitorId/checkin', [
  param('visitorId')
    .notEmpty()
    .withMessage('Visitor ID is required')
    .isNumeric()
    .withMessage('Visitor ID must be numeric'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, GatepassController.checkinGatepass);

// POST /api/gatepass/:visitorId/checkout - Check-out gatepass (sets OutTime)
router.post('/:visitorId/checkout', [
  param('visitorId')
    .notEmpty()
    .withMessage('Visitor ID is required')
    .isNumeric()
    .withMessage('Visitor ID must be numeric'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, GatepassController.checkoutGatepass);

// GET /api/gatepass/:visitorId/status - Get gatepass current status
router.get('/:visitorId/status', [
  param('visitorId')
    .notEmpty()
    .withMessage('Visitor ID is required')
    .isNumeric()
    .withMessage('Visitor ID must be numeric'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, GatepassController.getGatepassStatus);

// GET /api/gatepass/pending-checkin - Get gatepasses ready for check-in
router.get('/pending-checkin', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, GatepassController.getPendingCheckin);

// GET /api/gatepass/pending-checkout - Get gatepasses that need check-out
router.get('/pending-checkout', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, GatepassController.getPendingCheckout);

// GET /api/gatepass/purposes - Get available purposes
router.get('/purposes', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, GatepassController.getGatepassPurposes);

// GET /api/gatepass/export - Export gatepasses to CSV
router.get('/export', [
  query('purposeId').optional().isInt().withMessage('PurposeId must be an integer'),
  query('statusId').optional().isInt().withMessage('StatusId must be an integer'),
  query('fromDate').optional().isISO8601().withMessage('FromDate must be a valid date'),
  query('toDate').optional().isISO8601().withMessage('ToDate must be a valid date'),
  query('format').optional().isIn(['csv']).withMessage('Invalid format'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, GatepassController.exportGatepasses);

// GET /api/gatepass/template - Download CSV template
router.get('/template', handleValidationErrors, GatepassController.downloadTemplate);

module.exports = router;