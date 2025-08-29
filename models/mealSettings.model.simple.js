const { query } = require("../config/database");

class MealSettingsModelSimple {
  // Get simplified meal settings for testing - only essential columns
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
        
        IsActive as "isActive",
        CreatedDate as "createdDate",
        UpdatedDate as "updatedDate",
        CreatedBy as "createdBy",
        UpdatedBy as "updatedBy"
      FROM MealSettings
      WHERE TenantID = $1 
        AND IsActive = 'Y'
    `;

    // console.log('Executing simple MealSettings query for tenantId:', tenantId);
    const result = await query(sql, [tenantId]);
    // console.log('Simple MealSettings query result:', result.rows.length, 'rows');
    return result.rows[0];
  }
}

module.exports = MealSettingsModelSimple;