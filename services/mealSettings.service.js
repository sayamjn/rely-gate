const MealSettingsModel = require("../models/mealSettings.model");
const responseUtils = require("../utils/constants");

class MealSettingsService {
  // Get enhanced meal settings for a tenant
  static async getMealSettings(tenantId) {
    try {
      let settings = await MealSettingsModel.getMealSettings(tenantId);

      // If no enhanced settings found, create default settings
      if (!settings) {
        settings = await MealSettingsModel.createDefaultMealSettings(
          tenantId,
          "AUTO_GENERATED"
        );
      }

      // Format times for display (remove seconds if present)
      const formatTime = (timeString) => {
        if (!timeString) return "";
        return timeString.substring(0, 5); // Get HH:MM part only
      };

      // Format all time fields for each day (modify in place)
      const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      days.forEach((day) => {
        if (settings[`lunchBookingStart${day}`]) {
          settings[`lunchBookingStart${day}`] = formatTime(
            settings[`lunchBookingStart${day}`]
          );
        }
        if (settings[`lunchBookingEnd${day}`]) {
          settings[`lunchBookingEnd${day}`] = formatTime(
            settings[`lunchBookingEnd${day}`]
          );
        }
        if (settings[`lunchStart${day}`]) {
          settings[`lunchStart${day}`] = formatTime(
            settings[`lunchStart${day}`]
          );
        }
        if (settings[`lunchEnd${day}`]) {
          settings[`lunchEnd${day}`] = formatTime(settings[`lunchEnd${day}`]);
        }
        if (settings[`dinnerBookingStart${day}`]) {
          settings[`dinnerBookingStart${day}`] = formatTime(
            settings[`dinnerBookingStart${day}`]
          );
        }
        if (settings[`dinnerBookingEnd${day}`]) {
          settings[`dinnerBookingEnd${day}`] = formatTime(
            settings[`dinnerBookingEnd${day}`]
          );
        }
        if (settings[`dinnerStart${day}`]) {
          settings[`dinnerStart${day}`] = formatTime(
            settings[`dinnerStart${day}`]
          );
        }
        if (settings[`dinnerEnd${day}`]) {
          settings[`dinnerEnd${day}`] = formatTime(settings[`dinnerEnd${day}`]);
        }
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Enhanced meal settings retrieved successfully",
        data: settings,
      };
    } catch (error) {
      console.error("Error in getMealSettings service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Error retrieving meal settings",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Update enhanced meal settings for a tenant
  static async updateMealSettings(tenantId, settingsData, updatedBy) {
    try {
      // Validate day-wise meal settings
      const validation =
        MealSettingsModel.validateDayWiseMealSettings(settingsData);
      if (!validation.isValid) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid meal settings configuration",
          errors: validation.errors,
        };
      }

      // Ensure settings exist for the tenant
      await MealSettingsModel.getOrCreateMealSettings(tenantId, updatedBy);

      // Normalize time format (add seconds if not present)
      const normalizedSettings = {};
      const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      days.forEach((day) => {
        // Copy enable/disable flags
        if (settingsData[`lunchEnabled${day}`] !== undefined) {
          normalizedSettings[`lunchEnabled${day}`] =
            settingsData[`lunchEnabled${day}`];
        }
        if (settingsData[`dinnerEnabled${day}`] !== undefined) {
          normalizedSettings[`dinnerEnabled${day}`] =
            settingsData[`dinnerEnabled${day}`];
        }

        // Normalize time fields
        const timeFields = [
          `lunchBookingStart${day}`,
          `lunchBookingEnd${day}`,
          `lunchStart${day}`,
          `lunchEnd${day}`,
          `dinnerBookingStart${day}`,
          `dinnerBookingEnd${day}`,
          `dinnerStart${day}`,
          `dinnerEnd${day}`,
        ];

        timeFields.forEach((field) => {
          if (settingsData[field]) {
            const timeValue = settingsData[field];
            // Add :00 seconds if not present
            normalizedSettings[field] =
              timeValue.includes(":") && timeValue.split(":").length === 2
                ? `${timeValue}:00`
                : timeValue;
          }
        });
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
          responseMessage: "Failed to update meal settings",
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Enhanced meal settings updated successfully",
        data: updatedSettings,
      };
    } catch (error) {
      console.error("Error in updateMealSettings service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Error updating meal settings",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          responseMessage: "Meal settings not found for tenant",
        };
      }

      const currentMealType = await MealSettingsModel.getCurrentMealType(
        tenantId
      );
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

      let status = {
        currentTime,
        currentMealType,
        isMealTime: !!currentMealType,
        isLunchBookingOpen: await MealSettingsModel.isBookingAllowed(
          tenantId,
          "lunch"
        ),
        isDinnerBookingOpen: await MealSettingsModel.isBookingAllowed(
          tenantId,
          "dinner"
        ),
        nextMealInfo: null,
      };

      // Determine next meal
      const currentMinutes = MealSettingsModel.timeToMinutes(
        currentTime + ":00"
      );
      const lunchStart = MealSettingsModel.timeToMinutes(
        settings.lunchStartTime
      );
      const dinnerStart = MealSettingsModel.timeToMinutes(
        settings.dinnerStartTime
      );

      if (currentMinutes < lunchStart) {
        status.nextMealInfo = {
          mealType: "lunch",
          startTime: settings.lunchStartTime.substring(0, 5),
          bookingStartTime: settings.lunchBookingStartTime.substring(0, 5),
          bookingEndTime: settings.lunchBookingEndTime.substring(0, 5),
        };
      } else if (currentMinutes < dinnerStart) {
        status.nextMealInfo = {
          mealType: "dinner",
          startTime: settings.dinnerStartTime.substring(0, 5),
          bookingStartTime: settings.dinnerBookingStartTime.substring(0, 5),
          bookingEndTime: settings.dinnerBookingEndTime.substring(0, 5),
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Meal status retrieved successfully",
        data: status,
      };
    } catch (error) {
      console.error("Error in getCurrentMealStatus service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Error retrieving meal status",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Validate if action is allowed based on current time and enhanced settings
  static async validateMealAction(tenantId, actionType, mealType) {
    try {
      const settings = await MealSettingsModel.getMealSettings(tenantId);

      if (!settings) {
        return {
          isAllowed: false,
          message: "Meal settings not configured for this tenant",
        };
      }

      const currentDay = MealSettingsModel.getCurrentDayName();
      const daySettings = MealSettingsModel.getCurrentDaySettings(settings);

      // Check if meal is enabled for current day
      const mealEnabled =
        mealType === "lunch"
          ? daySettings.lunchEnabled
          : daySettings.dinnerEnabled;
      if (!mealEnabled) {
        return {
          isAllowed: false,
          message: `${
            mealType.charAt(0).toUpperCase() + mealType.slice(1)
          } is disabled for ${currentDay}`,
        };
      }

      if (actionType === "booking") {
        const isAllowed = await MealSettingsModel.isBookingAllowed(
          tenantId,
          mealType
        );
        return {
          isAllowed,
          message: isAllowed
            ? `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              } booking is currently open`
            : `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              } booking is not available at this time`,
        };
      }

      if (actionType === "checkin") {
        const currentMealType = await MealSettingsModel.getCurrentMealType(
          tenantId
        );
        const isAllowed = currentMealType === mealType;
        return {
          isAllowed,
          message: isAllowed
            ? `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              } check-in is currently allowed`
            : `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              } check-in is not available at this time`,
        };
      }

      return {
        isAllowed: false,
        message: "Invalid action type",
      };
    } catch (error) {
      console.error("Error in validateMealAction service:", error);
      return {
        isAllowed: false,
        message: "Error validating meal action",
      };
    }
  }

  // Get meal settings for a specific day
  static async getMealSettingsForDay(tenantId, dayName) {
    try {
      const settings = await MealSettingsModel.getMealSettingsForDay(
        tenantId,
        dayName
      );

      if (!settings) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Meal settings not found for tenant",
        };
      }

      // Format times for display
      const formatTime = (timeString) => {
        if (!timeString) return "";
        return timeString.substring(0, 5);
      };

      const formattedSettings = {
        day: dayName,
        lunch: {
          enabled: settings.lunchEnabled,
          bookingTime: {
            start: formatTime(settings.lunchBookingStart),
            end: formatTime(settings.lunchBookingEnd),
          },
          mealTime: {
            start: formatTime(settings.lunchStart),
            end: formatTime(settings.lunchEnd),
          },
        },
        dinner: {
          enabled: settings.dinnerEnabled,
          bookingTime: {
            start: formatTime(settings.dinnerBookingStart),
            end: formatTime(settings.dinnerBookingEnd),
          },
          mealTime: {
            start: formatTime(settings.dinnerStart),
            end: formatTime(settings.dinnerEnd),
          },
        },
      };

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: `Meal settings for ${dayName} retrieved successfully`,
        data: formattedSettings,
      };
    } catch (error) {
      console.error("Error in getMealSettingsForDay service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Error retrieving meal settings for day",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get weekly meal schedule
  static async getWeeklyMealSchedule(tenantId) {
    try {
      const settings = await MealSettingsModel.getMealSettings(tenantId);

      if (!settings) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Meal settings not found for tenant",
        };
      }

      const formatTime = (timeString) => {
        if (!timeString) return "";
        return timeString.substring(0, 5);
      };

      const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const weeklySchedule = {};

      days.forEach((day) => {
        weeklySchedule[day.toLowerCase()] = {
          lunch: {
            enabled: settings[`lunchEnabled${day}`],
            bookingTime: {
              start: formatTime(settings[`lunchBookingStart${day}`]),
              end: formatTime(settings[`lunchBookingEnd${day}`]),
            },
            mealTime: {
              start: formatTime(settings[`lunchStart${day}`]),
              end: formatTime(settings[`lunchEnd${day}`]),
            },
          },
          dinner: {
            enabled: settings[`dinnerEnabled${day}`],
            bookingTime: {
              start: formatTime(settings[`dinnerBookingStart${day}`]),
              end: formatTime(settings[`dinnerBookingEnd${day}`]),
            },
            mealTime: {
              start: formatTime(settings[`dinnerStart${day}`]),
              end: formatTime(settings[`dinnerEnd${day}`]),
            },
          },
        };
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Weekly meal schedule retrieved successfully",
        data: {
          tenantId,
          schedule: weeklySchedule,
        },
      };
    } catch (error) {
      console.error("Error in getWeeklyMealSchedule service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Error retrieving weekly meal schedule",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }
}

module.exports = MealSettingsService;
