const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const StudentController = require('../controllers/student.controller');
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

// POST /api/students/list - List students with filters
router.post('/list', [
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  body('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  body('search').optional().isString().trim().withMessage('Search must be a string'),
  body('purposeId').optional().isInt().withMessage('PurposeId must be an integer'),
  body('studentId').optional().isString().trim().withMessage('StudentId must be a string'),
  body('firstName').optional().isString().trim().withMessage('FirstName must be a string'),
  body('course').optional().isString().trim().withMessage('Course must be a string'),
  body('hostel').optional().isString().trim().withMessage('Hostel must be a string'),
  body('fromDate').optional().isISO8601().withMessage('FromDate must be a valid date'),
  body('toDate').optional().isISO8601().withMessage('ToDate must be a valid date'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StudentController.listStudents);

// GET /api/students/purposes - Get available purposes for students
router.get('/purposes', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('purposeCatId').optional().isInt({ min: 1 }).withMessage('PurposeCatId must be a positive integer')
], handleValidationErrors, StudentController.getStudentPurposes);

// GET /api/students/purpose-categories - Get purpose categories
router.get('/purpose-categories', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StudentController.getPurposeCategories);

// GET /api/students/pending-checkin - Get students currently checked out (pending check-in)
router.get('/pending-checkin', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StudentController.getPendingCheckin);

// GET /api/students - List students with pagination and search (kept for backward compatibility)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  query('search').optional().isString().trim().withMessage('Search must be a string'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StudentController.getStudents);

// GET /api/students/:studentId/status - Get student's current status (first visit check)
router.get('/:studentId/status', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StudentController.getStudentStatus);

// POST /api/students/:studentId/checkout - Checkout student with purpose support
router.post('/:studentId/checkout', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
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
], handleValidationErrors, StudentController.checkoutStudent);

// POST /api/students/:studentId/checkin - Checkin student
router.post('/:studentId/checkin', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StudentController.checkinStudent);

// GET /api/students/:studentId/history - Get student's visit history
router.get('/:studentId/history', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, StudentController.getStudentHistory);

module.exports = router;