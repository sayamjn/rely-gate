const MealModel = require('../models/meal.model');
const MealSettingsModel = require('../models/mealSettings.model');
const StudentModel = require('../models/student.model');
const ResponseFormatter = require('../utils/response');
const responseUtils = require('../utils/constants');

class MealConsumptionService {
  // Consume meal during serving window (Phase 2)
  static async consumeMeal(mealId, tenantId, consumedBy) {
    try {
      // Validate that meal exists and is in correct state
      const registration = await this.getMealRegistrationById(tenantId, mealId);
      if (!registration.success) {
        return registration;
      }

      const meal = registration.data;

      // Check if serving window is open
      const windowCheck = await this.validateServingWindow(tenantId, meal.mealType);
      if (!windowCheck.valid) {
        return ResponseFormatter.error(windowCheck.message);
      }

      // Consume the meal
      const consumedMeal = await MealModel.consumeMeal(tenantId, mealId, consumedBy);

      if (!consumedMeal) {
        return ResponseFormatter.error('Failed to consume meal - meal may already be consumed or cancelled');
      }

      return ResponseFormatter.success('Meal consumed successfully', {
        mealId: consumedMeal.mealid,
        tokenNumber: consumedMeal.tokennumber,
        studentName: consumedMeal.studentname,
        mealType: consumedMeal.mealtype,
        consumedTime: consumedMeal.consumedtime
      });

    } catch (error) {
      console.error('Error in consumeMeal:', error);
      return ResponseFormatter.error('Failed to consume meal', error.message);
    }
  }

  // Consume meal via QR code during serving window
  static async consumeViaQR(qrData, tenantId, consumedBy) {
    try {
      const { student_id, meal_type } = qrData;

      if (!student_id || !meal_type) {
        return ResponseFormatter.error('Invalid QR data: student_id and meal_type required');
      }

      // Get meal registration by QR data
      const mealRegistration = await MealModel.getMealRegistrationByQR(
        tenantId, 
        parseInt(student_id), 
        meal_type
      );

      if (!mealRegistration) {
        return ResponseFormatter.error('No meal registration found for this student and meal type today');
      }

      // Check if serving window is open
      const windowCheck = await this.validateServingWindow(tenantId, meal_type);
      if (!windowCheck.valid) {
        return ResponseFormatter.error(windowCheck.message);
      }

      // Consume the meal
      const consumedMeal = await MealModel.consumeMeal(tenantId, mealRegistration.mealid, consumedBy);

      if (!consumedMeal) {
        return ResponseFormatter.error('Failed to consume meal - meal may already be consumed');
      }

      return ResponseFormatter.success('Meal consumed successfully via QR', {
        mealId: consumedMeal.mealid,
        tokenNumber: consumedMeal.tokennumber,
        studentName: consumedMeal.studentname,
        mealType: consumedMeal.mealtype,
        consumedTime: consumedMeal.consumedtime,
        student: {
          id: mealRegistration.studentid,
          name: mealRegistration.studentname,
          regNo: mealRegistration.studentregno,
          mobile: mealRegistration.mobile,
          course: mealRegistration.course,
          hostel: mealRegistration.hostel
        },
        wasSpecial: mealRegistration.isspecial === 'Y',
        specialRemarks: mealRegistration.specialremarks
      });

    } catch (error) {
      console.error('Error in consumeViaQR:', error);
      return ResponseFormatter.error('Failed to consume meal via QR code', error.message);
    }
  }

