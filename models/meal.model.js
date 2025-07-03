const { query } = require("../config/database");

class MealModel {
  // Get meal timing windows configuration
  static getMealTimings() {
    return {
      breakfast: { start: 8, end: 10, name: 'breakfast' },
      lunch: { start: 13, end: 15, name: 'lunch' },
      dinner: { start: 19, end: 21, name: 'dinner' }
    };
  }

  // Determine meal type based on current time
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
}

module.exports = MealModel;