const { query } = require("../config/database");

class MealModel {
  // Get meal timing windows configuration (fallback method)
  static getMealTimings() {
    return {
      breakfast: { start: 8, end: 10, name: 'breakfast' },
      lunch: { start: 13, end: 15, name: 'lunch' },
      dinner: { start: 19, end: 21, name: 'dinner' }
    };
  }

  // Get meal timings from settings table
  static async getMealTimingsFromSettings(tenantId) {
    try {
      const sql = `
        SELECT 
          LunchStartTime,
          LunchEndTime,
          DinnerStartTime,
          DinnerEndTime
        FROM MealSettings
        WHERE TenantID = $1 AND IsActive = 'Y'
      `;
      
      const result = await query(sql, [tenantId]);
      
      if (result.rows.length > 0) {
        const settings = result.rows[0];
        return {
          lunch: { 
            start: settings.lunchstarttime, 
            end: settings.lunchendtime, 
            name: 'lunch' 
          },
          dinner: { 
            start: settings.dinnerstarttime, 
            end: settings.dinnerendtime, 
            name: 'dinner' 
          }
        };
      }
      
      // Fallback to default timings
      return {
        lunch: { start: '13:00:00', end: '15:00:00', name: 'lunch' },
        dinner: { start: '19:00:00', end: '21:00:00', name: 'dinner' }
      };
    } catch (error) {
      console.error('Error fetching meal timings from settings:', error);
      // Fallback to default timings
      return {
        lunch: { start: '13:00:00', end: '15:00:00', name: 'lunch' },
        dinner: { start: '19:00:00', end: '21:00:00', name: 'dinner' }
      };
    }
  }

  // Determine meal type based on current time (legacy method)
  static getCurrentMealType() {
    const now = new Date();
    const currentHour = now.getHours();
    const timings = this.getMealTimings();

    if (currentHour >= timings.breakfast.start && currentHour < timings.breakfast.end) {
      return 'breakfast';
    } else if (currentHour >= timings.lunch.start && currentHour < timings.lunch.end) {
      return 'lunch';
    } else if (currentHour >= timings.dinner.start && currentHour < timings.dinner.end) {
      return 'dinner';
    }
    
    return null; // Outside meal timing windows
  }

  // Determine meal type based on tenant settings
  static async getCurrentMealTypeByTenant(tenantId) {
    try {
      const timings = await this.getMealTimingsFromSettings(tenantId);
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
      
      // Helper function to convert time to minutes
      const timeToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const currentMinutes = timeToMinutes(currentTime);
      const lunchStart = timeToMinutes(timings.lunch.start);
      const lunchEnd = timeToMinutes(timings.lunch.end);
      const dinnerStart = timeToMinutes(timings.dinner.start);
      const dinnerEnd = timeToMinutes(timings.dinner.end);

      if (currentMinutes >= lunchStart && currentMinutes < lunchEnd) {
        return 'lunch';
      } else if (currentMinutes >= dinnerStart && currentMinutes < dinnerEnd) {
        return 'dinner';
      }
      
      return null; // Outside meal timing windows
    } catch (error) {
      console.error('Error getting current meal type by tenant:', error);
      // Fallback to legacy method
      return this.getCurrentMealType();
    }
  }

