const { query } = require('../config/database');

class MessModel {

  // ===== MENU MANAGEMENT =====

  // Get menu for specific date and meal type
  static async getMenu(tenantId, menuDate, mealType = null) {
    let sql = `
      SELECT 
        MenuID as "menuId",
        TenantID as "tenantId", 
        MenuDate as "menuDate",
        MealType as "mealType",
        MenuItems as "menuItems",
        MenuDescription as "menuDescription",
        IsVegetarian as "isVegetarian",
        IsAvailable as "isAvailable",
        CreatedDate as "createdDate",
        UpdatedDate as "updatedDate",
        CreatedBy as "createdBy",
        UpdatedBy as "updatedBy"
      FROM MessMenu
      WHERE TenantID = $1 
        AND MenuDate = $2
        AND IsActive = 'Y'
    `;
    
    const params = [tenantId, menuDate];
    
    if (mealType) {
      sql += ` AND MealType = $3`;
      params.push(mealType);
    }
    
    sql += ` ORDER BY 
      CASE MealType 
        WHEN 'breakfast' THEN 1 
        WHEN 'lunch' THEN 2 
        WHEN 'dinner' THEN 3 
      END`;
    
    const result = await query(sql, params);
    return result.rows;
  }

  // Get weekly menu (7 days from given start date)
  static async getWeeklyMenu(tenantId, startDate) {
    const sql = `
      SELECT 
        MenuID as "menuId",
        MenuDate as "menuDate",
        MealType as "mealType",
        MenuItems as "menuItems", 
        MenuDescription as "menuDescription",
        IsVegetarian as "isVegetarian",
        IsAvailable as "isAvailable"
      FROM MessMenu
      WHERE TenantID = $1 
        AND MenuDate >= $2 
        AND MenuDate < $2::date + interval '7 days'
        AND IsActive = 'Y'
      ORDER BY MenuDate, 
        CASE MealType 
          WHEN 'breakfast' THEN 1 
          WHEN 'lunch' THEN 2 
          WHEN 'dinner' THEN 3 
        END
    `;
    
    const result = await query(sql, [tenantId, startDate]);
    return result.rows;
  }

  // Create or update menu
  static async createOrUpdateMenu(tenantId, menuData, createdBy) {
    const { menuDate, mealType, menuItems, menuDescription, isVegetarian, isAvailable } = menuData;
    
    const sql = `
      INSERT INTO MessMenu (
        TenantID, MenuDate, MealType, MenuItems, MenuDescription, 
        IsVegetarian, IsAvailable, CreatedBy, UpdatedBy
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      ON CONFLICT (TenantID, MenuDate, MealType)
      DO UPDATE SET
        MenuItems = EXCLUDED.MenuItems,
        MenuDescription = EXCLUDED.MenuDescription,
        IsVegetarian = EXCLUDED.IsVegetarian,
        IsAvailable = EXCLUDED.IsAvailable,
        UpdatedDate = CURRENT_TIMESTAMP,
        UpdatedBy = EXCLUDED.UpdatedBy
      RETURNING 
        MenuID as "menuId",
        MenuDate as "menuDate",
        MealType as "mealType",
        MenuItems as "menuItems",
        MenuDescription as "menuDescription",
        IsVegetarian as "isVegetarian",
        IsAvailable as "isAvailable"
    `;
    
    const result = await query(sql, [
      tenantId, menuDate, mealType, menuItems, menuDescription || '',
      isVegetarian || true, isAvailable || true, createdBy
    ]);
    
    return result.rows[0];
  }

  // Update existing menu
  static async updateMenu(tenantId, menuId, updateData, updatedBy) {
    const { menuItems, menuDescription, isVegetarian, isAvailable } = updateData;
    
    const sql = `
      UPDATE MessMenu 
      SET MenuItems = COALESCE($3, MenuItems),
          MenuDescription = COALESCE($4, MenuDescription),
          IsVegetarian = COALESCE($5, IsVegetarian),
          IsAvailable = COALESCE($6, IsAvailable),
          UpdatedDate = CURRENT_TIMESTAMP,
          UpdatedBy = $7
      WHERE TenantID = $1 
        AND MenuID = $2 
        AND IsActive = 'Y'
      RETURNING 
        MenuID as "menuId",
        MenuDate as "menuDate", 
        MealType as "mealType",
        MenuItems as "menuItems",
        MenuDescription as "menuDescription",
        IsVegetarian as "isVegetarian",
        IsAvailable as "isAvailable"
    `;
    
    const result = await query(sql, [
      tenantId, menuId, menuItems, menuDescription, 
      isVegetarian, isAvailable, updatedBy
    ]);
    
    return result.rows[0];
  }

