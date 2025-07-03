const { query } = require("../config/database");

class StudentModel {
  // Get students with filters
  static async getStudentsWithFilters(tenantId, filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      search = "",
      purposeId = null,
      studentId = "",
      firstName = "",
      course = "",
      hostel = "",
      fromDate = null,
      toDate = null,
    } = filters;

    let sql = `
      SELECT 
  vr.VisitorRegID,
  vr.VisitorRegNo,
  vr.SecurityCode,
  vr.VistorName,
  vr.Mobile,
  vr.Email,
  vr.VisitorCatID,
  vr.VisitorCatName,
  vr.VisitorSubCatID,
  vr.VisitorSubCatName,
  vr.FlatID,
  vr.FlatName,
  vr.AssociatedFlat,
  vr.VehiclelNo,
  vr.PhotoFlag,
  vr.PhotoPath,
  vr.PhotoName,
  vr.CreatedDate,
  vr.UpdatedDate,
  vr.IsActive,
  -- Add custom fields for course and hostel information
  COALESCE(bvu.Course, 'N/A') as Course,
  COALESCE(bvu.Hostel, 'N/A') as Hostel,
  COALESCE(bvu.StudentID, '') as StudentID,
  -- Latest visit purpose info
  vh_latest.VisitPurposeID as LastVisitPurposeID,
  vh_latest.VisitPurpose as LastVisitPurpose,
  vh_latest.PurposeCatID as LastPurposeCatID,
  vh_latest.PurposeCatName as LastPurposeCatName,
  vh_latest.INTimeTxt as LastCheckOutTime,
  vh_latest.OutTimeTxt as LastCheckInTime,
  vh_latest.RegVisitorHistoryID as LastHistoryID,
  
  -- ADD THESE NEW FIELDS FOR DATE AND DURATION:
  vh_latest.INTime as LastCheckOutDateTime,
  vh_latest.OutTime as LastCheckInDateTime,
  vh_latest.CreatedDate as LastVisitDate,
  
  -- Calculate duration in hours if both times exist
  CASE 
    WHEN vh_latest.OutTime IS NOT NULL AND vh_latest.INTime IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (vh_latest.OutTime - vh_latest.INTime))/3600
    ELSE NULL 
  END as LastVisitDurationHours,
  
  -- Calculate current checkout duration if still checked out
  CASE 
    WHEN vh_latest.OutTime IS NULL AND vh_latest.INTime IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (NOW() - vh_latest.INTime))/3600
    ELSE NULL 
  END as CurrentCheckoutDurationHours,
  
  -- Current status
  CASE 
    WHEN vh_latest.OutTime IS NULL OR vh_latest.OutTimeTxt IS NULL OR vh_latest.OutTimeTxt = '' 
    THEN 'CHECKED_OUT' 
    ELSE 'CHECKED_IN' 
  END as CurrentStatus,
  COUNT(*) OVER() as total_count
FROM VisitorRegistration vr
LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'student'
LEFT JOIN LATERAL (
  SELECT vh.VisitPurposeID, vh.VisitPurpose, vh.PurposeCatID, vh.PurposeCatName,
         vh.INTimeTxt, vh.OutTimeTxt, vh.OutTime, vh.INTime, vh.CreatedDate, vh.RegVisitorHistoryID
  FROM VisitorRegVisitHistory vh 
  WHERE vh.VisitorRegID = vr.VisitorRegID 
    AND vh.TenantID = vr.TenantID 
    AND vh.IsActive = 'Y'
  ORDER BY vh.CreatedDate DESC 
  LIMIT 1
) vh_latest ON true
WHERE vr.TenantID = $1 
  AND vr.IsActive = 'Y'
  AND vr.VisitorCatID = 3
    `;

    const params = [tenantId];
    let paramIndex = 2;

