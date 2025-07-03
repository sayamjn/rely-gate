const { query } = require("../config/database");
const DateFormatter = require("../utils/dateFormatter");

class GatePassModel {
  // Create new gate pass (moved from service)
  static async createGatePass(gatepassData) {
    const {
      tenantId,
      statusId,
      statusName,
      purposeId,
      purposeName,
      fname,
      mobile,
      visitDate,
      visitDateTxt,
      securityCode,
      remark,
      createdBy,
    } = gatepassData;

    const sql = `
      INSERT INTO VisitorMaster (
        TenantID, IsActive, StatusID, StatusName, VisitorCatID, VisitorCatName,
        VisitorSubCatID, VisitorSubCatName, VisitPurposeID, VisitPurpose,
        Fname, Mobile, TotalVisitor, VisitDate, VisitDateTxt, OTPVerifiedDate,
        Remark, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES (
        $1, 'Y', $2, $3, 6, 'Gate Pass', 0, NULL, $4, $5, $6, $7, 1, $8, $9, NOW(),
        $10, NOW(), NOW(), $11, $12
      ) RETURNING VisitorID
    `;

    const result = await query(sql, [
      tenantId,
      statusId,
      statusName,
      purposeId,
      purposeName,
      fname,
      mobile,
      visitDate,
      visitDateTxt,
      securityCode,
      remark,
      createdBy,
    ]);

    return result.rows[0];
  }

