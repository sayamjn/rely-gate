const MealSettingsService = require("../services/mealSettings.service");
const responseUtils = require("../utils/constants");

class MealSettingsController {
  
  // GET /api/meal-settings - Get meal settings for the tenant
  static async getMealSettings(req, res) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant ID is required'
        });
      }

      const result = await MealSettingsService.getMealSettings(tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getMealSettings controller:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PUT /api/meal-settings - Update meal settings for the tenant
  static async updateMealSettings(req, res) {
    try {
      const tenantId = req.user?.tenantId;
      const updatedBy = req.user?.UserName || req.user?.Username || 'UNKNOWN';

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant ID is required'
        });
      }

      const {
        lunchBookingStartTime,
        lunchBookingEndTime,
        lunchStartTime,
        lunchEndTime,
        dinnerBookingStartTime,
        dinnerBookingEndTime,
        dinnerStartTime,
        dinnerEndTime
      } = req.body;

      // Validate required fields
      const requiredFields = [
        'lunchBookingStartTime', 'lunchBookingEndTime', 'lunchStartTime', 'lunchEndTime',
        'dinnerBookingStartTime', 'dinnerBookingEndTime', 'dinnerStartTime', 'dinnerEndTime'
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const invalidTimeFields = requiredFields.filter(field => !timeRegex.test(req.body[field]));
      if (invalidTimeFields.length > 0) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: `Invalid time format for fields: ${invalidTimeFields.join(', ')}. Use HH:MM format`
        });
      }

      const settingsData = {
        lunchBookingStartTime,
        lunchBookingEndTime,
        lunchStartTime,
        lunchEndTime,
        dinnerBookingStartTime,
        dinnerBookingEndTime,
        dinnerStartTime,
        dinnerEndTime
      };

      const result = await MealSettingsService.updateMealSettings(tenantId, settingsData, updatedBy);
      res.json(result);
    } catch (error) {
      console.error('Error in updateMealSettings controller:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/meal-settings/status - Get current meal status
  static async getCurrentMealStatus(req, res) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant ID is required'
        });
      }

      const result = await MealSettingsService.getCurrentMealStatus(tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getCurrentMealStatus controller:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/meal-settings/validate - Validate meal action
  static async validateMealAction(req, res) {
    try {
      const tenantId = req.user?.tenantId;
      const { actionType, mealType } = req.body;

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant ID is required'
        });
      }

      if (!actionType || !mealType) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'actionType and mealType are required'
        });
      }

      if (!['booking', 'checkin'].includes(actionType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'actionType must be either "booking" or "checkin"'
        });
      }

      if (!['lunch', 'dinner'].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'mealType must be either "lunch" or "dinner"'
        });
      }

      const result = await MealSettingsService.validateMealAction(tenantId, actionType, mealType);
      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Meal action validation completed',
        data: result
      });
    } catch (error) {
      console.error('Error in validateMealAction controller:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/meal-settings/default - Get default meal settings (for reference)
  static async getDefaultMealSettings(req, res) {
    try {
      const defaultSettings = {
        lunchBookingStartTime: "10:00",
        lunchBookingEndTime: "12:00",
        lunchStartTime: "13:00",
        lunchEndTime: "15:00",
        dinnerBookingStartTime: "16:00",
        dinnerBookingEndTime: "18:00",
        dinnerStartTime: "19:00",
        dinnerEndTime: "21:00"
      };

      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Default meal settings retrieved',
        data: defaultSettings
      });
    } catch (error) {
      console.error('Error in getDefaultMealSettings controller:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/meal-settings/reset - Reset to default settings
  static async resetToDefaultSettings(req, res) {
    try {
      const tenantId = req.user?.tenantId;
      const updatedBy = req.user?.UserName || req.user?.Username || 'RESET_ACTION';

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant ID is required'
        });
      }

      const defaultSettings = {
        lunchBookingStartTime: "10:00",
        lunchBookingEndTime: "12:00",
        lunchStartTime: "13:00",
        lunchEndTime: "15:00",
        dinnerBookingStartTime: "16:00",
        dinnerBookingEndTime: "18:00",
        dinnerStartTime: "19:00",
        dinnerEndTime: "21:00"
      };

      const result = await MealSettingsService.updateMealSettings(tenantId, defaultSettings, updatedBy);
      res.json(result);
    } catch (error) {
      console.error('Error in resetToDefaultSettings controller:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = MealSettingsController;