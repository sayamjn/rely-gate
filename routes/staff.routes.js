const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const StaffController = require('../controllers/staff.controller');
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

module.exports = router;