  // Get gate passes with filters (moved from service)
  static async getGatePassesWithFilters(tenantId, filters) {
    const {
      page = 1,
      pageSize = 20,
      search = "",
      purposeId = null,
      statusId = null,
      fromDate = null,
      toDate = null,
    } = filters;

    let whereConditions = [
      "TenantID = $1",
      "VisitorCatID = 6",
      "IsActive = 'Y'",
    ];
    let params = [tenantId];
    let paramIndex = 2;

    // Add search condition
    if (search) {
      whereConditions.push(
        `(Fname ILIKE $${paramIndex} OR Mobile ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add purpose filter
    if (purposeId) {
      whereConditions.push(`VisitPurposeID = $${paramIndex}`);
      params.push(purposeId);
      paramIndex++;
    }

    // Add status filter
    if (statusId) {
      whereConditions.push(`StatusID = $${paramIndex}`);
      params.push(statusId);
      paramIndex++;
    }

    // Add date range filter
    if (fromDate) {
      whereConditions.push(`VisitDate >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      whereConditions.push(`VisitDate <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");
    const offset = (page - 1) * pageSize;

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM VisitorMaster
      WHERE ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const totalCount = parseInt(countResult.rows[0].total);

    // Get paginated data
    const dataSql = `
      SELECT 
        VisitorID as "visitorId",
        Fname as "fname",
        Mobile as "mobile",
        VisitDate as "visitDate",
        TO_CHAR(VisitDate, '${DateFormatter.PG_DATETIME_FORMAT}') as "visitDateTxt",
        VisitPurposeID as "purposeId",
        VisitPurpose as "purposeName",
        StatusID as "statusId",
        StatusName as "statusName",
        Remark as "securityCode",
        INTime as "inTime",
        OutTime as "outTime",
        CASE 
          WHEN INTime IS NOT NULL THEN TO_CHAR(INTime, '${DateFormatter.PG_DATETIME_FORMAT}')
          ELSE INTimeTxt
        END as "inTimeTxt",
        CASE 
          WHEN OutTime IS NOT NULL THEN TO_CHAR(OutTime, '${DateFormatter.PG_DATETIME_FORMAT}')
          ELSE OutTimeTxt
        END as "outTimeTxt",
        CreatedDate as "createdDate",
        CASE 
          WHEN StatusID != 2 THEN 'PENDING_APPROVAL'
          WHEN INTime IS NULL THEN 'APPROVED_READY_FOR_CHECKIN'
          WHEN INTime IS NOT NULL AND OutTime IS NULL THEN 'CHECKED_IN'
          WHEN INTime IS NOT NULL AND OutTime IS NOT NULL THEN 'CHECKED_OUT'
          ELSE 'UNKNOWN'
        END as "currentState"
      FROM VisitorMaster
      WHERE ${whereClause}
      ORDER BY CreatedDate DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);
    const dataResult = await query(dataSql, params);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: dataResult.rows,
      totalCount,
      totalPages,
    };
  }

  // Check gate pass for approval (moved from service)
  static async checkGatePassForApproval(visitorId, tenantId) {
    const sql = `
      SELECT 
        VisitorID as "visitorId",
        Fname as "fname",
        Mobile as "mobile",
        StatusID as "statusId",
        StatusName as "statusName",
        Remark as "securityCode",
        INTime as "inTime",
        OutTime as "outTime"
      FROM VisitorMaster
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6 AND IsActive = 'Y'
    `;

    const result = await query(sql, [visitorId, tenantId]);
    return result.rows[0];
  }

  // Approve gate pass (moved from service)
  static async approveGatePass(visitorId, tenantId, updatedBy) {
    const sql = `
      UPDATE VisitorMaster 
      SET StatusID = 2, 
          StatusName = 'Approved',
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6
      RETURNING VisitorID
    `;

    const result = await query(sql, [visitorId, tenantId, updatedBy]);
    return result.rows[0];
  }

  // Check gate pass for checkin (moved from service)
  static async checkGatePassForCheckin(visitorId, tenantId) {
    const sql = `
      SELECT 
        VisitorID as "visitorId",
        Fname as "fname",
        Mobile as "mobile",
        StatusID as "statusId",
        StatusName as "statusName",
        INTime as "inTime",
        OutTime as "outTime"
      FROM VisitorMaster
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6 AND IsActive = 'Y'
    `;

    const result = await query(sql, [visitorId, tenantId]);
    return result.rows[0];
  }

  // Checkin gate pass (moved from service)
  static async checkinGatePass(visitorId, tenantId, updatedBy) {
    const sql = `
      UPDATE VisitorMaster 
      SET INTime = NOW(), 
          INTimeTxt = TO_CHAR(NOW(), '${DateFormatter.PG_DATETIME_FORMAT}'),
          OutTime = NULL,
          OutTimeTxt = NULL,
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6
      RETURNING VisitorID
    `;

    const result = await query(sql, [visitorId, tenantId, updatedBy]);
    return result.rows[0];
  }

  // Check gate pass for checkout (moved from service)
  static async checkGatePassForCheckout(visitorId, tenantId) {
    const sql = `
      SELECT 
        VisitorID as "visitorId",
        Fname as "fname",
        Mobile as "mobile",
        StatusID as "statusId",
        StatusName as "statusName", 
        INTime as "inTime",
        OutTime as "outTime"
      FROM VisitorMaster
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6 AND IsActive = 'Y'
    `;

    const result = await query(sql, [visitorId, tenantId]);
    return result.rows[0];
  }

  // Checkout gate pass (moved from service)
  static async checkoutGatePass(visitorId, tenantId, updatedBy) {
    const sql = `
      UPDATE VisitorMaster 
      SET OutTime = NOW(), 
          OutTimeTxt = TO_CHAR(NOW(), '${DateFormatter.PG_DATETIME_FORMAT}'),
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6
        AND INTime IS NOT NULL 
        AND OutTime IS NULL
      RETURNING VisitorID
    `;

    const result = await query(sql, [visitorId, tenantId, updatedBy]);
    return result.rows[0];
  }

  // Get gate pass status (moved from service)
  static async getGatePassStatus(visitorId, tenantId) {
    const sql = `
      SELECT 
        VisitorID as "visitorId",
        Fname as "fname",
        Mobile as "mobile",
        StatusID as "statusId",
        StatusName as "statusName",
        INTime as "inTime",
        OutTime as "outTime",
        INTimeTxt as "inTimeTxt",
        OutTimeTxt as "outTimeTxt",
        Remark as "securityCode",
        VisitPurpose as "purposeName",
        VisitDate as "visitDate",
        VisitDateTxt as "visitDateTxt",
        CreatedDate as "createdDate",
        CASE 
          WHEN StatusID != 2 THEN 'PENDING_APPROVAL'
          WHEN INTime IS NULL THEN 'APPROVED_READY_FOR_CHECKIN'
          WHEN INTime IS NOT NULL AND OutTime IS NULL THEN 'CHECKED_IN'
          WHEN INTime IS NOT NULL AND OutTime IS NOT NULL THEN 'CHECKED_OUT'
          ELSE 'UNKNOWN'
        END as "currentState"
      FROM VisitorMaster
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6 AND IsActive = 'Y'
    `;

    const result = await query(sql, [visitorId, tenantId]);
    return result.rows[0];
  }

  // Get pending checkins (moved from service)
  static async getPendingCheckins(tenantId) {
    const sql = `
      SELECT 
        VisitorID as "visitorId",
        Fname as "fname",
        Mobile as "mobile",
        VisitPurpose as "purposeName",
        Remark as "securityCode",
        VisitDate as "visitDate",
        VisitDateTxt as "visitDateTxt",
        CreatedDate as "createdDate",
        CASE 
          WHEN INTime IS NULL THEN 'READY_FOR_FIRST_CHECKIN'
          WHEN INTime IS NOT NULL AND OutTime IS NOT NULL THEN 'READY_FOR_RE_ENTRY'
          ELSE 'UNKNOWN'
        END as "checkinType"
      FROM VisitorMaster
      WHERE TenantID = $1 
        AND VisitorCatID = 6 
        AND IsActive = 'Y'
        AND StatusID = 2
        AND (INTime IS NULL OR (INTime IS NOT NULL AND OutTime IS NOT NULL))
      ORDER BY CreatedDate ASC
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get pending checkouts (moved from service)
  static async getPendingCheckouts(tenantId) {
    const sql = `
      SELECT 
        VisitorID as "visitorId",
        Fname as "fname",
        Mobile as "mobile",
        VisitPurpose as "purposeName",
        Remark as "securityCode",
        INTime as "inTime",
        INTimeTxt as "inTimeTxt",
        VisitDate as "visitDate",
        VisitDateTxt as "visitDateTxt",
        EXTRACT(EPOCH FROM (NOW() - INTime))/3600 as "hoursCheckedIn"
      FROM VisitorMaster
      WHERE TenantID = $1 
        AND VisitorCatID = 6 
        AND IsActive = 'Y'
        AND StatusID = 2
        AND INTime IS NOT NULL
        AND OutTime IS NULL
      ORDER BY INTime ASC
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Export gate passes (moved from service)
  static async exportGatePasses(tenantId, filters) {
    const {
      purposeId = null,
      statusId = null,
      fromDate = null,
      toDate = null,
    } = filters;

    let whereConditions = [
      "TenantID = $1",
      "VisitorCatID = 6",
      "IsActive = 'Y'",
    ];
    let params = [tenantId];
    let paramIndex = 2;

    if (purposeId) {
      whereConditions.push(`VisitPurposeID = $${paramIndex}`);
      params.push(purposeId);
      paramIndex++;
    }

    if (statusId) {
      whereConditions.push(`StatusID = $${paramIndex}`);
      params.push(statusId);
      paramIndex++;
    }

    if (fromDate) {
      whereConditions.push(`VisitDate >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      whereConditions.push(`VisitDate <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    const sql = `
      SELECT 
        VisitorID,
        Fname,
        Mobile,
        VisitDateTxt,
        VisitPurpose,
        StatusName,
        Remark as SecurityCode,
        INTimeTxt,
        OutTimeTxt,
        TO_CHAR(CreatedDate, 'YYYY-MM-DD HH24:MI:SS') as CreatedDate
      FROM VisitorMaster
      WHERE ${whereClause}
      ORDER BY CreatedDate DESC
    `;

    const result = await query(sql, params);
    return result.rows;
  }

  // ===== EXISTING PURPOSE METHODS (keeping as they are) =====

  // Get gate pass purposes
  static async getGatePassPurposes(tenantId) {
    const sql = `
      SELECT 
        VisitPurposeID as "purposeId",
        VisitPurpose as "purposeName",
        PurposeCatID as "purposeCatId",
        PurposeCatName as "purposeCatName",
        ImageFlag as "imageFlag",
        ImagePath as "imagePath",
        ImageName as "imageName",
        ImageUrl as "imageUrl"
      FROM VisitorPuposeMaster
      WHERE TenantID = $1 
        AND IsActive = 'Y' 
        AND PurposeCatID = 6
      ORDER BY VisitPurpose ASC
    `;

    const result = await query(sql, [tenantId]);
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

  // Add new purpose for gate pass
  static async addGatePassPurpose(purposeData) {
        const { tenantId, purposeName, createdBy, imageData } = purposeData;
    const sql = `
      INSERT INTO VisitorPuposeMaster (
        TenantID, 
        PurposeCatID, 
        PurposeCatName, 
        VisitPurpose, 
        IsActive,
        CreatedBy,
        CreatedDate,
        ImageFlag,
        ImagePath,
        ImageName,
        ImageUrl
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10)
      RETURNING 
        VisitPurposeID as "purposeId",
        VisitPurpose as "purposeName",
        PurposeCatID as "purposeCatId",
        PurposeCatName as "purposeCatName",
        ImageFlag as "imageFlag",
        ImagePath as "imagePath",
        ImageName as "imageName",
        ImageUrl as "imageUrl"
    `;

    const result = await query(sql, [
      tenantId,
      6, // Gate Pass category ID
      'Gate Pass',
      purposeName,
      'Y',
      createdBy,
      imageData ? imageData.flag : 'N',
      imageData ? imageData.path : null,
      imageData ? imageData.name : null,
      imageData ? imageData.url : null
    ]);
    return result.rows[0];
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

  // Check purpose exists and status
  static async checkPurposeStatus(purposeId, tenantId) {
    const sql = `
      SELECT VisitPurposeID, IsActive, VisitPurpose
      FROM VisitorPuposeMaster 
      WHERE VisitPurposeID = $1 
        AND TenantID = $2 
        AND PurposeCatID = 6
    `;
    
    const result = await query(sql, [purposeId, tenantId]);
    return result.rows[0];
  }

  // Delete purpose (soft delete) - FIXED VERSION
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

  // ===== KEEPING EXISTING HELPER METHODS =====

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
}

module.exports = GatePassModel;