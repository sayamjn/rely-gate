const { query } = require('../config/database');

class StaffModel {
  // Get all staff with pagination and search
  static async getStaff(tenantId, page = 1, pageSize = 10, search = '') {
    const offset = (page - 1) * pageSize;
    
    let sql = `
      SELECT 
        vr.VisitorRegID as staffId,
        vr.VistorName as staffName,
        vr.Mobile as mobile,
        vr.Email as email,
        vr.VisitorRegNo as staffRegNo,
        vr.SecurityCode as securityCode,
        vr.VisitorCatID as visitorCatId,
        vr.VisitorCatName as visitorCatName,
        vr.VisitorSubCatID as visitorSubCatId,
        vr.VisitorSubCatName as visitorSubCatName,
        vr.AssociatedFlat as associatedFlat,
        vr.AssociatedBlock as associatedBlock,
        vr.StatusID as statusId,
        vr.StatusName as statusName,
        vr.IsActive as isActive,
        vr.CreatedDate as createdDate,
        vr.UpdatedDate as updatedDate,
        vr.VehiclelNo as vehicleNo
      FROM VisitorRegistration vr
      WHERE vr.TenantID = $1 
        AND vr.VisitorCatID = 1 
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
        OR LOWER(vr.Email) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search.trim()}%`);
    }
    
    sql += ` ORDER BY vr.VistorName ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(pageSize, offset);
    
    return await query(sql, params);
  }

  // Get total count for pagination
  static async getStaffCount(tenantId, search = '') {
    let sql = `
      SELECT COUNT(*) as total
      FROM VisitorRegistration vr
      WHERE vr.TenantID = $1 
        AND vr.VisitorCatID = 1 
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
        OR LOWER(vr.Email) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search.trim()}%`);
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
        AND vr.VisitorCatID = 1 
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
        NOW(), TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI:SS'), NOW(), NOW(), $14, $14
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
        OutTimeTxt = TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI:SS'),
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
        vh.INTimeTxt as checkinTimeTxt,
        vh.OutTime as checkoutTime,
        vh.OutTimeTxt as checkoutTimeTxt,
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
        vh.INTimeTxt as checkinTimeTxt,
        
        -- Calculate how long they've been checked in
        EXTRACT(EPOCH FROM (NOW() - vh.INTime))/3600.0 as hoursCheckedIn
        
      FROM VisitorRegistration vr
      INNER JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID
      WHERE vr.TenantID = $1 
        AND vr.VisitorCatID = 1 
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
        
        -- Check if currently checked in
        CASE 
          WHEN MAX(CASE WHEN vh.OutTime IS NULL THEN 1 ELSE 0 END) = 1 THEN true
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
        AND vr.VisitorCatID = 1 
        AND vr.IsActive = 'Y'
      GROUP BY vr.VisitorRegID, vr.VistorName, vr.VisitorRegNo
    `;
    
    const result = await query(sql, [staffId, tenantId]);
    return result.rows[0];
  }
}

module.exports = StaffModel;