const MealSettingsModel = require("../models/mealSettings.model");
const responseUtils = require("../utils/constants");

class MealSettingsService {
  
  // Get meal settings for a tenant
  static async getMealSettings(tenantId) {
    try {
      let settings = await MealSettingsModel.getMealSettings(tenantId);
      
      // If no settings found, create default settings
      if (!settings) {
        settings = await MealSettingsModel.createDefaultMealSettings(tenantId, 'AUTO_GENERATED');
      }

      // Format times for display (remove seconds if present)
      const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5); // Get HH:MM part only
      };

      const formattedSettings = {
        ...settings,
        lunchBookingStartTime: formatTime(settings.lunchBookingStartTime),
        lunchBookingEndTime: formatTime(settings.lunchBookingEndTime),
        lunchStartTime: formatTime(settings.lunchStartTime),
        lunchEndTime: formatTime(settings.lunchEndTime),
        dinnerBookingStartTime: formatTime(settings.dinnerBookingStartTime),
        dinnerBookingEndTime: formatTime(settings.dinnerBookingEndTime),
        dinnerStartTime: formatTime(settings.dinnerStartTime),
        dinnerEndTime: formatTime(settings.dinnerEndTime)
      };

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Meal settings retrieved successfully",
        data: formattedSettings
      };
    } catch (error) {
      console.error('Error in getMealSettings service:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Error retrieving meal settings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Update meal settings for a tenant
  static async updateMealSettings(tenantId, settingsData, updatedBy) {
    try {
      // Validate input data
      const requiredFields = [
        'lunchBookingStartTime', 'lunchBookingEndTime', 'lunchStartTime', 'lunchEndTime',
        'dinnerBookingStartTime', 'dinnerBookingEndTime', 'dinnerStartTime', 'dinnerEndTime'
      ];

      const missingFields = requiredFields.filter(field => !settingsData[field]);
      if (missingFields.length > 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: `Missing required fields: ${missingFields.join(', ')}`
        };
      }

      // Validate meal times logic
      const validation = MealSettingsModel.validateMealTimes(settingsData);
      if (!validation.isValid) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid time configuration',
          errors: validation.errors
        };
      }

      // Ensure settings exist for the tenant
      await MealSettingsModel.getOrCreateMealSettings(tenantId, updatedBy);

      // Normalize time format (add seconds if not present)
      const normalizedSettings = {};
      requiredFields.forEach(field => {
        const timeValue = settingsData[field];
        // Add :00 seconds if not present
        normalizedSettings[field] = timeValue.includes(':') && timeValue.split(':').length === 2 
          ? `${timeValue}:00` 
          : timeValue;
      });

      // Update settings
      const updatedSettings = await MealSettingsModel.updateMealSettings(
        tenantId, 
        normalizedSettings, 
        updatedBy
      );

      if (!updatedSettings) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Failed to update meal settings'
        };
      }

      // Format response (remove seconds for display)
      const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5);
      };

      const formattedResponse = {
        ...updatedSettings,
        lunchBookingStartTime: formatTime(updatedSettings.lunchBookingStartTime),
        lunchBookingEndTime: formatTime(updatedSettings.lunchBookingEndTime),
        lunchStartTime: formatTime(updatedSettings.lunchStartTime),
        lunchEndTime: formatTime(updatedSettings.lunchEndTime),
        dinnerBookingStartTime: formatTime(updatedSettings.dinnerBookingStartTime),
        dinnerBookingEndTime: formatTime(updatedSettings.dinnerBookingEndTime),
        dinnerStartTime: formatTime(updatedSettings.dinnerStartTime),
        dinnerEndTime: formatTime(updatedSettings.dinnerEndTime)
      };

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Meal settings updated successfully",
        data: formattedResponse
      };
    } catch (error) {
      console.error('Error in updateMealSettings service:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Error updating meal settings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get current meal status based on settings
  static async getCurrentMealStatus(tenantId) {
    try {
      const settings = await MealSettingsModel.getMealSettings(tenantId);
      
      if (!settings) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Meal settings not found for tenant'
        };
      }

      const currentMealType = await MealSettingsModel.getCurrentMealType(tenantId);
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      let status = {
        currentTime,
        currentMealType,
        isMealTime: !!currentMealType,
        isLunchBookingOpen: await MealSettingsModel.isBookingAllowed(tenantId, 'lunch'),
        isDinnerBookingOpen: await MealSettingsModel.isBookingAllowed(tenantId, 'dinner'),
        nextMealInfo: null
      };

      // Determine next meal
      const currentMinutes = MealSettingsModel.timeToMinutes(currentTime + ':00');
      const lunchStart = MealSettingsModel.timeToMinutes(settings.lunchStartTime);
      const dinnerStart = MealSettingsModel.timeToMinutes(settings.dinnerStartTime);

      if (currentMinutes < lunchStart) {
        status.nextMealInfo = {
          mealType: 'lunch',
          startTime: settings.lunchStartTime.substring(0, 5),
          bookingStartTime: settings.lunchBookingStartTime.substring(0, 5),
          bookingEndTime: settings.lunchBookingEndTime.substring(0, 5)
        };
      } else if (currentMinutes < dinnerStart) {
        status.nextMealInfo = {
          mealType: 'dinner',
          startTime: settings.dinnerStartTime.substring(0, 5),
          bookingStartTime: settings.dinnerBookingStartTime.substring(0, 5),
          bookingEndTime: settings.dinnerBookingEndTime.substring(0, 5)
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Meal status retrieved successfully",
        data: status
      };
    } catch (error) {
      console.error('Error in getCurrentMealStatus service:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Error retrieving meal status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Validate if action is allowed based on current time and settings
  static async validateMealAction(tenantId, actionType, mealType) {
    try {
      const settings = await MealSettingsModel.getMealSettings(tenantId);
      
      if (!settings) {
        return {
          isAllowed: false,
          message: 'Meal settings not configured for this tenant'
        };
      }

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
      const currentMinutes = MealSettingsModel.timeToMinutes(currentTime);

      if (actionType === 'booking') {
        const isAllowed = await MealSettingsModel.isBookingAllowed(tenantId, mealType);
        return {
          isAllowed,
          message: isAllowed ? 
            `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} booking is currently open` :
            `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} booking is not available at this time`
        };
      }

      if (actionType === 'checkin') {
        const currentMealType = await MealSettingsModel.getCurrentMealType(tenantId);
        const isAllowed = currentMealType === mealType;
        return {
          isAllowed,
          message: isAllowed ?
            `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} check-in is currently allowed` :
            `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} check-in is not available at this time`
        };
      }

      return {
        isAllowed: false,
        message: 'Invalid action type'
      };
    } catch (error) {
      console.error('Error in validateMealAction service:', error);
      return {
        isAllowed: false,
        message: 'Error validating meal action'
      };
    }
  }
}

module.exports = MealSettingsService;