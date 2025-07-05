const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const StaffController = require('../controllers/staff.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { uploadPurposeImage, handleUploadError } = require('../middleware/upload');

const router = express.Router();

router.use(authenticateToken);

// GET /api/staff/pending-checkout - Get staff currently checked in (pending checkout)
router.get('/pending-checkout', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StaffController.getPendingCheckout);

// GET /api/staff - List staff with pagination and search
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  query('search').optional().isString().trim().withMessage('Search must be a string'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StaffController.getStaff);

// GET /api/staff/:staffId/status - Get staff's current status (first visit check)
router.get('/:staffId/status', [
  param('staffId').isInt({ min: 1 }).withMessage('Staff ID must be a positive integer'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StaffController.getStaffStatus);

// POST /api/staff/:staffId/checkin - Check-in staff member (First action)
router.post('/:staffId/checkin', [
  param('staffId').isInt({ min: 1 }).withMessage('Staff ID must be a positive integer'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StaffController.checkinStaff);

// POST /api/staff/:staffId/checkout - Check-out staff member (Second action)
router.post('/:staffId/checkout', [
  param('staffId').isInt({ min: 1 }).withMessage('Staff ID must be a positive integer'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StaffController.checkoutStaff);

// GET /api/staff/:staffId/history - Get staff visit history
router.get('/:staffId/history', [
  param('staffId').isInt({ min: 1 }).withMessage('Staff ID must be a positive integer'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('limit').optional().isNumeric().withMessage('Limit must be numeric')
], handleValidationErrors, StaffController.getStaffHistory);


// POST /api/staff/list - List staff with filters 
router.post('/list', [
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  body('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  body('search').optional().isString().trim().withMessage('Search must be a string'),
  body('designation').optional().isString().trim().withMessage('Designation must be a string'),
  body('staffId').optional().isString().trim().withMessage('StaffId must be a string'),
  body('name').optional().isString().trim().withMessage('Name must be a string'),
  body('fromDate').optional().isISO8601().withMessage('FromDate must be a valid date'),
  body('toDate').optional().isISO8601().withMessage('ToDate must be a valid date'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StaffController.listStaff);


// GET /api/staff/designations - Get available designations
router.get('/designations', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StaffController.getDesignations);

// GET /api/staff/purposes - Get available staff purposes
router.get('/purposes', [
  query('tenantId')
    .notEmpty()
    .isNumeric()
    .withMessage('TenantId is required and must be numeric'),
], handleValidationErrors, StaffController.getStaffPurposes);

// POST /api/staff/register - Staff registration (OTP-based)
router.post('/register', [
  body('mobile').notEmpty().matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
  body('designation').notEmpty().withMessage('Designation is required'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StaffController.registerStaff);


// POST /api/staff/verify-registration - Verify OTP and complete registration
router.post('/verify-registration', [
  body('mobile').notEmpty().matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
  body('otpNumber').notEmpty().matches(/^\d{6}$/).withMessage('OTP must be 6 digits'),
  body('name').notEmpty().withMessage('Name is required'),
  body('designation').notEmpty().withMessage('Designation is required'),
  body('address1').optional().isString().trim(),
  body('address2').optional().isString().trim(),
  body('remarks').optional().isString().trim(),
  body('vehicleNumber').optional().isString().trim(),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StaffController.verifyRegistration);


// GET /api/staff/export - Export staff data to CSV
router.get('/export', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('designation').optional().isString().trim(),
], handleValidationErrors, StaffController.exportStaff);

// GET /api/staff/template - Download CSV template for bulk upload
router.get('/template', handleValidationErrors, StaffController.downloadTemplate);

// ===== DESIGNATION (PURPOSE) MANAGEMENT ROUTES =====

// POST /api/staff/designations - Add new designation
router.post('/designations', uploadPurposeImage, handleUploadError, [
  body('purposeName')
    .notEmpty()
    .withMessage('Designation name is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage('Designation name must be between 1 and 250 characters'),
  body('tenantId')
    .notEmpty()
    .isNumeric()
    .withMessage('TenantId is required and must be numeric'),
], handleValidationErrors, StaffController.addStaffPurpose);

// PUT /api/staff/designations/:purposeId - Update designation
router.put('/designations/:purposeId', [
  param('purposeId')
    .notEmpty()
    .withMessage('Designation ID is required')
    .isNumeric()
    .withMessage('Designation ID must be numeric'),
  body('purposeName')
    .notEmpty()
    .withMessage('Designation name is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage('Designation name must be between 1 and 250 characters'),
  body('tenantId')
    .notEmpty()
    .isNumeric()
    .withMessage('TenantId is required and must be numeric'),
], handleValidationErrors, StaffController.updateStaffPurpose);

// DELETE /api/staff/designations/:purposeId - Delete designation
router.delete('/designations/:purposeId', [
  param('purposeId')
    .notEmpty()
    .withMessage('Designation ID is required')
    .isNumeric()
    .withMessage('Designation ID must be numeric'),
  query('tenantId')
    .notEmpty()
    .isNumeric()
    .withMessage('TenantId is required and must be numeric'),
], handleValidationErrors, StaffController.deleteStaffPurpose);

module.exports = router;