const { query } = require('../config/database');


const AnalyticsModel = {
  async getHourlyVisitorPattern(tenantId, days = 7) {
    const sql = `
      SELECT 
        EXTRACT(HOUR FROM INTime) as hour,
        COUNT(*) as visit_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (
          COALESCE(OutTime, NOW()) - INTime
        ))/3600), 2) as avg_duration_hours
      FROM VisitorRegVisitHistory
      WHERE TenantID = $1 
        AND CreatedDate >= (CURRENT_DATE - INTERVAL '${days} days')
        AND IsActive = 'Y'
        AND INTime IS NOT NULL
      GROUP BY EXTRACT(HOUR FROM INTime)
      ORDER BY hour
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  },

  async getVisitorCategoryStats(tenantId, fromDate, toDate) {
    const sql = `
      SELECT 
        VisitorCatID,
        VisitorCatName,
        COUNT(*) as total_visits,
        COUNT(DISTINCT VisitorRegID) as unique_visitors,
        ROUND(AVG(EXTRACT(EPOCH FROM (
          COALESCE(OutTime, NOW()) - INTime
        ))/3600), 2) as avg_duration_hours
      FROM VisitorRegVisitHistory
      WHERE TenantID = $1 
        AND DATE(CreatedDate) BETWEEN $2 AND $3
        AND IsActive = 'Y'
      GROUP BY VisitorCatID, VisitorCatName
      ORDER BY total_visits DESC
    `;

    const result = await query(sql, [tenantId, fromDate, toDate]);
    return result.rows;
  },

  async getGatePassAnalytics(tenantId, days = 7) {
    const sql = `
      SELECT 
        COUNT(CASE WHEN StatusID = 1 THEN 1 END) as pending_approval,
        COUNT(CASE WHEN StatusID = 2 AND INTime IS NULL THEN 1 END) as pending_checkin,
        COUNT(CASE WHEN StatusID = 2 AND INTime IS NOT NULL AND OutTime IS NULL THEN 1 END) as pending_checkout,
        COUNT(CASE WHEN StatusID = 2 AND INTime IS NOT NULL AND OutTime IS NOT NULL THEN 1 END) as completed,
        COUNT(*) as total_gatepasses,
        COUNT(CASE WHEN DATE(CreatedDate) = CURRENT_DATE THEN 1 END) as today_total
      FROM VisitorMaster
      WHERE TenantID = $1 
        AND VisitorCatID = 6 
        AND IsActive = 'Y'
        AND CreatedDate >= CURRENT_DATE - INTERVAL '${days} days'
    `;

    const result = await query(sql, [tenantId]);
    return result.rows[0];
  },

  // async getGatePassTrendData(tenantId, days = 7) {
  //   const sql = `
  //     SELECT 
  //       DATE(CreatedDate) as date,
  //       COUNT(*) as total_created,
  //       COUNT(CASE WHEN StatusID = 2 THEN 1 END) as approved,
  //       COUNT(CASE WHEN INTime IS NOT NULL THEN 1 END) as checked_in,
  //       COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as completed
  //     FROM VisitorMaster
  //     WHERE TenantID = $1 
  //       AND VisitorCatID = 6 
  //       AND IsActive = 'Y'
  //       AND CreatedDate >= CURRENT_DATE - INTERVAL '${days} days'
  //     GROUP BY DATE(CreatedDate)
  //     ORDER BY date DESC
  //   `;

  //   const result = await query(sql, [tenantId]);
  //   return result.rows;
  // },

  // async getGatePassPurposeStats(tenantId, days = 7) {
  //   const sql = `
  //     SELECT 
  //       VisitPurposeID as purpose_id,
  //       VisitPurpose as purpose_name,
  //       COUNT(*) as total_count,
  //       COUNT(CASE WHEN StatusID = 1 THEN 1 END) as pending_count,
  //       COUNT(CASE WHEN StatusID = 2 THEN 1 END) as approved_count,
  //       COUNT(CASE WHEN INTime IS NOT NULL THEN 1 END) as checkedin_count,
  //       COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as completed_count
  //     FROM VisitorMaster
  //     WHERE TenantID = $1 
  //       AND VisitorCatID = 6 
  //       AND IsActive = 'Y'
  //       AND CreatedDate >= CURRENT_DATE - INTERVAL '${days} days'
  //     GROUP BY VisitPurposeID, VisitPurpose
  //     ORDER BY total_count DESC
  //   `;

  //   const result = await query(sql, [tenantId]);
  //   return result.rows;
  // }
};

module.exports = AnalyticsModel;