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

// PUT /api/meal-settings - Update meal settings for the tenant
router.put('/', [
  body('lunchBookingStartTime')
    .notEmpty()
    .withMessage('Lunch booking start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Lunch booking start time must be in HH:MM format'),
  
  body('lunchBookingEndTime')
    .notEmpty()
    .withMessage('Lunch booking end time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Lunch booking end time must be in HH:MM format'),
  
  body('lunchStartTime')
    .notEmpty()
    .withMessage('Lunch start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Lunch start time must be in HH:MM format'),
  
  body('lunchEndTime')
    .notEmpty()
    .withMessage('Lunch end time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Lunch end time must be in HH:MM format'),
  
  body('dinnerBookingStartTime')
    .notEmpty()
    .withMessage('Dinner booking start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Dinner booking start time must be in HH:MM format'),
  
  body('dinnerBookingEndTime')
    .notEmpty()
    .withMessage('Dinner booking end time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Dinner booking end time must be in HH:MM format'),
  
  body('dinnerStartTime')
    .notEmpty()
    .withMessage('Dinner start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Dinner start time must be in HH:MM format'),
  
  body('dinnerEndTime')
    .notEmpty()
    .withMessage('Dinner end time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Dinner end time must be in HH:MM format'),

  // Custom validation for time logic
  body().custom((value) => {
    const {
      lunchBookingStartTime,
      lunchBookingEndTime,
      lunchStartTime,
      lunchEndTime,
      dinnerBookingStartTime,
      dinnerBookingEndTime,
      dinnerStartTime,
      dinnerEndTime
    } = value;

    // Helper function to convert time to minutes
    const timeToMinutes = (timeString) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Validate lunch times
    if (timeToMinutes(lunchBookingStartTime) >= timeToMinutes(lunchBookingEndTime)) {
      throw new Error('Lunch booking start time must be before lunch booking end time');
    }
    
    if (timeToMinutes(lunchStartTime) >= timeToMinutes(lunchEndTime)) {
      throw new Error('Lunch start time must be before lunch end time');
    }
    
    if (timeToMinutes(lunchBookingEndTime) > timeToMinutes(lunchStartTime)) {
      throw new Error('Lunch booking must end before lunch serving starts');
    }

    // Validate dinner times
    if (timeToMinutes(dinnerBookingStartTime) >= timeToMinutes(dinnerBookingEndTime)) {
      throw new Error('Dinner booking start time must be before dinner booking end time');
    }
    
    if (timeToMinutes(dinnerStartTime) >= timeToMinutes(dinnerEndTime)) {
      throw new Error('Dinner start time must be before dinner end time');
    }
    
    if (timeToMinutes(dinnerBookingEndTime) > timeToMinutes(dinnerStartTime)) {
      throw new Error('Dinner booking must end before dinner serving starts');
    }

    // Check overlap between lunch and dinner
    if (timeToMinutes(lunchEndTime) > timeToMinutes(dinnerBookingStartTime)) {
      throw new Error('Lunch serving should end before dinner booking starts');
    }

    return true;
  })
], handleValidationErrors, MealSettingsController.updateMealSettings);

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

module.exports = router;