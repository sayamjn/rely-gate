const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const StudentController = require('../controllers/student.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { uploadPurposeImage, handleUploadError } = require('../middleware/upload');

const router = express.Router();


router.use(authenticateToken);

// GET /api/students/list - List students with filters (GET, query params)
// Accepts fromDate/toDate in DD/MM/YYYY or YYYY-MM-DD
router.get('/list', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100000 }).withMessage('PageSize must be between 1 and 100000'),
  query('search').optional().isString().trim().withMessage('Search must be a string'),
  query('purposeId').optional().isInt().withMessage('PurposeId must be an integer'),
  query('studentId').optional().isString().trim().withMessage('StudentId must be a string'),
  query('VisitorSubCatID').optional().isInt().withMessage('VisitorSubCatID must be an integer'),
  query('firstName').optional().isString().trim().withMessage('FirstName must be a string'),
  query('course').optional().isString().trim().withMessage('Course must be a string'),
  query('hostel').optional().isString().trim().withMessage('Hostel must be a string'),
  query('fromDate').optional().isInt().withMessage('FromDate must be valid epoch timestamp'),
  query('toDate').optional().isInt().withMessage('ToDate must be valid epoch timestamp'),
], handleValidationErrors, StudentController.listStudents);

// GET /api/students/purposes - Get available purposes for students
router.get('/purposes', [
  query('purposeCatId').optional().isInt({ min: 1 }).withMessage('PurposeCatId must be a positive integer')
], handleValidationErrors, StudentController.getStudentPurposes);

// GET /api/students/purpose-categories - Get purpose categories
router.get('/purpose-categories', [
], handleValidationErrors, StudentController.getPurposeCategories);

// GET /api/students/pending-checkin - Get students currently checked out (pending check-in)
router.get('/pending-checkin', [
], handleValidationErrors, StudentController.getPendingCheckin);

// GET /api/students - List students with pagination and search (kept for backward compatibility)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100000 }).withMessage('PageSize must be between 1 and 100000'),
  query('search').optional().isString().trim().withMessage('Search must be a string'),
  query('visitorSubCatId').optional().isInt().withMessage('VisitorSubCatId must be an integer'),
], handleValidationErrors, StudentController.getStudents);

// GET /api/students/:studentId/status - Get student's current status (first visit check)
router.get('/:studentId/status', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
], handleValidationErrors, StudentController.getStudentStatus);

// POST /api/students/:studentId/checkout - Checkout student with purpose support
router.post('/:studentId/checkout', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
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
], handleValidationErrors, StudentController.checkinStudent);

// GET /api/students/:studentId/history - Get student's visit history
router.get('/:studentId/history', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, StudentController.getStudentHistory);

// GET /api/students/export - Export students data
router.get('/export', [
  query('hostel').optional().isString().trim().withMessage('Hostel must be a string'),
  query('status').optional().isIn(['CHECKED_OUT', 'AVAILABLE']).withMessage('Invalid status'),
  query('fromDate').optional().isISO8601().withMessage('FromDate must be a valid date'),
  query('toDate').optional().isISO8601().withMessage('ToDate must be a valid date'),
  query('format').optional().isIn(['csv']).withMessage('Invalid format'),
], handleValidationErrors, StudentController.exportStudents);

// GET /api/students/template - Download CSV template
router.get('/template', handleValidationErrors, StudentController.downloadTemplate);

router.get('/pending-checkout', [
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
], handleValidationErrors, StudentController.updateStudentPurpose);

// DELETE /api/students/purposes/:purposeId - Delete purpose
router.delete('/purposes/:purposeId', [
  param('purposeId')
    .notEmpty()
    .withMessage('Purpose ID is required')
    .isNumeric()
    .withMessage('Purpose ID must be numeric'),
], handleValidationErrors, StudentController.deleteStudentPurpose);

// POST /api/students/meal-checkin - Meal check-in via QR code
router.post('/meal-checkin', [
  body('student_id').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('confirmed').optional().isBoolean().withMessage('Confirmed must be a boolean')
], handleValidationErrors, StudentController.mealCheckIn);

// GET /api/students/:studentId/meal-history - Get student's meal history
router.get('/:studentId/meal-history', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, StudentController.getStudentMealHistory);

// GET /api/students/meal-queue - Get current meal queue
router.get('/meal-queue', [
  query('mealType').optional().isIn(['breakfast', 'lunch', 'dinner']).withMessage('Meal type must be breakfast, lunch, or dinner')
], handleValidationErrors, StudentController.getCurrentMealQueue);

