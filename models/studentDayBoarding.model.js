const { query } = require('../config/database');

class StudentDayBoardingModel {
  
  // ================================================================================
  // STUDENT DAY BOARDING LIST METHODS
  // ================================================================================

  // Bulk insert students from CSV
  static async bulkInsertStudents(studentsData, tenantId, createdBy) {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      
      for (let i = 0; i < studentsData.length; i++) {
        const student = studentsData[i];
        
        // Check if student already exists
        const existingStudent = await client.query(`
          SELECT StudentDayBoardingID, StudentID 
          FROM StudentDayBoardingList 
          WHERE TenantID = $1 AND StudentID = $2 AND IsActive = 'Y'
        `, [tenantId, student.studentId]);
        
        if (existingStudent.rows.length > 0) {
          results.push({
            rowNumber: i + 1,
            studentId: student.studentId,
            status: 'DUPLICATE',
            message: 'Student already exists'
          });
          continue;
        }
        
        // Insert student
        const insertResult = await client.query(`
          INSERT INTO StudentDayBoardingList (
            TenantID, StudentID, StudentName, Course, Section, Year,
            PrimaryGuardianName, PrimaryGuardianPhone, GuardianRelation,
            VisitorCatID, VisitorCatName, IsActive, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 7, 'Day Boarding Student', 'Y', NOW(), NOW(), $10, $10)
          RETURNING StudentDayBoardingID
        `, [
          tenantId, student.studentId, student.studentName,
          student.course, student.section, student.year,
          student.primaryGuardianName, student.primaryGuardianPhone,
          student.guardianRelation, createdBy
        ]);
        
        const insertedStudent = insertResult.rows[0];
        
        // Insert or update guardian in auth master
        await this._insertOrUpdateGuardianAuth(
          client, tenantId, insertedStudent.studentdayboardingid, student.primaryGuardianName,
          student.primaryGuardianPhone, student.guardianRelation, createdBy
        );
        
        results.push({
          rowNumber: i + 1,
          studentId: student.studentId,
          studentDayBoardingId: insertedStudent.studentdayboardingid,
          status: 'SUCCESS',
          message: 'Student inserted successfully'
        });
      }
      
      await client.query('COMMIT');
      return results;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get students with filters and pagination
  static async getStudentsWithFilters(tenantId, filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      course = null,
      section = null,
      year = null
    } = filters;

    let sql = `
      SELECT 
        sdbl.StudentDayBoardingID,
        sdbl.StudentID,
        sdbl.StudentName,
        sdbl.Course,
        sdbl.Section,
        sdbl.Year,
        sdbl.PrimaryGuardianName,
        sdbl.PrimaryGuardianPhone,
        sdbl.GuardianRelation,
        sdbl.VisitorCatID,
        sdbl.VisitorCatName,
        sdbl.IsActive,
        sdbl.CreatedDate,
        sdbl.CreatedBy,
        COUNT(*) OVER() as total_count
      FROM StudentDayBoardingList sdbl
      WHERE sdbl.TenantID = $1 AND sdbl.VisitorCatID = 7 AND sdbl.IsActive = 'Y'
    `;

    const params = [tenantId];
    let paramIndex = 2;

    // Apply filters
    if (search) {
      sql += ` AND (
        sdbl.StudentName ILIKE $${paramIndex} OR 
        sdbl.StudentID ILIKE $${paramIndex} OR 
        sdbl.PrimaryGuardianName ILIKE $${paramIndex} OR
        sdbl.PrimaryGuardianPhone ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (course) {
      sql += ` AND sdbl.Course ILIKE $${paramIndex}`;
      params.push(`%${course}%`);
      paramIndex++;
    }

    if (section) {
      sql += ` AND sdbl.Section ILIKE $${paramIndex}`;
      params.push(`%${section}%`);
      paramIndex++;
    }

    if (year) {
      sql += ` AND sdbl.Year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY sdbl.CreatedDate DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  // Get student by ID
  static async getStudentById(studentDayBoardingId, tenantId) {
    const sql = `
      SELECT 
        sdbl.StudentDayBoardingID,
        sdbl.StudentID,
        sdbl.StudentName,
        sdbl.Course,
        sdbl.Section,
        sdbl.Year,
        sdbl.PrimaryGuardianName,
        sdbl.PrimaryGuardianPhone,
        sdbl.GuardianRelation,
        sdbl.VisitorCatID,
        sdbl.VisitorCatName,
        sdbl.IsActive,
        sdbl.CreatedDate,
        sdbl.UpdatedDate
      FROM StudentDayBoardingList sdbl
      WHERE sdbl.StudentDayBoardingID = $1 AND sdbl.TenantID = $2 AND sdbl.VisitorCatID = 7 AND sdbl.IsActive = 'Y'
    `;

    const result = await query(sql, [studentDayBoardingId, tenantId]);
    return result.rows[0];
  }


  // ================================================================================
  // AUTH MASTER METHODS
  // ================================================================================

  // Get guardian by phone number
  static async getGuardianByPhone(tenantId, phoneNumber) {
    const sql = `
      SELECT 
        AuthMasterID,
        StudentDayBoardingID,
        Name,
        PhoneNumber,
        PhotoFlag,
        PhotoPath,
        PhotoName,
        Relation,
        IsActive
      FROM StudentDayBoardingAuthMaster
      WHERE TenantID = $1 AND PhoneNumber = $2 AND IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId, phoneNumber]);
    return result.rows[0];
  }

  // Get students linked to a guardian
  static async getStudentsByGuardian(tenantId, authMasterId) {
    const sql = `
      SELECT 
        sdbl.StudentDayBoardingID,
        sdbl.StudentID,
        sdbl.StudentName,
        sdbl.Course,
        sdbl.Section,
        sdbl.Year,
        sdbml.Relation,
        sdbml.PhotoFlag,
        sdbml.PhotoPath,
        sdbml.PhotoName,
        sdbml.IsActive as LinkActive
      FROM StudentDayBoardingAuthMasterLink sdbml
      INNER JOIN StudentDayBoardingList sdbl ON sdbml.StudentDayBoardingID = sdbl.StudentDayBoardingID
      WHERE sdbml.TenantID = $1 AND sdbml.AuthMasterID = $2 AND sdbml.IsActive = 'Y'
        AND sdbl.IsActive = 'Y'
      ORDER BY sdbl.StudentName
    `;

    const result = await query(sql, [tenantId, authMasterId]);
    return result.rows;
  }

  // Add guardian to auth master
  static async addGuardianAuth(tenantId, guardianData, createdBy) {
    const sql = `
      INSERT INTO StudentDayBoardingAuthMaster (
        TenantID, StudentDayBoardingID, Name, PhoneNumber, PhotoFlag, PhotoPath, PhotoName,
        Relation, IsActive, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Y', NOW(), NOW(), $9, $9)
      RETURNING AuthMasterID, Name, PhoneNumber
    `;

    const result = await query(sql, [
      tenantId, guardianData.studentDayBoardingId, guardianData.name, guardianData.phoneNumber,
      guardianData.photoFlag || 'N', guardianData.photoPath, guardianData.photoName,
      guardianData.relation, createdBy
    ]);
    return result.rows[0];
  }

  // Update guardian information
  static async updateGuardianAuth(authMasterId, tenantId, guardianData, updatedBy) {
    const sql = `
      UPDATE StudentDayBoardingAuthMaster
      SET Name = $1,
          PhotoFlag = $2,
          PhotoPath = $3,
          PhotoName = $4,
          Relation = $5,
          UpdatedDate = NOW(),
          UpdatedBy = $6
      WHERE AuthMasterID = $7 AND TenantID = $8
      RETURNING AuthMasterID, Name, PhoneNumber
    `;

    const result = await query(sql, [
      guardianData.name, guardianData.photoFlag || 'N', guardianData.photoPath,
      guardianData.photoName, guardianData.relation, updatedBy, authMasterId, tenantId
    ]);
    return result.rows[0];
  }

  // Inactivate guardian
  static async inactivateGuardian(authMasterId, tenantId, updatedBy) {
    const sql = `
      UPDATE StudentDayBoardingAuthMaster
      SET IsActive = 'N',
          UpdatedDate = NOW(),
          UpdatedBy = $1
      WHERE AuthMasterID = $2 AND TenantID = $3
      RETURNING AuthMasterID
    `;

    const result = await query(sql, [updatedBy, authMasterId, tenantId]);
    return result.rows[0];
  }

  // ================================================================================
  // AUTH MASTER LINK METHODS
  // ================================================================================

  // Link student to guardian
  static async linkStudentToGuardian(tenantId, linkData, createdBy) {
    const sql = `
      INSERT INTO StudentDayBoardingAuthMasterLink (
        TenantID, StudentDayBoardingID, AuthMasterID, StudentID, PhoneNumber,
        Relation, PhotoFlag, PhotoPath, PhotoName, IsActive,
        CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Y', NOW(), NOW(), $10, $10)
      RETURNING LinkID
    `;

    const result = await query(sql, [
      tenantId, linkData.studentDayBoardingId, linkData.authMasterId,
      linkData.studentId, linkData.phoneNumber, linkData.relation,
      linkData.photoFlag || 'N', linkData.photoPath, linkData.photoName, createdBy
    ]);
    return result.rows[0];
  }

  // Check if student-guardian link exists
  static async checkStudentGuardianLink(tenantId, studentDayBoardingId, authMasterId) {
    const sql = `
      SELECT LinkID
      FROM StudentDayBoardingAuthMasterLink
      WHERE TenantID = $1 AND StudentDayBoardingID = $2 AND AuthMasterID = $3 AND IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId, studentDayBoardingId, authMasterId]);
    return result.rows.length > 0;
  }

  // Inactivate student-guardian link
  static async inactivateStudentGuardianLink(linkId, tenantId, updatedBy) {
    const sql = `
      UPDATE StudentDayBoardingAuthMasterLink
      SET IsActive = 'N',
          UpdatedDate = NOW(),
          UpdatedBy = $1
      WHERE LinkID = $2 AND TenantID = $3
      RETURNING LinkID
    `;

    const result = await query(sql, [updatedBy, linkId, tenantId]);
    return result.rows[0];
  }

  // ================================================================================
  // CHECKOUT HISTORY METHODS
  // ================================================================================

  // Create checkout record
  static async createCheckoutRecord(tenantId, checkoutData, createdBy) {
    const sql = `
      INSERT INTO StudentDayBoardingHistory (
        TenantID, StudentDayBoardingID, AuthMasterID, StudentID, StudentName,
        GuardianName, GuardianPhone, Relation, VisitorCatID, VisitorCatName,
        CheckInTime, CheckInTimeTxt, CheckOutTime, CheckOutTimeTxt, Status, Remarks, IsActive, 
        CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 7, 'Day Boarding Student', NOW(), 
               FLOOR(EXTRACT(EPOCH FROM NOW()))::text, NOW(), 
               FLOOR(EXTRACT(EPOCH FROM NOW()))::text, $9, $10, 'Y', NOW(), NOW(), $11, $11)
      RETURNING HistoryID, CheckInTime, CheckInTimeTxt, CheckOutTime, CheckOutTimeTxt
    `;

    const result = await query(sql, [
      tenantId, checkoutData.studentDayBoardingId, checkoutData.authMasterId,
      checkoutData.studentId, checkoutData.studentName, checkoutData.guardianName,
      checkoutData.guardianPhone, checkoutData.relation, checkoutData.status || 'CHECKED_OUT',
      checkoutData.remarks, createdBy
    ]);
    return result.rows[0];
  }

  // Update OTP information
  static async updateCheckoutOTP(historyId, tenantId, otpData, updatedBy) {
    const sql = `
      UPDATE StudentDayBoardingHistory
      SET OTPSent = $1,
          OTPNumber = $2,
          OTPSentTime = $3,
          OTPVerified = $4,
          OTPVerifiedTime = $5,
          UpdatedDate = NOW(),
          UpdatedBy = $6
      WHERE HistoryID = $7 AND TenantID = $8
      RETURNING HistoryID
    `;

    const result = await query(sql, [
      otpData.sent || 'N', otpData.number, otpData.sentTime,
      otpData.verified || 'N', otpData.verifiedTime, updatedBy, historyId, tenantId
    ]);
    return result.rows[0];
  }

  // Get checkout history with filters
  static async getCheckoutHistory(tenantId, filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      fromDate = null,
      toDate = null,
      status = null
    } = filters;

    let sql = `
      SELECT 
        sdbh.HistoryID,
        sdbh.StudentID,
        sdbh.StudentName,
        sdbh.GuardianName,
        sdbh.GuardianPhone,
        sdbh.Relation,
        sdbh.VisitorCatID,
        sdbh.VisitorCatName,
        sdbh.CheckInTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as CheckInTime,
        sdbh.CheckInTimeTxt,
        sdbh.CheckOutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as CheckOutTime,
        sdbh.CheckOutTimeTxt,
        sdbh.OTPSent,
        sdbh.OTPVerified,
        sdbh.Status,
        sdbh.Remarks,
        sdbh.CreatedDate,
        sdbl.Course,
        sdbl.Section,
        sdbl.Year,
        COUNT(*) OVER() as total_count
      FROM StudentDayBoardingHistory sdbh
      INNER JOIN StudentDayBoardingList sdbl ON sdbh.StudentDayBoardingID = sdbl.StudentDayBoardingID
      WHERE sdbh.TenantID = $1 AND sdbh.VisitorCatID = 7 AND sdbh.IsActive = 'Y' 
        AND sdbl.VisitorCatID = 7 AND sdbl.IsActive = 'Y'
    `;

    const params = [tenantId];
    let paramIndex = 2;

    // Apply filters
    if (search) {
      sql += ` AND (
        sdbh.StudentName ILIKE $${paramIndex} OR 
        sdbh.StudentID ILIKE $${paramIndex} OR 
        sdbh.GuardianName ILIKE $${paramIndex} OR
        sdbh.GuardianPhone ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      sql += ` AND sdbh.Status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (fromDate && toDate) {
      sql += ` AND sdbh.CheckInTime BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(fromDate, toDate);
      paramIndex += 2;
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY sdbh.CheckInTime DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  // ================================================================================
  // HELPER METHODS
  // ================================================================================

  // Internal method to insert or update guardian in auth master
  static async _insertOrUpdateGuardianAuth(client, tenantId, studentDayBoardingId, name, phoneNumber, relation, createdBy) {
    // Check if guardian already exists for this student
    const existingGuardian = await client.query(`
      SELECT AuthMasterID FROM StudentDayBoardingAuthMaster
      WHERE TenantID = $1 AND StudentDayBoardingID = $2 AND PhoneNumber = $3 AND IsActive = 'Y'
    `, [tenantId, studentDayBoardingId, phoneNumber]);

    if (existingGuardian.rows.length === 0) {
      // Insert new guardian
      await client.query(`
        INSERT INTO StudentDayBoardingAuthMaster (
          TenantID, StudentDayBoardingID, Name, PhoneNumber, Relation, IsActive,
          CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
        ) VALUES ($1, $2, $3, $4, $5, 'Y', NOW(), NOW(), $6, $6)
      `, [tenantId, studentDayBoardingId, name, phoneNumber, relation, createdBy]);
    }
  }

  // Get all courses for filter dropdown
  static async getCourses(tenantId) {
    const sql = `
      SELECT DISTINCT Course
      FROM StudentDayBoardingList
      WHERE TenantID = $1 AND VisitorCatID = 7 AND IsActive = 'Y' AND Course IS NOT NULL
      ORDER BY Course
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get all sections for filter dropdown
  static async getSections(tenantId) {
    const sql = `
      SELECT DISTINCT Section
      FROM StudentDayBoardingList
      WHERE TenantID = $1 AND VisitorCatID = 7 AND IsActive = 'Y' AND Section IS NOT NULL
      ORDER BY Section
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get all years for filter dropdown
  static async getYears(tenantId) {
    const sql = `
      SELECT DISTINCT Year
      FROM StudentDayBoardingList
      WHERE TenantID = $1 AND VisitorCatID = 7 AND IsActive = 'Y' AND Year IS NOT NULL
      ORDER BY Year
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get student by StudentID for QR scan
  static async getStudentByStudentId(tenantId, studentId) {
    const sql = `
      SELECT 
        sdbl.StudentDayBoardingID,
        sdbl.StudentID,
        sdbl.StudentName,
        sdbl.Course,
        sdbl.Section,
        sdbl.Year,
        sdbl.PrimaryGuardianName,
        sdbl.PrimaryGuardianPhone,
        sdbl.VisitorCatID,
        sdbl.VisitorCatName
      FROM StudentDayBoardingList sdbl
      WHERE sdbl.TenantID = $1 AND sdbl.StudentID = $2 AND sdbl.VisitorCatID = 7 AND sdbl.IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId, studentId]);
    return result.rows[0];
  }
}

module.exports = StudentDayBoardingModel;