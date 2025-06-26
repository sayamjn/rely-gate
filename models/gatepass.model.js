const { query } = require("../config/database");

class GatePassModel {
  // Legacy gate pass list with basic search and pagination
  static async getGatePassesLegacy(tenantId, page, pageSize, search) {
    let whereConditions = [
      `vm.TenantID = $1`,
      `vm.VisitorCatID = 6`,
      `vm.IsActive = 'Y'`,
    ];
    let params = [tenantId];
    let paramCount = 1;

    // Add search condition
    if (search) {
      paramCount++;
      whereConditions.push(`(
      LOWER(vm.Fname) LIKE LOWER($${paramCount}) OR 
      vm.Mobile LIKE $${paramCount} OR 
      LOWER(vm.VisitPurpose) LIKE LOWER($${paramCount})
    )`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(" AND ");

    // Count query
    const countSql = `
    SELECT COUNT(*) as total_count
    FROM VisitorMaster vm
    WHERE ${whereClause}
  `;

    const countResult = await query(countSql, params);
    const totalCount = parseInt(countResult.rows[0].total_count);

    // Data query with pagination
    const offset = (page - 1) * pageSize;
    paramCount++;
    params.push(pageSize);
    paramCount++;
    params.push(offset);

    const dataSql = `
    SELECT 
      vm.VisitorID as "visitorId",
      vm.Fname as "fname",
      vm.Mobile as "mobile",
      vm.VisitDateTxt as "visitDateTxt",
      vm.VisitPurpose as "purposeName",
      CASE 
        WHEN vm.VisitPurposeID IS NULL THEN 'Custom'
        ELSE 'Predefined'
      END as "purposeType",
      vm.StatusName as "statusName",
      vm.Remark as "securityCode",
      vm.INTimeTxt as "checkInTimeTxt",
      vm.OutTimeTxt as "checkOutTimeTxt",
      vm.CreatedDate as "createdDate"
    FROM VisitorMaster vm
    WHERE ${whereClause}
    ORDER BY vm.CreatedDate DESC
    LIMIT $${paramCount - 1} OFFSET $${paramCount}
  `;

    const dataResult = await query(dataSql, params);

    return {
      data: dataResult.rows,
      count: totalCount,
    };
  }

  // Insert new gate pass into VisitorMaster table
  static async insertGatePass(gatePassData) {
    const {
      tenantId,
      fname,
      mobile,
      visitDate,
      visitDateTxt,
      purposeId,
      purposeName,
      statusId,
      statusName,
      visitorCatId,
      visitorCatName,
      visitorSubCatId,
      visitorSubCatName,
      totalVisitors,
      otpDate,
      remarks,
      createdBy,
      updatedBy,
    } = gatePassData;

    const sql = `
      INSERT INTO VisitorMaster (
        TenantID, IsActive, StatusID, StatusName, VisitorCatID, VisitorCatName,
        VisitorSubCatID, VisitorSubCatName, VisitPurposeID, VisitPurpose,
        Fname, Mobile, TotalVisitor, VisitDate, VisitDateTxt, OTPVerifiedDate,
        Remark, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES (
        $1, 'Y', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        NOW(), NOW(), $17, $18
      ) RETURNING VisitorID
    `;

    const result = await query(sql, [
      tenantId,
      statusId,
      statusName,
      visitorCatId,
      visitorCatName,
      visitorSubCatId,
      visitorSubCatName,
      purposeId,
      purposeName,
      fname,
      mobile,
      totalVisitors,
      visitDate,
      visitDateTxt,
      otpDate,
      remarks,
      createdBy,
      updatedBy,
    ]);

    return result.rows[0];
  }

  // Get gate pass list with filters
  static async getGatePassWithFilters(tenantId, filters) {
    const { purposeId, fromDate, toDate, visitDate, search, page, pageSize } =
      filters;

    let whereConditions = [
      `vm.TenantID = $1`,
      `vm.VisitorCatID = 6`,
      `vm.IsActive = 'Y'`,
    ];
    let params = [tenantId];
    let paramCount = 1;

    if (purposeId) {
      paramCount++;
      whereConditions.push(`vm.VisitPurposeID = $${paramCount}`);
      params.push(purposeId);
    }

    if (visitDate) {
      paramCount++;
      whereConditions.push(`DATE(vm.VisitDate) = $${paramCount}`);
      params.push(visitDate);
    }

    if (fromDate && toDate) {
      paramCount++;
      whereConditions.push(`DATE(vm.VisitDate) >= $${paramCount}`);
      params.push(fromDate);
      paramCount++;
      whereConditions.push(`DATE(vm.VisitDate) <= $${paramCount}`);
      params.push(toDate);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(
        LOWER(vm.Fname) LIKE LOWER($${paramCount}) OR 
        vm.Mobile LIKE $${paramCount} OR 
        LOWER(vm.VisitPurpose) LIKE LOWER($${paramCount})
      )`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(" AND ");

    // Count query
    const countSql = `
      SELECT COUNT(*) as total_count
      FROM VisitorMaster vm
      WHERE ${whereClause}
    `;

    const countResult = await query(countSql, params);
    const totalCount = parseInt(countResult.rows[0].total_count);

    // Data query with pagination
    const offset = (page - 1) * pageSize;
    paramCount++;
    params.push(pageSize);
    paramCount++;
    params.push(offset);

    const dataSql = `
      SELECT 
        vm.VisitorID as "visitorId",
        vm.Fname as "fname",
        vm.Mobile as "mobile",
        vm.VisitDate as "visitDate",
        vm.VisitDateTxt as "visitDateTxt",
        vm.VisitPurposeID as "purposeId",
        vm.VisitPurpose as "purposeName",
        vm.StatusID as "statusId",
        vm.StatusName as "statusName",
        vm.VisitorCatName as "visitorCatName",
        vm.TotalVisitor as "totalVisitors",
        vm.Remark as "securityCode",
        vm.INTime as "checkInTime",
        vm.INTimeTxt as "checkInTimeTxt",
        vm.OutTime as "checkOutTime",
        vm.OutTimeTxt as "checkOutTimeTxt",
        vm.CreatedDate as "createdDate",
        vm.CreatedBy as "createdBy"
      FROM VisitorMaster vm
      WHERE ${whereClause}
      ORDER BY vm.CreatedDate DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const dataResult = await query(dataSql, params);

    return {
      data: dataResult.rows,
      count: totalCount,
    };
  }

  // Get gate pass by ID
  static async getGatePassById(visitorId, tenantId) {
    const sql = `
      SELECT 
        VisitorID as "visitorId",
        Fname as "fname",
        Mobile as "mobile",
        VisitDate as "visitDate",
        VisitDateTxt as "visitDateTxt",
        VisitPurposeID as "purposeId",
        VisitPurpose as "purposeName",
        StatusID as "statusId",
        StatusName as "statusName",
        Remark as "remarks",
        INTime as "intime",
        OutTime as "outtime",
        CreatedDate as "createdDate"
      FROM VisitorMaster
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6 AND IsActive = 'Y'
    `;

    const result = await query(sql, [visitorId, tenantId]);
    return result.rows[0];
  }

  // Update gate pass status (approve/reject)
  static async updateGatePassStatus(
    visitorId,
    tenantId,
    statusId,
    statusName,
    updatedBy
  ) {
    const sql = `
      UPDATE VisitorMaster 
      SET StatusID = $3, 
          StatusName = $4,
          UpdatedDate = NOW(),
          UpdatedBy = $5
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6
      RETURNING VisitorID
    `;

    const result = await query(sql, [
      visitorId,
      tenantId,
      statusId,
      statusName,
      updatedBy,
    ]);
    return result.rows[0];
  }

  // Get pending check-in (approved but not checked in)
  static async getPendingCheckIn(tenantId) {
    const sql = `
      SELECT 
        vm.VisitorID as "visitorId",
        vm.Fname as "fname",
        vm.Mobile as "mobile",
        vm.VisitDate as "visitDate",
        vm.VisitDateTxt as "visitDateTxt",
        vm.VisitPurpose as "purposeName",
        vm.StatusName as "statusName",
        vm.Remark as "securityCode",
        vm.CreatedDate as "createdDate"
      FROM VisitorMaster vm
      WHERE vm.TenantID = $1 
        AND vm.VisitorCatID = 6 
        AND vm.IsActive = 'Y'
        AND vm.StatusID = 2 
        AND vm.INTime IS NULL
      ORDER BY vm.CreatedDate DESC
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get pending check-out (checked in but not checked out)
  static async getPendingCheckOut(tenantId) {
    const sql = `
    SELECT 
      vm.VisitorID as "visitorId",
      vm.Fname as "fname",
      vm.Mobile as "mobile",
      vm.VisitDate as "visitDate",
      vm.VisitDateTxt as "visitDateTxt",
      vm.VisitPurpose as "purposeName",
      vm.StatusName as "statusName",
      vm.Remark as "securityCode",
      vm.INTime as "checkInTime",
      vm.INTimeTxt as "checkInTimeTxt",
      vm.CreatedDate as "createdDate"
    FROM VisitorMaster vm
    WHERE vm.TenantID = $1 
      AND vm.VisitorCatID = 6 
      AND vm.IsActive = 'Y'
      AND vm.StatusID = 2
      AND vm.INTime IS NOT NULL 
      AND vm.OutTime IS NULL
    ORDER BY vm.INTime DESC
  `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Update check-in time
  static async updateCheckInTime(visitorId, tenantId, updatedBy) {
    const sql = `
      UPDATE VisitorMaster 
      SET INTime = NOW(), 
          INTimeTxt = TO_CHAR(NOW(), 'HH12:MI AM'),
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6
      RETURNING VisitorID
    `;

    const result = await query(sql, [visitorId, tenantId, updatedBy]);
    return result.rows[0];
  }

  // Update check-out time
  static async updateCheckOutTime(visitorId, tenantId, updatedBy) {
    const sql = `
      UPDATE VisitorMaster 
      SET OutTime = NOW(), 
          OutTimeTxt = TO_CHAR(NOW(), 'HH12:MI AM'),
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6
      RETURNING VisitorID
    `;

    const result = await query(sql, [visitorId, tenantId, updatedBy]);
    return result.rows[0];
  }

  // Get gate pass purposes
  static async getGatePassPurposes(tenantId) {
    const sql = `
    SELECT 
      VisitPurposeID as "purposeId",
      VisitPurpose as "purposeName",
      PurposeCatID as "purposeCatId",
      PurposeCatName as "purposeCatName"
    FROM VisitorPuposeMaster
    WHERE TenantID = $1 
      AND IsActive = 'Y' 
      AND PurposeCatID = 6
    ORDER BY VisitPurpose ASC
  `;

    const result = await query(sql, [tenantId]);

    // Add custom purpose option at the beginning
    // const customPurpose = {
    //   purposeId: -1,
    //   purposeName: "Custom Purpose",
    //   purposeCatId: 6,
    //   purposeCatName: "Gate Pass",
    // };

    return [...result.rows];
  }

  // Check if mobile has active gate pass for same day
  static async checkDailyMobileExists(mobile, visitDate, tenantId) {
    const sql = `
      SELECT 
        VisitorID as "visitorId",
        StatusName as "statusName"
      FROM VisitorMaster
      WHERE Mobile = $1 
        AND DATE(VisitDate) = DATE($2)
        AND TenantID = $3 
        AND VisitorCatID = 6 
        AND IsActive = 'Y'
        AND StatusID IN (1, 2)
        AND (OutTime IS NULL OR DATE(OutTime) = DATE($2))
      LIMIT 1
    `;

    const result = await query(sql, [mobile, visitDate, tenantId]);
    return result.rows[0];
  }

  // Get recent gate passes by mobile (for rate limiting)
  static async getRecentGatePassesByMobile(mobile, tenantId, hoursBack = 1) {
    const sql = `
      SELECT VisitorID
      FROM VisitorMaster
      WHERE Mobile = $1 
        AND TenantID = $2 
        AND VisitorCatID = 6 
        AND IsActive = 'Y'
        AND CreatedDate >= NOW() - INTERVAL '${hoursBack} hours'
      ORDER BY CreatedDate DESC
    `;

    const result = await query(sql, [mobile, tenantId]);
    return result.rows;
  }

  // Get purpose by ID for validation
  static async getPurposeById(purposeId, tenantId) {
    const sql = `
    SELECT 
      VisitPurposeID as "purposeId",
      VisitPurpose as "purposeName",
      PurposeCatID as "purposeCatId",
      PurposeCatName as "purposeCatName",
      IsActive as "isActive"
    FROM VisitorPuposeMaster
    WHERE VisitPurposeID = $1 
      AND TenantID = $2 
      AND PurposeCatID = 6
  `;

    const result = await query(sql, [purposeId, tenantId]);
    return result.rows[0];
  }

  // Get gate pass statistics for dashboard
  static async getGatePassStats(tenantId, dateRange = 30) {
    const sql = `
      SELECT 
        COUNT(*) as "totalGatePasses",
        COUNT(CASE WHEN StatusID = 1 THEN 1 END) as "pendingApproval",
        COUNT(CASE WHEN StatusID = 2 AND INTime IS NULL THEN 1 END) as "pendingCheckIn",
        COUNT(CASE WHEN INTime IS NOT NULL AND OutTime IS NULL THEN 1 END) as "pendingCheckOut",
        COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as "completed",
        COUNT(CASE WHEN DATE(CreatedDate) = CURRENT_DATE THEN 1 END) as "todayTotal",
        AVG(CASE 
          WHEN OutTime IS NOT NULL AND INTime IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (OutTime - INTime))/3600 
          ELSE NULL 
        END) as "avgVisitHours"
      FROM VisitorMaster
      WHERE TenantID = $1 
        AND VisitorCatID = 6 
        AND IsActive = 'Y'
        AND CreatedDate >= CURRENT_DATE - INTERVAL '${dateRange} days'
    `;

    const result = await query(sql, [tenantId]);
    return result.rows[0];
  }

  // Export gate pass data (for future implementation)
  static async exportGatePasses(tenantId, filters = {}) {
    const { purposeId, fromDate, toDate, statusId } = filters;

    let whereConditions = [
      `vm.TenantID = $1`,
      `vm.VisitorCatID = 6`,
      `vm.IsActive = 'Y'`,
    ];
    let params = [tenantId];
    let paramCount = 1;

    if (purposeId) {
      paramCount++;
      whereConditions.push(`vm.VisitPurposeID = ${paramCount}`);
      params.push(purposeId);
    }

    if (statusId) {
      paramCount++;
      whereConditions.push(`vm.StatusID = ${paramCount}`);
      params.push(statusId);
    }

    if (fromDate && toDate) {
      paramCount++;
      whereConditions.push(`DATE(vm.VisitDate) >= ${paramCount}`);
      params.push(fromDate);
      paramCount++;
      whereConditions.push(`DATE(vm.VisitDate) <= ${paramCount}`);
      params.push(toDate);
    }

    const whereClause = whereConditions.join(" AND ");

    const sql = `
      SELECT 
        vm.Fname as "Visitor Name",
        vm.Mobile as "Mobile Number",
        vm.VisitDateTxt as "Visit Date",
        vm.VisitPurpose as "Purpose",
        vm.StatusName as "Status",
        vm.Remark as "Security Code",
        vm.INTimeTxt as "Check In Time",
        vm.OutTimeTxt as "Check Out Time",
        vm.CreatedDate as "Created Date"
      FROM VisitorMaster vm
      WHERE ${whereClause}
      ORDER BY vm.CreatedDate DESC
    `;

    const result = await query(sql, params);
    return result.rows;
  }

  // Add new purpose for gate pass
  static async addGatePassPurpose(purposeData) {
  const sql = `
    INSERT INTO VisitorPuposeMaster (
      TenantID, 
      PurposeCatID, 
      PurposeCatName, 
      VisitPurpose, 
      IsActive,
      CreatedBy,
      CreatedDate
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING 
      VisitPurposeID as "purposeId",
      VisitPurpose as "purposeName",
      PurposeCatID as "purposeCatId",
      PurposeCatName as "purposeCatName"
  `;

  const values = [
    purposeData.tenantId,
    6, // Gate Pass category
    'Gate Pass',
    purposeData.purposeName,
    'Y',
    purposeData.createdBy
  ];

  const result = await query(sql, values);
  return result.rows[0];
}

// Check if purpose name already exists for tenant
static async checkPurposeExists(tenantId, purposeName) {
  const sql = `
    SELECT VisitPurposeID 
    FROM VisitorPuposeMaster 
    WHERE TenantID = $1 
      AND PurposeCatID = 6 
      AND LOWER(VisitPurpose) = LOWER($2)
      AND IsActive = 'Y'
  `;

  const result = await query(sql, [tenantId, purposeName]);
  return result.rows.length > 0;
}

// Update existing purpose
static async updateGatePassPurpose(purposeId, tenantId, purposeName, updatedBy) {
  const sql = `
    UPDATE VisitorPuposeMaster 
    SET VisitPurpose = $1,
        UpdatedBy = $2,
        UpdatedDate = NOW()
    WHERE VisitPurposeID = $3 
      AND TenantID = $4 
      AND PurposeCatID = 6
    RETURNING 
      VisitPurposeID as "purposeId",
      VisitPurpose as "purposeName",
      PurposeCatID as "purposeCatId",
      PurposeCatName as "purposeCatName"
  `;

  const result = await query(sql, [purposeName, updatedBy, purposeId, tenantId]);
  return result.rows[0];
}

// Delete purpose (soft delete)
static async deleteGatePassPurpose(purposeId, tenantId, updatedBy) {
  const sql = `
    UPDATE VisitorPuposeMaster 
    SET IsActive = 'N',
        UpdatedBy = $1,
        UpdatedDate = NOW()
    WHERE VisitPurposeID = $2 
      AND TenantID = $3 
      AND PurposeCatID = 6
      AND IsActive = 'Y'
    RETURNING VisitPurposeID as "purposeId"
  `;
  const result = await query(sql, [updatedBy, purposeId, tenantId]);
  return result.rows[0];
}

}

module.exports = GatePassModel;