  // Validate if serving window is open
  static async validateServingWindow(tenantId, mealType) {
    try {
      const settings = await MealSettingsModel.getMealSettings(tenantId);
      if (!settings) {
        return { valid: false, message: 'Meal settings not configured' };
      }

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

      // Get current day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = now.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = dayNames[dayOfWeek];

      // Helper function to convert time to minutes
      const timeToMinutes = (timeString) => {
        if (!timeString) return null;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const currentMinutes = timeToMinutes(currentTime);

      if (mealType === 'lunch') {
        // Check if lunch is enabled for current day
        const lunchEnabledKey = `lunchEnabled${currentDay}`;
        if (!settings[lunchEnabledKey]) {
          return { valid: false, message: `Lunch is not available on ${currentDay}` };
        }

        // Get serving times for current day
        const servingStartKey = `lunchStart${currentDay}`;
        const servingEndKey = `lunchEnd${currentDay}`;
        
        const servingStart = timeToMinutes(settings[servingStartKey]);
        const servingEnd = timeToMinutes(settings[servingEndKey]);

        if (!servingStart || !servingEnd) {
          return { valid: false, message: `Lunch serving times not configured for ${currentDay}` };
        }

        if (currentMinutes >= servingStart && currentMinutes <= servingEnd) {
          return { valid: true, message: 'Lunch serving window is open' };
        } else if (currentMinutes < servingStart) {
          return { valid: false, message: `Lunch serving starts at ${settings[servingStartKey]}` };
        } else {
          return { valid: false, message: `Lunch serving ended at ${settings[servingEndKey]}` };
        }
      } else if (mealType === 'dinner') {
        // Check if dinner is enabled for current day
        const dinnerEnabledKey = `dinnerEnabled${currentDay}`;
        if (!settings[dinnerEnabledKey]) {
          return { valid: false, message: `Dinner is not available on ${currentDay}` };
        }

        // Get serving times for current day
        const servingStartKey = `dinnerStart${currentDay}`;
        const servingEndKey = `dinnerEnd${currentDay}`;
        
        const servingStart = timeToMinutes(settings[servingStartKey]);
        const servingEnd = timeToMinutes(settings[servingEndKey]);

        if (!servingStart || !servingEnd) {
          return { valid: false, message: `Dinner serving times not configured for ${currentDay}` };
        }

        if (currentMinutes >= servingStart && currentMinutes <= servingEnd) {
          return { valid: true, message: 'Dinner serving window is open' };
        } else if (currentMinutes < servingStart) {
          return { valid: false, message: `Dinner serving starts at ${settings[servingStartKey]}` };
        } else {
          return { valid: false, message: `Dinner serving ended at ${settings[servingEndKey]}` };
        }
      }

      return { valid: false, message: 'Invalid meal type' };

    } catch (error) {
      console.error('Error validating serving window:', error);
      return { valid: false, message: 'Failed to validate serving window' };
    }
  }

  // Get current serving status for a meal type
  static async getServingStatus(tenantId, mealType) {
    try {
      const windowCheck = await this.validateServingWindow(tenantId, mealType);
      const servingStats = await this.getServingStatistics(tenantId, mealType);

      return ResponseFormatter.success('Serving status retrieved', {
        mealType,
        isServingOpen: windowCheck.valid,
        message: windowCheck.message,
        statistics: servingStats,
        date: new Date().toISOString().split('T')[0]
      });

    } catch (error) {
      console.error('Error getting serving status:', error);
      return ResponseFormatter.error('Failed to get serving status', error.message);
    }
  }

  // Get serving statistics for today's meal
  static async getServingStatistics(tenantId, mealType, mealDate = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      
      const registered = await MealModel.getRegisteredMeals(tenantId, mealType, targetDate);
      const consumed = await MealModel.getConsumedMeals(tenantId, mealType, targetDate);

      const totalRegistered = registered.length;
      const totalConsumed = consumed.length;
      const totalWasted = totalRegistered - totalConsumed;
      const consumptionRate = totalRegistered > 0 ? ((totalConsumed / totalRegistered) * 100).toFixed(2) : 0;
      const specialMeals = registered.filter(meal => meal.isspecial === 'Y').length;

      return {
        totalRegistered,
        totalConsumed,
        totalWasted,
        consumptionRate: parseFloat(consumptionRate),
        specialMeals,
        pendingConsumption: totalRegistered - totalConsumed
      };

    } catch (error) {
      console.error('Error getting serving statistics:', error);
      return {
        totalRegistered: 0,
        totalConsumed: 0,
        totalWasted: 0,
        consumptionRate: 0,
        specialMeals: 0,
        pendingConsumption: 0
      };
    }
  }

  // Get meal registration by ID (helper method)
  static async getMealRegistrationById(tenantId, mealId) {
    try {
      // This is a simplified query - in practice you'd have a proper method in MealModel
      const { query } = require('../config/database');
      const sql = `
        SELECT 
          MealID,
          StudentID,
          StudentName,
          MealType,
          Status,
          IsConsumed,
          IsSpecial,
          SpecialRemarks
        FROM MealMaster
        WHERE TenantID = $1 
          AND MealID = $2 
          AND IsActive = 'Y'
      `;

      const result = await query(sql, [tenantId, mealId]);
      
      if (result.rows.length === 0) {
        return ResponseFormatter.error('Meal registration not found');
      }

      const meal = result.rows[0];
      
      if (meal.status === 'cancelled') {
        return ResponseFormatter.error('Meal registration was cancelled');
      }

      if (meal.isconsumed === 'Y') {
        return ResponseFormatter.error('Meal already consumed');
      }

      return ResponseFormatter.success('Meal registration found', {
        mealId: meal.mealid,
        studentId: meal.studentid,
        studentName: meal.studentname,
        mealType: meal.mealtype,
        status: meal.status,
        isConsumed: meal.isconsumed === 'Y',
        isSpecial: meal.isspecial === 'Y',
        specialRemarks: meal.specialremarks
      });

    } catch (error) {
      console.error('Error getting meal registration by ID:', error);
      return ResponseFormatter.error('Failed to get meal registration', error.message);
    }
  }

