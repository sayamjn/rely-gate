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

  async getGatePassExitsByPurpose(tenantId, fromDate = null, toDate = null) {
    let dateFilter = '';
    let params = [tenantId];
    
    if (fromDate && toDate) {
      dateFilter = `AND DATE(CreatedDate) BETWEEN $2 AND $3`;
      params.push(fromDate, toDate);
    } else if (fromDate) {
      dateFilter = `AND DATE(CreatedDate) >= $2`;
      params.push(fromDate);
    } else if (toDate) {
      dateFilter = `AND DATE(CreatedDate) <= $2`;
      params.push(toDate);
    }

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
        ${dateFilter}
      GROUP BY 
        CASE 
          WHEN VisitPurposeID = -1 THEN 'Others'
          ELSE VisitPurpose
        END
      ORDER BY exit_count DESC
    `;

    const result = await query(sql, params);
    return result.rows;
  },

  // Get trend analytics by category (Student, Bus, Visitor, Staff)
  async getTrendByCategory(tenantId, fromDate, toDate) {
    // Convert DD/MM/YYYY to YYYY-MM-DD format
    const convertDate = (dateStr) => {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const startDate = convertDate(fromDate);
    const endDate = convertDate(toDate) + ' 23:59:59';

    const sql = `
      WITH DateSeries AS (
        SELECT GENERATE_SERIES(
          $2::date,
          $3::date,
          '1 day'::interval
        )::date as visit_date
      ),
      DailyStats AS (
        SELECT 
          DATE(VisitDate) as visit_date,
          -- Student counts (Category = Student, PurposeCatID = 3)
          COUNT(CASE WHEN VisitorCatName = 'Student' AND InTime IS NOT NULL THEN 1 END) as StudentIN,
          COUNT(CASE WHEN VisitorCatName = 'Student' AND OutTime IS NOT NULL THEN 1 END) as StudentOUT,
          -- Bus counts (Category = Bus, PurposeCatID = 2)  
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND InTime IS NOT NULL THEN 1 END) as BusIN,
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND OutTime IS NOT NULL THEN 1 END) as BusOUT,
          -- Visitor counts (Category = Visitor, PurposeCatID = 1)
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND InTime IS NOT NULL THEN 1 END) as VisitorsIN,
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND OutTime IS NOT NULL THEN 1 END) as VisitorsOUT,
          -- Staff counts (Category = Staff, PurposeCatID = 4)
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND InTime IS NOT NULL THEN 1 END) as StaffIN,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND OutTime IS NOT NULL THEN 1 END) as StaffOUT
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitDate >= $2
          AND VisitDate <= $4
        GROUP BY DATE(VisitDate)
      )
      SELECT 
        TO_CHAR(ds.visit_date, 'DD/MM/YYYY') as "VisitDate",
        COALESCE(st.StudentIN, 0) as "StudentIN",
        COALESCE(st.StudentOUT, 0) as "StudentOUT", 
        COALESCE(st.BusIN, 0) as "BusIN",
        COALESCE(st.BusOUT, 0) as "BusOUT",
        COALESCE(st.VisitorsIN, 0) as "VisitorsIN",
        COALESCE(st.VisitorsOUT, 0) as "VisitorsOUT",
        COALESCE(st.StaffIN, 0) as "StaffIN",
        COALESCE(st.StaffOUT, 0) as "StaffOUT"
      FROM DateSeries ds
      LEFT JOIN DailyStats st ON ds.visit_date = st.visit_date
      WHERE (st.StudentIN > 0 OR st.StudentOUT > 0 OR st.BusIN > 0 OR st.BusOUT > 0 
        OR st.VisitorsIN > 0 OR st.VisitorsOUT > 0 OR st.StaffIN > 0 OR st.StaffOUT > 0)
      ORDER BY ds.visit_date
    `;

    const result = await query(sql, [tenantId, startDate, startDate, endDate]);
    return result.rows;
  },

  // Get overview analytics by visitor subcategory
  async getOverView(tenantId, fromDate, toDate) {
    // Convert DD/MM/YYYY to YYYY-MM-DD format
    const convertDate = (dateStr) => {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const startDate = convertDate(fromDate);
    const endDate = convertDate(toDate) + ' 23:59:59';

    const sql = `
      SELECT 
        VisitorSubCatName,
        COUNT(CASE WHEN InTime IS NOT NULL THEN 1 END) as "VisitorIN",
        COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as "VisitorOUT"
      FROM VisitorMaster
      WHERE TenantID = $1 
        AND IsActive = 'Y'
        AND VisitorCatName = 'Visitor'
        AND VisitDate >= $2
        AND VisitDate <= $3
        AND VisitorSubCatName IS NOT NULL
      GROUP BY VisitorSubCatName
      HAVING COUNT(CASE WHEN InTime IS NOT NULL THEN 1 END) > 0 
        OR COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) > 0
      ORDER BY "VisitorIN" DESC, "VisitorOUT" DESC
    `;

    const result = await query(sql, [tenantId, startDate, endDate]);
    return result.rows;
  },

  // Get trend analytics by purpose/subcategory
  async getTrendByPurpose(tenantId, fromDate, toDate, subCatID) {
    // Convert DD/MM/YYYY to YYYY-MM-DD format
    const convertDate = (dateStr) => {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const startDate = convertDate(fromDate);
    const endDate = convertDate(toDate) + ' 23:59:59';

    const sql = `
      SELECT 
        CASE 
          WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
          ELSE VisitPurpose
        END as "GroupLabel",
        COUNT(CASE WHEN InTime IS NOT NULL THEN 1 END) as "VisitorIN",
        COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as "VisitorOUT"
      FROM VisitorMaster
      WHERE TenantID = $1 
        AND IsActive = 'Y'
        AND VisitorSubCatID = $4
        AND VisitDate >= $2
        AND VisitDate <= $3
      GROUP BY 
        CASE 
          WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
          ELSE VisitPurpose
        END
      HAVING COUNT(CASE WHEN InTime IS NOT NULL THEN 1 END) > 0 
        OR COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) > 0
      ORDER BY "VisitorIN" DESC, "VisitorOUT" DESC
    `;

    const result = await query(sql, [tenantId, startDate, endDate, subCatID]);
    return result.rows;
  },

  // Get dashboard summary analytics
  async getDashboardSummary(tenantId) {
    const sql = `
      WITH TodayStats AS (
        SELECT 
          -- Today's visitors currently outside (checked in but not out)
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(VisitDate) = CURRENT_DATE 
                    AND InTime IS NOT NULL AND OutTime IS NULL THEN 1 END) as today_outside,
          
          -- Today's check-ins and check-outs for visitors
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(InTime) = CURRENT_DATE THEN 1 END) as checkin_visitors,
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_visitors,
          
          -- Yesterday's visitors still outside
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(VisitDate) = CURRENT_DATE - 1 
                    AND InTime IS NOT NULL AND OutTime IS NULL THEN 1 END) as yesterday_outside,
          
          -- Total visitors
          COUNT(CASE WHEN VisitorCatName = 'Visitor' THEN 1 END) as total_visitors,
          
          -- Present and absent registered visitors (using IsActive for registration status)
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND InTime IS NOT NULL AND OutTime IS NULL 
                    AND IsActive = 'Y' THEN 1 END) as present_reg_visitors,
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND (InTime IS NULL OR OutTime IS NOT NULL) 
                    AND IsActive = 'Y' THEN 1 END) as absent_reg_visitors,
          
          -- Employee check-ins and check-outs (Staff category)
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND DATE(InTime) = CURRENT_DATE THEN 1 END) as checkin_employee,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_employee,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND DATE(VisitDate) = CURRENT_DATE - 1 
                    AND InTime IS NOT NULL AND OutTime IS NULL THEN 1 END) as yesterday_employee,
          
          -- Student check-ins and check-outs
          COUNT(CASE WHEN VisitorCatName = 'Student' AND DATE(InTime) = CURRENT_DATE THEN 1 END) as checkin_student,
          COUNT(CASE WHEN VisitorCatName = 'Student' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_student,
          
          -- Bus check-ins and check-outs
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND DATE(InTime) = CURRENT_DATE THEN 1 END) as checkin_bus,
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_bus
          
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitDate >= CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT 
        today_outside as "todayOutside",
        checkin_visitors as "checkInVisitors",
        checkout_visitors as "checkOutVisitors",
        yesterday_outside as "yesterdayOutside",
        total_visitors as "totalVisitors",
        present_reg_visitors as "presentRegVisitors",
        absent_reg_visitors as "absentRegVisitors",
        checkout_employee as "checkOutEmployee",
        checkin_employee as "checkInEmployee",
        yesterday_employee as "yesterdayEmployee",
        checkin_student as "checkInStudent",
        checkout_student as "checkOutStudent",
        checkin_bus as "checkInBus",
        checkout_bus as "checkOutBus"
      FROM TodayStats
    `;

    const result = await query(sql, [tenantId]);
    return result.rows[0] || {
      todayOutside: 0,
      checkInVisitors: 0,
      checkOutVisitors: 0,
      yesterdayOutside: 0,
      totalVisitors: 0,
      presentRegVisitors: 0,
      absentRegVisitors: 0,
      checkOutEmployee: 0,
      checkInEmployee: 0,
      yesterdayEmployee: 0,
      checkInStudent: 0,
      checkOutStudent: 0,
      checkInBus: 0,
      checkOutBus: 0
    };
  }
};

module.exports = AnalyticsModel;