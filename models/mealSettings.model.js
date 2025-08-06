const { query } = require("../config/database");

class MealSettingsModel {
  // Get meal settings for a tenant
  static async getMealSettings(tenantId) {
    const sql = `
      SELECT 
        MealSettingID as "mealSettingId",
        TenantID as "tenantId",
        LunchBookingStartTime as "lunchBookingStartTime",
        LunchBookingEndTime as "lunchBookingEndTime", 
        LunchStartTime as "lunchStartTime",
        LunchEndTime as "lunchEndTime",
        DinnerBookingStartTime as "dinnerBookingStartTime",
        DinnerBookingEndTime as "dinnerBookingEndTime",
        DinnerStartTime as "dinnerStartTime", 
        DinnerEndTime as "dinnerEndTime",
        IsActive as "isActive",
        CreatedDate as "createdDate",
        UpdatedDate as "updatedDate",
        CreatedBy as "createdBy",
        UpdatedBy as "updatedBy"
      FROM MealSettings
      WHERE TenantID = $1 
        AND IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId]);
    return result.rows[0];
  }

  // Create default meal settings for a tenant
  static async createDefaultMealSettings(tenantId, createdBy = 'SYSTEM') {
    const sql = `
      INSERT INTO MealSettings (
        TenantID,
        LunchBookingStartTime, LunchBookingEndTime, LunchStartTime, LunchEndTime,
        DinnerBookingStartTime, DinnerBookingEndTime, DinnerStartTime, DinnerEndTime,
        IsActive, CreatedBy, UpdatedBy, CreatedDate, UpdatedDate
      ) VALUES (
        $1, 
        '10:00:00', '12:00:00', '13:00:00', '15:00:00',
        '16:00:00', '18:00:00', '19:00:00', '21:00:00',
        'Y', $2, $2, NOW(), NOW()
      )
      RETURNING 
        MealSettingID as "mealSettingId",
        TenantID as "tenantId",
        LunchBookingStartTime as "lunchBookingStartTime",
        LunchBookingEndTime as "lunchBookingEndTime",
        LunchStartTime as "lunchStartTime", 
        LunchEndTime as "lunchEndTime",
        DinnerBookingStartTime as "dinnerBookingStartTime",
        DinnerBookingEndTime as "dinnerBookingEndTime",
        DinnerStartTime as "dinnerStartTime",
        DinnerEndTime as "dinnerEndTime"
    `;

    const result = await query(sql, [tenantId, createdBy]);
    return result.rows[0];
  }

  // Update meal settings
  static async updateMealSettings(tenantId, settingsData, updatedBy) {
    const {
      lunchBookingStartTime,
      lunchBookingEndTime,
      lunchStartTime,
      lunchEndTime,
      dinnerBookingStartTime,
      dinnerBookingEndTime,
      dinnerStartTime,
      dinnerEndTime
    } = settingsData;

    const sql = `
      UPDATE MealSettings 
      SET 
        LunchBookingStartTime = $2,
        LunchBookingEndTime = $3,
        LunchStartTime = $4,
        LunchEndTime = $5,
        DinnerBookingStartTime = $6,
        DinnerBookingEndTime = $7,
        DinnerStartTime = $8,
        DinnerEndTime = $9,
        UpdatedBy = $10,
        UpdatedDate = NOW()
      WHERE TenantID = $1 
        AND IsActive = 'Y'
      RETURNING 
        MealSettingID as "mealSettingId",
        TenantID as "tenantId",
        LunchBookingStartTime as "lunchBookingStartTime",
        LunchBookingEndTime as "lunchBookingEndTime",
        LunchStartTime as "lunchStartTime",
        LunchEndTime as "lunchEndTime", 
        DinnerBookingStartTime as "dinnerBookingStartTime",
        DinnerBookingEndTime as "dinnerBookingEndTime",
        DinnerStartTime as "dinnerStartTime",
        DinnerEndTime as "dinnerEndTime",
        UpdatedDate as "updatedDate"
    `;

    const result = await query(sql, [
      tenantId,
      lunchBookingStartTime,
      lunchBookingEndTime,
      lunchStartTime,
      lunchEndTime,
      dinnerBookingStartTime,
      dinnerBookingEndTime,
      dinnerStartTime,
      dinnerEndTime,
      updatedBy
    ]);

    return result.rows[0];
  }

  // Get or create meal settings (helper method)
  static async getOrCreateMealSettings(tenantId, createdBy = 'SYSTEM') {
    let settings = await this.getMealSettings(tenantId);
    
    if (!settings) {
      settings = await this.createDefaultMealSettings(tenantId, createdBy);
    }
    
    return settings;
  }

  // Validate time format (HH:MM:SS or HH:MM)
  static validateTimeFormat(timeString) {
    if (!timeString) return false;
    
    // Match HH:MM or HH:MM:SS format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return timeRegex.test(timeString);
  }

  // Convert time string to minutes for comparison
  static timeToMinutes(timeString) {
    if (!timeString) return 0;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Validate meal time logic
  static validateMealTimes(settingsData) {
    const {
      lunchBookingStartTime,
      lunchBookingEndTime,
      lunchStartTime,
      lunchEndTime,
      dinnerBookingStartTime,
      dinnerBookingEndTime,
      dinnerStartTime,
      dinnerEndTime
    } = settingsData;

    const errors = [];

    // Validate time formats
    const timeFields = [
      { field: 'lunchBookingStartTime', value: lunchBookingStartTime },
      { field: 'lunchBookingEndTime', value: lunchBookingEndTime },
      { field: 'lunchStartTime', value: lunchStartTime },
      { field: 'lunchEndTime', value: lunchEndTime },
      { field: 'dinnerBookingStartTime', value: dinnerBookingStartTime },
      { field: 'dinnerBookingEndTime', value: dinnerBookingEndTime },
      { field: 'dinnerStartTime', value: dinnerStartTime },
      { field: 'dinnerEndTime', value: dinnerEndTime }
    ];

    timeFields.forEach(({ field, value }) => {
      if (!this.validateTimeFormat(value)) {
        errors.push(`${field} must be in HH:MM or HH:MM:SS format`);
      }
    });

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Convert to minutes for comparison
    const lunchBookingStart = this.timeToMinutes(lunchBookingStartTime);
    const lunchBookingEnd = this.timeToMinutes(lunchBookingEndTime);
    const lunchStart = this.timeToMinutes(lunchStartTime);
    const lunchEnd = this.timeToMinutes(lunchEndTime);
    const dinnerBookingStart = this.timeToMinutes(dinnerBookingStartTime);
    const dinnerBookingEnd = this.timeToMinutes(dinnerBookingEndTime);
    const dinnerStart = this.timeToMinutes(dinnerStartTime);
    const dinnerEnd = this.timeToMinutes(dinnerEndTime);

    // Validate lunch times
    if (lunchBookingStart >= lunchBookingEnd) {
      errors.push('Lunch booking start time must be before lunch booking end time');
    }
    if (lunchStart >= lunchEnd) {
      errors.push('Lunch start time must be before lunch end time');
    }
    if (lunchBookingEnd > lunchStart) {
      errors.push('Lunch booking must end before lunch serving starts');
    }

    // Validate dinner times
    if (dinnerBookingStart >= dinnerBookingEnd) {
      errors.push('Dinner booking start time must be before dinner booking end time');
    }
    if (dinnerStart >= dinnerEnd) {
      errors.push('Dinner start time must be before dinner end time');
    }
    if (dinnerBookingEnd > dinnerStart) {
      errors.push('Dinner booking must end before dinner serving starts');
    }

    // Check overlap between lunch and dinner
    if (lunchEnd > dinnerBookingStart) {
      errors.push('Lunch serving should end before dinner booking starts');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get current meal type based on tenant settings and current time
  static async getCurrentMealType(tenantId) {
    const settings = await this.getMealSettings(tenantId);
    
    if (!settings) {
      // Fallback to default timings if no settings found
      return this.getCurrentMealTypeDefault();
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    const currentMinutes = this.timeToMinutes(currentTime);

    const lunchStart = this.timeToMinutes(settings.lunchStartTime);
    const lunchEnd = this.timeToMinutes(settings.lunchEndTime);
    const dinnerStart = this.timeToMinutes(settings.dinnerStartTime);
    const dinnerEnd = this.timeToMinutes(settings.dinnerEndTime);

    if (currentMinutes >= lunchStart && currentMinutes < lunchEnd) {
      return 'lunch';
    } else if (currentMinutes >= dinnerStart && currentMinutes < dinnerEnd) {
      return 'dinner';
    }
    
    return null; // Outside meal timing windows
  }

  // Fallback method for default meal timings
  static getCurrentMealTypeDefault() {
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour >= 13 && currentHour < 15) {
      return 'lunch';
    } else if (currentHour >= 19 && currentHour < 21) {
      return 'dinner';
    }
    
    return null;
  }

  // Check if booking is allowed for a meal type
  static async isBookingAllowed(tenantId, mealType) {
    const settings = await this.getMealSettings(tenantId);
    
    if (!settings) {
      return false;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    const currentMinutes = this.timeToMinutes(currentTime);

    if (mealType === 'lunch') {
      const bookingStart = this.timeToMinutes(settings.lunchBookingStartTime);
      const bookingEnd = this.timeToMinutes(settings.lunchBookingEndTime);
      return currentMinutes >= bookingStart && currentMinutes <= bookingEnd;
    } else if (mealType === 'dinner') {
      const bookingStart = this.timeToMinutes(settings.dinnerBookingStartTime);
      const bookingEnd = this.timeToMinutes(settings.dinnerBookingEndTime);
      return currentMinutes >= bookingStart && currentMinutes <= bookingEnd;
    }

    return false;
  }
}

module.exports = MealSettingsModel;