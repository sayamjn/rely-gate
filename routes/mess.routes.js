const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const MessController = require('../controllers/mess.controller');
const { handleValidationErrors } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// ================================================================================
// MESS INCHARGE ROUTES
// ================================================================================

// Apply authentication to all mess routes
router.use(authenticateToken);

// ===== MENU MANAGEMENT =====

// GET /api/mess/menu - Get menu for specific date and meal type
router.get('/menu', [
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  query('mealType').optional().isIn(['breakfast', 'lunch', 'dinner']).withMessage('Meal type must be breakfast, lunch, or dinner')
], handleValidationErrors, MessController.getMenu);

// GET /api/mess/menu/week - Get menu for entire week
router.get('/menu/week', [
  query('startDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Start date must be in YYYY-MM-DD format')
], handleValidationErrors, MessController.getWeeklyMenu);

// POST /api/mess/menu - Create/Update menu for specific date and meal type
router.post('/menu', [
  body('menuDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Menu date must be in YYYY-MM-DD format'),
  body('mealType').isIn(['breakfast', 'lunch', 'dinner']).withMessage('Meal type must be breakfast, lunch, or dinner'),
  body('menuItems').notEmpty().withMessage('Menu items are required'),
  body('menuDescription').optional().isString().trim(),
  body('isVegetarian').optional().isBoolean().withMessage('isVegetarian must be a boolean'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean')
], handleValidationErrors, MessController.createOrUpdateMenu);

// PUT /api/mess/menu/:menuId - Update specific menu
router.put('/menu/:menuId', [
  param('menuId').isInt({ min: 1 }).withMessage('Menu ID must be a positive integer'),
  body('menuItems').optional().notEmpty().withMessage('Menu items cannot be empty'),
  body('menuDescription').optional().isString().trim(),
  body('isVegetarian').optional().isBoolean().withMessage('isVegetarian must be a boolean'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean')
], handleValidationErrors, MessController.updateMenu);

// DELETE /api/mess/menu/:menuId - Delete menu
router.delete('/menu/:menuId', [
  param('menuId').isInt({ min: 1 }).withMessage('Menu ID must be a positive integer')
], handleValidationErrors, MessController.deleteMenu);

// ===== MEAL REGISTRATION MANAGEMENT =====

// GET /api/mess/meal/list - Get list of students who opted for meal
router.get('/meal/list', [
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  query('mealType').optional().isIn(['breakfast', 'lunch', 'dinner']).withMessage('Meal type must be breakfast, lunch, or dinner')
], handleValidationErrors, MessController.getMealRegistrationsList);

// GET /api/mess/meal/status/:studentId - Check student's meal registration status
router.get('/meal/status/:studentId', [
  param('studentId').isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
], handleValidationErrors, MessController.getStudentMealStatus);

// ===== SPECIAL MEAL REQUESTS =====

// GET /api/mess/meal/special-requests - Get all special meal requests
router.get('/meal/special-requests', [
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  query('mealType').optional().isIn(['breakfast', 'lunch', 'dinner']).withMessage('Meal type must be breakfast, lunch, or dinner'),
  query('status').optional().isIn(['pending', 'approved', 'fulfilled']).withMessage('Status must be pending, approved, or fulfilled')
], handleValidationErrors, MessController.getSpecialMealRequests);

// PUT /api/mess/meal/special-request/:mealId - Update special meal request status
router.put('/meal/special-request/:mealId', [
  param('mealId').isInt({ min: 1 }).withMessage('Meal ID must be a positive integer'),
  body('specialRemarks').optional().isString().trim(),
  body('status').optional().isIn(['pending', 'approved', 'fulfilled']).withMessage('Status must be pending, approved, or fulfilled'),
  body('fulfillmentNotes').optional().isString().trim()
], handleValidationErrors, MessController.updateSpecialMealRequest);

// ===== MEAL CONSUMPTION TRACKING =====

// GET /api/mess/meal/consumption - Get meal consumption details
router.get('/meal/consumption', [
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  query('mealType').optional().isIn(['breakfast', 'lunch', 'dinner']).withMessage('Meal type must be breakfast, lunch, or dinner')
], handleValidationErrors, MessController.getMealConsumption);

// POST /api/mess/meal/mark-consumption/:mealId - Mark meal as consumed (mess staff action)
router.post('/meal/mark-consumption/:mealId', [
  param('mealId').isInt({ min: 1 }).withMessage('Meal ID must be a positive integer'),
  body('consumedBy').optional().isString().trim().withMessage('Consumed by field must be a string'),
  body('notes').optional().isString().trim().withMessage('Notes must be a string')
], handleValidationErrors, MessController.markMealConsumption);

// ===== DASHBOARD AND ANALYTICS =====

// GET /api/mess/dashboard - Get mess dashboard data
router.get('/dashboard', [
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
], handleValidationErrors, MessController.getMessDashboard);

// GET /api/mess/analytics - Get mess analytics
router.get('/analytics', [
  query('fromDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('From date must be in YYYY-MM-DD format'),
  query('toDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('To date must be in YYYY-MM-DD format')
], handleValidationErrors, MessController.getMessAnalytics);

module.exports = router;