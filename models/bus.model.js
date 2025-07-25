const { query } = require("../config/database");

class BusModel {
  // Get bus by VisitorRegNo instead of VisitorRegID
  static async getBusByRegNo(visitorRegNo, tenantId) {
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
      WHERE vr.VisitorRegNo = $1 
        AND vr.TenantID = $2 
        AND vr.IsActive = 'Y'
        AND vr.VisitorCatID = 5
    `;
    const result = await query(sql, [visitorRegNo, tenantId]);
    return result.rows[0];
  }

  // Get buses with filters
  static async getBusesWithFilters(tenantId, filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      search = "",
      purposeId = null,
      busNumber = "",
      registrationNumber = "",
      driverName = "",
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
        -- Add custom fields for bus information
        COALESCE(bvu.Name, vr.VistorName) as BusNumber,
        COALESCE(bvu.StudentID, vr.VisitorRegNo) as RegistrationNumber,
        COALESCE(bvu.Course, 'N/A') as DriverName,
        COALESCE(bvu.Hostel, 'N/A') as BusType,
        -- Latest visit purpose info
        vh_latest.VisitPurposeID as VisitPurposeID,
        vh_latest.VisitPurpose as VisitPurpose,
        vh_latest.PurposeCatID as LastPurposeCatID,
        vh_latest.PurposeCatName as LastPurposeCatName,
        vh_latest.INTimeTxt as LastCheckOutTime,
        vh_latest.OutTimeTxt as LastCheckInTime,
        vh_latest.RegVisitorHistoryID as LastHistoryID,
        
        -- Date and duration fields
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

              -- isCheckedIn boolean flag (true if student is currently checked out, waiting to check in)
      CASE 
        WHEN vh_latest.OutTime IS NULL OR vh_latest.OutTimeTxt IS NULL OR vh_latest.OutTimeTxt = '' 
        THEN true 
        ELSE false 
      END as isCheckedIn,
        COUNT(*) OVER() as total_count
      FROM VisitorRegistration vr
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'bus'
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
        AND vr.VisitorCatID = 5
    `;

    const params = [tenantId];
    let paramIndex = 2;

    if (search && search.trim() !== "") {
      const searchTerm = search.trim();

      sql += ` AND (
        -- Bus Number exact match (highest priority)
        UPPER(COALESCE(bvu.Name, '')) = UPPER($${paramIndex}) OR
        -- Registration Number exact match  
        UPPER(COALESCE(bvu.StudentID, '')) = UPPER($${paramIndex}) OR
        -- Driver name exact match
        UPPER(COALESCE(bvu.Course, '')) = UPPER($${paramIndex}) OR
        -- Visitor name exact match
        UPPER(COALESCE(vr.VistorName, '')) = UPPER($${paramIndex}) OR
        
        -- Bus Number starts with (high priority)
        UPPER(COALESCE(bvu.Name, '')) LIKE UPPER($${paramIndex}) || '%' OR
        -- Registration Number starts with
        UPPER(COALESCE(bvu.StudentID, '')) LIKE UPPER($${paramIndex}) || '%' OR
        -- Driver name starts with
        UPPER(COALESCE(bvu.Course, '')) LIKE UPPER($${paramIndex}) || '%' OR
        
        -- Contains matches (medium priority)
        UPPER(COALESCE(bvu.Name, '')) LIKE '%' || UPPER($${paramIndex}) || '%' OR
        UPPER(COALESCE(bvu.StudentID, '')) LIKE '%' || UPPER($${paramIndex}) || '%' OR
        UPPER(COALESCE(bvu.Course, '')) LIKE '%' || UPPER($${paramIndex}) || '%' OR
        UPPER(COALESCE(vr.VistorName, '')) LIKE '%' || UPPER($${paramIndex}) || '%' OR
        UPPER(COALESCE(vr.VisitorRegNo, '')) LIKE '%' || UPPER($${paramIndex}) || '%' OR
        UPPER(vr.SecurityCode::text) LIKE '%' || UPPER($${paramIndex}) || '%' OR
        vr.Mobile::text LIKE '%' || $${paramIndex} || '%' OR
        UPPER(COALESCE(bvu.Hostel, '')) LIKE '%' || UPPER($${paramIndex}) || '%'
      )`;

      params.push(searchTerm);
      paramIndex++;
    }

    if (busNumber) {
      sql += ` AND (COALESCE(bvu.Name, '') ILIKE $${paramIndex} OR COALESCE(vr.VistorName, '') ILIKE $${paramIndex})`;
      params.push(`%${busNumber}%`);
      paramIndex++;
    }

    if (registrationNumber) {
      sql += ` AND (COALESCE(bvu.StudentID, '') ILIKE $${paramIndex} OR COALESCE(vr.VisitorRegNo, '') ILIKE $${paramIndex})`;
      params.push(`%${registrationNumber}%`);
      paramIndex++;
    }

    if (driverName) {
      sql += ` AND COALESCE(bvu.Course, '') ILIKE $${paramIndex}`;
      params.push(`%${driverName}%`);
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

  // Get bus by ID
  static async getBusById(busId, tenantId) {
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
        COALESCE(bvu.Name, vr.VistorName) as BusNumber,
        COALESCE(bvu.StudentID, vr.VisitorRegNo) as RegistrationNumber,
        COALESCE(bvu.Course, 'N/A') as DriverName,
        COALESCE(bvu.Hostel, 'N/A') as BusType
      FROM VisitorRegistration vr
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'bus'
      WHERE vr.VisitorRegID = $1 
        AND vr.TenantID = $2 
        AND vr.IsActive = 'Y'
        AND vr.VisitorCatID = 5
    `;

    const result = await query(sql, [busId, tenantId]);
    return result.rows[0];
  }

  // Get active visit with purpose for bus
  static async getActiveVisit(busId, tenantId) {
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

    const result = await query(sql, [busId, tenantId]);
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

    // Handle custom purpose case (visitPurposeId = -1)
    // For custom purposes, we need to set visitPurposeId to NULL to avoid foreign key constraint
    const finalPurposeId = visitPurposeId === -1 ? null : visitPurposeId;

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
        NOW(), EXTRACT(EPOCH FROM NOW())::bigint, NOW(), NOW(), $18, $18
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
      finalPurposeId, // Use NULL for custom purposes
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
          OutTimeTxt = EXTRACT(EPOCH FROM NOW())::bigint,
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE RegVisitorHistoryID = $1 AND TenantID = $2
      RETURNING RegVisitorHistoryID
    `;

    const result = await query(sql, [historyId, tenantId, updatedBy]);
    return result.rows[0];
  }

  // Get bus visit history with purposes
  static async getBusHistory(busId, tenantId, limit = 10) {
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

    const result = await query(sql, [busId, tenantId, limit]);
    return result.rows;
  }

  // Get buses pending check-in (currently checked out)
  static async getBusesPendingCheckin(tenantId) {
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
        COALESCE(bvu.Name, vr.VistorName) as BusNumber,
        COALESCE(bvu.StudentID, vr.VisitorRegNo) as RegistrationNumber,
        COALESCE(bvu.Course, 'N/A') as DriverName,
        COALESCE(bvu.Hostel, 'N/A') as BusType
      FROM VisitorRegVisitHistory vh
      JOIN VisitorRegistration vr ON vh.VisitorRegID = vr.VisitorRegID
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'bus'
      WHERE vh.TenantID = $1 
        AND vh.IsActive = 'Y'
        AND vh.VisitorCatID = 5
        AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '')
      ORDER BY vh.INTime DESC
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get bus purposes by category
  static async getBusPurposes(tenantId, purposeCatId = 2) {
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

  // Add new bus purpose
  static async addBusPurpose(purposeData) {
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
      2, // Bus category ID
      "Bus",
      purposeName,
      "Y",
      createdBy,
      imageData ? imageData.flag : "N",
      imageData ? imageData.path : null,
      imageData ? imageData.name : null,
      imageData ? imageData.url : null,
    ]);

    return result.rows[0];
  }

  // Update bus purpose
  static async updateBusPurpose(purposeId, tenantId, purposeName, updatedBy) {
    const sql = `
      UPDATE VisitorPuposeMaster 
      SET VisitPurpose = $1,
          UpdatedBy = $2,
          UpdatedDate = NOW()
      WHERE VisitPurposeID = $3 
        AND TenantID = $4 
        AND PurposeCatID = 2
      RETURNING 
        VisitPurposeID as "purposeId",
        VisitPurpose as "purposeName",
        PurposeCatID as "purposeCatId",
        PurposeCatName as "purposeCatName"
    `;

    const result = await query(sql, [
      purposeName,
      updatedBy,
      purposeId,
      tenantId,
    ]);
    return result.rows[0];
  }

  // Delete bus purpose (soft delete)
  static async deleteBusPurpose(purposeId, tenantId, updatedBy) {
    const sql = `
      UPDATE VisitorPuposeMaster 
      SET IsActive = 'N',
          UpdatedBy = $1,
          UpdatedDate = NOW()
      WHERE VisitPurposeID = $2 
        AND TenantID = $3 
        AND PurposeCatID = 2
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
        AND PurposeCatID = 2
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
        AND PurposeCatID = 2
    `;

    const result = await query(sql, [purposeId, tenantId]);
    return result.rows[0];
  }

  // New method: Get buses list with comprehensive filters and pagination
  static async getBusesList(tenantId, filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      search = "",
      purposeId = 0,
      busNumber = "",
      VisitorSubCatID = 0,
      registrationNumber = "",
      driverName = "",
      busType = "",
      route = "",
      fromDate = "",
      toDate = "",
    } = filters;

    let whereConditions = [
      "vr.TenantID = $1",
      "vr.IsActive = 'Y'",
      "vr.VisitorCatID = 5",
    ];
    let params = [tenantId];
    let paramIndex = 2;

    // Search filter (bus number, registration, driver, etc.)
    if (search && search.trim()) {
      whereConditions.push(`(
        LOWER(COALESCE(bvu.Name, vr.VistorName)) LIKE LOWER($${paramIndex}) OR
        LOWER(COALESCE(bvu.StudentID, vr.VisitorRegNo)) LIKE LOWER($${paramIndex}) OR
        LOWER(COALESCE(bvu.Course, '')) LIKE LOWER($${paramIndex}) OR
        LOWER(vr.VistorName) LIKE LOWER($${paramIndex}) OR
        LOWER(vr.VisitorRegNo) LIKE LOWER($${paramIndex}) OR
        LOWER(vr.SecurityCode) LIKE LOWER($${paramIndex}) OR
        vr.Mobile LIKE $${paramIndex} OR
        LOWER(COALESCE(bvu.Hostel, '')) LIKE LOWER($${paramIndex})
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Purpose ID filter
    if (purposeId && purposeId > 0) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM VisitorRegVisitHistory vh 
        WHERE vh.VisitorRegID = vr.VisitorRegID 
        AND vh.TenantID = vr.TenantID 
        AND vh.VisitPurposeID = $${paramIndex}
        AND vh.IsActive = 'Y'
      )`);
      params.push(purposeId);
      paramIndex++;
    }

    // Bus number filter
    if (busNumber && busNumber.trim()) {
      whereConditions.push(`(
        COALESCE(bvu.Name, vr.VistorName) ILIKE $${paramIndex}
      )`);
      params.push(`%${busNumber.trim()}%`);
      paramIndex++;
    }

    // Registration number filter
    if (registrationNumber && registrationNumber.trim()) {
      whereConditions.push(`(
        COALESCE(bvu.StudentID, vr.VisitorRegNo) ILIKE $${paramIndex}
      )`);
      params.push(`%${registrationNumber.trim()}%`);
      paramIndex++;
    }

    // Driver name filter
    if (driverName && driverName.trim()) {
      whereConditions.push(`COALESCE(bvu.Course, '') ILIKE $${paramIndex}`);
      params.push(`%${driverName.trim()}%`);
      paramIndex++;
    }

    // Bus type filter
    if (busType && busType.trim()) {
      whereConditions.push(`COALESCE(bvu.Hostel, '') ILIKE $${paramIndex}`);
      params.push(`%${busType.trim()}%`);
      paramIndex++;
    }

    // Route filter
    if (route && route.trim()) {
      whereConditions.push(`vr.AssociatedFlat ILIKE $${paramIndex}`);
      params.push(`%${route.trim()}%`);
      paramIndex++;
    }

    // Date range filter (for visit history)
    if (fromDate && fromDate.trim()) {
      const [day, month, year] = fromDate.split("/");
      const formattedFromDate = `${year}-${month.padStart(
        2,
        "0"
      )}-${day.padStart(2, "0")}`;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM VisitorRegVisitHistory vh 
        WHERE vh.VisitorRegID = vr.VisitorRegID 
        AND vh.TenantID = vr.TenantID 
        AND DATE(vh.INTime) >= $${paramIndex}
        AND vh.IsActive = 'Y'
      )`);
      params.push(formattedFromDate);
      paramIndex++;
    }

    if (toDate && toDate.trim()) {
      const [day, month, year] = toDate.split("/");
      const formattedToDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM VisitorRegVisitHistory vh 
        WHERE vh.VisitorRegID = vr.VisitorRegID 
        AND vh.TenantID = vr.TenantID 
        AND DATE(vh.INTime) <= $${paramIndex}
        AND vh.IsActive = 'Y'
      )`);
      params.push(formattedToDate);
      paramIndex++;
    }

    // Visitor Sub Category ID filter
    if (VisitorSubCatID && VisitorSubCatID > 0) {
      whereConditions.push(`vr.VisitorSubCatID = $${paramIndex}`);
      params.push(VisitorSubCatID);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");
    const offset = (page - 1) * pageSize;

    // Count query for pagination
    const countSql = `
      SELECT COUNT(DISTINCT vr.VisitorRegID) as total_count
      FROM VisitorRegistration vr
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'bus'
      WHERE ${whereClause}
    `;

    // Main query with latest visit details - ensure unique bus records
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
        COALESCE(bvu.Name, vr.VistorName) as BusNumber,
        COALESCE(bvu.StudentID, vr.VisitorRegNo) as RegistrationNumber,
        COALESCE(bvu.Course, 'N/A') as DriverName,
        COALESCE(bvu.Hostel, 'N/A') as BusType,

        -- Latest visit details with proper checkout/checkin logic
        latest_visit.RegVisitorHistoryID,
        latest_visit.INTime as LastCheckoutTime,
        latest_visit.INTimeTxt as LastCheckoutTimeTxt,
        latest_visit.OutTime as LastCheckinTime,
        latest_visit.OutTimeTxt as LastCheckinTimeTxt,
        latest_visit.VisitPurposeID,
        latest_visit.VisitPurpose,
        latest_visit.PurposeCatID,
        latest_visit.PurposeCatName,

        -- Current status based on latest visit
        CASE 
          WHEN latest_visit.RegVisitorHistoryID IS NULL THEN 'AVAILABLE'
          WHEN latest_visit.OutTime IS NULL OR latest_visit.OutTimeTxt IS NULL OR latest_visit.OutTimeTxt = '' THEN 'CHECKED_OUT'
          ELSE 'AVAILABLE'
        END as CurrentStatus

      FROM VisitorRegistration vr
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'bus'
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
      query(sql, params),
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
        hasPrev: parseInt(page) > 1,
      },
    };
  }

  // Get all unique bus subcategories for a tenant
  static async getBusSubCategories(tenantId) {
    const sql = `
      SELECT DISTINCT
        vr.VisitorSubCatID AS "subCategoryId",
        vr.VisitorSubCatName AS "subCategoryName"
      FROM VisitorRegistration vr
      WHERE vr.TenantID = $1
        AND vr.IsActive = 'Y'
        AND vr.VisitorCatID = 5
        AND vr.VisitorSubCatID IS NOT NULL
        AND vr.VisitorSubCatName IS NOT NULL
      ORDER BY vr.VisitorSubCatName ASC
    `;
    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Export buses method moved from service
  static async exportBuses(tenantId, filters = {}) {
    let whereConditions = [
      "vr.TenantID = $1",
      "vr.IsActive = 'Y'",
      "vr.VisitorCatName = 'Bus'",
    ];
    let params = [tenantId];
    let paramIndex = 2;

    // Apply filters
    if (filters.registrationNumber && filters.registrationNumber.trim()) {
      whereConditions.push(`vr.VisitorRegNo ILIKE $${paramIndex}`);
      params.push(`%${filters.registrationNumber.trim()}%`);
      paramIndex++;
    }

    if (filters.driverName && filters.driverName.trim()) {
      whereConditions.push(`vr.VistorName ILIKE $${paramIndex}`);
      params.push(`%${filters.driverName.trim()}%`);
      paramIndex++;
    }

    if (filters.fromDate) {
      whereConditions.push(`vr.CreatedDate >= $${paramIndex}`);
      params.push(filters.fromDate);
      paramIndex++;
    }

    if (filters.toDate) {
      whereConditions.push(`vr.CreatedDate <= $${paramIndex}`);
      params.push(filters.toDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    // Fixed SQL without DISTINCT conflict
    const sql = `
      SELECT 
        vr.VisitorRegNo as "Bus Registration",
        vr.VistorName as "Driver Name",
        vr.Mobile as "Driver Mobile",
        vr.VisitorSubCatName as "Bus Type",
        vr.AssociatedFlat as "Route",
        vr.AssociatedBlock as "Area",
        vr.StatusName as "Status",
        TO_CHAR(vr.CreatedDate, 'YYYY-MM-DD') as "Registration Date"
      FROM VisitorRegistration vr
      WHERE ${whereClause}
      ORDER BY vr.CreatedDate DESC
    `;

    const result = await query(sql, params);
    return result.rows;
  }

  // Get buses with pagination (legacy method moved from service)
  static async getBusesBasic(
    tenantId,
    page = 1,
    pageSize = 20,
    search = "",
    category = 0
  ) {
    const offset = (page - 1) * pageSize;
    let whereConditions = [
      "TenantID = $1",
      "IsActive = 'Y'",
      "VisitorCatName = 'Bus'",
    ];
    let params = [tenantId];
    let paramIndex = 2;

    if (search && search.trim()) {
      whereConditions.push(
        `(VistorName ILIKE $${paramIndex} OR VisitorRegNo ILIKE $${paramIndex} OR Mobile ILIKE $${paramIndex})`
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Category filter: 0 means show all, any other ID filters by VisitorSubCatID
    if (category && parseInt(category) > 0) {
      whereConditions.push(`VisitorSubCatID = $${paramIndex}`);
      params.push(parseInt(category));
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM VisitorRegistration
      WHERE ${whereClause}
    `;

    const countResult = await query(countSql, params);
    const totalCount = parseInt(countResult.rows[0].total);

    // Get paginated data
    const dataSql = `
      SELECT 
        VisitorRegId,
        VisitorRegNo,
        VistorName,
        Mobile,
        VisitorSubCatName,
        COALESCE(FlatName, AssociatedFlat, '') as FlatName
      FROM VisitorRegistration
      WHERE ${whereClause}
      ORDER BY CreatedDate DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);
    const dataResult = await query(dataSql, params);

    return {
      rows: dataResult.rows,
      totalCount,
    };
  }

  // Get buses pending checkout (moved from service)
  static async getBusesPendingCheckout(tenantId) {
    const sql = `
      SELECT DISTINCT
        vr.VisitorRegID as busId,
        vr.VisitorRegNo as busRegNo,
        vr.VistorName as driverName,
        vr.Mobile as driverMobile,
        vr.VisitorSubCatName as busType,
        vr.AssociatedFlat as route,
        vr.AssociatedBlock as area,
        vh.INTime as checkInTime,
        vh.INTimeTxt as checkInTimeText,
        EXTRACT(EPOCH FROM (NOW() - vh.INTime))/3600 as hoursCheckedIn
      FROM VisitorRegistration vr
      INNER JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID
      WHERE vr.TenantID = $1 
        AND vr.IsActive = 'Y'
        AND vr.VisitorCatName = 'Bus'
        AND vh.TenantID = $1
        AND vh.IsActive = 'Y'
        AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '')
      ORDER BY vh.INTime DESC
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get all bus visit history from VisitorRegVisitHistory
  static async getAllBusVisitHistory(tenantId, filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      search = "",
      fromDate = null,
      toDate = null,
      visitorRegId = null,
      purposeId = null
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
        -- Additional student information from VisitorRegistration and BulkVisitorUpload
        vr.Email as email,
        vr.PhotoFlag as photoFlag,
        vr.PhotoPath as photoPath,
        vr.PhotoName as photoName,
        vr.VehiclePhotoFlag as vehiclePhotoFlag,
        vr.VehiclePhotoName as vehiclePhotoName,
        COALESCE(bvu.Course, vr.VisitorSubCatName) as course,
        COALESCE(bvu.Hostel, vr.AssociatedFlat) as hostel,
        COALESCE(bvu.StudentID, vr.VisitorRegNo) as studentNumber,
        vr.CreatedDate as registrationDate,
        -- Calculate duration in hours if both times exist
        CASE 
          WHEN vh.OutTime IS NOT NULL AND vh.INTime IS NOT NULL 
          THEN EXTRACT(EPOCH FROM ((vh.INTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') - (vh.OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')))/3600
          ELSE NULL 
        END as durationHours,
        -- Status based on check-in/out times
        CASE 
          WHEN vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '' 
          THEN 'CHECKED_OUT' 
          ELSE 'COMPLETED' 
        END as status,
        -- Format date for display
        TO_CHAR(vh.CreatedDate AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY') as visitDate,
        TO_CHAR(vh.INTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') as checkOutTimeDisplay,
        TO_CHAR(vh.OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') as checkInTimeDisplay,
        TO_CHAR(vr.CreatedDate AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY') as createdDateTxt,
        -- isCheckedIn boolean flag (true if student is currently checked out, waiting to check in)
        CASE 
          WHEN vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '' 
          THEN true 
          ELSE false 
        END as isCheckedIn,
        COUNT(*) OVER() as total_count
      FROM VisitorRegVisitHistory vh
      INNER JOIN VisitorRegistration vr ON vh.VisitorRegID::text = vr.VisitorRegID::text AND vh.TenantID = vr.TenantID
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'student' AND bvu.TenantID::text = vr.TenantID::text
      WHERE vh.TenantID = $1 
        AND vh.IsActive = 'Y'
        AND vh.VisitorCatID = 5
    `;

    const params = [tenantId];
    let paramIndex = 2;

    // Apply filters
    if (search) {
      sql += ` AND (
        vh.VistorName ILIKE $${paramIndex} OR 
        vh.Mobile ILIKE $${paramIndex} OR 
        vh.VisitorRegNo ILIKE $${paramIndex} OR
        vh.SecurityCode ILIKE $${paramIndex} OR
        COALESCE(bvu.Name, '') ILIKE $${paramIndex} OR
        COALESCE(bvu.StudentID, '') ILIKE $${paramIndex} OR
        COALESCE(bvu.Course, '') ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (visitorRegId) {
      sql += ` AND vh.VisitorRegID::text = $${paramIndex}::text`;
      params.push(visitorRegId.toString());
      paramIndex++;
    }

    if (purposeId && purposeId > 0) {
      sql += ` AND vh.VisitPurposeID::text = $${paramIndex}::text`;
      params.push(purposeId.toString());
      paramIndex++;
    }

    if (fromDate && toDate) {
      // Check if dates are epoch timestamps
      if (/^\d+$/.test(fromDate) && /^\d+$/.test(toDate)) {
        sql += ` AND vh.CreatedDate BETWEEN to_timestamp($${paramIndex}) AND to_timestamp($${paramIndex + 1})`;
      } else {
        sql += ` AND vh.CreatedDate BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      }
      params.push(fromDate, toDate);
      paramIndex += 2;
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY vh.CreatedDate DESC, vh.INTime DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const result = await query(sql, params);
    return result.rows;
  }
}

module.exports = BusModel;