    // Apply filters
    if (search) {
      sql += ` AND (
        vr.VistorName ILIKE $${paramIndex} OR 
        vr.Mobile ILIKE $${paramIndex} OR 
        vr.VisitorRegNo ILIKE $${paramIndex} OR
        vr.SecurityCode ILIKE $${paramIndex} OR
        bvu.StudentID ILIKE $${paramIndex} OR
        bvu.Course ILIKE $${paramIndex} OR
        bvu.Hostel ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (studentId) {
      sql += ` AND (bvu.StudentID ILIKE $${paramIndex} OR vr.VisitorRegNo ILIKE $${paramIndex})`;
      params.push(`%${studentId}%`);
      paramIndex++;
    }

    if (firstName) {
      sql += ` AND vr.VistorName ILIKE $${paramIndex}`;
      params.push(`%${firstName}%`);
      paramIndex++;
    }

    if (course) {
      sql += ` AND bvu.Course ILIKE $${paramIndex}`;
      params.push(`%${course}%`);
      paramIndex++;
    }

    if (hostel) {
      sql += ` AND bvu.Hostel ILIKE $${paramIndex}`;
      params.push(`%${hostel}%`);
      paramIndex++;
    }

    if (purposeId && purposeId > 0) {
      sql += ` AND vh_latest.VisitPurposeID = $${paramIndex}`;
      params.push(purposeId);
      paramIndex++;
    }

    if (fromDate && toDate) {
      sql += ` AND vr.CreatedDate BETWEEN $${paramIndex} AND $${
        paramIndex + 1
      }`;
      params.push(fromDate, toDate);
      paramIndex += 2;
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY vr.CreatedDate DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(pageSize, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  // Get student by ID with latest purpose
  static async getStudentById(studentId, tenantId) {
    const sql = `
      SELECT 
        vr.VisitorRegID,
        vr.VisitorRegNo,
        vr.SecurityCode,
        vr.VistorName,
        vr.Mobile,
        vr.Email,
        vr.VisitorCatID,
        vr.VisitorCatName,
        vr.VisitorSubCatID,
        vr.VisitorSubCatName,
        vr.FlatID,
        vr.FlatName,
        vr.AssociatedFlat,
        vr.AssociatedBlock,
        vr.VehiclelNo,
        vr.PhotoFlag,
        vr.PhotoPath,
        vr.PhotoName,
        vr.IsActive,
        COALESCE(bvu.Course, 'N/A') as Course,
        COALESCE(bvu.Hostel, 'N/A') as Hostel,
        COALESCE(bvu.StudentID, '') as StudentID
      FROM VisitorRegistration vr
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'student'
      WHERE vr.VisitorRegID = $1 
        AND vr.TenantID = $2 
        AND vr.IsActive = 'Y'
        AND vr.VisitorCatID = 3
    `;

    const result = await query(sql, [studentId, tenantId]);
    return result.rows[0];
  }

  // Get active visit with purpose for student
  static async getActiveVisit(studentId, tenantId) {
    const sql = `
      SELECT 
        RegVisitorHistoryID,
        VisitorRegID,
        VistorName,
        Mobile,
        INTime,
        INTimeTxt,
        OutTime,
        OutTimeTxt,
        VisitPurposeID,
        VisitPurpose,
        PurposeCatID,
        PurposeCatName,
        CreatedDate,
        UpdatedDate
      FROM VisitorRegVisitHistory
      WHERE VisitorRegID = $1 
        AND TenantID = $2 
        AND IsActive = 'Y'
      ORDER BY CreatedDate DESC
      LIMIT 1
    `;

    const result = await query(sql, [studentId, tenantId]);
    return result.rows[0];
  }

  // Create visit history record with purpose for checkout
  static async createVisitHistory(visitData) {
    const {
      tenantId,
      visitorRegId,
      visitorRegNo,
      securityCode,
      vistorName,
      mobile,
      vehicleNo,
      visitorCatId,
      visitorCatName,
      visitorSubCatId,
      visitorSubCatName,
      associatedFlat,
      associatedBlock,
      visitPurposeId,
      visitPurpose,
      purposeCatId,
      purposeCatName,
      createdBy,
    } = visitData;

    const sql = `
      INSERT INTO VisitorRegVisitHistory (
        TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
        VistorName, Mobile, VehiclelNo, VisitorCatID, VisitorCatName,
        VisitorSubCatID, VisitorSubCatName, AssociatedFlat, AssociatedBlock,
        VisitPurposeID, VisitPurpose, PurposeCatID, PurposeCatName,
        INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES (
        $1, 'Y', 'Y', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17,
        NOW(), TO_CHAR(NOW(), 'HH12:MI AM'), NOW(), NOW(), $18, $18
      ) RETURNING RegVisitorHistoryID
    `;

    const result = await query(sql, [
      tenantId,
      visitorRegId,
      visitorRegNo,
      securityCode,
      vistorName,
      mobile,
      vehicleNo,
      visitorCatId,
      visitorCatName,
      visitorSubCatId,
      visitorSubCatName,
      associatedFlat,
      associatedBlock,
      visitPurposeId,
      visitPurpose,
      purposeCatId,
      purposeCatName,
      createdBy,
    ]);

    return result.rows[0];
  }

  // Update visit history for check-in
  static async updateVisitHistoryCheckin(historyId, tenantId, updatedBy) {
    const sql = `
      UPDATE VisitorRegVisitHistory 
      SET OutTime = NOW(), 
          OutTimeTxt = TO_CHAR(NOW(), 'HH12:MI AM'),
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE RegVisitorHistoryID = $1 AND TenantID = $2
      RETURNING RegVisitorHistoryID
    `;

    const result = await query(sql, [historyId, tenantId, updatedBy]);
    return result.rows[0];
  }

  // Get student's visit history with purposes
  static async getStudentHistory(studentId, tenantId, limit = 10) {
    const sql = `
      SELECT 
        RegVisitorHistoryID,
        VisitorRegID,
        VistorName,
        Mobile,
        VehiclelNo,
        VisitorCatName,
        VisitorSubCatName,
        AssociatedFlat,
        VisitPurposeID,
        VisitPurpose,
        PurposeCatID,
        PurposeCatName,
        INTime,
        INTimeTxt,
        OutTime,
        OutTimeTxt,
        CreatedDate,
        UpdatedDate,
        -- Calculate duration if both times exist
        CASE 
          WHEN OutTime IS NOT NULL AND INTime IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (OutTime - INTime))/3600
          ELSE NULL 
        END as DurationHours
      FROM VisitorRegVisitHistory
      WHERE VisitorRegID = $1 
        AND TenantID = $2 
        AND IsActive = 'Y'
      ORDER BY CreatedDate DESC
      LIMIT $3
    `;

    const result = await query(sql, [studentId, tenantId, limit]);
    return result.rows;
  }

  // Get students pending check-in (currently checked out)
  static async getStudentsPendingCheckin(tenantId) {
    const sql = `
      SELECT 
        vh.RegVisitorHistoryID,
        vh.VisitorRegID,
        vh.VistorName,
        vh.Mobile,
        vh.VisitorCatName,
        vh.VisitorSubCatName,
        vh.AssociatedFlat,
        vh.VisitPurposeID,
        vh.VisitPurpose,
        vh.PurposeCatID,
        vh.PurposeCatName,
        vh.INTime,
        vh.INTimeTxt,
        vr.PhotoPath,
        vr.PhotoName,
        COALESCE(bvu.Course, 'N/A') as Course,
        COALESCE(bvu.Hostel, 'N/A') as Hostel,
        COALESCE(bvu.StudentID, '') as StudentID
      FROM VisitorRegVisitHistory vh
      JOIN VisitorRegistration vr ON vh.VisitorRegID = vr.VisitorRegID
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'student'
      WHERE vh.TenantID = $1 
        AND vh.IsActive = 'Y'
        AND vh.VisitorCatID = 3
        AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '')
      ORDER BY vh.INTime DESC
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get student purposes by category (specifically for students - PurposeCatID = 3)
  static async getStudentPurposes(tenantId, purposeCatId = 3) {
    const sql = `
      SELECT 
        VisitPurposeID as "purposeId",
        VisitPurpose as "purposeName",
        PurposeCatID as "purposeCatId",
        PurposeCatName as "purposeCatName",
        ImageFlag as "imageFlag",
        ImagePath as "imagePath",
        ImageName as "imageName",
        ImageUrl as "imageUrl"
      FROM VisitorPuposeMaster
      WHERE TenantID = $1 
        AND PurposeCatID = $2
        AND IsActive = 'Y'
      ORDER BY VisitPurpose ASC
    `;

    const result = await query(sql, [tenantId, purposeCatId]);
    return result.rows;
  }