// GET /api/students/meal-statistics - Get meal statistics
router.get('/meal-statistics', [
  query('fromDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('FromDate must be in DD/MM/YYYY format'),
  query('toDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('ToDate must be in DD/MM/YYYY format')
], handleValidationErrors, StudentController.getMealStatistics);


// GET /api/students/visit-history - Get all student visit history
router.get('/visit-history', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  query('search').optional().isString().trim().withMessage('Search must be a string'),
  query('fromDate').optional().isInt().withMessage('FromDate must be valid epoch timestamp'),
  query('toDate').optional().isInt().withMessage('ToDate must be valid epoch timestamp'),
  query('visitorRegId').optional().isInt({ min: 1 }).withMessage('VisitorRegId must be a positive integer'),
], handleValidationErrors, StudentController.getAllStudentVisitHistory);

// GET /api/students/sub-categories - List of student's sub categories
router.get('/sub-categories', handleValidationErrors, StudentController.getStudentSubCategories);

// ===== QR CODE ROUTES FOR CHECK-IN/CHECK-OUT =====

// POST /api/students/:studentId/generate-qr - Generate QR code for student
router.post('/:studentId/generate-qr', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
], handleValidationErrors, StudentController.generateStudentQR);

// POST /api/students/scan-qr - Process QR code scan and return check-in/check-out status
router.post('/scan-qr', [
  body('qrData').notEmpty().withMessage('QR data is required'),
], handleValidationErrors, StudentController.processStudentQRScan);

// POST /api/students/qr-checkin - QR-based check-in for students
router.post('/qr-checkin', [
  body('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('tenantId').isInt({ min: 1 }).withMessage('Tenant ID must be a positive integer'),
], handleValidationErrors, StudentController.qrCheckinStudent);

// POST /api/students/qr-checkout - QR-based check-out for students
router.post('/qr-checkout', [
  body('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('tenantId').isInt({ min: 1 }).withMessage('Tenant ID must be a positive integer'),
  body('purposeId').optional().isInt().withMessage('PurposeId must be an integer'),
  body('purposeName').optional().isString().trim().withMessage('PurposeName must be a string'),
], handleValidationErrors, StudentController.qrCheckoutStudent);

// DELETE /api/students/:id - Delete student and all related data
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
], handleValidationErrors, StudentController.deleteStudent);

// ===== NEW MEAL REGISTRATION ROUTES (Phase 1) =====

// POST /api/students/:studentId/meal-register - Register student for meal
router.post('/:studentId/meal-register', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
  body('isSpecial').optional().isBoolean().withMessage('IsSpecial must be a boolean'),
  body('specialRemarks').optional().isString().trim().isLength({ max: 500 }).withMessage('Special remarks must be less than 500 characters')
], handleValidationErrors, StudentController.registerStudentForMeal);

// POST /api/students/meal-register-qr - Register for meal via QR code
router.post('/meal-register-qr', [
  body('qrData').notEmpty().withMessage('QR data is required'),
  body('isSpecial').optional().isBoolean().withMessage('IsSpecial must be a boolean'),
  body('specialRemarks').optional().isString().trim().isLength({ max: 500 }).withMessage('Special remarks must be less than 500 characters')
], handleValidationErrors, StudentController.registerMealViaQR);

// GET /api/students/:studentId/meal-registrations - Get student's meal registrations for today
router.get('/:studentId/meal-registrations', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer')
], handleValidationErrors, StudentController.getStudentMealRegistrations);

// GET /api/students/meal-registrations/:mealType - Get all registrations for a meal type
router.get('/meal-registrations/:mealType', [
  param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
], handleValidationErrors, StudentController.getMealRegistrations);

// GET /api/students/meal-registration-status/:mealType - Get registration status for a meal type
router.get('/meal-registration-status/:mealType', [
  param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner')
], handleValidationErrors, StudentController.getMealRegistrationStatus);

// PUT /api/students/meal-registration/:mealId - Update meal registration (special requests)
router.put('/meal-registration/:mealId', [
  param('mealId').isInt({ min: 1 }).withMessage('Meal ID must be a positive integer'),
  body('isSpecial').optional().isBoolean().withMessage('IsSpecial must be a boolean'),
  body('specialRemarks').optional().isString().trim().isLength({ max: 500 }).withMessage('Special remarks must be less than 500 characters')
], handleValidationErrors, StudentController.updateMealRegistration);

// DELETE /api/students/meal-registration/:mealId - Cancel meal registration
router.delete('/meal-registration/:mealId', [
  param('mealId').isInt({ min: 1 }).withMessage('Meal ID must be a positive integer')
], handleValidationErrors, StudentController.cancelMealRegistration);

// ===== NEW MEAL CONSUMPTION ROUTES (Phase 2) =====

// POST /api/students/meal-consume/:mealId - Consume meal
router.post('/meal-consume/:mealId', [
  param('mealId').isInt({ min: 1 }).withMessage('Meal ID must be a positive integer')
], handleValidationErrors, StudentController.consumeMeal);

