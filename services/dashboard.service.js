const { query } = require('../config/database');
const DashboardModel = require('../models/dashboard.model');
const responseUtils = require('../utils/constants');

class DashboardService {
  static async getDashboardSummary(tenantId) {
    try {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM VisitorRegistration 
           WHERE TenantID = $1 AND IsActive = 'Y') as total_registered,
          
          (SELECT COUNT(*) FROM VisitorRegVisitHistory 
           WHERE TenantID = $1 AND IsActive = 'Y' 
           AND DATE(CreatedDate) = CURRENT_DATE) as today_checkins,
           
          (SELECT COUNT(*) FROM VisitorRegVisitHistory 
           WHERE TenantID = $1 AND IsActive = 'Y' 
           AND (OutTime IS NULL OR OutTimeTxt IS NULL OR OutTimeTxt = '')) as currently_inside,
           
          (SELECT COUNT(*) FROM VisitorMaster 
           WHERE TenantID = $1 AND IsActive = 'Y' 
           AND DATE(CreatedDate) = CURRENT_DATE) as today_unregistered
      `;

      const result = await query(sql, [tenantId]);
      const summary = result.rows[0];

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: summary,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS
      };
    } catch (error) {
      console.error('Error in dashboard summary:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      };
    }
  }

  static async getVisitorLatestVisitDetails(tenantId, catId, subCatId) {
    try {
      const sql = `
        SELECT 
          vr.VistorName as visitor_name,
          vr.Mobile,
          vr.VisitorCatName,
          vr.VisitorSubCatName, 
          vr.FlatName,
          vh.INTimeTxt,
          vh.OutTimeTxt,
          vh.CreatedDate,
          vr.PhotoPath,
          vr.PhotoName
        FROM VisitorRegistration vr
        LEFT JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID
        WHERE vr.TenantID = $1 
          AND vr.VisitorCatID = $2
          AND vr.VisitorSubCatID = $3
          AND vh.IsActive = 'Y'
        ORDER BY vh.CreatedDate DESC
        LIMIT 10
      `;

      const result = await query(sql, [tenantId, catId, subCatId]);
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: result.rows,
        count: result.rows.length,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS
      };
    } catch (error) {
      console.error('Error in latest visit details:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      };
    }
  }
}

module.exports = DashboardService;