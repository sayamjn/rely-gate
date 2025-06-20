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

// GET /api/students - List students with pagination and search
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

// POST /api/students/:studentId/checkout - Checkout student (first visit or subsequent)
router.post('/:studentId/checkout', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
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

// GET /api/students/pending-checkin - Get students currently checked out (pending check-in)
router.get('/pending-checkin', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric')
], handleValidationErrors, StudentController.getPendingCheckin);

// GET /api/students/search - Advanced search with filters
// router.get('/search', [
//   query('search').optional().isString().trim(),
//   query('course').optional().isString().trim(),
//   query('hostel').optional().isString().trim(),
//   query('page').optional().isInt({ min: 1 }),
//   query('pageSize').optional().isInt({ min: 1, max: 100 }),
//   query('tenantId').optional().isNumeric()
// ], handleValidationErrors, StudentController.searchStudents);

module.exports = router;