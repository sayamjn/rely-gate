const { query } = require('../config/database');

class DashboardModel {
  static async getDashboardSummary(tenantId) {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM VisitorRegistration 
         WHERE TenantID = $1 AND IsActive = 'Y') as totalRegistered,
        
        (SELECT COUNT(*) FROM VisitorRegVisitHistory 
         WHERE TenantID = $1 AND IsActive = 'Y' 
         AND DATE(CreatedDate) = CURRENT_DATE) as todayCheckins,
         
        (SELECT COUNT(*) FROM VisitorRegVisitHistory 
         WHERE TenantID = $1 AND IsActive = 'Y' 
         AND (OutTime IS NULL OR OutTimeTxt IS NULL OR OutTimeTxt = '')) as currentlyInside,
         
        (SELECT COUNT(*) FROM VisitorMaster 
         WHERE TenantID = $1 AND IsActive = 'Y' 
         AND DATE(CreatedDate) = CURRENT_DATE) as todayUnregistered,
         
        (SELECT COUNT(*) FROM VisitorRegVisitHistory 
         WHERE TenantID = $1 AND IsActive = 'Y' 
         AND OutTime IS NOT NULL AND OutTimeTxt IS NOT NULL 
         AND OutTimeTxt != '' AND DATE(CreatedDate) = CURRENT_DATE) as todayCheckouts
    `;

    const result = await query(sql, [tenantId]);
    return result.rows[0];
  }

  static async getVisitorLatestVisitDetails(tenantId, catId, subCatId, limit = 10) {
    const sql = `
      SELECT 
        vr.VistorName as visitorName,
        vr.Mobile,
        vr.VisitorCatName,
        vr.VisitorSubCatName, 
        vr.FlatName,
        vh.INTimeTxt,
        vh.OutTimeTxt,
        vh.CreatedDate,
        vr.PhotoPath,
        vr.PhotoName,
        vh.RegVisitorHistoryID
      FROM VisitorRegistration vr
      LEFT JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID
      WHERE vr.TenantID = $1 
        AND vr.VisitorCatID = $2
        AND vr.VisitorSubCatID = $3
        AND vh.IsActive = 'Y'
      ORDER BY vh.CreatedDate DESC
      LIMIT $4
    `;

    const result = await query(sql, [tenantId, catId, subCatId, limit]);
    return result.rows;
  }
}

module.exports = DashboardModel;