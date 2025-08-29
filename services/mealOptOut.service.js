const MealModel = require('../models/meal.model');
const MealSettingsModel = require('../models/mealSettings.model.simple');
const StudentModel = require('../models/student.model');
const MealRegistrationService = require('./mealRegistration.service');
const ResponseFormatter = require('../utils/response');
const { query } = require('../config/database');

class MealOptOutService {
  // Allow student to opt-out of a meal during booking window
  static async optOutOfMeal(tenantId, studentId, mealType, optedOutBy, mealDate = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      
      console.log(`Student opt-out request: tenantId=${tenantId}, studentId=${studentId}, mealType=${mealType}, date=${targetDate}`);

      // Check if booking window is still open
      const windowCheck = await MealRegistrationService.validateRegistrationWindow(tenantId, mealType);
      if (!windowCheck.valid) {
        return ResponseFormatter.error(`Cannot opt-out: ${windowCheck.message}`);
      }

      // Find existing meal registration for student
      const existingRegistration = await MealModel.checkExistingMealRegistration(
        tenantId,
        studentId,
        mealType,
        targetDate
      );

      if (!existingRegistration) {
        return ResponseFormatter.error('No meal registration found for student on this date');
      }

      // Check if meal can be opted out (must be in 'registered' or 'confirmed' status)
      if (!['registered', 'confirmed'].includes(existingRegistration.status)) {
        if (existingRegistration.status === 'opted_out') {
          return ResponseFormatter.error('Student has already opted out of this meal');
        } else if (existingRegistration.status === 'consumed') {
          return ResponseFormatter.error('Cannot opt-out: Meal has already been consumed');
        } else if (existingRegistration.status === 'cancelled') {
          return ResponseFormatter.error('Cannot opt-out: Meal has already been cancelled');
        } else {
          return ResponseFormatter.error(`Cannot opt-out: Meal is in ${existingRegistration.status} status`);
        }
      }

      // Update the meal status to 'opted_out'
      const sql = `
        UPDATE MealMaster 
        SET Status = 'opted_out',
            UpdatedDate = NOW(),
            UpdatedBy = $3
        WHERE TenantID = $1 
          AND MealID = $2 
          AND IsActive = 'Y'
          AND Status IN ('registered', 'confirmed')
        RETURNING MealID, TokenNumber, StudentName, MealType, MealDate, MealPreference, IsSpecial, SpecialRemarks
      `;

      const result = await query(sql, [tenantId, existingRegistration.mealid, optedOutBy]);

      if (result.rows.length === 0) {
        return ResponseFormatter.error('Failed to opt-out of meal. Please try again.');
      }

      const updatedMeal = result.rows[0];

      console.log(`Successfully opted out student ${updatedMeal.studentname} from ${updatedMeal.mealtype} on ${updatedMeal.mealdate}`);

      return ResponseFormatter.success('Successfully opted out of meal', {
        mealId: updatedMeal.mealid,
        studentName: updatedMeal.studentname,
        mealType: updatedMeal.mealtype,
        mealDate: updatedMeal.mealdate,
        tokenNumber: updatedMeal.tokennumber,
        mealPreference: updatedMeal.mealpreference,
        isSpecial: updatedMeal.isspecial === 'Y',
        specialRemarks: updatedMeal.specialremarks,
        optedOutBy,
        optedOutTime: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error in optOutOfMeal:', error);
      return ResponseFormatter.error('Failed to opt-out of meal', error.message);
    }
  }

  // Allow student to opt back in (re-register) during booking window
  static async optBackIn(tenantId, studentId, mealType, registeredBy, mealDate = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      
      console.log(`Student opt back in request: tenantId=${tenantId}, studentId=${studentId}, mealType=${mealType}, date=${targetDate}`);

      // Check if booking window is still open
      const windowCheck = await MealRegistrationService.validateRegistrationWindow(tenantId, mealType);
      if (!windowCheck.valid) {
        return ResponseFormatter.error(`Cannot opt back in: ${windowCheck.message}`);
      }

      // Find existing meal registration for student
      const existingRegistration = await MealModel.checkExistingMealRegistration(
        tenantId,
        studentId,
        mealType,
        targetDate
      );

      if (!existingRegistration) {
        return ResponseFormatter.error('No meal registration found for student on this date');
      }

      // Check if meal can be opted back in (must be in 'opted_out' status)
      if (existingRegistration.status !== 'opted_out') {
        if (['registered', 'confirmed'].includes(existingRegistration.status)) {
          return ResponseFormatter.error('Student is already registered for this meal');
        } else if (existingRegistration.status === 'consumed') {
          return ResponseFormatter.error('Cannot opt back in: Meal has already been consumed');
        } else if (existingRegistration.status === 'cancelled') {
          return ResponseFormatter.error('Cannot opt back in: Meal has been cancelled');
        } else {
          return ResponseFormatter.error(`Cannot opt back in: Meal is in ${existingRegistration.status} status`);
        }
      }

      // Update the meal status back to 'confirmed'
      const sql = `
        UPDATE MealMaster 
        SET Status = 'confirmed',
            UpdatedDate = NOW(),
            UpdatedBy = $3
        WHERE TenantID = $1 
          AND MealID = $2 
          AND IsActive = 'Y'
          AND Status = 'opted_out'
        RETURNING MealID, TokenNumber, StudentName, MealType, MealDate, MealPreference, IsSpecial, SpecialRemarks
      `;

      const result = await query(sql, [tenantId, existingRegistration.mealid, registeredBy]);

      if (result.rows.length === 0) {
        return ResponseFormatter.error('Failed to opt back in for meal. Please try again.');
      }

      const updatedMeal = result.rows[0];

      console.log(`Successfully opted back in student ${updatedMeal.studentname} for ${updatedMeal.mealtype} on ${updatedMeal.mealdate}`);

      return ResponseFormatter.success('Successfully opted back in for meal', {
        mealId: updatedMeal.mealid,
        studentName: updatedMeal.studentname,
        mealType: updatedMeal.mealtype,
        mealDate: updatedMeal.mealdate,
        tokenNumber: updatedMeal.tokennumber,
        mealPreference: updatedMeal.mealpreference,
        isSpecial: updatedMeal.isspecial === 'Y',
        specialRemarks: updatedMeal.specialremarks,
        registeredBy,
        optedBackInTime: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error in optBackIn:', error);
      return ResponseFormatter.error('Failed to opt back in for meal', error.message);
    }
  }

  // Update meal preference (veg/non-veg) during booking window
  static async updateMealPreference(tenantId, studentId, mealType, newPreference, updatedBy, mealDate = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      
      // Validate preference value
      if (!['veg', 'non-veg'].includes(newPreference)) {
        return ResponseFormatter.error('Invalid meal preference. Must be "veg" or "non-veg"');
      }

      console.log(`Update meal preference request: tenantId=${tenantId}, studentId=${studentId}, mealType=${mealType}, preference=${newPreference}, date=${targetDate}`);

      // Check if booking window is still open
      const windowCheck = await MealRegistrationService.validateRegistrationWindow(tenantId, mealType);
      if (!windowCheck.valid) {
        return ResponseFormatter.error(`Cannot update preference: ${windowCheck.message}`);
      }

      // Find existing meal registration for student
      const existingRegistration = await MealModel.checkExistingMealRegistration(
        tenantId,
        studentId,
        mealType,
        targetDate
      );

      if (!existingRegistration) {
        return ResponseFormatter.error('No meal registration found for student on this date');
      }

      // Check if meal preference can be updated (must not be consumed or cancelled)
      if (existingRegistration.status === 'consumed') {
        return ResponseFormatter.error('Cannot update preference: Meal has already been consumed');
      } else if (existingRegistration.status === 'cancelled') {
        return ResponseFormatter.error('Cannot update preference: Meal has been cancelled');
      }

      // Update the meal preference
      const sql = `
        UPDATE MealMaster 
        SET MealPreference = $3,
            UpdatedDate = NOW(),
            UpdatedBy = $4
        WHERE TenantID = $1 
          AND MealID = $2 
          AND IsActive = 'Y'
          AND Status IN ('registered', 'confirmed', 'opted_out')
        RETURNING MealID, TokenNumber, StudentName, MealType, MealDate, MealPreference, Status, IsSpecial, SpecialRemarks
      `;

      const result = await query(sql, [tenantId, existingRegistration.mealid, newPreference, updatedBy]);

      if (result.rows.length === 0) {
        return ResponseFormatter.error('Failed to update meal preference. Please try again.');
      }

      const updatedMeal = result.rows[0];

      console.log(`Successfully updated meal preference for student ${updatedMeal.studentname}: ${updatedMeal.mealtype} -> ${updatedMeal.mealpreference}`);

      return ResponseFormatter.success('Meal preference updated successfully', {
        mealId: updatedMeal.mealid,
        studentName: updatedMeal.studentname,
        mealType: updatedMeal.mealtype,
        mealDate: updatedMeal.mealdate,
        tokenNumber: updatedMeal.tokennumber,
        status: updatedMeal.status,
        mealPreference: updatedMeal.mealpreference,
        isSpecial: updatedMeal.isspecial === 'Y',
        specialRemarks: updatedMeal.specialremarks,
        updatedBy,
        updatedTime: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error in updateMealPreference:', error);
      return ResponseFormatter.error('Failed to update meal preference', error.message);
    }
  }

  // Get student's current meal status for today
  static async getStudentMealStatus(tenantId, studentId, mealDate = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      
      const sql = `
        SELECT 
          MealID,
          MealType,
          MealDate,
          TokenNumber,
          Status,
          MealPreference,
          IsSpecial,
          SpecialRemarks,
          IsConsumed,
          ConsumedTime,
          MealTime as RegistrationTime,
          UpdatedDate,
          UpdatedBy
        FROM MealMaster
        WHERE TenantID = $1 
          AND StudentID = $2 
          AND MealDate = $3
          AND IsActive = 'Y'
        ORDER BY MealType ASC
      `;

      const result = await query(sql, [tenantId, studentId, targetDate]);
      
      const meals = result.rows.map(meal => ({
        mealId: meal.mealid,
        mealType: meal.mealtype,
        mealDate: meal.mealdate,
        tokenNumber: meal.tokennumber,
        status: meal.status,
        mealPreference: meal.mealpreference,
        isSpecial: meal.isspecial === 'Y',
        specialRemarks: meal.specialremarks,
        isConsumed: meal.isconsumed === 'Y',
        consumedTime: meal.consumedtime,
        registrationTime: meal.registrationtime,
        lastUpdatedTime: meal.updateddate,
        lastUpdatedBy: meal.updatedby
      }));

      return ResponseFormatter.success('Student meal status retrieved', {
        studentId,
        date: targetDate,
        meals
      });

    } catch (error) {
      console.error('Error in getStudentMealStatus:', error);
      return ResponseFormatter.error('Failed to get student meal status', error.message);
    }
  }

  // Get summary of opted-out students for a specific meal
  static async getOptedOutSummary(tenantId, mealType, mealDate = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      
      const sql = `
        SELECT 
          COUNT(*) as total_opted_out,
          COUNT(CASE WHEN MealPreference = 'veg' THEN 1 END) as veg_opted_out,
          COUNT(CASE WHEN MealPreference = 'non-veg' THEN 1 END) as non_veg_opted_out,
          COUNT(CASE WHEN IsSpecial = 'Y' THEN 1 END) as special_opted_out,
          
          -- Get list of students who opted out
          ARRAY_AGG(
            JSON_BUILD_OBJECT(
              'studentId', StudentID,
              'studentName', StudentName,
              'mobile', Mobile,
              'course', Course,
              'hostel', Hostel,
              'mealPreference', MealPreference,
              'isSpecial', CASE WHEN IsSpecial = 'Y' THEN true ELSE false END,
              'specialRemarks', SpecialRemarks,
              'updatedBy', UpdatedBy,
              'updatedTime', UpdatedDate
            ) ORDER BY StudentName
          ) as opted_out_students
        FROM MealMaster
        WHERE TenantID = $1 
          AND MealType = $2 
          AND MealDate = $3
          AND Status = 'opted_out'
          AND IsActive = 'Y'
      `;

      const result = await query(sql, [tenantId, mealType, targetDate]);
      const summary = result.rows[0];

      return ResponseFormatter.success('Opted-out summary retrieved', {
        mealType,
        date: targetDate,
        totalOptedOut: parseInt(summary.total_opted_out) || 0,
        vegOptedOut: parseInt(summary.veg_opted_out) || 0,
        nonVegOptedOut: parseInt(summary.non_veg_opted_out) || 0,
        specialOptedOut: parseInt(summary.special_opted_out) || 0,
        students: summary.opted_out_students || []
      });

    } catch (error) {
      console.error('Error in getOptedOutSummary:', error);
      return ResponseFormatter.error('Failed to get opted-out summary', error.message);
    }
  }
}

module.exports = MealOptOutService;