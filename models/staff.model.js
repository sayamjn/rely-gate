const { query } = require('../config/database');

class StaffModel {
  // Get all staff visit history
  static async getAllStaffVisitHistory(tenantId, filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      search = "",
      fromDate = null,
      toDate = null,
      visitorRegId = null,
      designation = null,
      VisitorSubCatID = null
    } = filters;
    
    let sql = `
      SELECT 
        vh.RegVisitorHistoryID as regVisitorHistoryId,
        vh.TenantID as tenantId,
        vh.IsActive as isActive,
        vh.IsRegFlag as isRegFlag,
        vh.VisitorRegID as visitorRegId,
        vh.VisitorRegNo as visitorRegNo,
        vh.SecurityCode as securityCode,
        vh.VistorName as visitorName,
        vh.Mobile as mobile,
        vh.VehiclelNo as vehicleNo,
        vh.Remark as remark,
        vh.VisitorCatID as visitorCatId,
        vh.VisitorCatName as visitorCatName,
        vh.VisitorSubCatID as visitorSubCatId,
        vh.VisitorSubCatName as visitorSubCatName,
        vh.AssociatedFlat as associatedFlat,
        vh.AssociatedBlock as associatedBlock,
        -- Convert to IST and provide both timestamp and text format
        vh.INTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as inTime,
        CASE 
          WHEN vh.INTime IS NOT NULL 
          THEN FLOOR(EXTRACT(EPOCH FROM vh.INTime))::text
          ELSE vh.INTimeTxt
        END as inTimeTxt,
        vh.OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as outTime,
        CASE 
          WHEN vh.OutTime IS NOT NULL 
          THEN FLOOR(EXTRACT(EPOCH FROM vh.OutTime))::text
          ELSE vh.OutTimeTxt
        END as outTimeTxt,
        vh.VisitPurposeID as visitPurposeId,
        vh.VisitPurpose as visitPurpose,
        vh.PurposeCatID as purposeCatId,
        vh.PurposeCatName as purposeCatName,
        vh.CreatedDate AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as createdDate,
        vh.UpdatedDate AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as updatedDate,
        vh.CreatedBy as createdBy,
        vh.UpdatedBy as updatedBy,
        -- Additional staff information from VisitorRegistration
        vr.Email as email,
        vr.PhotoFlag as photoFlag,
        vr.PhotoPath as photoPath,
        vr.PhotoName as photoName,
        vr.VehiclePhotoFlag as vehiclePhotoFlag,
        vr.VehiclePhotoPath as vehiclePhotoPath,
        vr.VehiclePhotoName as vehiclePhotoName,
        -- Calculate duration in hours if both times exist
        CASE 
          WHEN vh.OutTime IS NOT NULL AND vh.INTime IS NOT NULL 
          THEN EXTRACT(EPOCH FROM ((vh.OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') - (vh.INTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')))/3600
          ELSE NULL 
        END as durationHours,
        -- Status based on check-in/out times
        CASE 
          WHEN vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '' 
          THEN 'CHECKED_IN' 
          ELSE 'COMPLETED' 
        END as status,
        -- Format date for display
        TO_CHAR(vh.CreatedDate AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY') as visitDate,
        TO_CHAR(vh.INTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') as checkInTimeDisplay,
        TO_CHAR(vh.OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') as checkOutTimeDisplay,
        COUNT(*) OVER() as total_count
      FROM VisitorRegVisitHistory vh
      INNER JOIN VisitorRegistration vr ON vh.VisitorRegID::text = vr.VisitorRegID::text AND vh.TenantID = vr.TenantID
      WHERE vh.TenantID = $1 
        AND vh.IsActive = 'Y'
        AND vh.VisitorCatID = 3
    `;
    
    const params = [tenantId];
    let paramIndex = 2;
    
