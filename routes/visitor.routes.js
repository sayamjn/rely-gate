const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const VisitorController = require('../controllers/visitor.controller');
const { authenticateToken, validateTenantAccess } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { uploadPurposeImage, handleUploadError } = require('../middleware/upload');

const router = express.Router();



router.use(authenticateToken);

// GET /api/visitors/purposes - Get visitor purposes by category
router.get('/purposes', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('purposeCatId').optional().isNumeric().withMessage('PurposeCatId must be numeric')
], handleValidationErrors, VisitorController.getVisitorPurposes);

// GET /api/visitors/subcategories - Get visitor subcategories
router.get('/subcategories', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('visitorCatId').optional().isNumeric().withMessage('VisitorCatId must be numeric')
], handleValidationErrors, VisitorController.getVisitorSubCategories);

// POST /api/visitors/send-otp - Send OTP for visitor registration
router.post('/send-otp', [
  body('mobile')
    .notEmpty()
    .withMessage('Mobile is required')
    .matches(/^\d{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  body('visitorTypeId').optional().isNumeric().withMessage('VisitorTypeId must be numeric')
], handleValidationErrors, VisitorController.sendOTP);

// POST /api/visitors/send-unregistered-otp - Send OTP for unregistered visitor
router.post('/send-unregistered-otp', [
  body('mobile')
    .notEmpty()
    .withMessage('Mobile is required')
    .matches(/^\d{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.sendUnregisteredOTP);

// POST /api/visitors/verify-otp - Verify OTP
router.post('/verify-otp', [
  body('refId')
    .notEmpty()
    .withMessage('RefId is required')
    .isNumeric()
    .withMessage('RefId must be numeric'),
  body('otpNumber')
    .notEmpty()
    .withMessage('OTP number is required')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be 6 digits'),
  body('mobile')
    .notEmpty()
    .withMessage('Mobile is required')
    .matches(/^\d{10}$/)
    .withMessage('Mobile must be 10 digits')
], handleValidationErrors, VisitorController.verifyOTP);

// POST /api/visitors/create-unregistered - Create unregistered visitor
router.post('/create-unregistered', [
  body('fname').notEmpty().withMessage('First name is required'),
  body('mobile')
    .notEmpty()
    .withMessage('Mobile is required')
    .matches(/^\d{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('flatName').notEmpty().withMessage('Flat name is required'),
  body('visitorCatId')
    .notEmpty()
    .withMessage('Visitor category ID is required')
    .isNumeric()
    .withMessage('Visitor category ID must be numeric'),
  body('visitorSubCatId')
    .notEmpty()
    .withMessage('Visitor subcategory ID is required')
    .isNumeric()
    .withMessage('Visitor subcategory ID must be numeric'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  body('visitPurposeId').optional().isNumeric().withMessage('Visit purpose ID must be numeric'),
  body('totalVisitor').optional().isNumeric().withMessage('Total visitor must be numeric')
], handleValidationErrors, VisitorController.createUnregisteredVisitor);

// POST /api/visitors/create-registered - Create registered visitor
router.post('/create-registered', [
  body('vistorName').notEmpty().withMessage('Visitor name is required'),
  body('mobile')
    .notEmpty()
    .withMessage('Mobile is required')
    .matches(/^\d{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('visitorCatId')
    .notEmpty()
    .withMessage('Visitor category ID is required')
    .isNumeric()
    .withMessage('Visitor category ID must be numeric'),
  body('visitorSubCatId')
    .notEmpty()
    .withMessage('Visitor subcategory ID is required')
    .isNumeric()
    .withMessage('Visitor subcategory ID must be numeric'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  body('flatId').optional().isNumeric().withMessage('Flat ID must be numeric'),
  body('identityId').optional().isNumeric().withMessage('Identity ID must be numeric')
], handleValidationErrors, VisitorController.createRegisteredVisitor);

// GET /api/visitors/registered - Get registered visitors
router.get('/registered', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('visitorCatId').optional().isNumeric().withMessage('VisitorCatId must be numeric'),
  query('visitorSubCatId').optional().isNumeric().withMessage('VisitorSubCatId must be numeric')
], handleValidationErrors, VisitorController.getRegisteredVisitors);

// PUT /api/visitors/:visitorId/checkout - Checkout visitor
router.put('/:visitorId/checkout', [
  param('visitorId')
    .notEmpty()
    .withMessage('Visitor ID is required')
    .isNumeric()
    .withMessage('Visitor ID must be numeric'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.checkoutVisitor);

// GET /api/visitors/:visitorId/status - Get visitor's current status
router.get('/:visitorId/status', [
  param('visitorId')
    .notEmpty()
    .withMessage('Visitor ID is required')
    .isNumeric()
    .withMessage('Visitor ID must be numeric'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.getVisitorStatus);

// POST /api/visitors/checkin - Check in registered visitor
router.post('/checkin', [
  body('visitorRegId')
    .notEmpty()
    .withMessage('Visitor registration ID is required')
    .isNumeric()
    .withMessage('Visitor registration ID must be numeric'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.checkinVisitor);

// PUT /api/visitors/history/:historyId/checkout - Check out visitor by history ID
router.put('/history/:historyId/checkout', [
  param('historyId')
    .notEmpty()
    .withMessage('History ID is required')
    .isNumeric()
    .withMessage('History ID must be numeric'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.checkoutVisitorHistory);

// GET /api/visitors/:visitorRegId/history - Get visitor history
router.get('/:visitorRegId/history', [
  param('visitorRegId')
    .notEmpty()
    .withMessage('Visitor registration ID is required')
    .isNumeric()
    .withMessage('Visitor registration ID must be numeric'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('limit').optional().isNumeric().withMessage('Limit must be numeric')
], handleValidationErrors, VisitorController.getVisitorHistory);

// GET /api/visitors/pending-checkout - Get visitors pending checkout
router.get('/pending-checkout', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.getPendingCheckout);



// POST /api/visitors/:visitorRegId/qr - Generate QR code for visitor
router.post('/:visitorRegId/qr', [
  param('visitorRegId')
    .notEmpty()
    .withMessage('Visitor registration ID is required')
    .isNumeric()
    .withMessage('Visitor registration ID must be numeric'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.generateQR);

// POST /api/visitors/scan-qr - Scan QR code
router.post('/scan-qr', [
  body('qrString')
    .notEmpty()
    .withMessage('QR string is required'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.scanQR);

// GET /api/visitors/search - Search visitors with pagination
router.get('/search', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('page').optional().isNumeric().withMessage('Page must be numeric'),
  query('pageSize').optional().isNumeric().withMessage('Page size must be numeric'),
  query('visitorCatId').optional().isNumeric().withMessage('VisitorCatId must be numeric'),
  query('visitorSubCatId').optional().isNumeric().withMessage('VisitorSubCatId must be numeric')
], handleValidationErrors, VisitorController.searchVisitors);


router.get('/history/comprehensive', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('page').optional().isNumeric().withMessage('Page must be numeric'),
  query('pageSize').optional().isNumeric().withMessage('Page size must be numeric'),
  query('visitorCatId').optional().isNumeric().withMessage('VisitorCatId must be numeric'),
  query('visitorSubCatId').optional().isNumeric().withMessage('VisitorSubCatId must be numeric'),
  query('fromDate').optional().isDate().withMessage('FromDate must be valid date'),
  query('toDate').optional().isDate().withMessage('ToDate must be valid date')
], handleValidationErrors, VisitorController.getComprehensiveHistory);


router.post('/list', [
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  body('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  body('search').optional().isString().trim().withMessage('Search must be a string'),
  body('visitorCatId').optional().isInt().withMessage('VisitorCatId must be an integer'),
  body('visitorSubCatId').optional().isInt().withMessage('VisitorSubCatId must be an integer'),
  body('purposeId').optional().isInt().withMessage('PurposeId must be an integer'),
  body('flatName').optional().isString().trim().withMessage('FlatName must be a string'),
  body('mobile').optional().isString().trim().withMessage('Mobile must be a string'),
  body('fromDate').optional().isISO8601().withMessage('FromDate must be a valid date'),
  body('toDate').optional().isISO8601().withMessage('ToDate must be a valid date'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'CHECKED_IN', 'AVAILABLE']).withMessage('Invalid status'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.listVisitors);

// GET /api/visitors - List visitors with pagination and search (legacy)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  query('search').optional().isString().trim().withMessage('Search must be a string'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.getVisitors);

// GET /api/visitors/export - Export visitors
router.get('/export', [
  query('visitorCatId').optional().isInt().withMessage('VisitorCatId must be an integer'),
  query('visitorSubCatId').optional().isInt().withMessage('VisitorSubCatId must be an integer'),
  query('status').optional().isIn(['CHECKED_IN', 'AVAILABLE']).withMessage('Invalid status'),
  query('fromDate').optional().isISO8601().withMessage('FromDate must be a valid date'),
  query('toDate').optional().isISO8601().withMessage('ToDate must be a valid date'),
  query('format').optional().isIn(['csv']).withMessage('Invalid format'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.exportVisitors);

// GET /api/visitors/pending-checkout - Get visitors currently checked in
router.get('/pending-checkout', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('visitorCatId').optional().isInt().withMessage('VisitorCatId must be an integer')
], handleValidationErrors, VisitorController.getPendingCheckout);

// GET /api/visitors/template - Download CSV template
router.get('/template', [
  query('visitorCatId').optional().isInt({ min: 1, max: 5 }).withMessage('VisitorCatId must be between 1 and 5')
], handleValidationErrors, VisitorController.downloadTemplate);


router.get('/export', [
  query('visitorCatId').optional().isInt().withMessage('VisitorCatId must be an integer'),
  query('visitorSubCatId').optional().isInt().withMessage('VisitorSubCatId must be an integer'),
  query('status').optional().isIn(['CHECKED_IN', 'AVAILABLE']).withMessage('Invalid status'),
  query('fromDate').optional().isISO8601().withMessage('FromDate must be a valid date'),
  query('toDate').optional().isISO8601().withMessage('ToDate must be a valid date'),
  query('format').optional().isIn(['csv']).withMessage('Invalid format'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, VisitorController.exportVisitors);

// ===== PURPOSE MANAGEMENT ROUTES =====

// POST /api/visitors/purposes - Add new purpose
router.post('/purposes', uploadPurposeImage, handleUploadError, [
  body('purposeName')
    .notEmpty()
    .withMessage('Purpose name is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage('Purpose name must be between 1 and 250 characters'),
  body('tenantId')
    .optional()
    .isNumeric()
    .withMessage('TenantId must be numeric'),
], handleValidationErrors, VisitorController.addVisitorPurpose);

// PUT /api/visitors/purposes/:purposeId - Update purpose
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
    .optional()
    .isNumeric()
    .withMessage('TenantId must be numeric'),
], handleValidationErrors, VisitorController.updateVisitorPurpose);

// DELETE /api/visitors/purposes/:purposeId - Delete purpose
router.delete('/purposes/:purposeId', [
  param('purposeId')
    .notEmpty()
    .withMessage('Purpose ID is required')
    .isNumeric()
    .withMessage('Purpose ID must be numeric'),
  body('tenantId')
    .optional()
    .isNumeric()
    .withMessage('TenantId must be numeric'),
], handleValidationErrors, VisitorController.deleteVisitorPurpose);

module.exports = router;