// POST /api/students/meal-consume-qr - Consume meal via QR code
router.post('/meal-consume-qr', [
  body('qrData').notEmpty().withMessage('QR data is required')
], handleValidationErrors, StudentController.consumeMealViaQR);

// GET /api/students/meal-serving-status/:mealType - Get serving status for a meal type
router.get('/meal-serving-status/:mealType', [
  param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner')
], handleValidationErrors, StudentController.getMealServingStatus);

// GET /api/students/meal-queue/:mealType - Get meal queue with real-time status
router.get('/meal-queue/:mealType', [
  param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
], handleValidationErrors, StudentController.getMealQueue);

// GET /api/students/meal-pending/:mealType - Get pending meals for consumption
router.get('/meal-pending/:mealType', [
  param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
], handleValidationErrors, StudentController.getPendingMeals);

// GET /api/students/meal-consumed/:mealType - Get consumed meals
router.get('/meal-consumed/:mealType', [
  param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
], handleValidationErrors, StudentController.getConsumedMeals);

// POST /api/students/meal-validate-consumption - Validate meal consumption before consuming
router.post('/meal-validate-consumption', [
  body('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner')
], handleValidationErrors, StudentController.validateMealConsumption);

// ===== MEAL ANALYTICS AND HISTORY ROUTES =====

// GET /api/students/meal-analytics - Get comprehensive meal analytics
router.get('/meal-analytics', [
  query('fromDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('FromDate must be in DD/MM/YYYY format'),
  query('toDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('ToDate must be in DD/MM/YYYY format')
], handleValidationErrors, StudentController.getMealAnalytics);

// GET /api/students/meal-dashboard - Get today's meal dashboard data
router.get('/meal-dashboard', handleValidationErrors, StudentController.getMealDashboard);

// GET /api/students/meal-history-detailed - Get detailed meal history with registration and consumption data
router.get('/meal-history-detailed', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('PageSize must be between 1 and 100'),
  query('mealType').optional().isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
  query('fromDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('FromDate must be in DD/MM/YYYY format'),
  query('toDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('ToDate must be in DD/MM/YYYY format'),
  query('status').optional().isIn(['registered', 'consumed', 'cancelled']).withMessage('Status must be registered, consumed, or cancelled'),
  query('isSpecial').optional().isIn(['Y', 'N']).withMessage('IsSpecial must be Y or N')
], handleValidationErrors, StudentController.getDetailedMealHistory);

// GET /api/students/meal-waste-report - Get meal waste report
router.get('/meal-waste-report', [
  query('fromDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('FromDate must be in DD/MM/YYYY format'),
  query('toDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('ToDate must be in DD/MM/YYYY format'),
  query('mealType').optional().isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner')
], handleValidationErrors, StudentController.getMealWasteReport);

// ===== MEAL QR CODE GENERATION ROUTES =====

// POST /api/students/:studentId/generate-meal-qr - Generate meal QR code for student
router.post('/:studentId/generate-meal-qr', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
  body('qrType').optional().isIn(['unified', 'registration', 'consumption']).withMessage('QR type must be unified, registration, or consumption'),
  body('validHours').optional().isInt({ min: 1, max: 48 }).withMessage('Valid hours must be between 1 and 48')
], handleValidationErrors, StudentController.generateMealQR);

// POST /api/students/validate-meal-qr - Validate meal QR code
router.post('/validate-meal-qr', [
  body('qrData').notEmpty().withMessage('QR data is required')
], handleValidationErrors, StudentController.validateMealQR);

// GET /api/students/meal-window-status/:mealType - Get meal window status
router.get('/meal-window-status/:mealType', [
  param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner')
], handleValidationErrors, StudentController.getMealWindowStatus);

// ===== AUTOMATIC MEAL SYSTEM WITH OPT-OUT FUNCTIONALITY =====

// PUT /api/student/meal-opt-out - Student opts out of automatically registered meal
router.put('/meal-opt-out', [
  body('studentId').optional().isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
  body('mealDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
], handleValidationErrors, StudentController.mealOptOut);

// PUT /api/student/meal-opt-back-in - Student opts back in to previously opted-out meal
router.put('/meal-opt-back-in', [
  body('studentId').optional().isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
  body('mealDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
], handleValidationErrors, StudentController.mealOptBackIn);

// PUT /api/student/meal-preference - Student updates meal preference (veg/non-veg)
router.put('/meal-preference', [
  body('studentId').optional().isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
  body('mealPreference').isIn(['veg', 'non-veg']).withMessage('Meal preference must be veg or non-veg'),
  body('mealDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
], handleValidationErrors, StudentController.updateMealPreference);

// GET /api/student/meal-status - Get student's current meal registration status
router.get('/meal-status', [
  query('mealDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
], handleValidationErrors, StudentController.getStudentMealStatus);

module.exports = router;