  // Get purpose by ID
  static async getPurposeById(purposeId, tenantId) {
    const sql = `
      SELECT 
        VisitPurposeID,
        PurposeCatID,
        PurposeCatName,
        VisitPurpose,
        IsActive
      FROM VisitorPuposeMaster
      WHERE VisitPurposeID = $1 
        AND TenantID = $2
        AND IsActive = 'Y'
    `;

    const result = await query(sql, [purposeId, tenantId]);
    return result.rows[0];
  }

  // New method: Get purpose categories for students
  static async getPurposeCategories(tenantId) {
    const sql = `
      SELECT DISTINCT 
        PurposeCatID,
        PurposeCatName
      FROM VisitorPuposeMaster
      WHERE TenantID = $1 
        AND IsActive = 'Y'
      ORDER BY PurposeCatName
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get students currently checked in (pending checkout)
  static async getPendingCheckout(tenantId) {
    try {
      const sql = `
      SELECT DISTINCT
        vr.VisitorRegID as studentId,
        vr.VisitorRegNo as studentRegNo,
        vr.VistorName as studentName,
        vr.Mobile as mobile,
        COALESCE(bvu.Course, vr.AssociatedBlock) as course,
        COALESCE(bvu.Hostel, vr.AssociatedFlat) as hostel,
        vh.INTime as checkInTime,
        vh.INTimeTxt as checkInTimeText,
        EXTRACT(EPOCH FROM (NOW() - vh.INTime))/3600 as hoursCheckedIn
      FROM VisitorRegistration vr
      INNER JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'student'
      WHERE vr.TenantID = $1 
        AND vr.IsActive = 'Y'
        AND vr.VisitorCatName = 'Student'
        AND vh.TenantID = $1
        AND vh.IsActive = 'Y'
        AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '')
      ORDER BY vh.INTime DESC
    `;

      const { query } = require("../config/database");
      const result = await query(sql, [tenantId]);

      const students = result.rows.map((row) => ({
        ...row,
        hoursCheckedIn: Math.round(row.hourscheckedin * 100) / 100,
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: students,
        count: students.length,
      };
    } catch (error) {
      console.error("Error fetching pending checkout students:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Add new student purpose
  static async addStudentPurpose(purposeData) {
    const { tenantId, purposeName, createdBy, imageData } = purposeData;
    
    const sql = `
      INSERT INTO VisitorPuposeMaster (
        TenantID, 
        PurposeCatID, 
        PurposeCatName, 
        VisitPurpose, 
        IsActive,
        CreatedBy,
        CreatedDate,
        ImageFlag,
        ImagePath,
        ImageName,
        ImageUrl
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10)
      RETURNING 
        VisitPurposeID as "purposeId",
        VisitPurpose as "purposeName",
        PurposeCatID as "purposeCatId",
        PurposeCatName as "purposeCatName",
        ImageFlag as "imageFlag",
        ImagePath as "imagePath",
        ImageName as "imageName",
        ImageUrl as "imageUrl"
    `;

    const result = await query(sql, [
      tenantId,
      3, // Student category ID
      'Student',
      purposeName,
      'Y',
      createdBy,
      imageData ? imageData.flag : 'N',
      imageData ? imageData.path : null,
      imageData ? imageData.name : null,
      imageData ? imageData.url : null
    ]);

    return result.rows[0];
  }

  // Update student purpose
  static async updateStudentPurpose(purposeId, tenantId, purposeName, updatedBy) {
    const sql = `
      UPDATE VisitorPuposeMaster 
      SET VisitPurpose = $1,
          UpdatedBy = $2,
          UpdatedDate = NOW()
      WHERE VisitPurposeID = $3 
        AND TenantID = $4 
        AND PurposeCatID = 3
      RETURNING 
        VisitPurposeID as "purposeId",
        VisitPurpose as "purposeName",
        PurposeCatID as "purposeCatId",
        PurposeCatName as "purposeCatName"
    `;

    const result = await query(sql, [purposeName, updatedBy, purposeId, tenantId]);
    return result.rows[0];
  }

  // Delete student purpose (soft delete)
  static async deleteStudentPurpose(purposeId, tenantId, updatedBy) {
    const sql = `
      UPDATE VisitorPuposeMaster 
      SET IsActive = 'N',
          UpdatedBy = $1,
          UpdatedDate = NOW()
      WHERE VisitPurposeID = $2 
        AND TenantID = $3 
        AND PurposeCatID = 3
        AND IsActive = 'Y'
      RETURNING VisitPurposeID as "purposeId"
    `;

    const result = await query(sql, [updatedBy, purposeId, tenantId]);
    return result.rows[0];
  }

  // Check if purpose exists (for validation)
  static async checkPurposeExists(tenantId, purposeName, excludeId = null) {
    let sql = `
      SELECT VisitPurposeID
      FROM VisitorPuposeMaster
      WHERE TenantID = $1 
        AND LOWER(TRIM(VisitPurpose)) = LOWER(TRIM($2))
        AND PurposeCatID = 3
        AND IsActive = 'Y'
    `;
    
    const params = [tenantId, purposeName];
    
    if (excludeId) {
      sql += ` AND VisitPurposeID != $3`;
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.rows.length > 0;
  }

  // Check purpose status before operations
  static async checkPurposeStatus(purposeId, tenantId) {
    const sql = `
      SELECT VisitPurposeID, IsActive
      FROM VisitorPuposeMaster
      WHERE VisitPurposeID = $1 
        AND TenantID = $2
        AND PurposeCatID = 3
    `;

    const result = await query(sql, [purposeId, tenantId]);
    return result.rows[0];
  }
}

module.exports = StudentModel;
