const { query } = require("../config/database");

class BusModel {
  
  // Get buses with filters
  static async getBusesWithFilters(tenantId, filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      purposeId = null,
      busNumber = '',
      registrationNumber = '',
      driverName = '',
      fromDate = null,
      toDate = null
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
        vh_latest.VisitPurposeID as LastVisitPurposeID,
        vh_latest.VisitPurpose as LastVisitPurpose,
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

    if (search && search.trim() !== '') {
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
      sql += ` AND vr.CreatedDate BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(fromDate, toDate);
      paramIndex += 2;
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY vr.CreatedDate DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
        VisitPurposeID,
        PurposeCatID,
        PurposeCatName,
        VisitPurpose,
        IsActive
      FROM VisitorPuposeMaster
      WHERE TenantID = $1 
        AND PurposeCatID = $2
        AND IsActive = 'Y'
      ORDER BY VisitPurpose
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
}

module.exports = BusModel;