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
  }
};

module.exports = AnalyticsModel;