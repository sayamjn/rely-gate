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
        COUNT(CASE WHEN INTime IS NOT NULL AND OutTime IS NOT NULL THEN 1 END) as checked_out_count,
        COUNT(CASE WHEN INTime IS NOT NULL AND OutTime IS NULL THEN 1 END) as checked_in_count,
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

  async getGatePassEntriesByPurpose(tenantId, days = 7) {
    const sql = `
      SELECT 
        CASE 
          WHEN VisitPurposeID = -1 THEN 'Others'
          ELSE VisitPurpose
        END as purpose_name,
        COUNT(CASE WHEN INTime IS NOT NULL THEN 1 END) as checkin_count,
        COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as checkout_count,
        COUNT(*) as total_entries
      FROM VisitorMaster
      WHERE TenantID = $1 
        AND VisitorCatID = 6 
        AND IsActive = 'Y'
        AND CreatedDate >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY 
        CASE 
          WHEN VisitPurposeID = -1 THEN 'Others'
          ELSE VisitPurpose
        END
      ORDER BY total_entries DESC
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  },

  async getGatePassExitsByPurpose(tenantId, days = 7) {
    const sql = `
      SELECT 
        CASE 
          WHEN VisitPurposeID = -1 THEN 'Others'
          ELSE VisitPurpose
        END as purpose_name,
        COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as exit_count
      FROM VisitorMaster
      WHERE TenantID = $1 
        AND VisitorCatID = 6 
        AND IsActive = 'Y'
        AND OutTime IS NOT NULL
        AND CreatedDate >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY 
        CASE 
          WHEN VisitPurposeID = -1 THEN 'Others'
          ELSE VisitPurpose
        END
      ORDER BY exit_count DESC
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }
};

module.exports = AnalyticsModel;