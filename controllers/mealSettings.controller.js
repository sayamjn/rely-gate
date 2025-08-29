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
          responseMessage: "Tenant ID is required",
        });
      }

      const result = await MealSettingsService.getMealSettings(tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error in getMealSettings controller:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/meal-settings - Update enhanced meal settings for the tenant
  static async updateMealSettings(req, res) {
    try {
      const tenantId = req.user?.tenantId;
      const updatedBy = req.user?.UserName || req.user?.Username || "UNKNOWN";

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Tenant ID is required",
        });
      }

      // Validate time format for any provided time fields
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const timeFields = Object.keys(req.body).filter(
        (key) =>
          key.includes("BookingStart") ||
          key.includes("BookingEnd") ||
          key.includes("Start") ||
          key.includes("End")
      );

      const invalidTimeFields = timeFields.filter(
        (field) => req.body[field] && !timeRegex.test(req.body[field])
      );

      if (invalidTimeFields.length > 0) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: `Invalid time format for fields: ${invalidTimeFields.join(
            ", "
          )}. Use HH:MM format`,
        });
      }

      const result = await MealSettingsService.updateMealSettings(
        tenantId,
        req.body,
        updatedBy
      );
      res.json(result);
    } catch (error) {
      console.error("Error in updateMealSettings controller:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          responseMessage: "Tenant ID is required",
        });
      }

      const result = await MealSettingsService.getCurrentMealStatus(tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error in getCurrentMealStatus controller:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          responseMessage: "Tenant ID is required",
        });
      }

      if (!actionType || !mealType) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "actionType and mealType are required",
        });
      }

      if (!["booking", "checkin"].includes(actionType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'actionType must be either "booking" or "checkin"',
        });
      }

      if (!["lunch", "dinner"].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'mealType must be either "lunch" or "dinner"',
        });
      }

      const result = await MealSettingsService.validateMealAction(
        tenantId,
        actionType,
        mealType
      );
      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Meal action validation completed",
        data: result,
      });
    } catch (error) {
      console.error("Error in validateMealAction controller:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
        dinnerEndTime: "21:00",
      };

      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Default meal settings retrieved",
        data: defaultSettings,
      });
    } catch (error) {
      console.error("Error in getDefaultMealSettings controller:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/meal-settings/reset - Reset to default enhanced settings
  static async resetToDefaultSettings(req, res) {
    try {
      const tenantId = req.user?.tenantId;
      const updatedBy =
        req.user?.UserName || req.user?.Username || "RESET_ACTION";

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Tenant ID is required",
        });
      }

      // Create default settings for all days
      const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const defaultSettings = {};

      days.forEach((day) => {
        // Enable all meals by default
        defaultSettings[`lunchEnabled${day}`] = true;
        defaultSettings[`dinnerEnabled${day}`] = true;

        // Set default times
        defaultSettings[`lunchBookingStart${day}`] = "10:00";
        defaultSettings[`lunchBookingEnd${day}`] = "12:00";
        defaultSettings[`lunchStart${day}`] = "13:00";
        defaultSettings[`lunchEnd${day}`] = "15:00";
        defaultSettings[`dinnerBookingStart${day}`] = "16:00";
        defaultSettings[`dinnerBookingEnd${day}`] = "18:00";
        defaultSettings[`dinnerStart${day}`] = "19:00";
        defaultSettings[`dinnerEnd${day}`] = "21:00";
      });

      const result = await MealSettingsService.updateMealSettings(
        tenantId,
        defaultSettings,
        updatedBy
      );
      res.json(result);
    } catch (error) {
      console.error("Error in resetToDefaultSettings controller:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/meal-settings/day/:dayName - Get meal settings for a specific day
  static async getMealSettingsForDay(req, res) {
    try {
      const tenantId = req.user?.tenantId;
      const { dayName } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Tenant ID is required",
        });
      }

      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const capitalizedDay =
        dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();

      if (!validDays.includes(capitalizedDay)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage:
            "Invalid day name. Use Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday",
        });
      }

      const result = await MealSettingsService.getMealSettingsForDay(
        tenantId,
        capitalizedDay
      );
      res.json(result);
    } catch (error) {
      console.error("Error in getMealSettingsForDay controller:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/meal-settings/weekly - Get weekly meal schedule
  static async getWeeklyMealSchedule(req, res) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Tenant ID is required",
        });
      }

      const result = await MealSettingsService.getWeeklyMealSchedule(tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error in getWeeklyMealSchedule controller:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/meal-settings/day/:dayName - Update meal settings for a specific day
  static async updateMealSettingsForDay(req, res) {
    try {
      const tenantId = req.user?.tenantId;
      const updatedBy = req.user?.UserName || req.user?.Username || "UNKNOWN";
      const { dayName } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Tenant ID is required",
        });
      }

      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const capitalizedDay =
        dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();

      if (!validDays.includes(capitalizedDay)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage:
            "Invalid day name. Use Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday",
        });
      }

      // Transform request body to include day suffix
      const daySpecificSettings = {};
      const { lunch, dinner } = req.body;

      if (lunch) {
        if (lunch.enabled !== undefined) {
          daySpecificSettings[`lunchEnabled${capitalizedDay}`] = lunch.enabled;
        }
        if (lunch.bookingTime) {
          if (lunch.bookingTime.start)
            daySpecificSettings[`lunchBookingStart${capitalizedDay}`] =
              lunch.bookingTime.start;
          if (lunch.bookingTime.end)
            daySpecificSettings[`lunchBookingEnd${capitalizedDay}`] =
              lunch.bookingTime.end;
        }
        if (lunch.mealTime) {
          if (lunch.mealTime.start)
            daySpecificSettings[`lunchStart${capitalizedDay}`] =
              lunch.mealTime.start;
          if (lunch.mealTime.end)
            daySpecificSettings[`lunchEnd${capitalizedDay}`] =
              lunch.mealTime.end;
        }
      }

      if (dinner) {
        if (dinner.enabled !== undefined) {
          daySpecificSettings[`dinnerEnabled${capitalizedDay}`] =
            dinner.enabled;
        }
        if (dinner.bookingTime) {
          if (dinner.bookingTime.start)
            daySpecificSettings[`dinnerBookingStart${capitalizedDay}`] =
              dinner.bookingTime.start;
          if (dinner.bookingTime.end)
            daySpecificSettings[`dinnerBookingEnd${capitalizedDay}`] =
              dinner.bookingTime.end;
        }
        if (dinner.mealTime) {
          if (dinner.mealTime.start)
            daySpecificSettings[`dinnerStart${capitalizedDay}`] =
              dinner.mealTime.start;
          if (dinner.mealTime.end)
            daySpecificSettings[`dinnerEnd${capitalizedDay}`] =
              dinner.mealTime.end;
        }
      }

      const result = await MealSettingsService.updateMealSettings(
        tenantId,
        daySpecificSettings,
        updatedBy
      );
      res.json(result);
    } catch (error) {
      console.error("Error in updateMealSettingsForDay controller:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = MealSettingsController;