  // Delete menu (soft delete)
  static async deleteMenu(tenantId, menuId) {
    const sql = `
      UPDATE MessMenu 
      SET IsActive = 'N', UpdatedDate = CURRENT_TIMESTAMP
      WHERE TenantID = $1 AND MenuID = $2
    `;
    
    const result = await query(sql, [tenantId, menuId]);
    return result.rowCount > 0;
  }

  // ===== MEAL REGISTRATION QUERIES =====

  // Get meal registrations list (leverages existing MealMaster)
  static async getMealRegistrationsList(tenantId, mealDate, mealType = null) {
    let sql = `
      SELECT 
        m.MealID as "mealId",
        m.StudentID as "studentId",
        m.StudentName as "studentName",
        m.StudentRegNo as "studentRegNo",
        m.Mobile as "mobile",
        m.Course as "course",
        m.Hostel as "hostel",
        m.MealType as "mealType",
        m.MealDate as "mealDate",
        m.TokenNumber as "tokenNumber",
        m.Status as "status",
        m.IsSpecial as "isSpecial",
        m.SpecialRemarks as "specialRemarks",
        m.IsConsumed as "isConsumed",
        m.ConsumedTime as "consumedTime",
        m.MealTime as "registrationTime",
        -- Include menu info if available
        menu.MenuItems as "menuItems",
        menu.MenuDescription as "menuDescription"
      FROM MealMaster m
      LEFT JOIN MessMenu menu ON (
        m.TenantID = menu.TenantID 
        AND m.MealDate = menu.MenuDate 
        AND m.MealType = menu.MealType 
        AND menu.IsActive = 'Y'
      )
      WHERE m.TenantID = $1 
        AND m.MealDate = $2
        AND m.IsActive = 'Y'
        AND m.Status = 'confirmed'
    `;
    
    const params = [tenantId, mealDate];
    
    if (mealType) {
      sql += ` AND m.MealType = $3`;
      params.push(mealType);
    }
    
    sql += ` ORDER BY m.TokenNumber, m.MealTime`;
    
    const result = await query(sql, params);
    return result.rows;
  }

  // Get student meal status
  static async getStudentMealStatus(tenantId, studentId, mealDate) {
    const sql = `
      SELECT 
        MealID as "mealId",
        MealType as "mealType",
        TokenNumber as "tokenNumber",
        Status as "status",
        IsSpecial as "isSpecial",
        SpecialRemarks as "specialRemarks",
        IsConsumed as "isConsumed",
        ConsumedTime as "consumedTime",
        MealTime as "registrationTime"
      FROM MealMaster
      WHERE TenantID = $1 
        AND StudentID = $2 
        AND MealDate = $3
        AND IsActive = 'Y'
      ORDER BY 
        CASE MealType 
          WHEN 'breakfast' THEN 1 
          WHEN 'lunch' THEN 2 
          WHEN 'dinner' THEN 3 
        END
    `;
    
    const result = await query(sql, [tenantId, studentId, mealDate]);
    return result.rows;
  }

  // ===== SPECIAL MEAL REQUESTS =====

  // Get special meal requests (from existing MealMaster)
  static async getSpecialMealRequests(tenantId, mealDate = null, mealType = null, status = null) {
    let sql = `
      SELECT 
        MealID as "mealId",
        StudentID as "studentId",
        StudentName as "studentName",
        StudentRegNo as "studentRegNo",
        Mobile as "mobile",
        Course as "course",
        MealType as "mealType",
        MealDate as "mealDate",
        TokenNumber as "tokenNumber",
        SpecialRemarks as "specialRemarks",
        Status as "status",
        IsConsumed as "isConsumed",
        ConsumedTime as "consumedTime",
        MealTime as "registrationTime"
      FROM MealMaster
      WHERE TenantID = $1 
        AND IsSpecial = 'Y'
        AND IsActive = 'Y'
    `;
    
    const params = [tenantId];
    
    if (mealDate) {
      sql += ` AND MealDate = $${params.length + 1}`;
      params.push(mealDate);
    }
    
    if (mealType) {
      sql += ` AND MealType = $${params.length + 1}`;
      params.push(mealType);
    }
    
    if (status) {
      sql += ` AND Status = $${params.length + 1}`;
      params.push(status);
    }
    
    sql += ` ORDER BY MealDate DESC, MealTime DESC`;
    
    const result = await query(sql, params);
    return result.rows;
  }

  // Update special meal request (in existing MealMaster)
  static async updateSpecialMealRequest(tenantId, mealId, updateData, updatedBy) {
    const { specialRemarks, status } = updateData;
    
    const sql = `
      UPDATE MealMaster 
      SET SpecialRemarks = COALESCE($3, SpecialRemarks),
          Status = COALESCE($4, Status),
          UpdatedDate = CURRENT_TIMESTAMP,
          UpdatedBy = $5
      WHERE TenantID = $1 
        AND MealID = $2 
        AND IsActive = 'Y'
        AND IsSpecial = 'Y'
      RETURNING 
        MealID as "mealId",
        StudentName as "studentName",
        MealType as "mealType",
        SpecialRemarks as "specialRemarks",
        Status as "status"
    `;
    
    const result = await query(sql, [tenantId, mealId, specialRemarks, status, updatedBy]);
    return result.rows[0];
  }

