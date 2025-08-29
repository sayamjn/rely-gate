const { query } = require("../config/database");

class StudentDayBoardingModel {
  // ================================================================================
  // STUDENT DAY BOARDING LIST METHODS
  // ================================================================================

  // Bulk insert students from CSV
  static async bulkInsertStudents(studentsData, tenantId, createdBy) {
    const client = await require("../config/database").getClient();

    try {
      await client.query("BEGIN");

      const results = [];

      for (let i = 0; i < studentsData.length; i++) {
        const student = studentsData[i];

        // Check if student already exists
        const existingStudent = await client.query(
          `
          SELECT StudentDayBoardingID, StudentID 
          FROM StudentDayBoardingList 
          WHERE TenantID = $1 AND StudentID = $2 AND IsActive = 'Y'
        `,
          [tenantId, student.studentId]
        );

        if (existingStudent.rows.length > 0) {
          results.push({
            rowNumber: i + 1,
            studentId: student.studentId,
            status: "DUPLICATE",
            message: "Student already exists",
          });
          continue;
        }

        // Insert student
        const insertResult = await client.query(
          `
          INSERT INTO StudentDayBoardingList (
            TenantID, StudentID, StudentName, Course, Section, Year,
            PrimaryGuardianName, PrimaryGuardianPhone, GuardianRelation,
            VisitorCatID, VisitorCatName, IsActive, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 7, 'Day Boarding Student', 'Y', NOW(), NOW(), $10, $10)
          RETURNING StudentDayBoardingID
        `,
          [
            tenantId,
            student.studentId,
            student.studentName,
            student.course,
            student.section,
            student.year,
            student.primaryGuardianName,
            student.primaryGuardianPhone,
            student.guardianRelation,
            createdBy,
          ]
        );

        const insertedStudent = insertResult.rows[0];

        // Insert or update guardian in auth master
        await this._insertOrUpdateGuardianAuth(
          client,
          tenantId,
          insertedStudent.studentdayboardingid,
          student.primaryGuardianName,
          student.primaryGuardianPhone,
          student.guardianRelation,
          createdBy
        );

        results.push({
          rowNumber: i + 1,
          studentId: student.studentId,
          studentDayBoardingId: insertedStudent.studentdayboardingid,
          status: "SUCCESS",
          message: "Student inserted successfully",
        });
      }

      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Insert single student
  static async insertSingleStudent(studentData, tenantId, createdBy) {
    const client = await require("../config/database").getClient();

    try {
      await client.query("BEGIN");

      // Check if student already exists
      const existingStudent = await client.query(
        `
        SELECT StudentDayBoardingID, StudentID 
        FROM StudentDayBoardingList 
        WHERE TenantID = $1 AND StudentID = $2 AND IsActive = 'Y'
      `,
        [tenantId, studentData.studentId]
      );

      if (existingStudent.rows.length > 0) {
        await client.query("ROLLBACK");
        return {
          success: false,
          message: "Student already exists",
          studentId: studentData.studentId,
        };
      }

      // Insert student
      const insertResult = await client.query(
        `
        INSERT INTO StudentDayBoardingList (
          TenantID, StudentID, StudentName, Course, Section, Year,
          PrimaryGuardianName, PrimaryGuardianPhone, GuardianRelation,
          VisitorCatID, VisitorCatName, IsActive, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy,
          StudentPhotoFlag, StudentPhotoPath, StudentPhotoName
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 7, 'Day Boarding Student', 'Y', NOW(), NOW(), $10, $10, $11, $12, $13)
        RETURNING StudentDayBoardingID, StudentID, StudentName
      `,
        [
          tenantId,
          studentData.studentId,
          studentData.studentName,
          studentData.course,
          studentData.section,
          studentData.year,
          studentData.primaryGuardianName,
          studentData.primaryGuardianPhone,
          studentData.guardianRelation || "Guardian",
          createdBy,
          studentData.studentPhotoFlag || "N",
          studentData.studentPhotoPath || null,
          studentData.studentPhotoName || null,
        ]
      );

      const insertedStudent = insertResult.rows[0];

      // Insert or update guardian in auth master
      await this._insertOrUpdateGuardianAuth(
        client,
        tenantId,
        insertedStudent.studentdayboardingid,
        studentData.primaryGuardianName,
        studentData.primaryGuardianPhone,
        studentData.guardianRelation || "Guardian",
        createdBy
      );

      await client.query("COMMIT");

      return {
        success: true,
        message: "Student added successfully",
        data: {
          StudentDayBoardingID: insertedStudent.studentdayboardingid,
          StudentID: insertedStudent.studentid,
          StudentName: insertedStudent.studentname,
        },
      };
    } catch (error) {
      await client.query("ROLLBACK");
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
      search = "",
      course = null,
      section = null,
      year = null,
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
        sdbl.StudentPhotoFlag,
        sdbl.StudentPhotoPath,
        sdbl.StudentPhotoName,
        -- Check if student has any active approvers
        CASE 
          WHEN COUNT(sdbml.LinkID) FILTER (WHERE sdbml.IsActive = 'Y' AND sdbam.IsActive = 'Y') > 0 
          THEN 'Y' 
          ELSE 'N' 
        END as HasActiveApprovers,
        COUNT(sdbml.LinkID) FILTER (WHERE sdbml.IsActive = 'Y' AND sdbam.IsActive = 'Y') as ActiveApproversCount,
        COUNT(sdbml.LinkID) FILTER (WHERE sdbam.IsActive = 'Y') as TotalApproversCount,
        -- Today's checkout information
        MAX(sdbh_today.HistoryID) as TodayCheckoutHistoryID,
        MAX(sdbh_today.CheckOutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') as TodayCheckoutTime,
        MAX(sdbh_today.CheckOutTimeTxt) as TodayCheckoutTimeTxt,
        MAX(sdbh_today.GuardianName) as TodayCheckoutGuardianName,
        MAX(sdbh_today.GuardianPhone) as TodayCheckoutGuardianPhone,
        MAX(sdbh_today.Relation) as TodayCheckoutRelation,
        MAX(sdbh_today.Status) as TodayCheckoutStatus,
        MAX(sdbh_today.Remarks) as TodayCheckoutRemarks,
        MAX(sdbh_today.CreatedBy) as TodayCheckoutByUser,
        COUNT(*) OVER() as total_count
      FROM StudentDayBoardingList sdbl
      LEFT JOIN StudentDayBoardingAuthMasterLink sdbml ON sdbl.StudentDayBoardingID = sdbml.StudentDayBoardingID
      LEFT JOIN StudentDayBoardingAuthMaster sdbam ON sdbml.AuthMasterID = sdbam.AuthMasterID
      LEFT JOIN (
        SELECT DISTINCT ON (StudentDayBoardingID) 
               HistoryID, StudentDayBoardingID, CheckOutTime, CheckOutTimeTxt, 
               GuardianName, GuardianPhone, Relation, Status, Remarks, CreatedBy
        FROM StudentDayBoardingHistory 
        WHERE TenantID = $1 
          AND DATE(CheckOutTime AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE
          AND IsActive = 'Y'
        ORDER BY StudentDayBoardingID, CheckOutTime DESC
      ) sdbh_today ON sdbl.StudentDayBoardingID = sdbh_today.StudentDayBoardingID
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

    // Group by all non-aggregate columns
    sql += ` GROUP BY sdbl.StudentDayBoardingID, sdbl.StudentID, sdbl.StudentName, 
             sdbl.Course, sdbl.Section, sdbl.Year, sdbl.PrimaryGuardianName, 
             sdbl.PrimaryGuardianPhone, sdbl.GuardianRelation, sdbl.VisitorCatID, 
             sdbl.VisitorCatName, sdbl.IsActive, sdbl.CreatedDate, sdbl.CreatedBy,
             sdbl.StudentPhotoFlag, sdbl.StudentPhotoPath, sdbl.StudentPhotoName`;

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY sdbl.CreatedDate DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
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
        sdbl.UpdatedDate,
        sdbl.StudentPhotoFlag,
        sdbl.StudentPhotoPath,
        sdbl.StudentPhotoName
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
    // console.log("result: ", result)
    return result.rows[0];
  }

  // Get primary guardian by phone number from StudentDayBoardingList
  static async getPrimaryGuardianByPhone(tenantId, phoneNumber) {
    const sql = `
      SELECT 
        StudentDayBoardingID,
        StudentID,
        StudentName,
        PrimaryGuardianName,
        PrimaryGuardianPhone,
        GuardianRelation
      FROM StudentDayBoardingList
      WHERE TenantID = $1 AND PrimaryGuardianPhone = $2 AND VisitorCatID = 7 AND IsActive = 'Y'
      LIMIT 1
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
      tenantId,
      guardianData.studentDayBoardingId,
      guardianData.name,
      guardianData.phoneNumber,
      guardianData.photoFlag || "N",
      guardianData.photoPath,
      guardianData.photoName,
      guardianData.relation,
      createdBy,
    ]);
    return result.rows[0];
  }

  // Update guardian information
  static async updateGuardianAuth(
    authMasterId,
    tenantId,
    guardianData,
    updatedBy
  ) {
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
      guardianData.name,
      guardianData.photoFlag || "N",
      guardianData.photoPath,
      guardianData.photoName,
      guardianData.relation,
      updatedBy,
      authMasterId,
      tenantId,
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
      tenantId,
      linkData.studentDayBoardingId,
      linkData.authMasterId,
      linkData.studentId,
      linkData.phoneNumber,
      linkData.relation,
      linkData.photoFlag || "N",
      linkData.photoPath,
      linkData.photoName,
      createdBy,
    ]);
    return result.rows[0];
  }

  // Check if student-guardian link exists
  static async checkStudentGuardianLink(
    tenantId,
    studentDayBoardingId,
    authMasterId
  ) {
    const sql = `
      SELECT LinkID
      FROM StudentDayBoardingAuthMasterLink
      WHERE TenantID = $1 AND StudentDayBoardingID = $2 AND AuthMasterID = $3 AND IsActive = 'Y'
    `;

    const result = await query(sql, [
      tenantId,
      studentDayBoardingId,
      authMasterId,
    ]);
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
      tenantId,
      checkoutData.studentDayBoardingId,
      checkoutData.authMasterId,
      checkoutData.studentId,
      checkoutData.studentName,
      checkoutData.guardianName,
      checkoutData.guardianPhone,
      checkoutData.relation,
      checkoutData.status || "CHECKED_OUT",
      checkoutData.remarks,
      createdBy,
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
      otpData.sent || "N",
      otpData.number,
      otpData.sentTime,
      otpData.verified || "N",
      otpData.verifiedTime,
      updatedBy,
      historyId,
      tenantId,
    ]);
    return result.rows[0];
  }

  // Get checkout history with filters
// Get checkout history with filters
static async getCheckoutHistory(tenantId, filters = {}) {
  const {
    page = 1,
    pageSize = 20,
    search = "",
    studentId = "",
    course = "",
    fromDate = null,
    toDate = null,
    status = null,
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
      sdbh.CreatedBy,
      sdbl.Course,
      sdbl.Section,
      sdbl.Year,
      sdbam.PhotoFlag as GuardianPhotoFlag,
      sdbam.PhotoPath as GuardianPhotoPath,
      sdbam.PhotoName as GuardianPhotoName,
      lu.UserName as CheckoutByUserName,
      COUNT(*) OVER() as total_count
    FROM StudentDayBoardingHistory sdbh
    INNER JOIN StudentDayBoardingList sdbl 
      ON sdbh.StudentDayBoardingID = sdbl.StudentDayBoardingID
    LEFT JOIN StudentDayBoardingAuthMaster sdbam 
      ON sdbh.GuardianPhone = sdbam.PhoneNumber 
      AND sdbam.TenantID = sdbh.TenantID 
      AND sdbam.IsActive = 'Y'
    LEFT JOIN LoginUser lu 
      ON sdbh.CreatedBy = lu.UserName   -- ✅ FIX: join on username
      AND lu.TenantID = sdbh.TenantID 
      AND lu.IsActive = 'Y'
    WHERE sdbh.TenantID = $1 
      AND sdbh.VisitorCatID = 7 
      AND sdbh.IsActive = 'Y' 
      AND sdbl.VisitorCatID = 7 
      AND sdbl.IsActive = 'Y'
  `;

  const params = [tenantId];
  let paramIndex = 2;

  // Apply filters
  if (search) {
    sql += ` AND (
      sdbh.StudentName ILIKE $${paramIndex} OR 
      sdbh.StudentID ILIKE $${paramIndex} OR 
      sdbh.GuardianName ILIKE $${paramIndex} OR
      sdbh.GuardianPhone ILIKE $${paramIndex} OR
      sdbl.Course ILIKE $${paramIndex}
    )`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (studentId) {
    sql += ` AND sdbh.StudentID ILIKE $${paramIndex}`;
    params.push(`%${studentId}%`);
    paramIndex++;
  }

  if (course) {
    sql += ` AND sdbl.Course ILIKE $${paramIndex}`;
    params.push(`%${course}%`);
    paramIndex++;
  }

  if (status) {
    sql += ` AND sdbh.Status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // ✅ Epoch filtering using CheckInTimeTxt
  if (fromDate && toDate) {
    sql += ` AND sdbh.CheckInTimeTxt::BIGINT BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
    params.push(fromDate, toDate);
    paramIndex += 2;
  } else if (fromDate) {
    sql += ` AND sdbh.CheckInTimeTxt::BIGINT >= $${paramIndex}`;
    params.push(fromDate);
    paramIndex++;
  } else if (toDate) {
    sql += ` AND sdbh.CheckInTimeTxt::BIGINT <= $${paramIndex}`;
    params.push(toDate);
    paramIndex++;
  }

  // Pagination
  const offset = (page - 1) * pageSize;
  sql += ` ORDER BY sdbh.CheckInTimeTxt::BIGINT DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pageSize, offset);

  const result = await query(sql, params);
  return result.rows;
}




  // ================================================================================
  // HELPER METHODS
  // ================================================================================

  // Internal method to insert or update guardian in auth master
  static async _insertOrUpdateGuardianAuth(
    client,
    tenantId,
    studentDayBoardingId,
    name,
    phoneNumber,
    relation,
    createdBy
  ) {
    // Check if guardian already exists for this student
    const existingGuardian = await client.query(
      `
      SELECT AuthMasterID FROM StudentDayBoardingAuthMaster
      WHERE TenantID = $1 AND StudentDayBoardingID = $2 AND PhoneNumber = $3 AND IsActive = 'Y'
    `,
      [tenantId, studentDayBoardingId, phoneNumber]
    );

    if (existingGuardian.rows.length === 0) {
      // Insert new guardian
      await client.query(
        `
        INSERT INTO StudentDayBoardingAuthMaster (
          TenantID, StudentDayBoardingID, Name, PhoneNumber, Relation, IsActive,
          CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
        ) VALUES ($1, $2, $3, $4, $5, 'Y', NOW(), NOW(), $6, $6)
      `,
        [tenantId, studentDayBoardingId, name, phoneNumber, relation, createdBy]
      );
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

  // Get all guardians with pagination and filters
  static async getAllGuardians(tenantId, filters = {}) {
    const { page = 1, pageSize = 20, search = "" } = filters;

    let sql = `
      SELECT 
        sdbam.AuthMasterID,
        sdbam.Name,
        sdbam.PhoneNumber,
        sdbam.PhotoFlag,
        sdbam.PhotoPath,
        sdbam.PhotoName,
        sdbam.Relation,
        sdbam.IsActive,
        sdbam.CreatedDate,
        sdbam.UpdatedDate,
        COUNT(DISTINCT sdbml.StudentDayBoardingID) as LinkedStudentsCount,
        ARRAY_AGG(DISTINCT sdbl.StudentID) FILTER (WHERE sdbl.StudentID IS NOT NULL) as StudentIDs,
        ARRAY_AGG(DISTINCT sdbl.StudentName) FILTER (WHERE sdbl.StudentName IS NOT NULL) as StudentNames,
        COUNT(*) OVER() as total_count
      FROM StudentDayBoardingAuthMaster sdbam
      LEFT JOIN StudentDayBoardingAuthMasterLink sdbml ON sdbam.AuthMasterID = sdbml.AuthMasterID 
        AND sdbml.IsActive = 'Y'
      LEFT JOIN StudentDayBoardingList sdbl ON sdbml.StudentDayBoardingID = sdbl.StudentDayBoardingID
        AND sdbl.IsActive = 'Y' AND sdbl.VisitorCatID = 7
      WHERE sdbam.TenantID = $1 AND sdbam.IsActive = 'Y'
    `;

    const params = [tenantId];
    let paramIndex = 2;

    // Apply search filter
    if (search) {
      sql += ` AND (
        sdbam.Name ILIKE $${paramIndex} OR 
        sdbam.PhoneNumber ILIKE $${paramIndex} OR
        sdbam.Relation ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` GROUP BY sdbam.AuthMasterID, sdbam.Name, sdbam.PhoneNumber, sdbam.PhotoFlag, 
             sdbam.PhotoPath, sdbam.PhotoName, sdbam.Relation, sdbam.IsActive, 
             sdbam.CreatedDate, sdbam.UpdatedDate`;

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY sdbam.CreatedDate DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(pageSize, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  // Get guardian details by ID
  static async getGuardianById(tenantId, authMasterId) {
    const sql = `
      SELECT 
        sdbam.AuthMasterID,
        sdbam.Name,
        sdbam.PhoneNumber,
        sdbam.PhotoFlag,
        sdbam.PhotoPath,
        sdbam.PhotoName,
        sdbam.Relation,
        sdbam.IsActive,
        sdbam.CreatedDate,
        sdbam.UpdatedDate
      FROM StudentDayBoardingAuthMaster sdbam
      WHERE sdbam.TenantID = $1 AND sdbam.AuthMasterID = $2 AND sdbam.IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId, authMasterId]);
    return result.rows[0];
  }

  // Get authorized guardians by primary guardian phone
  static async getAuthorizedGuardiansByPrimaryPhone(
    tenantId,
    primaryGuardianPhone,
    filters = {}
  ) {
    const { page = 1, pageSize = 20, search = "" } = filters;

    let sql = `
      SELECT DISTINCT
        sdbam.AuthMasterID,
        sdbam.Name,
        sdbam.PhoneNumber,
        sdbam.PhotoFlag,
        sdbam.PhotoPath,
        sdbam.PhotoName,
        sdbam.Relation,
        sdbam.IsActive,
        sdbam.CreatedDate,
        sdbam.UpdatedDate,
        -- Count only active links for LinkedStudentsCount
        COUNT(DISTINCT CASE WHEN sdbml.IsActive = 'Y' THEN sdbml.StudentDayBoardingID END) as LinkedStudentsCount,
        -- Include all student IDs (both active and inactive links)
        ARRAY_AGG(DISTINCT sdbl.StudentID) FILTER (WHERE sdbl.StudentID IS NOT NULL) as StudentIDs,
        ARRAY_AGG(DISTINCT sdbl.StudentName) FILTER (WHERE sdbl.StudentName IS NOT NULL) as StudentNames,
        -- Check if approver has any active links
        CASE 
          WHEN COUNT(DISTINCT CASE WHEN sdbml.IsActive = 'Y' THEN sdbml.StudentDayBoardingID END) > 0 
          THEN 'Y' 
          ELSE 'N' 
        END as HasActiveLinks,
        COUNT(*) OVER() as total_count
      FROM StudentDayBoardingAuthMaster sdbam
      INNER JOIN StudentDayBoardingAuthMasterLink sdbml ON sdbam.AuthMasterID = sdbml.AuthMasterID
      INNER JOIN StudentDayBoardingList sdbl ON sdbml.StudentDayBoardingID = sdbl.StudentDayBoardingID
        AND sdbl.IsActive = 'Y' AND sdbl.VisitorCatID = 7
        AND sdbl.PrimaryGuardianPhone = $2
      WHERE sdbam.TenantID = $1 AND sdbam.IsActive = 'Y'
    `;

    const params = [tenantId, primaryGuardianPhone];
    let paramIndex = 3;

    // Apply search filter
    if (search) {
      sql += ` AND (
        sdbam.Name ILIKE $${paramIndex} OR 
        sdbam.PhoneNumber ILIKE $${paramIndex} OR
        sdbam.Relation ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` GROUP BY sdbam.AuthMasterID, sdbam.Name, sdbam.PhoneNumber, sdbam.PhotoFlag, 
             sdbam.PhotoPath, sdbam.PhotoName, sdbam.Relation, sdbam.IsActive, 
             sdbam.CreatedDate, sdbam.UpdatedDate`;

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY sdbam.CreatedDate DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(pageSize, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  // Guardian authentication - get guardian dashboard data
  static async getGuardianDashboard(tenantId, guardianPhone) {
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
        sdbl.StudentPhotoFlag,
        sdbl.StudentPhotoPath,
        sdbl.StudentPhotoName,
        -- Get all approvers for this student
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'AuthMasterID', sdbam.AuthMasterID,
              'Name', sdbam.Name,
              'PhoneNumber', sdbam.PhoneNumber,
              'Relation', sdbml.Relation,
              'PhotoFlag', sdbam.PhotoFlag,
              'PhotoPath', sdbam.PhotoPath,
              'PhotoName', sdbam.PhotoName,
              'IsActive', sdbml.IsActive,
              'LinkID', sdbml.LinkID
            )
          ) FILTER (WHERE sdbam.AuthMasterID IS NOT NULL), 
          '[]'::json
        ) as Approvers
      FROM StudentDayBoardingList sdbl
      LEFT JOIN StudentDayBoardingAuthMasterLink sdbml ON sdbl.StudentDayBoardingID = sdbml.StudentDayBoardingID
        AND sdbml.IsActive = 'Y'
      LEFT JOIN StudentDayBoardingAuthMaster sdbam ON sdbml.AuthMasterID = sdbam.AuthMasterID
        AND sdbam.IsActive = 'Y'
      WHERE sdbl.TenantID = $1 AND sdbl.PrimaryGuardianPhone = $2 
        AND sdbl.VisitorCatID = 7 AND sdbl.IsActive = 'Y'
      GROUP BY sdbl.StudentDayBoardingID, sdbl.StudentID, sdbl.StudentName, sdbl.Course, 
               sdbl.Section, sdbl.Year, sdbl.PrimaryGuardianName, sdbl.PrimaryGuardianPhone, 
               sdbl.GuardianRelation, sdbl.StudentPhotoFlag, sdbl.StudentPhotoPath, sdbl.StudentPhotoName
      ORDER BY sdbl.StudentName
    `;

    const result = await query(sql, [tenantId, guardianPhone]);
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
        sdbl.VisitorCatName,
        sdbl.StudentPhotoFlag,
        sdbl.StudentPhotoPath,
        sdbl.StudentPhotoName
      FROM StudentDayBoardingList sdbl
      WHERE sdbl.TenantID = $1 AND sdbl.StudentID = $2 AND sdbl.VisitorCatID = 7 AND sdbl.IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId, studentId]);
    return result.rows[0];
  }

  // ================================================================================
  // NEW ENHANCED API MODEL METHODS
  // ================================================================================

  // 1. Get all tenants with country code
  static async getAllTenants() {
    const sql = `
      SELECT 
        t.TenantID,
        t.TenantName,
        t.TenantCode,
        t.IsActive,
        COALESCE(ts.CountryCode, '+91') as CountryCode
      FROM Tenant t
      LEFT JOIN TenantSetting ts ON t.TenantID = ts.TenantID AND ts.IsActive = 'Y'
      WHERE t.IsActive = 'Y'
      ORDER BY t.TenantName
    `;

    const result = await query(sql, []);
    return result.rows;
  }

  // 2. Get students by primary guardian phone
  static async getStudentsByPrimaryGuardianPhone(tenantId, guardianPhone) {
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
        sdbl.StudentPhotoFlag,
        sdbl.StudentPhotoPath,
        sdbl.StudentPhotoName,
        -- Check if student has any active approvers
        CASE 
          WHEN COUNT(sdbml.LinkID) FILTER (WHERE sdbml.IsActive = 'Y' AND sdbam.IsActive = 'Y') > 0 
          THEN 'Y' 
          ELSE 'N' 
        END as HasActiveApprovers,
        COUNT(sdbml.LinkID) FILTER (WHERE sdbml.IsActive = 'Y' AND sdbam.IsActive = 'Y') as ActiveApproversCount,
        COUNT(sdbml.LinkID) FILTER (WHERE sdbam.IsActive = 'Y') as TotalApproversCount
      FROM StudentDayBoardingList sdbl
      LEFT JOIN StudentDayBoardingAuthMasterLink sdbml ON sdbl.StudentDayBoardingID = sdbml.StudentDayBoardingID
      LEFT JOIN StudentDayBoardingAuthMaster sdbam ON sdbml.AuthMasterID = sdbam.AuthMasterID
      WHERE sdbl.TenantID = $1 AND sdbl.PrimaryGuardianPhone = $2 
        AND sdbl.VisitorCatID = 7 AND sdbl.IsActive = 'Y'
      GROUP BY sdbl.StudentDayBoardingID, sdbl.StudentID, sdbl.StudentName, 
               sdbl.Course, sdbl.Section, sdbl.Year, sdbl.PrimaryGuardianName, 
               sdbl.PrimaryGuardianPhone, sdbl.GuardianRelation, sdbl.StudentPhotoFlag, 
               sdbl.StudentPhotoPath, sdbl.StudentPhotoName
      ORDER BY sdbl.StudentName
    `;

    const result = await query(sql, [tenantId, guardianPhone]);
    return result.rows;
  }

  // 3. Get authorized list by guardian phone
  static async getAuthorizedListByGuardianPhone(tenantId, guardianPhone) {
    const sql = `
      SELECT 
        sdbml.LinkID,
        sdbml.StudentDayBoardingID,
        sdbl.StudentID,
        sdbl.StudentName,
        sdbl.Course,
        sdbl.Section,
        sdbl.Year,
        sdbml.Relation,
        sdbml.PhotoFlag,
        sdbml.PhotoPath,
        sdbml.PhotoName,
        sdbml.IsActive,
        sdbam.AuthMasterID,
        sdbam.Name as GuardianName,
        sdbam.PhoneNumber as GuardianPhone,
        sdbam.PhotoFlag as GuardianPhotoFlag,
        sdbam.PhotoPath as GuardianPhotoPath,
        sdbam.PhotoName as GuardianPhotoName
      FROM StudentDayBoardingAuthMasterLink sdbml
      INNER JOIN StudentDayBoardingList sdbl ON sdbml.StudentDayBoardingID = sdbl.StudentDayBoardingID
      INNER JOIN StudentDayBoardingAuthMaster sdbam ON sdbml.AuthMasterID = sdbam.AuthMasterID
      WHERE sdbml.TenantID = $1 AND sdbam.PhoneNumber = $2 
        AND sdbml.IsActive = 'Y' AND sdbl.IsActive = 'Y' AND sdbam.IsActive = 'Y'
        AND sdbl.VisitorCatID = 7
      ORDER BY sdbl.StudentName
    `;

    const result = await query(sql, [tenantId, guardianPhone]);
    return result.rows;
  }

  // 4. Get active approvers by student ID
  static async getActiveApproversByStudentId(tenantId, studentId) {
    const sql = `
      SELECT 
        sdbml.LinkID,
        sdbam.AuthMasterID,
        sdbml.StudentDayBoardingID,
        sdbam.Name,
        sdbam.PhoneNumber,
        sdbml.Relation,
        sdbml.PhotoFlag,
        sdbml.PhotoPath,
        sdbml.PhotoName,
        sdbml.IsActive
      FROM StudentDayBoardingAuthMasterLink sdbml
      INNER JOIN StudentDayBoardingAuthMaster sdbam ON sdbml.AuthMasterID = sdbam.AuthMasterID
      INNER JOIN StudentDayBoardingList sdbl ON sdbml.StudentDayBoardingID = sdbl.StudentDayBoardingID
      WHERE sdbml.TenantID = $1 AND sdbl.StudentID = $2 
        AND sdbml.IsActive = 'Y' AND sdbam.IsActive = 'Y' AND sdbl.IsActive = 'Y'
        AND sdbl.VisitorCatID = 7
      ORDER BY sdbam.Name
    `;

    const result = await query(sql, [tenantId, studentId]);
    return result.rows;
  }

  // 5. Bulk link students to guardian
  static async bulkLinkStudentsToGuardian(linkData, createdBy) {
    const client = await require("../config/database").getClient();

    try {
      await client.query("BEGIN");

      const {
        tenantId,
        primaryGuardianPhone,
        studentIds,
        name,
        phoneNumber,
        relation,
        photoFlag,
        photoPath,
        photoName,
      } = linkData;
      const results = [];

      // First, check if guardian exists in auth master
      let authMasterResult = await client.query(
        `
        SELECT AuthMasterID FROM StudentDayBoardingAuthMaster
        WHERE TenantID = $1 AND PhoneNumber = $2 AND IsActive = 'Y'
        LIMIT 1
      `,
        [tenantId, primaryGuardianPhone]
      );

      let authMasterId;

      if (authMasterResult.rows.length === 0) {
        // Create new auth master record - use first student for reference
        const firstStudentResult = await client.query(
          `
          SELECT StudentDayBoardingID FROM StudentDayBoardingList 
          WHERE TenantID = $1 AND StudentID = $2 AND IsActive = 'Y'
          LIMIT 1
        `,
          [tenantId, studentIds[0]]
        );

        if (firstStudentResult.rows.length === 0) {
          throw new Error(`Student ${studentIds[0]} not found`);
        }

        const newAuthMaster = await client.query(
          `
          INSERT INTO StudentDayBoardingAuthMaster (
            TenantID, StudentDayBoardingID, Name, PhoneNumber, PhotoFlag, PhotoPath, PhotoName,
            Relation, IsActive, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Y', NOW(), NOW(), $9, $9)
          RETURNING AuthMasterID
        `,
          [
            tenantId,
            firstStudentResult.rows[0].studentdayboardingid,
            name,
            phoneNumber,
            photoFlag,
            photoPath,
            photoName,
            relation,
            createdBy,
          ]
        );

        authMasterId = newAuthMaster.rows[0].authmasterid;
      } else {
        authMasterId = authMasterResult.rows[0].authmasterid;
      }

      // Process each student
      for (const studentId of studentIds) {
        try {
          // Get student info
          const studentResult = await client.query(
            `
            SELECT StudentDayBoardingID FROM StudentDayBoardingList
            WHERE TenantID = $1 AND StudentID = $2 AND IsActive = 'Y'
          `,
            [tenantId, studentId]
          );

          if (studentResult.rows.length === 0) {
            results.push({
              studentId,
              status: "ERROR",
              message: "Student not found",
            });
            continue;
          }

          const studentDayBoardingId =
            studentResult.rows[0].studentdayboardingid;

          // Check if link already exists
          const existingLink = await client.query(
            `
            SELECT LinkID FROM StudentDayBoardingAuthMasterLink
            WHERE TenantID = $1 AND StudentDayBoardingID = $2 AND AuthMasterID = $3 AND IsActive = 'Y'
          `,
            [tenantId, studentDayBoardingId, authMasterId]
          );

          if (existingLink.rows.length > 0) {
            results.push({
              studentId,
              status: "DUPLICATE",
              message: "Student already linked to this guardian",
            });
            continue;
          }

          // Create the link
          await client.query(
            `
            INSERT INTO StudentDayBoardingAuthMasterLink (
              TenantID, StudentDayBoardingID, AuthMasterID, StudentID, PhoneNumber,
              Relation, PhotoFlag, PhotoPath, PhotoName, IsActive,
              CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Y', NOW(), NOW(), $10, $10)
          `,
            [
              tenantId,
              studentDayBoardingId,
              authMasterId,
              studentId,
              phoneNumber,
              relation,
              photoFlag,
              photoPath,
              photoName,
              createdBy,
            ]
          );

          results.push({
            studentId,
            status: "SUCCESS",
            message: "Student linked successfully",
            authMasterId: authMasterId,
          });
        } catch (error) {
          results.push({
            studentId,
            status: "ERROR",
            message: error.message,
          });
        }
      }

      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // 6. Deactivate approver for all students
  static async deactivateApprover(
    tenantId,
    guardianPhone,
    approverId,
    updatedBy
  ) {
    const sql = `
      UPDATE StudentDayBoardingAuthMasterLink
      SET IsActive = 'N',
          UpdatedDate = NOW(),
          UpdatedBy = $1
      WHERE TenantID = $2 AND AuthMasterID = $3 AND IsActive = 'Y'
        AND EXISTS (
          SELECT 1 FROM StudentDayBoardingList sdbl 
          WHERE sdbl.StudentID = StudentDayBoardingAuthMasterLink.StudentID 
            AND sdbl.PrimaryGuardianPhone = $4 AND sdbl.IsActive = 'Y'
            AND sdbl.VisitorCatID = 7
        )
        AND EXISTS (
          SELECT 1 FROM StudentDayBoardingAuthMaster sdbam 
          WHERE sdbam.AuthMasterID = StudentDayBoardingAuthMasterLink.AuthMasterID 
            AND sdbam.IsActive = 'Y'
        )
      RETURNING LinkID, StudentID
    `;

    const result = await query(sql, [
      updatedBy,
      tenantId,
      approverId,
      guardianPhone,
    ]);
    return result.rows; // Return all affected links
  }

  // 7. Activate approver for all students
  static async activateApprover(
    tenantId,
    guardianPhone,
    approverId,
    updatedBy
  ) {
    const sql = `
      UPDATE StudentDayBoardingAuthMasterLink
      SET IsActive = 'Y',
          UpdatedDate = NOW(),
          UpdatedBy = $1
      WHERE TenantID = $2 AND AuthMasterID = $3 AND IsActive = 'N'
        AND EXISTS (
          SELECT 1 FROM StudentDayBoardingList sdbl 
          WHERE sdbl.StudentID = StudentDayBoardingAuthMasterLink.StudentID 
            AND sdbl.PrimaryGuardianPhone = $4 AND sdbl.IsActive = 'Y'
            AND sdbl.VisitorCatID = 7
        )
        AND EXISTS (
          SELECT 1 FROM StudentDayBoardingAuthMaster sdbam 
          WHERE sdbam.AuthMasterID = StudentDayBoardingAuthMasterLink.AuthMasterID 
            AND sdbam.IsActive = 'Y'
        )
      RETURNING LinkID, StudentID
    `;

    const result = await query(sql, [
      updatedBy,
      tenantId,
      approverId,
      guardianPhone,
    ]);
    return result.rows; // Return all affected links
  }

  // 8. Update approver details
  static async updateApprover(tenantId, approverId, approverData, updatedBy) {
    const sql = `
      UPDATE StudentDayBoardingAuthMaster
      SET Name = $1,
          Relation = $2,
          PhoneNumber = $3,
          PhotoFlag = $4,
          PhotoPath = $5,
          PhotoName = $6,
          UpdatedDate = NOW(),
          UpdatedBy = $7
      WHERE TenantID = $8 AND AuthMasterID = $9 AND IsActive = 'Y'
      RETURNING AuthMasterID, Name, PhoneNumber, Relation, PhotoFlag, PhotoPath, PhotoName
    `;

    const result = await query(sql, [
      approverData.name,
      approverData.relation,
      approverData.phoneNumber,
      approverData.photoFlag,
      approverData.photoPath,
      approverData.photoName,
      updatedBy,
      tenantId,
      approverId,
    ]);
    return result.rows[0];
  }

  // 9. Get all approvers by student ID (including inactive)
  static async getAllApproversByStudentId(tenantId, studentId) {
    const sql = `
      SELECT 
        sdbml.LinkID,
        sdbam.AuthMasterID,
        sdbml.StudentDayBoardingID,
        sdbam.Name,
        sdbam.PhoneNumber,
        sdbml.Relation,
        sdbml.PhotoFlag,
        sdbml.PhotoPath,
        sdbml.PhotoName,
        sdbml.IsActive
      FROM StudentDayBoardingAuthMasterLink sdbml
      INNER JOIN StudentDayBoardingAuthMaster sdbam ON sdbml.AuthMasterID = sdbam.AuthMasterID
      INNER JOIN StudentDayBoardingList sdbl ON sdbml.StudentDayBoardingID = sdbl.StudentDayBoardingID
      WHERE sdbml.TenantID = $1 AND sdbl.StudentID = $2 
        AND sdbam.IsActive = 'Y' AND sdbl.IsActive = 'Y'
        AND sdbl.VisitorCatID = 7
        -- Note: Removed sdbml.IsActive = 'Y' filter to include inactive approvers
      ORDER BY sdbml.IsActive DESC, sdbam.Name
    `;

    const result = await query(sql, [tenantId, studentId]);
    return result.rows;
  }

  // Get approvers by student day boarding ID
  static async getApproversByDayboardingId(tenantId, studentDayBoardingId) {
    const sql = `
      SELECT 
        sdbam.AuthMasterID,
        sdbam.Name,
        sdbml.PhotoPath,
        sdbml.Relation
      FROM StudentDayBoardingAuthMasterLink sdbml
      INNER JOIN StudentDayBoardingAuthMaster sdbam ON sdbml.AuthMasterID = sdbam.AuthMasterID
      WHERE sdbml.TenantID = $1 AND sdbml.StudentDayBoardingID = $2 
        AND sdbam.IsActive = 'Y' AND sdbml.IsActive = 'Y'
      ORDER BY sdbam.Name
    `;

    const result = await query(sql, [tenantId, studentDayBoardingId]);
    return result.rows;
  }

  // Get student details by StudentDayBoardingID
  static async getStudentByDayBoardingId(tenantId, studentDayBoardingId) {
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
        vc.VisitorCatName,
        sdbl.CreatedDate,
        sdbl.CreatedBy
      FROM StudentDayBoardingList sdbl
      LEFT JOIN VisitorCategory vc ON sdbl.VisitorCatID = vc.VisitorCatID
      WHERE sdbl.TenantID = $1 AND sdbl.StudentDayBoardingID = $2 AND sdbl.IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId, studentDayBoardingId]);
    return result.rows[0];
  }

  // Get approver by ID
  static async getApproverById(tenantId, approverId) {
    const sql = `
      SELECT 
        AuthMasterID,
        Name,
        PhoneNumber,
        Relation
      FROM StudentDayBoardingAuthMaster
      WHERE TenantID = $1 AND AuthMasterID = $2 AND IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId, approverId]);
    return result.rows[0];
  }

  // Get students with detailed approver information
  static async getStudentsWithApproverDetails(tenantId, filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      search = "",
      course = null,
      section = null,
      year = null,
      approverStatus = null, // 'ACTIVE', 'INACTIVE', or null for all
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
        sdbl.StudentPhotoFlag,
        sdbl.StudentPhotoPath,
        sdbl.StudentPhotoName,
        -- Approver details
        CASE 
          WHEN COUNT(sdbml.LinkID) FILTER (WHERE sdbml.IsActive = 'Y' AND sdbam.IsActive = 'Y') > 0 
          THEN 'Y' 
          ELSE 'N' 
        END as HasActiveApprovers,
        COUNT(sdbml.LinkID) FILTER (WHERE sdbml.IsActive = 'Y' AND sdbam.IsActive = 'Y') as ActiveApproversCount,
        COUNT(sdbml.LinkID) FILTER (WHERE sdbam.IsActive = 'Y') as TotalApproversCount,
        -- Approver list as JSON
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'LinkID', sdbml.LinkID,
              'AuthMasterID', sdbam.AuthMasterID,
              'Name', sdbam.Name,
              'PhoneNumber', sdbam.PhoneNumber,
              'Relation', sdbml.Relation,
              'PhotoFlag', sdbml.PhotoFlag,
              'PhotoPath', sdbml.PhotoPath,
              'PhotoName', sdbml.PhotoName,
              'IsActive', sdbml.IsActive,
              'AuthMasterActive', sdbam.IsActive
            )
          ) FILTER (WHERE sdbam.AuthMasterID IS NOT NULL), 
          '[]'::json
        ) as Approvers,
        COUNT(*) OVER() as total_count
      FROM StudentDayBoardingList sdbl
      LEFT JOIN StudentDayBoardingAuthMasterLink sdbml ON sdbl.StudentDayBoardingID = sdbml.StudentDayBoardingID
      LEFT JOIN StudentDayBoardingAuthMaster sdbam ON sdbml.AuthMasterID = sdbam.AuthMasterID
        AND sdbam.IsActive = 'Y'
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

    // Group by all non-aggregate columns
    sql += ` GROUP BY sdbl.StudentDayBoardingID, sdbl.StudentID, sdbl.StudentName, 
             sdbl.Course, sdbl.Section, sdbl.Year, sdbl.PrimaryGuardianName, 
             sdbl.PrimaryGuardianPhone, sdbl.GuardianRelation, sdbl.VisitorCatID, 
             sdbl.VisitorCatName, sdbl.IsActive, sdbl.CreatedDate, sdbl.CreatedBy,
             sdbl.StudentPhotoFlag, sdbl.StudentPhotoPath, sdbl.StudentPhotoName`;

    // Filter by approver status after grouping
    if (approverStatus === "ACTIVE") {
      sql += ` HAVING COUNT(sdbml.LinkID) FILTER (WHERE sdbml.IsActive = 'Y' AND sdbam.IsActive = 'Y') > 0`;
    } else if (approverStatus === "INACTIVE") {
      sql += ` HAVING COUNT(sdbml.LinkID) FILTER (WHERE sdbml.IsActive = 'Y' AND sdbam.IsActive = 'Y') = 0`;
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY sdbl.CreatedDate DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(pageSize, offset);

    const result = await query(sql, params);
    return result.rows;
  }
}

module.exports = StudentDayBoardingModel;