  // Get pending meals for consumption (served during serving window)
  static async getPendingMeals(tenantId, mealType, mealDate = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      const pendingMeals = await MealModel.getRegisteredMeals(tenantId, mealType, targetDate);

      return ResponseFormatter.success({
        mealType,
        date: targetDate,
        totalPending: pendingMeals.length,
        meals: pendingMeals.map(meal => ({
          mealId: meal.mealid,
          studentId: meal.studentid,
          studentName: meal.studentname,
          studentRegNo: meal.studentregno,
          mobile: meal.mobile,
          course: meal.course,
          hostel: meal.hostel,
          tokenNumber: meal.tokennumber,
          registrationTime: meal.mealtime,
          isSpecial: meal.isspecial === 'Y',
          specialRemarks: meal.specialremarks,
          status: meal.status
        }))
      });

    } catch (error) {
      console.error('Error getting pending meals:', error);
      return ResponseFormatter.error('Failed to get pending meals', error.message);
    }
  }

  // Get consumed meals for today
  static async getConsumedMeals(tenantId, mealType, mealDate = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      const consumedMeals = await MealModel.getConsumedMeals(tenantId, mealType, targetDate);

      return ResponseFormatter.success({
        mealType,
        date: targetDate,
        totalConsumed: consumedMeals.length,
        meals: consumedMeals.map(meal => ({
          mealId: meal.mealid,
          studentId: meal.studentid,
          studentName: meal.studentname,
          studentRegNo: meal.studentregno,
          mobile: meal.mobile,
          course: meal.course,
          hostel: meal.hostel,
          tokenNumber: meal.tokennumber,
          registrationTime: meal.mealtime,
          consumedTime: meal.consumedtime,
          isSpecial: meal.isspecial === 'Y',
          specialRemarks: meal.specialremarks,
          status: meal.status
        }))
      });

    } catch (error) {
      console.error('Error getting consumed meals:', error);
      return ResponseFormatter.error('Failed to get consumed meals', error.message);
    }
  }

  // Get meal queue with real-time status (for display during serving)
  static async getMealQueue(tenantId, mealType, mealDate = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      
      // Get both pending and consumed meals for complete queue view
      const pendingResult = await this.getPendingMeals(tenantId, mealType, targetDate);
      const consumedResult = await this.getConsumedMeals(tenantId, mealType, targetDate);

      if (pendingResult.responseCode !== 'S' || consumedResult.responseCode !== 'S') {
        return ResponseFormatter.error('Failed to get meal queue data');
      }

      const windowCheck = await this.validateServingWindow(tenantId, mealType);
      const statistics = await this.getServingStatistics(tenantId, mealType, targetDate);

      return ResponseFormatter.success({
        mealType,
        date: targetDate,
        isServingOpen: windowCheck.valid,
        servingMessage: windowCheck.message,
        statistics,
        pending: pendingResult.data.meals,
        consumed: consumedResult.data.meals,
        totalInQueue: pendingResult.data.totalPending + consumedResult.data.totalConsumed
      }, 'Meal queue retrieved');

    } catch (error) {
      console.error('Error getting meal queue:', error);
      return ResponseFormatter.error('Failed to get meal queue', error.message);
    }
  }

  // Check if student can consume meal (validation before consumption)
  static async validateMealConsumption(tenantId, studentId, mealType) {
    try {
      // Check serving window
      const windowCheck = await this.validateServingWindow(tenantId, mealType);
      if (!windowCheck.valid) {
        return ResponseFormatter.error(windowCheck.message);
      }

      // Check if student has registered for this meal
      const registration = await MealModel.getMealRegistrationByQR(tenantId, studentId, mealType);
      if (!registration) {
        return ResponseFormatter.error('Student has not registered for this meal today');
      }

      return ResponseFormatter.success('Meal consumption validation passed', {
        canConsume: true,
        mealId: registration.mealid,
        tokenNumber: registration.tokennumber,
        studentName: registration.studentname,
        isSpecial: registration.isspecial === 'Y',
        specialRemarks: registration.specialremarks
      });

    } catch (error) {
      console.error('Error validating meal consumption:', error);
      return ResponseFormatter.error('Failed to validate meal consumption', error.message);
    }
  }
}

module.exports = MealConsumptionService;