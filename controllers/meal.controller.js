const MealModel = require('../models/meal.model');
const MealRegistrationService = require('../services/mealRegistration.service');
const MealConsumptionService = require('../services/mealConsumption.service');
const MealAutomaticRegistrationService = require('../services/mealAutomaticRegistration.service');
const MealOptOutService = require('../services/mealOptOut.service');
const ResponseFormatter = require('../utils/response');
const { body, param, query, validationResult } = require('express-validator');

class MealController {
  
  // ========================================================================
  // AUTO REGISTRATION ENDPOINTS (New Functionality)
  // ========================================================================

  // Manual trigger for automatic meal registration (for testing)
  static async triggerAutoRegistration(req, res) {
    try {
      console.log('=== DEBUG: triggerAutoRegistration called ===');
      console.log('req.user:', req.user);
      console.log('req.body:', req.body);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { mealType, mealDate } = req.body;
      const userId = req.user?.username || req.user?.userName || 'UNKNOWN';

      console.log(`Manual trigger auto registration: tenantId=${tenantId}, mealType=${mealType}, triggeredBy=${userId}`);
      console.log('About to call MealAutomaticRegistrationService.autoRegisterStudentsForMeals...');

      const result = await MealAutomaticRegistrationService.autoRegisterStudentsForMeals(
        tenantId,
        mealType,
        mealDate,
        userId
      );

      console.log('Service call result:', result);
      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in triggerAutoRegistration:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // Trigger auto registration for all tenants (admin only)
  static async triggerAutoRegistrationAllTenants(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const { mealType } = req.body;
      const userId = req.user?.username || req.user?.userName || 'UNKNOWN';

      console.log(`Trigger auto registration for all tenants: mealType=${mealType}, triggeredBy=${userId}`);

      const result = await MealAutomaticRegistrationService.triggerAllTenantsRegistration(mealType, userId);

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in triggerAutoRegistrationAllTenants:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // ========================================================================
  // MEAL OPT-OUT ENDPOINTS (New Functionality)  
  // ========================================================================

  // Allow student to opt-out of a meal
  static async optOutOfMeal(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { studentId, mealType, mealDate } = req.body;
      const userId = req.user?.username || req.user?.userName || 'UNKNOWN';

      console.log(`Opt-out request: studentId=${studentId}, mealType=${mealType}, optedOutBy=${userId}`);

      const result = await MealOptOutService.optOutOfMeal(
        tenantId,
        studentId,
        mealType,
        userId,
        mealDate
      );

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in optOutOfMeal:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // Allow student to opt back in
  static async optBackInForMeal(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { studentId, mealType, mealDate } = req.body;
      const userId = req.user?.username || req.user?.userName || 'UNKNOWN';

      console.log(`Opt back in request: studentId=${studentId}, mealType=${mealType}, registeredBy=${userId}`);

      const result = await MealOptOutService.optBackIn(
        tenantId,
        studentId,
        mealType,
        userId,
        mealDate
      );

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in optBackInForMeal:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // Update meal preference (veg/non-veg)
  static async updateMealPreference(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { studentId, mealType, mealPreference, mealDate } = req.body;
      const userId = req.user?.username || req.user?.userName || 'UNKNOWN';

      console.log(`Update meal preference: studentId=${studentId}, mealType=${mealType}, preference=${mealPreference}`);

      const result = await MealOptOutService.updateMealPreference(
        tenantId,
        studentId,
        mealType,
        mealPreference,
        userId,
        mealDate
      );

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in updateMealPreference:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // Get student's current meal status
  static async getStudentMealStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { studentId } = req.params;
      const { mealDate } = req.query;

      console.log(`Get student meal status: studentId=${studentId}, date=${mealDate || 'today'}`);

      const result = await MealOptOutService.getStudentMealStatus(
        tenantId,
        parseInt(studentId),
        mealDate
      );

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in getStudentMealStatus:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // Get opted-out summary for a meal
  static async getOptedOutSummary(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { mealType } = req.params;
      const { mealDate } = req.query;

      console.log(`Get opted-out summary: mealType=${mealType}, date=${mealDate || 'today'}`);

      const result = await MealOptOutService.getOptedOutSummary(
        tenantId,
        mealType,
        mealDate
      );

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in getOptedOutSummary:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // ========================================================================
  // EXISTING MEAL REGISTRATION ENDPOINTS (Phase 1)
  // ========================================================================

  // Register student for meal (manual registration - now less common)
  static async registerForMeal(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { studentId, mealType, isSpecial, specialRemarks } = req.body;
      const userId = req.user?.username || req.user?.userName || 'UNKNOWN';

      console.log(`Manual meal registration: studentId=${studentId}, mealType=${mealType}`);

      const result = await MealRegistrationService.registerStudentForMeal(
        studentId,
        tenantId,
        mealType,
        isSpecial || false,
        specialRemarks || '',
        userId
      );

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in registerForMeal:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // Register via QR code
  static async registerViaQR(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { qrData, isSpecial, specialRemarks } = req.body;
      const userId = req.user?.username || req.user?.userName || 'UNKNOWN';

      console.log(`QR meal registration: qrData=${JSON.stringify(qrData)}`);

      const result = await MealRegistrationService.registerViaQR(
        qrData,
        tenantId,
        isSpecial || false,
        specialRemarks || '',
        userId
      );

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in registerViaQR:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // Get registration status
  static async getRegistrationStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { mealType } = req.params;

      const result = await MealRegistrationService.getRegistrationStatus(tenantId, mealType);
      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in getRegistrationStatus:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // Get meal registrations
  static async getMealRegistrations(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { mealType } = req.params;
      const { mealDate } = req.query;

      const result = await MealRegistrationService.getMealRegistrations(tenantId, mealType, mealDate);
      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in getMealRegistrations:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // Update meal registration (special requests)
  static async updateRegistration(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { mealId } = req.params;
      const { isSpecial, specialRemarks } = req.body;
      const userId = req.user?.username || req.user?.userName || 'UNKNOWN';

      console.log(`Update meal registration: mealId=${mealId}, isSpecial=${isSpecial}`);

      const result = await MealRegistrationService.updateRegistration(
        tenantId,
        parseInt(mealId),
        { isSpecial, specialRemarks },
        userId
      );

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in updateRegistration:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // ========================================================================
  // EXISTING MEAL CONSUMPTION ENDPOINTS (Phase 2)
  // ========================================================================

  // Consume meal via QR
  static async consumeViaQR(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { qrData } = req.body;
      const userId = req.user?.username || req.user?.userName || 'UNKNOWN';

      console.log(`Consume meal via QR: qrData=${JSON.stringify(qrData)}`);

      const result = await MealConsumptionService.consumeViaQR(qrData, tenantId, userId);
      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in consumeViaQR:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // Get consumption status
  static async getConsumptionStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { mealType } = req.params;

      const result = await MealConsumptionService.getConsumptionStatus(tenantId, mealType);
      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in getConsumptionStatus:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // ========================================================================
  // ANALYTICS AND REPORTING
  // ========================================================================

  // Get meal analytics
  static async getMealAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { fromDate, toDate } = req.query;

      const analytics = await MealModel.getMealRegistrationAnalytics(tenantId, fromDate, toDate);

      return res.status(200).json(ResponseFormatter.success('Meal analytics retrieved', {
        dateRange: { fromDate, toDate },
        analytics
      }));

    } catch (error) {
      console.error('Error in getMealAnalytics:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // Get current meal queue
  static async getCurrentMealQueue(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(ResponseFormatter.error('Validation failed', errors.array()));
      }

      const tenantId = req.user?.tenantId;
      const { mealType } = req.params;
      const { mealDate } = req.query;

      const queue = await MealModel.getCurrentMealQueue(tenantId, mealType, mealDate);

      return res.status(200).json(ResponseFormatter.success('Current meal queue retrieved', {
        mealType,
        date: mealDate || new Date().toISOString().split('T')[0],
        queueLength: queue.length,
        queue
      }));

    } catch (error) {
      console.error('Error in getCurrentMealQueue:', error);
      return res.status(500).json(ResponseFormatter.error('Internal server error', error.message));
    }
  }

  // ========================================================================
  // VALIDATION RULES
  // ========================================================================

  static getValidationRules() {
    return {
      // Auto registration validations
      triggerAutoRegistration: [
        body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
        body('mealDate').optional().isISO8601().withMessage('Invalid date format')
      ],

      triggerAutoRegistrationAllTenants: [
        body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner')
      ],

      // Opt-out validations
      optOutOfMeal: [
        body('studentId').isInt({ min: 1 }).withMessage('Valid student ID is required'),
        body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
        body('mealDate').optional().isISO8601().withMessage('Invalid date format')
      ],

      optBackInForMeal: [
        body('studentId').isInt({ min: 1 }).withMessage('Valid student ID is required'),
        body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
        body('mealDate').optional().isISO8601().withMessage('Invalid date format')
      ],

      updateMealPreference: [
        body('studentId').isInt({ min: 1 }).withMessage('Valid student ID is required'),
        body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
        body('mealPreference').isIn(['veg', 'non-veg']).withMessage('Meal preference must be veg or non-veg'),
        body('mealDate').optional().isISO8601().withMessage('Invalid date format')
      ],

      getStudentMealStatus: [
        param('studentId').isInt({ min: 1 }).withMessage('Valid student ID is required'),
        query('mealDate').optional().isISO8601().withMessage('Invalid date format')
      ],

      getOptedOutSummary: [
        param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
        query('mealDate').optional().isISO8601().withMessage('Invalid date format')
      ],

      // Existing validations
      registerForMeal: [
        body('studentId').isInt({ min: 1 }).withMessage('Valid student ID is required'),
        body('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
        body('isSpecial').optional().isBoolean().withMessage('isSpecial must be a boolean'),
        body('specialRemarks').optional().isString().withMessage('Special remarks must be a string')
      ],

      registerViaQR: [
        body('qrData').isObject().withMessage('QR data must be an object'),
        body('qrData.student_id').exists().withMessage('Student ID is required in QR data'),
        body('qrData.meal_type').isIn(['lunch', 'dinner']).withMessage('Meal type in QR must be lunch or dinner'),
        body('isSpecial').optional().isBoolean().withMessage('isSpecial must be a boolean'),
        body('specialRemarks').optional().isString().withMessage('Special remarks must be a string')
      ],

      getRegistrationStatus: [
        param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner')
      ],

      getMealRegistrations: [
        param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
        query('mealDate').optional().isISO8601().withMessage('Invalid date format')
      ],

      updateRegistration: [
        param('mealId').isInt({ min: 1 }).withMessage('Valid meal ID is required'),
        body('isSpecial').optional().isBoolean().withMessage('isSpecial must be a boolean'),
        body('specialRemarks').optional().isString().withMessage('Special remarks must be a string')
      ],

      consumeViaQR: [
        body('qrData').isObject().withMessage('QR data must be an object'),
        body('qrData.student_id').exists().withMessage('Student ID is required in QR data'),
        body('qrData.meal_type').isIn(['lunch', 'dinner']).withMessage('Meal type in QR must be lunch or dinner')
      ],

      getConsumptionStatus: [
        param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner')
      ],

      getMealAnalytics: [
        query('fromDate').isISO8601().withMessage('Invalid from date format'),
        query('toDate').isISO8601().withMessage('Invalid to date format')
      ],

      getCurrentMealQueue: [
        param('mealType').isIn(['lunch', 'dinner']).withMessage('Meal type must be lunch or dinner'),
        query('mealDate').optional().isISO8601().withMessage('Invalid date format')
      ]
    };
  }
}

module.exports = MealController;