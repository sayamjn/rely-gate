const { query } = require("../config/database");

class MealSettingsModel {
  // Get enhanced meal settings for a tenant with day-wise configuration
  static async getMealSettings(tenantId) {
    const sql = `
      SELECT 
        MealSettingID as "mealSettingId",
        TenantID as "tenantId",
        
        -- Lunch Enable/Disable for each day
        LunchEnabledMonday as "lunchEnabledMonday",
        LunchEnabledTuesday as "lunchEnabledTuesday",
        LunchEnabledWednesday as "lunchEnabledWednesday",
        LunchEnabledThursday as "lunchEnabledThursday",
        LunchEnabledFriday as "lunchEnabledFriday",
        LunchEnabledSaturday as "lunchEnabledSaturday",
        LunchEnabledSunday as "lunchEnabledSunday",
        
        -- Dinner Enable/Disable for each day
        DinnerEnabledMonday as "dinnerEnabledMonday",
        DinnerEnabledTuesday as "dinnerEnabledTuesday",
        DinnerEnabledWednesday as "dinnerEnabledWednesday",
        DinnerEnabledThursday as "dinnerEnabledThursday",
        DinnerEnabledFriday as "dinnerEnabledFriday",
        DinnerEnabledSaturday as "dinnerEnabledSaturday",
        DinnerEnabledSunday as "dinnerEnabledSunday",
        
        -- Lunch Booking Times
        LunchBookingStartMonday as "lunchBookingStartMonday",
        LunchBookingEndMonday as "lunchBookingEndMonday",
        LunchBookingStartTuesday as "lunchBookingStartTuesday",
        LunchBookingEndTuesday as "lunchBookingEndTuesday",
        LunchBookingStartWednesday as "lunchBookingStartWednesday",
        LunchBookingEndWednesday as "lunchBookingEndWednesday",
        LunchBookingStartThursday as "lunchBookingStartThursday",
        LunchBookingEndThursday as "lunchBookingEndThursday",
        LunchBookingStartFriday as "lunchBookingStartFriday",
        LunchBookingEndFriday as "lunchBookingEndFriday",
        LunchBookingStartSaturday as "lunchBookingStartSaturday",
        LunchBookingEndSaturday as "lunchBookingEndSaturday",
        LunchBookingStartSunday as "lunchBookingStartSunday",
        LunchBookingEndSunday as "lunchBookingEndSunday",
        
        -- Lunch Meal Times
        LunchStartMonday as "lunchStartMonday",
        LunchEndMonday as "lunchEndMonday",
        LunchStartTuesday as "lunchStartTuesday",
        LunchEndTuesday as "lunchEndTuesday",
        LunchStartWednesday as "lunchStartWednesday",
        LunchEndWednesday as "lunchEndWednesday",
        LunchStartThursday as "lunchStartThursday",
        LunchEndThursday as "lunchEndThursday",
        LunchStartFriday as "lunchStartFriday",
        LunchEndFriday as "lunchEndFriday",
        LunchStartSaturday as "lunchStartSaturday",
        LunchEndSaturday as "lunchEndSaturday",
        LunchStartSunday as "lunchStartSunday",
        LunchEndSunday as "lunchEndSunday",
        
        -- Dinner Booking Times
        DinnerBookingStartMonday as "dinnerBookingStartMonday",
        DinnerBookingEndMonday as "dinnerBookingEndMonday",
        DinnerBookingStartTuesday as "dinnerBookingStartTuesday",
        DinnerBookingEndTuesday as "dinnerBookingEndTuesday",
        DinnerBookingStartWednesday as "dinnerBookingStartWednesday",
        DinnerBookingEndWednesday as "dinnerBookingEndWednesday",
        DinnerBookingStartThursday as "dinnerBookingStartThursday",
        DinnerBookingEndThursday as "dinnerBookingEndThursday",
        DinnerBookingStartFriday as "dinnerBookingStartFriday",
        DinnerBookingEndFriday as "dinnerBookingEndFriday",
        DinnerBookingStartSaturday as "dinnerBookingStartSaturday",
        DinnerBookingEndSaturday as "dinnerBookingEndSaturday",
        DinnerBookingStartSunday as "dinnerBookingStartSunday",
        DinnerBookingEndSunday as "dinnerBookingEndSunday",
        
        -- Dinner Meal Times
        DinnerStartMonday as "dinnerStartMonday",
        DinnerEndMonday as "dinnerEndMonday",
        DinnerStartTuesday as "dinnerStartTuesday",
        DinnerEndTuesday as "dinnerEndTuesday",
        DinnerStartWednesday as "dinnerStartWednesday",
        DinnerEndWednesday as "dinnerEndWednesday",
        DinnerStartThursday as "dinnerStartThursday",
        DinnerEndThursday as "dinnerEndThursday",
        DinnerStartFriday as "dinnerStartFriday",
        DinnerEndFriday as "dinnerEndFriday",
        DinnerStartSaturday as "dinnerStartSaturday",
        DinnerEndSaturday as "dinnerEndSaturday",
        DinnerStartSunday as "dinnerStartSunday",
        DinnerEndSunday as "dinnerEndSunday",
        
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

  // Get legacy meal settings (for backward compatibility)
  static async getLegacyMealSettings(tenantId) {
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

  // Create default enhanced meal settings for a tenant
  static async createDefaultMealSettings(tenantId, createdBy = 'SYSTEM') {
    const sql = `
      INSERT INTO MealSettings (
        TenantID,
        -- All meals enabled by default
        LunchEnabledMonday, LunchEnabledTuesday, LunchEnabledWednesday, LunchEnabledThursday, 
        LunchEnabledFriday, LunchEnabledSaturday, LunchEnabledSunday,
        DinnerEnabledMonday, DinnerEnabledTuesday, DinnerEnabledWednesday, DinnerEnabledThursday, 
        DinnerEnabledFriday, DinnerEnabledSaturday, DinnerEnabledSunday,
        
        -- Default lunch booking times for all days
        LunchBookingStartMonday, LunchBookingEndMonday, LunchBookingStartTuesday, LunchBookingEndTuesday,
        LunchBookingStartWednesday, LunchBookingEndWednesday, LunchBookingStartThursday, LunchBookingEndThursday,
        LunchBookingStartFriday, LunchBookingEndFriday, LunchBookingStartSaturday, LunchBookingEndSaturday,
        LunchBookingStartSunday, LunchBookingEndSunday,
        
        -- Default lunch meal times for all days
        LunchStartMonday, LunchEndMonday, LunchStartTuesday, LunchEndTuesday,
        LunchStartWednesday, LunchEndWednesday, LunchStartThursday, LunchEndThursday,
        LunchStartFriday, LunchEndFriday, LunchStartSaturday, LunchEndSaturday,
        LunchStartSunday, LunchEndSunday,
        
        -- Default dinner booking times for all days
        DinnerBookingStartMonday, DinnerBookingEndMonday, DinnerBookingStartTuesday, DinnerBookingEndTuesday,
        DinnerBookingStartWednesday, DinnerBookingEndWednesday, DinnerBookingStartThursday, DinnerBookingEndThursday,
        DinnerBookingStartFriday, DinnerBookingEndFriday, DinnerBookingStartSaturday, DinnerBookingEndSaturday,
        DinnerBookingStartSunday, DinnerBookingEndSunday,
        
        -- Default dinner meal times for all days
        DinnerStartMonday, DinnerEndMonday, DinnerStartTuesday, DinnerEndTuesday,
        DinnerStartWednesday, DinnerEndWednesday, DinnerStartThursday, DinnerEndThursday,
        DinnerStartFriday, DinnerEndFriday, DinnerStartSaturday, DinnerEndSaturday,
        DinnerStartSunday, DinnerEndSunday,
        
        IsActive, CreatedBy, UpdatedBy, CreatedDate, UpdatedDate
      ) VALUES (
        $1,
        -- Enable all meals
        true, true, true, true, true, true, true,
        true, true, true, true, true, true, true,
        
        -- Lunch booking times (10:00-12:00 for all days)
        '10:00:00', '12:00:00', '10:00:00', '12:00:00', '10:00:00', '12:00:00', '10:00:00', '12:00:00',
        '10:00:00', '12:00:00', '10:00:00', '12:00:00', '10:00:00', '12:00:00',
        
        -- Lunch meal times (13:00-15:00 for all days)
        '13:00:00', '15:00:00', '13:00:00', '15:00:00', '13:00:00', '15:00:00', '13:00:00', '15:00:00',
        '13:00:00', '15:00:00', '13:00:00', '15:00:00', '13:00:00', '15:00:00',
        
        -- Dinner booking times (16:00-18:00 for all days)
        '16:00:00', '18:00:00', '16:00:00', '18:00:00', '16:00:00', '18:00:00', '16:00:00', '18:00:00',
        '16:00:00', '18:00:00', '16:00:00', '18:00:00', '16:00:00', '18:00:00',
        
        -- Dinner meal times (19:00-21:00 for all days)
        '19:00:00', '21:00:00', '19:00:00', '21:00:00', '19:00:00', '21:00:00', '19:00:00', '21:00:00',
        '19:00:00', '21:00:00', '19:00:00', '21:00:00', '19:00:00', '21:00:00',
        
        'Y', $2, $2, NOW(), NOW()
      )
      RETURNING *
    `;

    const result = await query(sql, [tenantId, createdBy]);
    return result.rows[0];
  }

  // Update enhanced meal settings
  static async updateMealSettings(tenantId, settingsData, updatedBy) {
    // Build dynamic SQL based on provided fields
    const updateFields = [];
    const values = [tenantId];
    let paramIndex = 2;

    // Helper function to add field to update
    const addField = (dbField, dataField) => {
      if (settingsData[dataField] !== undefined) {
        updateFields.push(`${dbField} = $${paramIndex}`);
        values.push(settingsData[dataField]);
        paramIndex++;
      }
    };

    // Enable/Disable fields
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
      addField(`LunchEnabled${day}`, `lunchEnabled${day}`);
      addField(`DinnerEnabled${day}`, `dinnerEnabled${day}`);
      addField(`LunchBookingStart${day}`, `lunchBookingStart${day}`);
      addField(`LunchBookingEnd${day}`, `lunchBookingEnd${day}`);
      addField(`LunchStart${day}`, `lunchStart${day}`);
      addField(`LunchEnd${day}`, `lunchEnd${day}`);
      addField(`DinnerBookingStart${day}`, `dinnerBookingStart${day}`);
      addField(`DinnerBookingEnd${day}`, `dinnerBookingEnd${day}`);
      addField(`DinnerStart${day}`, `dinnerStart${day}`);
      addField(`DinnerEnd${day}`, `dinnerEnd${day}`);
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields provided for update');
    }

    // Add UpdatedBy and UpdatedDate
    updateFields.push(`UpdatedBy = $${paramIndex}`, `UpdatedDate = NOW()`);
    values.push(updatedBy);

    const sql = `
      UPDATE MealSettings 
      SET ${updateFields.join(', ')}
      WHERE TenantID = $1 AND IsActive = 'Y'
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Legacy update method for backward compatibility
  static async updateLegacyMealSettings(tenantId, settingsData, updatedBy) {
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

  // Get current day name
  static getCurrentDayName() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    return days[now.getDay()];
  }

  // Get meal settings for current day
  static getCurrentDaySettings(settings) {
    const currentDay = this.getCurrentDayName();
    
    return {
      lunchEnabled: settings[`lunchEnabled${currentDay}`],
      dinnerEnabled: settings[`dinnerEnabled${currentDay}`],
      lunchBookingStart: settings[`lunchBookingStart${currentDay}`],
      lunchBookingEnd: settings[`lunchBookingEnd${currentDay}`],
      lunchStart: settings[`lunchStart${currentDay}`],
      lunchEnd: settings[`lunchEnd${currentDay}`],
      dinnerBookingStart: settings[`dinnerBookingStart${currentDay}`],
      dinnerBookingEnd: settings[`dinnerBookingEnd${currentDay}`],
      dinnerStart: settings[`dinnerStart${currentDay}`],
      dinnerEnd: settings[`dinnerEnd${currentDay}`]
    };
  }

  // Get current meal type based on enhanced tenant settings and current time
  static async getCurrentMealType(tenantId) {
    const settings = await this.getMealSettings(tenantId);
    
    if (!settings) {
      // Fallback to default timings if no settings found
      return this.getCurrentMealTypeDefault();
    }

    const daySettings = this.getCurrentDaySettings(settings);
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    const currentMinutes = this.timeToMinutes(currentTime);

    // Check if lunch is enabled and within lunch time
    if (daySettings.lunchEnabled) {
      const lunchStart = this.timeToMinutes(daySettings.lunchStart);
      const lunchEnd = this.timeToMinutes(daySettings.lunchEnd);
      
      if (currentMinutes >= lunchStart && currentMinutes < lunchEnd) {
        return 'lunch';
      }
    }

    // Check if dinner is enabled and within dinner time
    if (daySettings.dinnerEnabled) {
      const dinnerStart = this.timeToMinutes(daySettings.dinnerStart);
      const dinnerEnd = this.timeToMinutes(daySettings.dinnerEnd);
      
      if (currentMinutes >= dinnerStart && currentMinutes < dinnerEnd) {
        return 'dinner';
      }
    }
    
    return null; // Outside meal timing windows or meals disabled
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

  // Check if booking is allowed for a meal type (enhanced version)
  static async isBookingAllowed(tenantId, mealType) {
    const settings = await this.getMealSettings(tenantId);
    
    if (!settings) {
      return false;
    }

    const daySettings = this.getCurrentDaySettings(settings);
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    const currentMinutes = this.timeToMinutes(currentTime);

    if (mealType === 'lunch') {
      // Check if lunch is enabled for current day
      if (!daySettings.lunchEnabled) {
        return false;
      }
      
      const bookingStart = this.timeToMinutes(daySettings.lunchBookingStart);
      const bookingEnd = this.timeToMinutes(daySettings.lunchBookingEnd);
      return currentMinutes >= bookingStart && currentMinutes <= bookingEnd;
    } else if (mealType === 'dinner') {
      // Check if dinner is enabled for current day
      if (!daySettings.dinnerEnabled) {
        return false;
      }
      
      const bookingStart = this.timeToMinutes(daySettings.dinnerBookingStart);
      const bookingEnd = this.timeToMinutes(daySettings.dinnerBookingEnd);
      return currentMinutes >= bookingStart && currentMinutes <= bookingEnd;
    }

    return false;
  }

  // Get meal settings for a specific day
  static async getMealSettingsForDay(tenantId, dayName) {
    const settings = await this.getMealSettings(tenantId);
    
    if (!settings) {
      return null;
    }

    return {
      lunchEnabled: settings[`lunchEnabled${dayName}`],
      dinnerEnabled: settings[`dinnerEnabled${dayName}`],
      lunchBookingStart: settings[`lunchBookingStart${dayName}`],
      lunchBookingEnd: settings[`lunchBookingEnd${dayName}`],
      lunchStart: settings[`lunchStart${dayName}`],
      lunchEnd: settings[`lunchEnd${dayName}`],
      dinnerBookingStart: settings[`dinnerBookingStart${dayName}`],
      dinnerBookingEnd: settings[`dinnerBookingEnd${dayName}`],
      dinnerStart: settings[`dinnerStart${dayName}`],
      dinnerEnd: settings[`dinnerEnd${dayName}`]
    };
  }

  // Validate day-wise meal settings
  static validateDayWiseMealSettings(settingsData) {
    const errors = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    days.forEach(day => {
      const lunchEnabled = settingsData[`lunchEnabled${day}`];
      const dinnerEnabled = settingsData[`dinnerEnabled${day}`];

      // Only validate times if meal is enabled
      if (lunchEnabled) {
        const lunchBookingStart = settingsData[`lunchBookingStart${day}`];
        const lunchBookingEnd = settingsData[`lunchBookingEnd${day}`];
        const lunchStart = settingsData[`lunchStart${day}`];
        const lunchEnd = settingsData[`lunchEnd${day}`];

        if (lunchBookingStart && lunchBookingEnd && lunchStart && lunchEnd) {
          const bookingStartMin = this.timeToMinutes(lunchBookingStart);
          const bookingEndMin = this.timeToMinutes(lunchBookingEnd);
          const startMin = this.timeToMinutes(lunchStart);
          const endMin = this.timeToMinutes(lunchEnd);

          if (bookingStartMin >= bookingEndMin) {
            errors.push(`${day}: Lunch booking start time must be before booking end time`);
          }
          if (startMin >= endMin) {
            errors.push(`${day}: Lunch start time must be before lunch end time`);
          }
          if (bookingEndMin > startMin) {
            errors.push(`${day}: Lunch booking must end before lunch serving starts`);
          }
        }
      }

      if (dinnerEnabled) {
        const dinnerBookingStart = settingsData[`dinnerBookingStart${day}`];
        const dinnerBookingEnd = settingsData[`dinnerBookingEnd${day}`];
        const dinnerStart = settingsData[`dinnerStart${day}`];
        const dinnerEnd = settingsData[`dinnerEnd${day}`];

        if (dinnerBookingStart && dinnerBookingEnd && dinnerStart && dinnerEnd) {
          const bookingStartMin = this.timeToMinutes(dinnerBookingStart);
          const bookingEndMin = this.timeToMinutes(dinnerBookingEnd);
          const startMin = this.timeToMinutes(dinnerStart);
          const endMin = this.timeToMinutes(dinnerEnd);

          if (bookingStartMin >= bookingEndMin) {
            errors.push(`${day}: Dinner booking start time must be before booking end time`);
          }
          if (startMin >= endMin) {
            errors.push(`${day}: Dinner start time must be before dinner end time`);
          }
          if (bookingEndMin > startMin) {
            errors.push(`${day}: Dinner booking must end before dinner serving starts`);
          }
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = MealSettingsModel;