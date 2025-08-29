const express = require('express');
const { body, validationResult } = require('express-validator');
const MealSettingsController = require('../controllers/mealSettings.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Test endpoint without authentication
router.get('/test', (req, res) => {
  res.json({
    responseCode: 'S',
    responseMessage: 'MealSettings routes are working',
    timestamp: new Date().toISOString()
  });
});

// Apply authentication to all other routes
router.use(authenticateToken);

// GET /api/meal-settings - Get meal settings for the tenant
router.get('/', MealSettingsController.getMealSettings);

// PUT /api/meal-settings - Update enhanced meal settings for the tenant
router.put('/', MealSettingsController.updateMealSettings);

// GET /api/meal-settings/status - Get current meal status
router.get('/status', MealSettingsController.getCurrentMealStatus);

// POST /api/meal-settings/validate - Validate meal action
router.post('/validate', [
  body('actionType')
    .notEmpty()
    .withMessage('Action type is required')
    .isIn(['booking', 'checkin'])
    .withMessage('Action type must be either "booking" or "checkin"'),
  
  body('mealType')
    .notEmpty()
    .withMessage('Meal type is required')
    .isIn(['lunch', 'dinner'])
    .withMessage('Meal type must be either "lunch" or "dinner"')
], handleValidationErrors, MealSettingsController.validateMealAction);

// GET /api/meal-settings/default - Get default meal settings
router.get('/default', MealSettingsController.getDefaultMealSettings);

// POST /api/meal-settings/reset - Reset to default settings
router.post('/reset', MealSettingsController.resetToDefaultSettings);

// GET /api/meal-settings/weekly - Get weekly meal schedule
router.get('/weekly', MealSettingsController.getWeeklyMealSchedule);

// GET /api/meal-settings/day/:dayName - Get meal settings for a specific day
router.get('/day/:dayName', MealSettingsController.getMealSettingsForDay);

// PUT /api/meal-settings/day/:dayName - Update meal settings for a specific day
router.put('/day/:dayName', [
  body('lunch.bookingTime.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Lunch booking start time must be in HH:MM format'),
  
  body('lunch.bookingTime.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Lunch booking end time must be in HH:MM format'),
  
  body('lunch.mealTime.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Lunch meal start time must be in HH:MM format'),
  
  body('lunch.mealTime.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Lunch meal end time must be in HH:MM format'),
  
  body('dinner.bookingTime.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Dinner booking start time must be in HH:MM format'),
  
  body('dinner.bookingTime.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Dinner booking end time must be in HH:MM format'),
  
  body('dinner.mealTime.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Dinner meal start time must be in HH:MM format'),
  
  body('dinner.mealTime.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Dinner meal end time must be in HH:MM format'),
  
  body('lunch.enabled')
    .optional()
    .isBoolean()
    .withMessage('Lunch enabled must be a boolean value'),
  
  body('dinner.enabled')
    .optional()
    .isBoolean()
    .withMessage('Dinner enabled must be a boolean value')
], handleValidationErrors, MealSettingsController.updateMealSettingsForDay);

module.exports = router;