    // Apply filters
    if (search) {
      sql += ` AND (
        vh.VistorName ILIKE $${paramIndex} OR
        vh.Mobile ILIKE $${paramIndex} OR
        vh.VisitorRegNo ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (designation) {
      sql += ` AND vh.VisitorSubCatName ILIKE $${paramIndex}`;
      params.push(`%${designation}%`);
      paramIndex++;
    }
    
    if (VisitorSubCatID && VisitorSubCatID !== 0) {
      sql += ` AND vh.VisitorSubCatID = $${paramIndex}`;
      params.push(VisitorSubCatID);
      paramIndex++;
    }
    
    if (visitorRegId) {
      sql += ` AND vh.VisitorRegID = $${paramIndex}`;
      params.push(visitorRegId);
      paramIndex++;
    }
    
    if (fromDate) {
      sql += ` AND vh.CreatedDate >= to_timestamp($${paramIndex})`;
      params.push(fromDate);
      paramIndex++;
    }
    
    if (toDate) {
      sql += ` AND vh.CreatedDate <= to_timestamp($${paramIndex})`;
      params.push(toDate);
      paramIndex++;
    }
    
    // Order by most recent first
    sql += ` ORDER BY vh.CreatedDate DESC`;
    
    // Add pagination
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);
    
    const result = await query(sql, params);
    return result.rows;
  }
  // Get all staff with pagination and search
  static async getStaff(tenantId, page = 1, pageSize = 10, search = '', designation = '') {
    const offset = (page - 1) * pageSize;
    
    let sql = `
      SELECT 
        vr.VisitorRegId,
        vr.VisitorRegNo,
        vr.VistorName,
        vr.Mobile,
        vr.VisitorSubCatName,
        COALESCE(vr.FlatName, vr.AssociatedFlat, '') as FlatName
      FROM VisitorRegistration vr
      WHERE vr.TenantID = $1 
        AND vr.VisitorCatID = 3 
        AND vr.IsActive = 'Y'
    `;
    
    const params = [tenantId];
    let paramCount = 1;
    
    if (search && search.trim() !== '') {
      paramCount++;
      sql += ` AND (
        LOWER(vr.VistorName) LIKE LOWER($${paramCount}) 
        OR LOWER(vr.Mobile) LIKE LOWER($${paramCount}) 
        OR LOWER(vr.VisitorRegNo) LIKE LOWER($${paramCount})
        OR LOWER(vr.VisitorSubCatName) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search.trim()}%`);
    }
    
    if (designation && designation.trim() !== '' && designation.trim() !== '0') {
      paramCount++;
      sql += ` AND LOWER(vr.VisitorSubCatName) LIKE LOWER($${paramCount})`;
      params.push(`%${designation.trim()}%`);
    }
    
    sql += ` ORDER BY vr.VistorName ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(pageSize, offset);
    
    return await query(sql, params);
  }

  // Get total count for pagination
  static async getStaffCount(tenantId, search = '', designation = '') {
    let sql = `
      SELECT COUNT(*) as total
      FROM VisitorRegistration vr
      WHERE vr.TenantID = $1 
        AND vr.VisitorCatID = 3 
        AND vr.IsActive = 'Y'
    `;
    
    const params = [tenantId];
    let paramCount = 1;
    
    if (search && search.trim() !== '') {
      paramCount++;
      sql += ` AND (
        LOWER(vr.VistorName) LIKE LOWER($${paramCount}) 
        OR LOWER(vr.Mobile) LIKE LOWER($${paramCount}) 
        OR LOWER(vr.VisitorRegNo) LIKE LOWER($${paramCount})
        OR LOWER(vr.VisitorSubCatName) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search.trim()}%`);
    }
    
