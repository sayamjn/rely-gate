const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const StudentController = require('../controllers/student.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { uploadPurposeImage, handleUploadError } = require('../middleware/upload');

const router = express.Router();


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

// GET /api/students/export - Export students data

router.get('/export', [
  query('course').optional().isString().trim().withMessage('Course must be a string'),
  query('hostel').optional().isString().trim().withMessage('Hostel must be a string'),
  query('status').optional().isIn(['CHECKED_OUT', 'AVAILABLE']).withMessage('Invalid status'),
  query('fromDate').optional().isISO8601().withMessage('FromDate must be a valid date'),
  query('toDate').optional().isISO8601().withMessage('ToDate must be a valid date'),
  query('format').optional().isIn(['csv']).withMessage('Invalid format'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StudentController.exportStudents);

// GET /api/students/template - Download CSV template
router.get('/template', handleValidationErrors, StudentController.downloadTemplate);

router.get('/pending-checkout', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StudentController.getPendingCheckout);

// ===== PURPOSE MANAGEMENT ROUTES =====

// POST /api/students/purposes - Add new purpose
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
], handleValidationErrors, StudentController.addStudentPurpose);

// PUT /api/students/purposes/:purposeId - Update purpose
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
], handleValidationErrors, StudentController.updateStudentPurpose);

// DELETE /api/students/purposes/:purposeId - Delete purpose
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
], handleValidationErrors, StudentController.deleteStudentPurpose);

// POST /api/students/meal-checkin - Meal check-in via QR code
router.post('/meal-checkin', [
  body('student_id').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('tenant_id').optional().isNumeric().withMessage('Tenant ID must be numeric'),
  body('confirmed').optional().isBoolean().withMessage('Confirmed must be a boolean')
], handleValidationErrors, StudentController.mealCheckIn);

// GET /api/students/:studentId/meal-history - Get student's meal history
router.get('/:studentId/meal-history', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, StudentController.getStudentMealHistory);

// GET /api/students/meal-queue - Get current meal queue
router.get('/meal-queue', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('mealType').optional().isIn(['breakfast', 'lunch', 'dinner']).withMessage('Meal type must be breakfast, lunch, or dinner')
], handleValidationErrors, StudentController.getCurrentMealQueue);

// GET /api/students/meal-statistics - Get meal statistics
router.get('/meal-statistics', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('fromDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('FromDate must be in DD/MM/YYYY format'),
  query('toDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('ToDate must be in DD/MM/YYYY format')
], handleValidationErrors, StudentController.getMealStatistics);

module.exports = router;