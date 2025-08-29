const MealModel = require('../models/meal.model');
const MealSettingsModel = require('../models/mealSettings.model.simple');
const StudentModel = require('../models/student.model');
const ResponseFormatter = require('../utils/response');
const { query } = require('../config/database');

class MealAutomaticRegistrationService {
  // Main cron job function to automatically register all active students for meals
  static async autoRegisterStudentsForMeals(tenantId, mealType, mealDate = null, triggerBy = 'SYSTEM') {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      
      console.log(`Starting automatic meal registration for tenantId: ${tenantId}, mealType: ${mealType}, date: ${targetDate}`);

      // Validate meal settings and timing
      const settingsValidation = await this.validateMealSettingsAndTiming(tenantId, mealType);
      if (!settingsValidation.valid) {
        console.log('Meal settings validation failed:', settingsValidation.message);
        return ResponseFormatter.error(settingsValidation.message);
      }

      // Get all active students for the tenant
      const students = await this.getAllActiveStudents(tenantId);
      if (!students || students.length === 0) {
        console.log('No active students found for tenant:', tenantId);
        return ResponseFormatter.success('No active students found to register', { 
          registeredCount: 0, 
          skippedCount: 0, 
          errors: [] 
        });
      }

      console.log(`Found ${students.length} active students for registration`);

      let registeredCount = 0;
      let skippedCount = 0;
      let errors = [];

      // Register each student for the meal
      for (const student of students) {
        try {
          // Check if student already has meal entry for today
          const existingEntry = await MealModel.checkExistingMealRegistration(
            tenantId,
            student.studentid || student.visitorregid,
            mealType,
            targetDate
          );

          if (existingEntry) {
            console.log(`Student ${student.name} already registered for ${mealType} on ${targetDate}`);
            skippedCount++;
            continue;
          }

          // Get student's meal preference (default to non-veg if not specified)
          const mealPreference = await this.getStudentMealPreference(tenantId, student.studentid || student.visitorregid);

          // Prepare meal registration data
          const mealData = {
            tenantId,
            studentId: student.studentid || student.visitorregid,
            studentRegNo: student.visitorregno,
            studentName: student.name,
            mobile: student.mobile,
            email: student.email || '',
            address: student.address || '',
            course: student.course || '',
            hostel: student.hostel || '',
            associatedFlat: student.associatedflat || '',
            associatedBlock: student.associatedblock || '',
            mealType,
            isSpecial: 'N',
            specialRemarks: '',
            mealPreference: mealPreference,
            createdBy: triggerBy
          };

          // Register the student for meal
          const registrationResult = await this.registerStudentForMealAutomatic(mealData, targetDate);
          
          if (registrationResult) {
            registeredCount++;
            console.log(`Successfully registered ${student.name} for ${mealType}`);
          } else {
            skippedCount++;
            errors.push(`Failed to register ${student.name}: Registration failed`);
          }

        } catch (studentError) {
          console.error(`Error registering student ${student.name}:`, studentError);
          skippedCount++;
          errors.push(`Failed to register ${student.name}: ${studentError.message}`);
        }
      }

      console.log(`Automatic registration completed. Registered: ${registeredCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`);

      return ResponseFormatter.success('Automatic meal registration completed', {
        mealType,
        date: targetDate,
        totalStudents: students.length,
        registeredCount,
        skippedCount,
        errors: errors.slice(0, 10) // Limit error messages
      });

    } catch (error) {
      console.error('Error in autoRegisterStudentsForMeals:', error);
      return ResponseFormatter.error('Failed to auto-register students for meals', error.message);
    }
  }

  // Register a single student automatically (modified version of existing registration)
  static async registerStudentForMealAutomatic(mealData, targetDate) {
    try {
      const tokenNumber = await MealModel.getNextTokenNumber(mealData.tenantId, mealData.mealType, targetDate);
      
      const sql = `
        INSERT INTO MealMaster (
          TenantID, StudentID, StudentRegNo, StudentName, Mobile, Email, Address,
          Course, Hostel, AssociatedFlat, AssociatedBlock, VehicleNo,
          VisitorCatName, VisitorSubCatName, SecurityCode, IDNumber, IDName,
          PhotoFlag, PhotoPath, PhotoName, ValidStartDate, ValidEndDate,
          MealType, MealDate, MealTime, TokenNumber, Status, IsSpecial, SpecialRemarks,
          MealPreference, IsConsumed, IsActive, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
          $23, $24, $25, $26, 'registered', $27, $28,
          $29, 'N', 'Y', NOW(), NOW(), $30, $30
        ) RETURNING MealID, TokenNumber, MealTime, MealDate
      `;

      const result = await query(sql, [
        mealData.tenantId, 
        mealData.studentId, 
        mealData.studentRegNo, 
        mealData.studentName, 
        mealData.mobile, 
        mealData.email, 
        mealData.address,
        mealData.course, 
        mealData.hostel, 
        mealData.associatedFlat, 
        mealData.associatedBlock, 
        '', // vehicleNo
        'Student', // visitorCatName
        'Regular Student', // visitorSubCatName
        '', // securityCode
        '', // idNumber
        '', // idName
        'N', // photoFlag
        '', // photoPath
        '', // photoName
        null, // validStartDate
        null, // validEndDate
        mealData.mealType, 
        targetDate, 
        new Date(), 
        tokenNumber, 
        mealData.isSpecial, 
        mealData.specialRemarks,
        mealData.mealPreference,
        mealData.createdBy
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in registerStudentForMealAutomatic:', error);
      throw error;
    }
  }

  // Get all active regular students for a tenant (only regular students, no day boarding)
  static async getAllActiveStudents(tenantId) {
    try {
      // Get regular students (VisitorCatID = 2) only
      const regularStudentsSQL = `
        SELECT 
          VisitorRegID as studentid,
          VisitorRegNo as visitorregno,
          VistorName as name,
          Mobile as mobile,
          Email as email,
          '' as address,
          '' as course,
          '' as hostel,
          '' as associatedflat,
          '' as associatedblock,
          'regular' as student_type
        FROM VisitorRegistration 
        WHERE TenantID = $1 
          AND VisitorCatID = 2 
          AND IsActive = 'Y'
      `;

      const result = await query(regularStudentsSQL, [tenantId]);
      const allStudents = result.rows;

      console.log(`Found ${allStudents.length} regular students for meal registration`);
      return allStudents;

    } catch (error) {
      console.error('Error getting all active students:', error);
      throw error;
    }
  }

  // Get student's meal preference (veg/non-veg) - placeholder for future implementation
  static async getStudentMealPreference(tenantId, studentId) {
    try {
      // For now, return default as 'non-veg'
      // In the future, this can be extended to check a student preferences table
      // or a field in the student record
      
      // Check if student has a preference set in a separate table (future enhancement)
      // const sql = `
      //   SELECT MealPreference 
      //   FROM StudentMealPreferences 
      //   WHERE TenantID = $1 AND StudentID = $2 AND IsActive = 'Y'
      // `;
      // const result = await query(sql, [tenantId, studentId]);
      // return result.rows[0]?.mealpreference || 'non-veg';
      
      return 'non-veg'; // Default preference
    } catch (error) {
      console.error('Error getting student meal preference:', error);
      return 'non-veg'; // Default fallback
    }
  }

  // Validate meal settings and current timing
  static async validateMealSettingsAndTiming(tenantId, mealType) {
    try {
      // console.log(`=== DEBUG: validateMealSettingsAndTiming called ===`);
      // console.log(`tenantId: ${tenantId}, mealType: ${mealType}`);
      
      const settings = await MealSettingsModel.getMealSettings(tenantId);
      // console.log(`MealSettings result in validateMealSettingsAndTiming:`, settings);
      // console.log(`Settings type:`, typeof settings);
      // console.log(`Settings falsy check:`, !settings);
      
      if (!settings) {
        console.log(`Settings is falsy in validateMealSettingsAndTiming, returning error`);
        return { valid: false, message: 'Meal settings not configured for tenant' };
      }

      const now = new Date();
      const dayOfWeek = now.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = dayNames[dayOfWeek];

      // Check if meal is enabled for current day
      if (mealType === 'lunch') {
        const lunchEnabledKey = `lunchEnabled${currentDay}`;
        if (!settings[lunchEnabledKey]) {
          return { valid: false, message: `Lunch is not available on ${currentDay}` };
        }
      } else if (mealType === 'dinner') {
        const dinnerEnabledKey = `dinnerEnabled${currentDay}`;
        if (!settings[dinnerEnabledKey]) {
          return { valid: false, message: `Dinner is not available on ${currentDay}` };
        }
      }

      return { valid: true, message: `${mealType} is available for registration` };

    } catch (error) {
      console.error('Error validating meal settings:', error);
      return { valid: false, message: 'Failed to validate meal settings' };
    }
  }

  // Cron job scheduler functions (for different meal times)
  static async scheduleLunchRegistration(tenantId) {
    try {
      console.log(`Triggering lunch registration cron for tenant: ${tenantId}`);
      return await this.autoRegisterStudentsForMeals(tenantId, 'lunch', null, 'LUNCH_CRON');
    } catch (error) {
      console.error('Error in lunch registration cron:', error);
      return ResponseFormatter.error('Lunch registration cron failed', error.message);
    }
  }

  static async scheduleDinnerRegistration(tenantId) {
    try {
      console.log(`Triggering dinner registration cron for tenant: ${tenantId}`);
      return await this.autoRegisterStudentsForMeals(tenantId, 'dinner', null, 'DINNER_CRON');
    } catch (error) {
      console.error('Error in dinner registration cron:', error);
      return ResponseFormatter.error('Dinner registration cron failed', error.message);
    }
  }

  // Manual trigger for all tenants (for testing purposes)
  static async triggerAllTenantsRegistration(mealType, triggerBy = 'MANUAL') {
    try {
      console.log(`Manual trigger for ${mealType} registration across all tenants`);

      // Get all active tenants
      const tenantsSQL = `SELECT TenantID FROM Tenant WHERE IsActive = 'Y'`;
      const tenantsResult = await query(tenantsSQL);
      const tenants = tenantsResult.rows;

      if (tenants.length === 0) {
        return ResponseFormatter.success('No active tenants found', { results: [] });
      }

      const results = [];
      
      // Process each tenant
      for (const tenant of tenants) {
        try {
          const result = await this.autoRegisterStudentsForMeals(tenant.tenantid, mealType, null, triggerBy);
          results.push({
            tenantId: tenant.tenantid,
            success: result.responseCode === 'S',
            message: result.responseMessage,
            data: result.data
          });
        } catch (tenantError) {
          console.error(`Error processing tenant ${tenant.tenantid}:`, tenantError);
          results.push({
            tenantId: tenant.tenantid,
            success: false,
            message: tenantError.message,
            data: null
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      return ResponseFormatter.success('Manual trigger completed across all tenants', {
        totalTenants: tenants.length,
        successCount,
        failCount,
        results
      });

    } catch (error) {
      console.error('Error in triggerAllTenantsRegistration:', error);
      return ResponseFormatter.error('Failed to trigger registration for all tenants', error.message);
    }
  }
}

module.exports = MealAutomaticRegistrationService;