    if (designation && designation.trim() !== '' && designation.trim() !== '0') {
      paramCount++;
      sql += ` AND LOWER(vr.VisitorSubCatName) LIKE LOWER($${paramCount})`;
      params.push(`%${designation.trim()}%`);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].total);
  }

  // Get staff by ID
  static async getStaffById(staffId, tenantId) {
    const sql = `
      SELECT 
        vr.VisitorRegID as visitorregid,
        vr.VistorName as vistorname,
        vr.Mobile as mobile,
        vr.Email as email,
        vr.VisitorRegNo as visitorregno,
        vr.SecurityCode as securitycode,
        vr.VisitorCatID as visitorcatid,
        vr.VisitorCatName as visitorcatname,
        vr.VisitorSubCatID as visitorsubcatid,
        vr.VisitorSubCatName as visitorsubcatname,
        vr.AssociatedFlat as associatedflat,
        vr.AssociatedBlock as associatedblock,
        vr.VehiclelNo as vehicleno
      FROM VisitorRegistration vr
      WHERE vr.VisitorRegID = $1 
        AND vr.TenantID = $2 
        AND vr.VisitorCatID = 3 
        AND vr.IsActive = 'Y'
    `;
    
    const result = await query(sql, [staffId, tenantId]);
    return result.rows[0];
  }

  // Check if staff has active visit (currently checked in)
  static async getActiveVisit(staffId, tenantId) {
    const sql = `
      SELECT 
        vh.RegVisitorHistoryID as regvisitorhistoryid,
        vh.INTime as intime,
        vh.INTimeTxt as intimetxt,
        vh.OutTime as outtime,
        vh.OutTimeTxt as outtimetxt,
        vh.VistorName as vistorname
      FROM VisitorRegVisitHistory vh
      WHERE vh.VisitorRegID = $1 
        AND vh.TenantID = $2 
        AND vh.IsActive = 'Y'
        AND vh.OutTime IS NULL
      ORDER BY vh.CreatedDate DESC
      LIMIT 1
    `;
    
    const result = await query(sql, [staffId, tenantId]);
    return result.rows[0];
  }

  // Create visit history for staff check-in (INTime = arrival for work)
  static async createVisitHistory(visitData) {
    const sql = `
      INSERT INTO VisitorRegVisitHistory (
        TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
        VistorName, Mobile, VehiclelNo, VisitorCatID, VisitorCatName,
        VisitorSubCatID, VisitorSubCatName, AssociatedFlat, AssociatedBlock,
        INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES (
        $1, 'Y', 'Y', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        NOW(), EXTRACT(EPOCH FROM NOW())::text, NOW(), NOW(), $14, $14
      )
      RETURNING RegVisitorHistoryID as regvisitorhistoryid, INTime as intime, INTimeTxt as intimetxt
    `;
    
    const result = await query(sql, [
      visitData.tenantId,
      visitData.visitorRegId,
      visitData.visitorRegNo,
      visitData.securityCode,
      visitData.vistorName,
      visitData.mobile,
      visitData.vehicleNo,
      visitData.visitorCatId,
      visitData.visitorCatName,
      visitData.visitorSubCatId,
      visitData.visitorSubCatName,
      visitData.associatedFlat,
      visitData.associatedBlock,
      visitData.createdBy
    ]);
    
    return result.rows[0];
  }

  // Update visit history for staff check-out (OutTime = leaving work)
  static async updateVisitHistory(historyId, tenantId, updatedBy) {
    const sql = `
      UPDATE VisitorRegVisitHistory 
      SET 
        OutTime = NOW(),
        OutTimeTxt = EXTRACT(EPOCH FROM NOW())::text,
        UpdatedDate = NOW(),
        UpdatedBy = $3
      WHERE RegVisitorHistoryID = $1 
        AND TenantID = $2 
        AND IsActive = 'Y'
        AND OutTime IS NULL
      RETURNING 
        RegVisitorHistoryID as regvisitorhistoryid,
        OutTime as outtime,
        OutTimeTxt as outtimetxt,
        INTime as intime,
        INTimeTxt as intimetxt
    `;
    
    const result = await query(sql, [historyId, tenantId, updatedBy]);
    return result.rows[0];
  }

  // Get staff visit history
  static async getStaffHistory(staffId, tenantId, limit = 10) {
    const sql = `
      SELECT 
        vh.RegVisitorHistoryID as historyId,
        vh.VisitorRegID as visitorRegId,
        vh.VisitorRegNo as visitorRegNo,
        vh.VistorName as visitorName,
        vh.Mobile as mobile,
        vh.VehiclelNo as vehicleNo,
        vh.VisitorCatID as visitorCatId,
        vh.VisitorCatName as visitorCatName,
        vh.VisitorSubCatID as visitorSubCatId,
        vh.VisitorSubCatName as visitorSubCatName,
        vh.AssociatedFlat as associatedFlat,
        vh.AssociatedBlock as associatedBlock,
        vh.INTime as checkinTime,
        CASE 
          WHEN vh.INTime IS NOT NULL 
          THEN EXTRACT(EPOCH FROM vh.INTime)::text
          ELSE vh.INTimeTxt
        END as checkinTimeTxt,
        vh.OutTime as checkoutTime,
        CASE 
          WHEN vh.OutTime IS NOT NULL 
          THEN EXTRACT(EPOCH FROM vh.OutTime)::text
          ELSE vh.OutTimeTxt
        END as checkoutTimeTxt,
        vh.CreatedDate as createdDate,
        
        -- Calculate duration if checked out
        CASE 
          WHEN vh.OutTime IS NOT NULL AND vh.INTime IS NOT NULL THEN
            EXTRACT(EPOCH FROM (vh.OutTime - vh.INTime))/3600.0
          ELSE NULL
        END as durationHours,
        
        -- Status based on check-in/out state
        CASE 
          WHEN vh.OutTime IS NULL THEN 'CHECKED_IN'
          ELSE 'CHECKED_OUT'
        END as visitStatus
        
      FROM VisitorRegVisitHistory vh
      WHERE vh.VisitorRegID = $1 
        AND vh.TenantID = $2 
        AND vh.IsActive = 'Y'
      ORDER BY vh.CreatedDate DESC
      LIMIT $3
    `;
    
    const result = await query(sql, [staffId, tenantId, limit]);
    return result.rows;
  }

  // Get staff currently checked in (pending checkout)
  static async getPendingCheckout(tenantId) {
    const sql = `
      SELECT 
        vr.VisitorRegID as staffId,
        vr.VistorName as staffName,
        vr.Mobile as mobile,
        vr.VisitorRegNo as staffRegNo,
        vr.VisitorSubCatName as staffType,
        vr.AssociatedFlat as associatedFlat,
        vr.AssociatedBlock as associatedBlock,
        vh.RegVisitorHistoryID as historyId,
        vh.INTime as checkinTime,
        CASE 
          WHEN vh.INTime IS NOT NULL 
          THEN EXTRACT(EPOCH FROM vh.INTime)::text
          ELSE vh.INTimeTxt
        END as checkinTimeTxt,
        
        -- Calculate how long they've been checked in
        EXTRACT(EPOCH FROM (NOW() - vh.INTime))/3600.0 as hoursCheckedIn
        
      FROM VisitorRegistration vr
      INNER JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID
      WHERE vr.TenantID = $1 
        AND vr.VisitorCatID = 3 
        AND vr.IsActive = 'Y'
        AND vh.TenantID = $1
        AND vh.IsActive = 'Y'
        AND vh.OutTime IS NULL
      ORDER BY vh.INTime ASC
    `;
    
    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get staff status (first visit check)
  static async getStaffStatus(staffId, tenantId) {
    const sql = `
      SELECT 
        vr.VisitorRegID as staffId,
        vr.VistorName as staffName,
        vr.VisitorRegNo as staffRegNo,
        
        -- Check if this is first visit
        CASE 
          WHEN COUNT(vh.RegVisitorHistoryID) = 0 THEN true
          ELSE false
        END as isFirstVisit,
        
        -- Check if currently checked in (based on any active visit)
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM VisitorRegVisitHistory vh2 
            WHERE vh2.VisitorRegID = vr.VisitorRegID 
              AND vh2.TenantID = vr.TenantID 
              AND vh2.IsActive = 'Y'
              AND vh2.OutTime IS NULL
          ) THEN true
          ELSE false
        END as isCurrentlyCheckedIn,
        
        COUNT(vh.RegVisitorHistoryID) as totalVisits,
        MAX(vh.INTime) as lastCheckinTime,
        MAX(vh.OutTime) as lastCheckoutTime
        
      FROM VisitorRegistration vr
      LEFT JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID 
        AND vh.TenantID = vr.TenantID 
        AND vh.IsActive = 'Y'
      WHERE vr.VisitorRegID = $1 
        AND vr.TenantID = $2 
        AND vr.VisitorCatID = 3 
        AND vr.IsActive = 'Y'
      GROUP BY vr.VisitorRegID, vr.VistorName, vr.VisitorRegNo
    `;
    
    const result = await query(sql, [staffId, tenantId]);
    const statusData = result.rows[0];
    
    // Debug logging
    console.log(`[DEBUG] StaffModel.getStaffStatus raw query result for staffId ${staffId}:`, statusData);
    
    return statusData;
  }

  // Add new staff purpose (designation)
  static async addStaffPurpose(purposeData) {
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
      4, // Staff category ID  
      'Staff',
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

  // Update staff purpose (designation)
  static async updateStaffPurpose(purposeId, tenantId, purposeName, updatedBy) {
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

  // Delete staff purpose (designation) - soft delete
  static async deleteStaffPurpose(purposeId, tenantId, updatedBy) {
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

  // Get staff designations (purposes)
  static async getDesignations(tenantId) {
    const sql = `
      SELECT 
        VisitPurposeID as "purposeId",
        VisitPurpose as "purposeName",
        PurposeCatID as "purposeCatId",
        PurposeCatName as "purposeCatName",
        IsActive as "isActive"
      FROM VisitorPuposeMaster
      WHERE TenantID = $1 
        AND PurposeCatID = 3
        AND IsActive = 'Y'
      ORDER BY VisitPurpose
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get staff purposes with image data
  static async getStaffPurposes(tenantId) {
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
        AND IsActive = 'Y' 
        AND PurposeCatID = 3
      ORDER BY VisitPurpose ASC
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get staff list with filters and pagination (like students/buses)
  static async getStaffList(tenantId, filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      designation = '',
      staffId = '',
      VisitorSubCatID = 0,
      name = '',
      department = '',
      fromDate = '',
      toDate = '',
      isCheckedIn = null
    } = filters;

    let whereConditions = [
      'vr.TenantID = $1',
      "vr.IsActive = 'Y'",
      "vr.VisitorCatID = 3"
    ];
    let params = [tenantId];
    let paramIndex = 2;

    if (search && search.trim()) {
      whereConditions.push(`(
        LOWER(vr.VistorName) LIKE LOWER($${paramIndex}) OR
        vr.Mobile LIKE $${paramIndex} OR
        LOWER(vr.VisitorRegNo) LIKE LOWER($${paramIndex}) OR
        LOWER(vr.Email) LIKE LOWER($${paramIndex})
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }
    if (designation && designation.trim() && designation.trim() !== '0') {
      whereConditions.push(`LOWER(vr.VisitorSubCatName) LIKE LOWER($${paramIndex})`);
      params.push(`%${designation.trim()}%`);
      paramIndex++;
    }
    if (staffId && staffId.trim()) {
      whereConditions.push(`LOWER(vr.VisitorRegNo) LIKE LOWER($${paramIndex})`);
      params.push(`%${staffId.trim()}%`);
      paramIndex++;
    }
    if (VisitorSubCatID && VisitorSubCatID > 0) {
      whereConditions.push(`vr.VisitorSubCatID = $${paramIndex}`);
      params.push(VisitorSubCatID);
      paramIndex++;
    }
    if (name && name.trim()) {
      whereConditions.push(`LOWER(vr.VistorName) LIKE LOWER($${paramIndex})`);
      params.push(`%${name.trim()}%`);
      paramIndex++;
    }
    if (department && department.trim()) {
      whereConditions.push(`LOWER(vr.AssociatedBlock) LIKE LOWER($${paramIndex})`);
      params.push(`%${department.trim()}%`);
      paramIndex++;
    }
    if (fromDate && fromDate.trim()) {
      const [day, month, year] = fromDate.split('/');
      const formattedFromDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM VisitorRegVisitHistory vh 
        WHERE vh.VisitorRegID = vr.VisitorRegID 
        AND vh.TenantID = vr.TenantID 
        AND vh.IsActive = 'Y'
        AND DATE(vh.INTime) >= $${paramIndex}
      )`);
      params.push(formattedFromDate);
      paramIndex++;
    }
    if (toDate && toDate.trim()) {
      const [day, month, year] = toDate.split('/');
      const formattedToDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM VisitorRegVisitHistory vh 
        WHERE vh.VisitorRegID = vr.VisitorRegID 
        AND vh.TenantID = vr.TenantID 
        AND vh.IsActive = 'Y'
        AND DATE(vh.INTime) <= $${paramIndex}
      )`);
      params.push(formattedToDate);
      paramIndex++;
    }

    // Add isCheckedIn filter
    if (isCheckedIn !== null && isCheckedIn !== undefined && isCheckedIn !== '') {
      const isCheckedInBool = isCheckedIn === 'true' || isCheckedIn === true || isCheckedIn === '1';
      if (isCheckedInBool) {
        // Filter for checked-in staff (those with active visits)
        whereConditions.push(`EXISTS (
          SELECT 1 FROM VisitorRegVisitHistory vh 
          WHERE vh.VisitorRegID = vr.VisitorRegID 
          AND vh.TenantID = vr.TenantID 
          AND vh.IsActive = 'Y'
          AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '')
        )`);
      } else {
        // Filter for not checked-in staff (available staff)
        whereConditions.push(`NOT EXISTS (
          SELECT 1 FROM VisitorRegVisitHistory vh 
          WHERE vh.VisitorRegID = vr.VisitorRegID 
          AND vh.TenantID = vr.TenantID 
          AND vh.IsActive = 'Y'
          AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '')
        )`);
      }
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * pageSize;

    // Count query for pagination
    const countSql = `
      SELECT COUNT(DISTINCT vr.VisitorRegID) as total_count
      FROM VisitorRegistration vr
      WHERE ${whereClause}
    `;

    // Main query with latest visit details
    const sql = `
      SELECT DISTINCT ON (vr.VisitorRegID)
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
        vr.CreatedDate,
        vr.CreatedBy,
        vr.StatusName,
        latest_visit.RegVisitorHistoryID,
        latest_visit.INTime as LastCheckinTime,
        CASE 
          WHEN latest_visit.INTime IS NOT NULL 
          THEN EXTRACT(EPOCH FROM latest_visit.INTime)::text
          ELSE latest_visit.INTimeTxt
        END as LastCheckinTimeTxt,
        latest_visit.OutTime as LastCheckoutTime,
        CASE 
          WHEN latest_visit.OutTime IS NOT NULL 
          THEN EXTRACT(EPOCH FROM latest_visit.OutTime)::text
          ELSE latest_visit.OutTimeTxt
        END as LastCheckoutTimeTxt,
        latest_visit.VisitPurposeID,
        latest_visit.VisitPurpose,
        latest_visit.PurposeCatID,
        latest_visit.PurposeCatName,
        CASE 
          WHEN latest_visit.RegVisitorHistoryID IS NULL THEN 'AVAILABLE'
          WHEN latest_visit.OutTime IS NULL OR latest_visit.OutTimeTxt IS NULL OR latest_visit.OutTimeTxt = '' THEN 'CHECKED_IN'
          ELSE 'AVAILABLE'
        END as CurrentStatus,
        -- Add isCheckedIn boolean field
        CASE 
          WHEN latest_visit.OutTime IS NULL OR latest_visit.OutTimeTxt IS NULL OR latest_visit.OutTimeTxt = '' THEN true
          ELSE false
        END as isCheckedIn
      FROM VisitorRegistration vr
      LEFT JOIN (
        SELECT DISTINCT ON (vh.VisitorRegID)
          vh.RegVisitorHistoryID,
          vh.VisitorRegID,
          vh.INTime,
          vh.INTimeTxt,
          vh.OutTime,
          vh.OutTimeTxt,
          vh.VisitPurposeID,
          vh.VisitPurpose,
          vh.PurposeCatID,
          vh.PurposeCatName
        FROM VisitorRegVisitHistory vh
        WHERE vh.TenantID = $1 AND vh.IsActive = 'Y'
        ORDER BY vh.VisitorRegID, vh.CreatedDate DESC
      ) latest_visit ON vr.VisitorRegID = latest_visit.VisitorRegID
      WHERE ${whereClause}
      ORDER BY vr.VisitorRegID, vr.CreatedDate DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    // For count query, we need all params except the LIMIT and OFFSET
    const countParams = params.slice(0, params.length - 2);

    const [countResult, dataResult] = await Promise.all([
      query(countSql, countParams),
      query(sql, params)
    ]);

    const totalCount = parseInt(countResult.rows[0]?.total_count || 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: dataResult.rows,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalItems: totalCount,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    };
  }

  // Get all unique staff subcategories for a tenant
  static async getStaffSubCategories(tenantId) {
    const sql = `
      SELECT DISTINCT
        vsc.VisitorSubCatID as id,
        vsc.VisitorSubCatName as name,
        vsc.VisitorSubCatName as designation,
        COUNT(vr.VisitorRegID) as count
      FROM VisitorSubCategory vsc
      LEFT JOIN VisitorRegistration vr ON vsc.VisitorSubCatID = vr.VisitorSubCatID 
        AND vr.TenantID = vsc.TenantID 
        AND vr.VisitorCatID = 3 
        AND vr.IsActive = 'Y'
      WHERE vsc.TenantID = $1 
        AND vsc.VisitorCatID = 3 
        AND vsc.IsActive = 'Y'
      GROUP BY vsc.VisitorSubCatID, vsc.VisitorSubCatName
      ORDER BY vsc.VisitorSubCatName ASC
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get staff by staff code (visitor reg no) for QR scanning
  static async getStaffByCode(staffCode, tenantId) {
    const sql = `
      SELECT 
        vr.VisitorRegID as visitorregid,
        vr.VistorName as vistorname,
        vr.Mobile as mobile,
        vr.Email as email,
        vr.VisitorRegNo as visitorregno,
        vr.SecurityCode as securitycode,
        vr.VisitorCatID as visitorcatid,
        vr.VisitorCatName as visitorcatname,
        vr.VisitorSubCatID as visitorsubcatid,
        vr.VisitorSubCatName as visitorsubcatname,
        vr.FlatID as flatid,
        vr.FlatName as flatname,
        vr.AssociatedFlat as associatedflat,
        vr.AssociatedBlock as associatedblock,
        vr.VehiclelNo as vehiclelno,
        vr.PhotoFlag as photoflag,
        vr.PhotoPath as photopath,
        vr.PhotoName as photoname,
        vr.IsActive as isactive,
        vr.CreatedDate as createddate,
        vr.CreatedBy as createdby
      FROM VisitorRegistration vr
      WHERE vr.VisitorRegNo = $1 
        AND vr.TenantID = $2 
        AND vr.VisitorCatID = 3 
        AND vr.IsActive = 'Y'
    `;

    const result = await query(sql, [staffCode, tenantId]);
    return result.rows[0];
  }
}

module.exports = StaffModel;