  // Get next available token number for a meal type on current date
  static async getNextTokenNumber(tenantId, mealType, mealDate = null) {
    const targetDate = mealDate || new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT COALESCE(MAX(TokenNumber), 0) + 1 as NextToken
      FROM MealMaster
      WHERE TenantID = $1 
        AND MealType = $2 
        AND MealDate = $3
        AND IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId, mealType, targetDate]);
    return result.rows[0]?.nexttoken || 1;
  }

  // Check if student already checked in for this meal today
  static async checkExistingMealEntry(tenantId, studentId, mealType, mealDate = null) {
    const targetDate = mealDate || new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT MealID, TokenNumber, MealTime, Status
      FROM MealMaster
      WHERE TenantID = $1 
        AND StudentID = $2 
        AND MealType = $3 
        AND MealDate = $4
        AND IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId, studentId, mealType, targetDate]);
    return result.rows[0];
  }

  // Create new meal entry
  static async createMealEntry(mealData) {
    const {
      tenantId,
      studentId,
      studentRegNo,
      studentName,
      mobile,
      email = '',
      address = '',
      course,
      hostel,
      associatedFlat = '',
      associatedBlock = '',
      vehicleNo = '',
      visitorCatName = 'Student',
      visitorSubCatName = 'Regular Student',
      securityCode = '',
      idNumber = '',
      idName = '',
      photoFlag = 'N',
      photoPath = '',
      photoName = '',
      validStartDate = null,
      validEndDate = null,
      mealType,
      tokenNumber,
      createdBy
    } = mealData;

    const mealDate = new Date().toISOString().split('T')[0];
    const mealTime = new Date();

    const sql = `
      INSERT INTO MealMaster (
        TenantID, StudentID, StudentRegNo, StudentName, Mobile, Email, Address,
        Course, Hostel, AssociatedFlat, AssociatedBlock, VehicleNo,
        VisitorCatName, VisitorSubCatName, SecurityCode, IDNumber, IDName,
        PhotoFlag, PhotoPath, PhotoName, ValidStartDate, ValidEndDate,
        MealType, MealDate, MealTime, TokenNumber, Status, IsActive,
        CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
        $23, $24, $25, $26, 'confirmed', 'Y',
        NOW(), NOW(), $27, $27
      ) RETURNING MealID, TokenNumber, MealTime, MealDate
    `;

    const result = await query(sql, [
      tenantId, studentId, studentRegNo, studentName, mobile, email, address,
      course, hostel, associatedFlat, associatedBlock, vehicleNo,
      visitorCatName, visitorSubCatName, securityCode, idNumber, idName,
      photoFlag, photoPath, photoName, validStartDate, validEndDate,
      mealType, mealDate, mealTime, tokenNumber, createdBy
    ]);

    return result.rows[0];
  }

  // Get student's meal history
  static async getStudentMealHistory(tenantId, studentId, limit = 10) {
    const sql = `
      SELECT 
        MealID,
        StudentID,
        StudentRegNo,
        StudentName,
        Mobile,
        Email,
        Address,
        Course,
        Hostel,
        AssociatedFlat,
        AssociatedBlock,
        MealType,
        MealDate,
        MealTime,
        TokenNumber,
        Status,
        CreatedDate
      FROM MealMaster
      WHERE TenantID = $1 
        AND StudentID = $2 
        AND IsActive = 'Y'
      ORDER BY MealDate DESC, MealTime DESC
      LIMIT $3
    `;

    const result = await query(sql, [tenantId, studentId, limit]);
    return result.rows;
  }

  // Get meal statistics for a date range
  static async getMealStatistics(tenantId, fromDate, toDate) {
    const sql = `
      SELECT 
        MealDate,
        MealType,
        COUNT(*) as StudentCount,
        MAX(TokenNumber) as MaxToken
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

  // Get current meal queue (students who checked in today for current meal)
  static async getCurrentMealQueue(tenantId, mealType, mealDate = null) {
    const targetDate = mealDate || new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        MealID,
        StudentID,
        StudentRegNo,
        StudentName,
        Mobile,
        Email,
        Address,
        Course,
        Hostel,
        AssociatedFlat,
        AssociatedBlock,
        VehicleNo,
        TokenNumber,
        MealTime,
        Status
      FROM MealMaster
      WHERE TenantID = $1 
        AND MealType = $2 
        AND MealDate = $3
        AND IsActive = 'Y'
      ORDER BY TokenNumber ASC
    `;

    const result = await query(sql, [tenantId, mealType, targetDate]);
    return result.rows;
  }

  // Cancel a meal entry (soft delete)
  static async cancelMealEntry(tenantId, mealId, updatedBy) {
    const sql = `
      UPDATE MealMaster 
      SET Status = 'cancelled',
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE TenantID = $1 
        AND MealID = $2 
        AND IsActive = 'Y'
      RETURNING MealID, TokenNumber
    `;

    const result = await query(sql, [tenantId, mealId, updatedBy]);
    return result.rows[0];
  }

  // ===== NEW MEAL REGISTRATION & CONSUMPTION METHODS =====

  // Check if student already registered for this meal today
  static async checkExistingMealRegistration(tenantId, studentId, mealType, mealDate = null) {
    const targetDate = mealDate || new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT MealID, TokenNumber, MealTime, Status, IsSpecial, SpecialRemarks, IsConsumed, ConsumedTime
      FROM MealMaster
      WHERE TenantID = $1 
        AND StudentID = $2 
        AND MealType = $3 
        AND MealDate = $4
        AND IsActive = 'Y'
        AND Status != 'cancelled'
    `;

    const result = await query(sql, [tenantId, studentId, mealType, targetDate]);
    return result.rows[0];
  }

  // Register student for meal during booking window (Phase 1)
  static async registerForMeal(mealData) {
    const {
      tenantId,
      studentId,
      studentRegNo,
      studentName,
      mobile,
      email = '',
      address = '',
      course,
      hostel,
      associatedFlat = '',
      associatedBlock = '',
      vehicleNo = '',
      visitorCatName = 'Student',
      visitorSubCatName = 'Regular Student',
      securityCode = '',
      idNumber = '',
      idName = '',
      photoFlag = 'N',
      photoPath = '',
      photoName = '',
      validStartDate = null,
      validEndDate = null,
      mealType,
      isSpecial = 'N',
      specialRemarks = '',
      createdBy
    } = mealData;

    const mealDate = new Date().toISOString().split('T')[0];
    const mealTime = new Date();
    const tokenNumber = await this.getNextTokenNumber(tenantId, mealType, mealDate);

    const sql = `
      INSERT INTO MealMaster (
        TenantID, StudentID, StudentRegNo, StudentName, Mobile, Email, Address,
        Course, Hostel, AssociatedFlat, AssociatedBlock, VehicleNo,
        VisitorCatName, VisitorSubCatName, SecurityCode, IDNumber, IDName,
        PhotoFlag, PhotoPath, PhotoName, ValidStartDate, ValidEndDate,
        MealType, MealDate, MealTime, TokenNumber, Status, IsSpecial, SpecialRemarks,
        IsConsumed, IsActive, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
        $23, $24, $25, $26, 'confirmed', $27, $28,
        'N', 'Y', NOW(), NOW(), $29, $29
      ) RETURNING MealID, TokenNumber, MealTime, MealDate, IsSpecial, SpecialRemarks
    `;

    const result = await query(sql, [
      tenantId, studentId, studentRegNo, studentName, mobile, email, address,
      course, hostel, associatedFlat, associatedBlock, vehicleNo,
      visitorCatName, visitorSubCatName, securityCode, idNumber, idName,
      photoFlag, photoPath, photoName, validStartDate, validEndDate,
      mealType, mealDate, mealTime, tokenNumber, isSpecial, specialRemarks,
      createdBy
    ]);

    return result.rows[0];
  }

  // Mark meal as consumed during serving window (Phase 2)
  static async consumeMeal(tenantId, mealId, consumedBy) {
    const sql = `
      UPDATE MealMaster 
      SET Status = 'consumed',
          IsConsumed = 'Y',
          ConsumedTime = NOW(),
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE TenantID = $1 
        AND MealID = $2 
        AND IsActive = 'Y'
        AND Status = 'registered'
        AND IsConsumed = 'N'
      RETURNING MealID, TokenNumber, StudentName, MealType, ConsumedTime
    `;

    const result = await query(sql, [tenantId, mealId, consumedBy]);
    return result.rows[0];
  }

  // Get meal registration by QR data (for consumption phase)
  static async getMealRegistrationByQR(tenantId, studentId, mealType, mealDate = null) {
    const targetDate = mealDate || new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        MealID,
        StudentID,
        StudentRegNo,
        StudentName,
        Mobile,
        Course,
        Hostel,
        MealType,
        MealDate,
        MealTime,
        TokenNumber,
        Status,
        IsSpecial,
        SpecialRemarks,
        IsConsumed,
        ConsumedTime
      FROM MealMaster
      WHERE TenantID = $1 
        AND StudentID = $2 
        AND MealType = $3 
        AND MealDate = $4
        AND IsActive = 'Y'
        AND Status = 'registered'
        AND IsConsumed = 'N'
    `;

    const result = await query(sql, [tenantId, studentId, mealType, targetDate]);
    return result.rows[0];
  }

  // Get registered but unconsumed meals (for serving window)
  static async getRegisteredMeals(tenantId, mealType, mealDate = null) {
    const targetDate = mealDate || new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        MealID,
        StudentID,
        StudentRegNo,
        StudentName,
        Mobile,
        Course,
        Hostel,
        TokenNumber,
        MealTime,
        IsSpecial,
        SpecialRemarks,
        Status
      FROM MealMaster
      WHERE TenantID = $1 
        AND MealType = $2 
        AND MealDate = $3
        AND IsActive = 'Y'
        AND Status = 'confirmed'
        AND IsConsumed = 'N'
      ORDER BY TokenNumber ASC
    `;

    const result = await query(sql, [tenantId, mealType, targetDate]);
    return result.rows;
  }

  // Get consumed meals (for analytics)
  static async getConsumedMeals(tenantId, mealType, mealDate = null) {
    const targetDate = mealDate || new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        MealID,
        StudentID,
        StudentRegNo,
        StudentName,
        Mobile,
        Course,
        Hostel,
        TokenNumber,
        MealTime,
        ConsumedTime,
        IsSpecial,
        SpecialRemarks,
        Status
      FROM MealMaster
      WHERE TenantID = $1 
        AND MealType = $2 
        AND MealDate = $3
        AND IsActive = 'Y'
        AND Status = 'consumed'
        AND IsConsumed = 'Y'
      ORDER BY ConsumedTime ASC
    `;

    const result = await query(sql, [tenantId, mealType, targetDate]);
    return result.rows;
  }

  // Get meal registration analytics
  static async getMealRegistrationAnalytics(tenantId, fromDate, toDate) {
    const sql = `
      SELECT 
        MealDate,
        MealType,
        COUNT(*) as TotalRegistrations,
        COUNT(CASE WHEN IsConsumed = 'Y' THEN 1 END) as TotalConsumed,
        COUNT(CASE WHEN IsConsumed = 'N' THEN 1 END) as TotalWasted,
        COUNT(CASE WHEN IsSpecial = 'Y' THEN 1 END) as SpecialMeals,
        ROUND(
          (COUNT(CASE WHEN IsConsumed = 'Y' THEN 1 END) * 100.0 / COUNT(*)), 2
        ) as ConsumptionRate
      FROM MealMaster
      WHERE TenantID = $1 
        AND MealDate BETWEEN $2 AND $3
        AND IsActive = 'Y'
        AND Status IN ('registered', 'consumed')
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

  // Update meal registration (for special requests)
  static async updateMealRegistration(tenantId, mealId, updateData, updatedBy) {
    const { isSpecial, specialRemarks } = updateData;
    
    console.log('MealModel.updateMealRegistration called with:', { tenantId, mealId, updateData, updatedBy });
    
    const sql = `
      UPDATE MealMaster 
      SET IsSpecial = $3,
          SpecialRemarks = $4,
          UpdatedDate = NOW(),
          UpdatedBy = $5
      WHERE TenantID = $1 
        AND MealID = $2 
        AND IsActive = 'Y'
        AND Status = 'confirmed'
        AND IsConsumed = 'N'
      RETURNING MealID, TokenNumber, StudentName, MealType, IsSpecial, SpecialRemarks
    `;

    console.log('Executing update query:', sql, 'with params:', [tenantId, mealId, isSpecial, specialRemarks, updatedBy]);
    const result = await query(sql, [tenantId, mealId, isSpecial, specialRemarks, updatedBy]);
    console.log('Update query result:', result.rows);
    return result.rows[0];
  }

  // Cancel meal registration (during booking window only)
  static async cancelMealRegistration(tenantId, mealId, cancelledBy) {
    const sql = `
      UPDATE MealMaster 
      SET Status = 'cancelled',
          IsActive = 'N',
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE TenantID = $1 
        AND MealID = $2 
        AND IsActive = 'Y'
        AND Status = 'registered'
        AND IsConsumed = 'N'
      RETURNING MealID, TokenNumber, StudentName, MealType
    `;

    const result = await query(sql, [tenantId, mealId, cancelledBy]);
    return result.rows[0];
  }
}

module.exports = MealModel;