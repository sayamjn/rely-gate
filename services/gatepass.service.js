const { query } = require("../config/database");
const ResponseFormatter = require("../utils/response");
const responseUtils = require("../utils/constants");
const MessagingService = require("./messaging.service");
const GatePassModel = require("../models/gatepass.model");

class GatepassService {
  // Generate random 6-digit security code
  static generateSecurityCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 1. CREATE GATEPASS - StatusID=1 (Pending), NO INTime set
  static async createGatepass(gatepassData) {
    try {
      const {
        fname,
        mobile,
        visitDate,
        purposeId,
        purposeName,
        statusId,
        tenantId,
        remark,
        createdBy,
      } = gatepassData;

      const securityCode = this.generateSecurityCode();
      const statusName = statusId === 2 ? "Approved" : "Pending";
      const visitDateTxt = new Date(visitDate).toLocaleDateString("en-US");

      // Insert into VisitorMaster with VisitorCatID = 6 (Gate Pass)
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

      if (result.rows.length > 0) {
        const visitorId = result.rows[0].visitorid || result.rows[0].VisitorID;

        // Send SMS if status is approved (statusId = 2)
        if (statusId === 2) {
          await this.sendApprovalSMS(mobile, fname, securityCode);
        }

        return ResponseFormatter.success(
          {
            visitorId,
            securityCode,
            status: statusName,
            fname,
            mobile,
            visitDate,
            purposeName,
            purposeId,
            visitDateTxt,
            remark,
          },
          "Gate pass created successfully"
        );
      } else {
        return ResponseFormatter.error("Failed to create gate pass");
      }
    } catch (error) {
      console.error("Error in createGatepass:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // 2. GET GATEPASSES WITH FILTERS
  static async getGatepassesWithFilters(tenantId, filters) {
    try {
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
          VisitDateTxt as "visitDateTxt",
          VisitPurposeID as "purposeId",
          VisitPurpose as "purposeName",
          StatusID as "statusId",
          StatusName as "statusName",
          Remark as "securityCode",
          INTime as "inTime",
          OutTime as "outTime",
          INTimeTxt as "inTimeTxt",
          OutTimeTxt as "outTimeTxt",
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

      return ResponseFormatter.success({
        gatepasses: dataResult.rows,
        pagination: {
          currentPage: page,
          pageSize,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters,
      });
    } catch (error) {
      console.error("Error in getGatepassesWithFilters:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // 3. APPROVE GATEPASS - CRITICAL: Only changes status, NO INTime set!
  static async approveGatepass(visitorId, tenantId, updatedBy) {
    try {
      // First check if gatepass exists and is pending
      const checkSql = `
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

      const checkResult = await query(checkSql, [visitorId, tenantId]);

      if (checkResult.rows.length === 0) {
        return ResponseFormatter.error("Gate pass not found");
      }

      const gatepass = checkResult.rows[0];

      if (gatepass.statusId !== 1) {
        return ResponseFormatter.error(
          "Only pending gate passes can be approved"
        );
      }

      // CRITICAL: Only update status, do NOT touch INTime or OutTime
      const approveSql = `
        UPDATE VisitorMaster 
        SET StatusID = 2, 
            StatusName = 'Approved',
            UpdatedDate = NOW(),
            UpdatedBy = $3
        WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6
        RETURNING VisitorID
      `;

      const result = await query(approveSql, [visitorId, tenantId, updatedBy]);

      if (result.rows.length > 0) {
        // Send approval SMS
        await this.sendApprovalSMS(
          gatepass.mobile,
          gatepass.fname,
          gatepass.securityCode
        );

        return ResponseFormatter.success(
          {
            visitorId: result.rows[0].visitorid || result.rows[0].VisitorID,
            status: "Approved",
            securityCode: gatepass.securityCode,
            fname: gatepass.fname,
            mobile: gatepass.mobile,
            currentState: "APPROVED_READY_FOR_CHECKIN",
          },
          "Gate pass approved successfully"
        );
      } else {
        return ResponseFormatter.error("Failed to approve gate pass");
      }
    } catch (error) {
      console.error("Error in approveGatepass:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // 4. CHECK-IN GATEPASS - Sets INTime
  static async checkinGatepass(visitorId, tenantId, updatedBy) {
    try {
      // Check current state
      const checkSql = `
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

      const checkResult = await query(checkSql, [visitorId, tenantId]);

      if (checkResult.rows.length === 0) {
        return ResponseFormatter.error("Gate pass not found");
      }

      const gatepass = checkResult.rows[0];

      // Validation: Must be approved first
      if (gatepass.statusId !== 2) {
        return ResponseFormatter.error(
          "Gate pass must be approved before check-in"
        );
      }

      // Validation: Cannot check-in if already checked in
      if (gatepass.inTime && !gatepass.outTime) {
        return ResponseFormatter.error("Gate pass is already checked in");
      }

      // Perform check-in: Set INTime and clear OutTime (for re-entry cases)
      const checkinSql = `
        UPDATE VisitorMaster 
        SET INTime = NOW(), 
            INTimeTxt = TO_CHAR(NOW(), 'HH12:MI AM'),
            OutTime = NULL,
            OutTimeTxt = NULL,
            UpdatedDate = NOW(),
            UpdatedBy = $3
        WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6
        RETURNING VisitorID
      `;

      const result = await query(checkinSql, [visitorId, tenantId, updatedBy]);

      if (result.rows.length > 0) {
        return ResponseFormatter.success(
          {
            visitorId: result.rows[0].visitorid || result.rows[0].VisitorID,
            visitorName: gatepass.fname,
            mobile: gatepass.mobile,
            checkInTime: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            status: "Checked In",
            currentState: "CHECKED_IN",
          },
          "Check-in successful"
        );
      } else {
        return ResponseFormatter.error("Failed to check-in");
      }
    } catch (error) {
      console.error("Error in checkinGatepass:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // 4. CHECK-OUT GATEPASS - Sets OUTTime

  // ===============================================

  static async checkoutGatepass(visitorId, tenantId, updatedBy) {
    try {
      // Check current state
      const checkSql = `
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

      const checkResult = await query(checkSql, [visitorId, tenantId]);

      if (checkResult.rows.length === 0) {
        return ResponseFormatter.error("Gate pass not found");
      }

      const gatepass = checkResult.rows[0];

      // Validation: Must be approved
      if (gatepass.statusId !== 2) {
        return ResponseFormatter.error("Gate pass must be approved");
      }

      // Validation: Must be checked in first (NO direct checkout!)
      if (!gatepass.inTime) {
        return ResponseFormatter.error(
          "Gate pass must be checked in before check-out"
        );
      }

      // Validation: Cannot check-out if already checked out
      if (gatepass.outTime) {
        return ResponseFormatter.error("Gate pass is already checked out");
      }

      // Perform check-out: ONLY set OutTime (no auto check-in)
      const checkoutSql = `
      UPDATE VisitorMaster 
      SET OutTime = NOW(), 
          OutTimeTxt = TO_CHAR(NOW(), 'HH12:MI AM'),
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE VisitorID = $1 AND TenantID = $2 AND VisitorCatID = 6
        AND INTime IS NOT NULL 
        AND OutTime IS NULL
      RETURNING VisitorID
    `;

      const result = await query(checkoutSql, [visitorId, tenantId, updatedBy]);

      if (result.rows.length > 0) {
        return ResponseFormatter.success(
          {
            visitorId: result.rows[0].visitorid || result.rows[0].VisitorID,
            visitorName: gatepass.fname,
            mobile: gatepass.mobile,
            checkOutTime: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            status: "Checked Out",
            currentState: "CHECKED_OUT",
          },
          "Check-out successful"
        );
      } else {
        return ResponseFormatter.error("Failed to check-out");
      }
    } catch (error) {
      console.error("Error in checkoutGatepass:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // 6. GET GATEPASS STATUS
  static async getGatepassStatus(visitorId, tenantId) {
    try {
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

      if (result.rows.length > 0) {
        return ResponseFormatter.success(
          result.rows[0],
          "Gate pass status retrieved"
        );
      } else {
        return ResponseFormatter.error("Gate pass not found");
      }
    } catch (error) {
      console.error("Error in getGatepassStatus:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // 7. GET PENDING CHECK-IN - Approved gatepasses ready for check-in OR re-entry
  static async getPendingCheckin(tenantId) {
    try {
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

      return ResponseFormatter.success({
        pendingCheckin: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error("Error in getPendingCheckin:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // 8. GET PENDING CHECK-OUT - Gatepasses currently checked in
  static async getPendingCheckout(tenantId) {
    try {
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

      return ResponseFormatter.success({
        pendingCheckout: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error("Error in getPendingCheckout:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // 9. GET GATEPASS PURPOSES
  static async getGatepassPurposes(tenantId) {
    try {
      const purposes = await GatePassModel.getGatePassPurposes(tenantId);

      return ResponseFormatter.success(
        purposes,
        "Gate pass purposes retrieved successfully",
        purposes.length
      );
    } catch (error) {
      console.error("Error in getGatepassPurposes service:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // 10. EXPORT GATEPASSES TO CSV
  static async exportGatepasses(tenantId, filters) {
    try {
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

      // Convert to CSV
      const headers = [
        "ID",
        "Name",
        "Mobile",
        "Visit Date",
        "Purpose",
        "Status",
        "Security Code",
        "Check-in Time",
        "Check-out Time",
        "Created Date",
      ];
      const csvRows = [headers.join(",")];

      result.rows.forEach((row) => {
        const values = [
          row.visitorid || row.VisitorID,
          `"${row.fname}"`,
          row.mobile,
          `"${row.visitdatetxt}"`,
          `"${row.visitpurpose}"`,
          `"${row.statusname}"`,
          row.securitycode || "",
          row.intimeTxt || "",
          row.outtimetxt || "",
          row.createddate,
        ];
        csvRows.push(values.join(","));
      });

      const csvData = csvRows.join("\n");

      return ResponseFormatter.success({ csvData });
    } catch (error) {
      console.error("Error in exportGatepasses:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  static async sendApprovalSMS(mobile, name, securityCode) {
    try {
      const message = `Hello ${name}, your Gate Pass has been approved. Security Code: ${securityCode}. Please show this code at the gate. - Rely Gate`;

      const tenantId = 1; // TODO: Replace with actual tenantId

      try {
        await MessagingService.sendGenericSMS(tenantId, mobile, message);
        console.log(`SMS sent to ${mobile}: ${message}`);
      } catch (smsError) {
        console.log(
          `SMS Service (DISABLED) - To: ${mobile}, Message: ${message}`
        );
      }
    } catch (error) {
      console.error("Error sending approval SMS:", error);
    }
  }

  static async getPurposeById(purposeId, tenantId) {
    try {
      return await GatePassModel.getPurposeById(purposeId, tenantId);
    } catch (error) {
      console.error("Error in getPurposeById:", error);
      throw error;
    }
  }

  // Add new purpose
  static async addGatePassPurpose(purposeData) {
    try {
      const { tenantId, purposeName, createdBy } = purposeData;

      if (!purposeName || purposeName.trim() === "") {
        return ResponseFormatter.error("Purpose name is required");
      }

      if (purposeName.length > 250) {
        return ResponseFormatter.error(
          "Purpose name too long (max 250 characters)"
        );
      }

      const exists = await GatePassModel.checkPurposeExists(
        tenantId,
        purposeName.trim()
      );
      if (exists) {
        return ResponseFormatter.error(
          "Purpose already exists for this tenant"
        );
      }

      const newPurpose = await GatePassModel.addGatePassPurpose({
        tenantId,
        purposeName: purposeName.trim(),
        createdBy,
      });

      return ResponseFormatter.success(
        newPurpose,
        "Purpose added successfully"
      );
    } catch (error) {
      console.error("Error in addGatePassPurpose service:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // Update purpose
  static async updateGatePassPurpose(
    purposeId,
    tenantId,
    purposeName,
    updatedBy
  ) {
    try {
      if (!purposeName || purposeName.trim() === "") {
        return ResponseFormatter.error("Purpose name is required");
      }

      if (purposeName.length > 250) {
        return ResponseFormatter.error(
          "Purpose name too long (max 250 characters)"
        );
      }

      const exists = await GatePassModel.checkPurposeExists(
        tenantId,
        purposeName.trim()
      );
      if (exists) {
        return ResponseFormatter.error("Purpose name already exists");
      }

      const updatedPurpose = await GatePassModel.updateGatePassPurpose(
        purposeId,
        tenantId,
        purposeName.trim(),
        updatedBy
      );

      if (!updatedPurpose) {
        return ResponseFormatter.error("Purpose not found or access denied");
      }

      return ResponseFormatter.success(
        updatedPurpose,
        "Purpose updated successfully"
      );
    } catch (error) {
      console.error("Error in updateGatePassPurpose service:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // Delete purpose
  static async deleteGatePassPurpose(purposeId, tenantId, updatedBy) {
    try {
      const deletedPurpose = await GatePassModel.deleteGatePassPurpose(
        purposeId,
        tenantId,
        updatedBy
      );

      if (!deletedPurpose) {
        return ResponseFormatter.error("Purpose not found or access denied");
      }

      return ResponseFormatter.success(
        { purposeId: deletedPurpose.purposeId },
        "Purpose deleted successfully"
      );
    } catch (error) {
      console.error("Error in deleteGatePassPurpose service:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }
}

module.exports = GatepassService;