  // ===== CONSUMPTION TRACKING =====

  // Get meal consumption details
  static async getMealConsumption(tenantId, mealDate, mealType = null) {
    let sql = `
      SELECT 
        MealID as "mealId",
        StudentID as "studentId",
        StudentName as "studentName",
        StudentRegNo as "studentRegNo",
        MealType as "mealType",
        TokenNumber as "tokenNumber",
        IsConsumed as "isConsumed",
        ConsumedTime as "consumedTime",
        IsSpecial as "isSpecial",
        SpecialRemarks as "specialRemarks",
        Status as "status"
      FROM MealMaster
      WHERE TenantID = $1 
        AND MealDate = $2
        AND IsActive = 'Y'
        AND Status = 'confirmed'
    `;
    
    const params = [tenantId, mealDate];
    
    if (mealType) {
      sql += ` AND MealType = $3`;
      params.push(mealType);
    }
    
    sql += ` ORDER BY TokenNumber, ConsumedTime DESC NULLS LAST`;
    
    const result = await query(sql, params);
    return result.rows;
  }

  // Mark meal as consumed (by mess staff)
  static async markMealConsumption(tenantId, mealId, consumedBy) {
    const sql = `
      UPDATE MealMaster 
      SET IsConsumed = 'Y',
          ConsumedTime = CURRENT_TIMESTAMP,
          UpdatedDate = CURRENT_TIMESTAMP,
          UpdatedBy = $3
      WHERE TenantID = $1 
        AND MealID = $2 
        AND IsActive = 'Y'
        AND Status = 'confirmed'
        AND IsConsumed = 'N'
      RETURNING 
        MealID as "mealId",
        StudentName as "studentName",
        MealType as "mealType",
        TokenNumber as "tokenNumber",
        ConsumedTime as "consumedTime"
    `;
    
    const result = await query(sql, [tenantId, mealId, consumedBy]);
    return result.rows[0];
  }

  // ===== ANALYTICS =====

  // Get mess dashboard data
  static async getMessDashboardData(tenantId, mealDate) {
    const sql = `
      SELECT 
        MealType as "mealType",
        COUNT(*) as "totalRegistrations",
        COUNT(CASE WHEN IsConsumed = 'Y' THEN 1 END) as "totalConsumed",
        COUNT(CASE WHEN IsConsumed = 'N' THEN 1 END) as "totalPending",
        COUNT(CASE WHEN IsSpecial = 'Y' THEN 1 END) as "specialRequests",
        COUNT(CASE WHEN IsSpecial = 'Y' AND IsConsumed = 'Y' THEN 1 END) as "specialConsumed"
      FROM MealMaster
      WHERE TenantID = $1 
        AND MealDate = $2
        AND IsActive = 'Y'
        AND Status = 'confirmed'
      GROUP BY MealType
      ORDER BY 
        CASE MealType 
          WHEN 'breakfast' THEN 1 
          WHEN 'lunch' THEN 2 
          WHEN 'dinner' THEN 3 
        END
    `;
    
    const result = await query(sql, [tenantId, mealDate]);
    return result.rows;
  }

  // Get mess analytics for date range
  static async getMessAnalytics(tenantId, fromDate, toDate) {
    const sql = `
      SELECT 
        MealDate as "mealDate",
        MealType as "mealType",
        COUNT(*) as "totalRegistrations",
        COUNT(CASE WHEN IsConsumed = 'Y' THEN 1 END) as "totalConsumed",
        COUNT(CASE WHEN IsConsumed = 'N' THEN 1 END) as "totalWasted",
        COUNT(CASE WHEN IsSpecial = 'Y' THEN 1 END) as "specialRequests",
        ROUND(
          (COUNT(CASE WHEN IsConsumed = 'Y' THEN 1 END) * 100.0 / COUNT(*)), 2
        ) as "consumptionRate"
      FROM MealMaster
      WHERE TenantID = $1 
        AND MealDate BETWEEN $2 AND $3
        AND IsActive = 'Y'
        AND Status = 'confirmed'
      GROUP BY MealDate, MealType
      ORDER BY MealDate DESC, 
        CASE MealType 
          WHEN 'breakfast' THEN 1 
          WHEN 'lunch' THEN 2 
          WHEN 'dinner' THEN 3 
        END
    `;
    
    const result = await query(sql, [tenantId, fromDate, toDate]);
    return result.rows;
  }
}

module.exports = MessModel;