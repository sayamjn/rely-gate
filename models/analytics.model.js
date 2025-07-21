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
    const endDate = convertDate(toDate);

    const sql = `
      WITH DateSeries AS (
        SELECT GENERATE_SERIES(
          $2::date,
          $3::date,
          '1 day'::interval
        )::date as visit_date
      ),
      UnregisteredStats AS (
        SELECT 
          DATE(InTime) as visit_date,
          COUNT(CASE WHEN VisitorCatName = 'Student' AND InTime IS NOT NULL THEN 1 END) as StudentIN,
          COUNT(CASE WHEN VisitorCatName = 'Student' AND OutTime IS NOT NULL THEN 1 END) as StudentOUT,
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND InTime IS NOT NULL THEN 1 END) as BusIN,
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND OutTime IS NOT NULL THEN 1 END) as BusOUT,
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND InTime IS NOT NULL THEN 1 END) as VisitorsIN,
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND OutTime IS NOT NULL THEN 1 END) as VisitorsOUT,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND InTime IS NOT NULL THEN 1 END) as StaffIN,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND OutTime IS NOT NULL THEN 1 END) as StaffOUT
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND (
            (InTime IS NOT NULL AND DATE(InTime) BETWEEN $2 AND $3) OR
            (OutTime IS NOT NULL AND DATE(OutTime) BETWEEN $2 AND $3)
          )
        GROUP BY DATE(InTime)
      ),
      RegisteredStats AS (
        SELECT 
          DATE(INTime) as visit_date,
          COUNT(CASE WHEN VisitorCatName = 'Student' AND INTime IS NOT NULL THEN 1 END) as StudentIN,
          COUNT(CASE WHEN VisitorCatName = 'Student' AND OutTime IS NOT NULL THEN 1 END) as StudentOUT,
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND INTime IS NOT NULL THEN 1 END) as BusIN,
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND OutTime IS NOT NULL THEN 1 END) as BusOUT,
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND INTime IS NOT NULL THEN 1 END) as VisitorsIN,
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND OutTime IS NOT NULL THEN 1 END) as VisitorsOUT,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND INTime IS NOT NULL THEN 1 END) as StaffIN,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND OutTime IS NOT NULL THEN 1 END) as StaffOUT
        FROM VisitorRegVisitHistory
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND (
            (INTime IS NOT NULL AND DATE(INTime) BETWEEN $2 AND $3) OR
            (OutTime IS NOT NULL AND DATE(OutTime) BETWEEN $2 AND $3)
          )
        GROUP BY DATE(INTime)
      ),
      CombinedStats AS (
        SELECT 
          ds.visit_date,
          (COALESCE(us.StudentIN, 0) + COALESCE(rs.StudentIN, 0)) as StudentIN,
          (COALESCE(us.StudentOUT, 0) + COALESCE(rs.StudentOUT, 0)) as StudentOUT,
          (COALESCE(us.BusIN, 0) + COALESCE(rs.BusIN, 0)) as BusIN,
          (COALESCE(us.BusOUT, 0) + COALESCE(rs.BusOUT, 0)) as BusOUT,
          (COALESCE(us.VisitorsIN, 0) + COALESCE(rs.VisitorsIN, 0)) as VisitorsIN,
          (COALESCE(us.VisitorsOUT, 0) + COALESCE(rs.VisitorsOUT, 0)) as VisitorsOUT,
          (COALESCE(us.StaffIN, 0) + COALESCE(rs.StaffIN, 0)) as StaffIN,
          (COALESCE(us.StaffOUT, 0) + COALESCE(rs.StaffOUT, 0)) as StaffOUT
        FROM DateSeries ds
        LEFT JOIN UnregisteredStats us ON ds.visit_date = us.visit_date
        LEFT JOIN RegisteredStats rs ON ds.visit_date = rs.visit_date
        ORDER BY ds.visit_date
      )
      SELECT 
        TO_CHAR(visit_date, 'DD/MM/YYYY') as "VisitDate",
        StudentIN as "StudentIN",
        StudentOUT as "StudentOUT", 
        BusIN as "BusIN",
        BusOUT as "BusOUT",
        VisitorsIN as "VisitorsIN",
        VisitorsOUT as "VisitorsOUT",
        StaffIN as "StaffIN",
        StaffOUT as "StaffOUT"
      FROM CombinedStats
    `;

    const result = await query(sql, [tenantId, startDate, endDate]);
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
    const endDate = convertDate(toDate);

    const sql = `
      WITH UnregisteredVisitors AS (
        SELECT 
          VisitorSubCatName,
          COUNT(CASE WHEN InTime IS NOT NULL THEN 1 END) as VisitorIN,
          COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as VisitorOUT
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatName = 'Visitor'
          AND (
            (InTime IS NOT NULL AND DATE(InTime) BETWEEN $2 AND $3) OR
            (OutTime IS NOT NULL AND DATE(OutTime) BETWEEN $2 AND $3)
          )
          AND VisitorSubCatName IS NOT NULL
        GROUP BY VisitorSubCatName
      ),
      RegisteredVisitors AS (
        SELECT 
          VisitorSubCatName,
          COUNT(CASE WHEN INTime IS NOT NULL THEN 1 END) as VisitorIN,
          COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as VisitorOUT
        FROM VisitorRegVisitHistory
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatName = 'Visitor'
          AND (
            (INTime IS NOT NULL AND DATE(INTime) BETWEEN $2 AND $3) OR
            (OutTime IS NOT NULL AND DATE(OutTime) BETWEEN $2 AND $3)
          )
          AND VisitorSubCatName IS NOT NULL
        GROUP BY VisitorSubCatName
      )
      SELECT 
        COALESCE(uv.VisitorSubCatName, rv.VisitorSubCatName) as VisitorSubCatName,
        (COALESCE(uv.VisitorIN, 0) + COALESCE(rv.VisitorIN, 0)) as "VisitorIN",
        (COALESCE(uv.VisitorOUT, 0) + COALESCE(rv.VisitorOUT, 0)) as "VisitorOUT"
      FROM UnregisteredVisitors uv
      FULL OUTER JOIN RegisteredVisitors rv ON uv.VisitorSubCatName = rv.VisitorSubCatName
      WHERE (COALESCE(uv.VisitorIN, 0) + COALESCE(rv.VisitorIN, 0)) > 0 
        OR (COALESCE(uv.VisitorOUT, 0) + COALESCE(rv.VisitorOUT, 0)) > 0
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
    const endDate = convertDate(toDate);

    const sql = `
      WITH UnregisteredPurposes AS (
        SELECT 
          CASE 
            WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
            ELSE VisitPurpose
          END as GroupLabel,
          COUNT(CASE WHEN InTime IS NOT NULL THEN 1 END) as VisitorIN,
          COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as VisitorOUT
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorSubCatID = $4
          AND (
            (InTime IS NOT NULL AND DATE(InTime) BETWEEN $2 AND $3) OR
            (OutTime IS NOT NULL AND DATE(OutTime) BETWEEN $2 AND $3)
          )
        GROUP BY 
          CASE 
            WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
            ELSE VisitPurpose
          END
      ),
      RegisteredPurposes AS (
        SELECT 
          CASE 
            WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
            ELSE VisitPurpose
          END as GroupLabel,
          COUNT(CASE WHEN INTime IS NOT NULL THEN 1 END) as VisitorIN,
          COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as VisitorOUT
        FROM VisitorRegVisitHistory
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorSubCatID = $4
          AND (
            (INTime IS NOT NULL AND DATE(INTime) BETWEEN $2 AND $3) OR
            (OutTime IS NOT NULL AND DATE(OutTime) BETWEEN $2 AND $3)
          )
        GROUP BY 
          CASE 
            WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
            ELSE VisitPurpose
          END
      )
      SELECT 
        COALESCE(up.GroupLabel, rp.GroupLabel) as "GroupLabel",
        (COALESCE(up.VisitorIN, 0) + COALESCE(rp.VisitorIN, 0)) as "VisitorIN",
        (COALESCE(up.VisitorOUT, 0) + COALESCE(rp.VisitorOUT, 0)) as "VisitorOUT"
      FROM UnregisteredPurposes up
      FULL OUTER JOIN RegisteredPurposes rp ON up.GroupLabel = rp.GroupLabel
      WHERE (COALESCE(up.VisitorIN, 0) + COALESCE(rp.VisitorIN, 0)) > 0 
        OR (COALESCE(up.VisitorOUT, 0) + COALESCE(rp.VisitorOUT, 0)) > 0
      ORDER BY "VisitorIN" DESC, "VisitorOUT" DESC
    `;

    const result = await query(sql, [tenantId, startDate, endDate, subCatID]);
    return result.rows;
  },

  // Get dashboard summary analytics
  async getDashboardSummary(tenantId) {
    const sql = `
      WITH UnregisteredStats AS (
        -- Get stats from VisitorMaster (unregistered visitors, gate passes)
        SELECT 
          -- Today's check-ins and check-outs by category
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(InTime) = CURRENT_DATE THEN 1 END) as checkin_visitors,
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_visitors,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND DATE(InTime) = CURRENT_DATE THEN 1 END) as checkin_staff,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_staff,
          COUNT(CASE WHEN VisitorCatName = 'Student' AND DATE(InTime) = CURRENT_DATE THEN 1 END) as checkin_student,
          COUNT(CASE WHEN VisitorCatName = 'Student' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_student,
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND DATE(InTime) = CURRENT_DATE THEN 1 END) as checkin_bus,
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_bus,
          COUNT(CASE WHEN VisitorCatID = 6 AND DATE(InTime) = CURRENT_DATE THEN 1 END) as checkin_gatepass,
          COUNT(CASE WHEN VisitorCatID = 6 AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_gatepass,
          
          -- Currently inside (checked in but not out today)
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(InTime) = CURRENT_DATE 
                    AND OutTime IS NULL THEN 1 END) as inside_visitors,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND DATE(InTime) = CURRENT_DATE 
                    AND OutTime IS NULL THEN 1 END) as inside_staff,
          
          -- Yesterday's still inside (checked in yesterday but not out)
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(InTime) = CURRENT_DATE - 1 
                    AND OutTime IS NULL THEN 1 END) as yesterday_visitors,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND DATE(InTime) = CURRENT_DATE - 1 
                    AND OutTime IS NULL THEN 1 END) as yesterday_staff,
          
          -- Total visitors (last 30 days)
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND InTime >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as total_visitors
          
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND (InTime >= CURRENT_DATE - INTERVAL '30 days' OR OutTime >= CURRENT_DATE - INTERVAL '30 days')
      ),
      RegisteredStats AS (
        -- Get stats from VisitorRegVisitHistory (registered visitors, students, staff, buses)
        SELECT 
          -- Today's check-ins and check-outs by category
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(INTime) = CURRENT_DATE THEN 1 END) as checkin_visitors,
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_visitors,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND DATE(INTime) = CURRENT_DATE THEN 1 END) as checkin_staff,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_staff,
          COUNT(CASE WHEN VisitorCatName = 'Student' AND DATE(INTime) = CURRENT_DATE THEN 1 END) as checkin_student,
          COUNT(CASE WHEN VisitorCatName = 'Student' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_student,
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND DATE(INTime) = CURRENT_DATE THEN 1 END) as checkin_bus,
          COUNT(CASE WHEN VisitorCatName = 'Bus' AND DATE(OutTime) = CURRENT_DATE THEN 1 END) as checkout_bus,
          
          -- Currently inside (checked in but not out)
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(INTime) = CURRENT_DATE 
                    AND OutTime IS NULL THEN 1 END) as inside_visitors,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND DATE(INTime) = CURRENT_DATE 
                    AND OutTime IS NULL THEN 1 END) as inside_staff,
          
          -- Yesterday's still inside 
          COUNT(CASE WHEN VisitorCatName = 'Visitor' AND DATE(INTime) = CURRENT_DATE - 1 
                    AND OutTime IS NULL THEN 1 END) as yesterday_visitors,
          COUNT(CASE WHEN VisitorCatName = 'Staff' AND DATE(INTime) = CURRENT_DATE - 1 
                    AND OutTime IS NULL THEN 1 END) as yesterday_staff
          
        FROM VisitorRegVisitHistory
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND INTime >= CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT 
        -- Combine stats from both tables
        (COALESCE(us.inside_visitors, 0) + COALESCE(rs.inside_visitors, 0)) as "todayOutside",
        (COALESCE(us.checkin_visitors, 0) + COALESCE(rs.checkin_visitors, 0) + COALESCE(us.checkin_gatepass, 0)) as "checkInVisitors",
        (COALESCE(us.checkout_visitors, 0) + COALESCE(rs.checkout_visitors, 0) + COALESCE(us.checkout_gatepass, 0)) as "checkOutVisitors",
        (COALESCE(us.yesterday_visitors, 0) + COALESCE(rs.yesterday_visitors, 0)) as "yesterdayOutside",
        COALESCE(us.total_visitors, 0) as "totalVisitors",
        COALESCE(rs.inside_visitors, 0) as "presentRegVisitors",
        0 as "absentRegVisitors",
        (COALESCE(us.checkout_staff, 0) + COALESCE(rs.checkout_staff, 0)) as "checkOutEmployee",
        (COALESCE(us.checkin_staff, 0) + COALESCE(rs.checkin_staff, 0)) as "checkInEmployee",
        (COALESCE(us.yesterday_staff, 0) + COALESCE(rs.yesterday_staff, 0)) as "yesterdayEmployee",
        (COALESCE(us.checkin_student, 0) + COALESCE(rs.checkin_student, 0)) as "checkInStudent",
        (COALESCE(us.checkout_student, 0) + COALESCE(rs.checkout_student, 0)) as "checkOutStudent",
        (COALESCE(us.checkin_bus, 0) + COALESCE(rs.checkin_bus, 0)) as "checkInBus",
        (COALESCE(us.checkout_bus, 0) + COALESCE(rs.checkout_bus, 0)) as "checkOutBus"
      FROM UnregisteredStats us
      FULL OUTER JOIN RegisteredStats rs ON 1=1
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