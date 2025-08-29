const express = require('express');
const router = express.Router();
const MealController = require('../controllers/meal.controller');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ========================================================================
// AUTO REGISTRATION ROUTES (New Functionality)
// ========================================================================

// POST /api/meals/auto-register - Manual trigger for automatic meal registration (for testing)
router.post('/auto-register', 
  MealController.getValidationRules().triggerAutoRegistration,
  MealController.triggerAutoRegistration
);

// POST /api/meals/auto-register/all-tenants - Trigger auto registration for all tenants (admin only)
router.post('/auto-register/all-tenants',
  MealController.getValidationRules().triggerAutoRegistrationAllTenants, 
  MealController.triggerAutoRegistrationAllTenants
);

// ========================================================================
// MEAL OPT-OUT ROUTES (New Functionality)
// ========================================================================

// PUT /api/meals/opt-out - Allow student to opt-out of a meal
router.put('/opt-out',
  MealController.getValidationRules().optOutOfMeal,
  MealController.optOutOfMeal
);

// PUT /api/meals/opt-back-in - Allow student to opt back in for a meal
router.put('/opt-back-in',
  MealController.getValidationRules().optBackInForMeal,
  MealController.optBackInForMeal
);

// PUT /api/meals/preference - Update meal preference (veg/non-veg)
router.put('/preference',
  MealController.getValidationRules().updateMealPreference,
  MealController.updateMealPreference
);

// GET /api/meals/student/:studentId/status - Get student's current meal status
router.get('/student/:studentId/status',
  MealController.getValidationRules().getStudentMealStatus,
  MealController.getStudentMealStatus
);

// GET /api/meals/:mealType/opted-out - Get opted-out summary for a meal
router.get('/:mealType/opted-out',
  MealController.getValidationRules().getOptedOutSummary,
  MealController.getOptedOutSummary
);

// ========================================================================
// MEAL REGISTRATION ROUTES (Phase 1 - Existing)
// ========================================================================

// POST /api/meals/register - Register student for meal (manual registration)
router.post('/register',
  MealController.getValidationRules().registerForMeal,
  MealController.registerForMeal
);

// POST /api/meals/register/qr - Register via QR code during booking window
router.post('/register/qr',
  MealController.getValidationRules().registerViaQR,
  MealController.registerViaQR
);

// GET /api/meals/:mealType/registration-status - Get registration status for a meal type
router.get('/:mealType/registration-status',
  MealController.getValidationRules().getRegistrationStatus,
  MealController.getRegistrationStatus
);

// GET /api/meals/:mealType/registrations - Get all registrations for a meal type
router.get('/:mealType/registrations',
  MealController.getValidationRules().getMealRegistrations,
  MealController.getMealRegistrations
);

// PUT /api/meals/registration/:mealId - Update meal registration (special requests)
router.put('/registration/:mealId',
  MealController.getValidationRules().updateRegistration,
  MealController.updateRegistration
);

// ========================================================================
// MEAL CONSUMPTION ROUTES (Phase 2 - Existing)
// ========================================================================

// POST /api/meals/consume/qr - Consume meal via QR code during serving window
router.post('/consume/qr',
  MealController.getValidationRules().consumeViaQR,
  MealController.consumeViaQR
);

// GET /api/meals/:mealType/consumption-status - Get consumption status for a meal type
router.get('/:mealType/consumption-status',
  MealController.getValidationRules().getConsumptionStatus,
  MealController.getConsumptionStatus
);

// ========================================================================
// ANALYTICS AND REPORTING ROUTES
// ========================================================================

// GET /api/meals/analytics - Get meal analytics for date range
router.get('/analytics',
  MealController.getValidationRules().getMealAnalytics,
  MealController.getMealAnalytics
);

// GET /api/meals/:mealType/queue - Get current meal queue (students waiting for meal)
router.get('/:mealType/queue',
  MealController.getValidationRules().getCurrentMealQueue,
  MealController.getCurrentMealQueue
);

// ========================================================================
// ADDITIONAL UTILITY ROUTES
// ========================================================================

// GET /api/meals/health - Health check for meal system
router.get('/health', (req, res) => {
  res.status(200).json({
    responseCode: 'S',
    responseMessage: 'Meal system is healthy',
    data: {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      features: [
        'Auto Registration',
        'Opt-out Functionality', 
        'Meal Preferences (Veg/Non-veg)',
        'QR-based Registration',
        'QR-based Consumption',
        'Real-time Analytics',
        'Queue Management'
      ]
    }
  });
});

// GET /api/meals/system/info - Get system information and current settings
router.get('/system/info', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const MealSettingsModel = require('../models/mealSettings.model.simple');
    
    const settings = await MealSettingsModel.getMealSettings(tenantId);
    
    res.status(200).json({
      responseCode: 'S',
      responseMessage: 'Meal system information retrieved',
      data: {
        tenantId,
        autoRegistrationEnabled: true,
        optOutEnabled: true,
        mealPreferencesEnabled: true,
        supportedMealTypes: ['lunch', 'dinner'],
        supportedPreferences: ['veg', 'non-veg'],
        statusWorkflow: ['registered', 'opted_out', 'consumed', 'cancelled'],
        currentSettings: settings || 'Not configured'
      }
    });
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({
      responseCode: 'E',
      responseMessage: 'Failed to get system information',
      data: { error: error.message }
    });
  }
});

module.exports = router;