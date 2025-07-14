const ResponseFormatter = require("../utils/response");
const MessagingService = require("./messaging.service");
const GatePassModel = require("../models/gatepass.model");
const DateFormatter = require("../utils/dateFormatter");
const responseUtils = require("../utils/constants");

class GatepassService {
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
      const visitDateTxt = DateFormatter.formatDate(visitDate);

      const result = await GatePassModel.createGatePass({
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
      });

      if (result) {
        const visitorId = result.visitorid || result.VisitorID;

        if (statusId === 2) {
          await this.sendApprovalSMS(mobile, fname, securityCode);
        }

        let responseMessage;
        if (statusId === 2) {
          responseMessage = `Your gate pass has been approved! Your security code is ${securityCode}. Please present this code to the security at the gate.`;
        } else {
          responseMessage = "Gate pass request submitted successfully. You will receive your security code once approved by the administrator.";
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
          responseMessage
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
      const { page = 1, pageSize = 20 } = filters;

      const result = await GatePassModel.getGatePassesWithFilters(tenantId, filters);

      return ResponseFormatter.success({
        gatepasses: result.data,
        pagination: {
          currentPage: page,
          pageSize,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
          hasNext: page < result.totalPages,
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
      const gatepass = await GatePassModel.checkGatePassForApproval(visitorId, tenantId);

      if (!gatepass) {
        return ResponseFormatter.error("Gate pass not found");
      }

      if (gatepass.statusId !== 1) {
        return ResponseFormatter.error(
          "Only pending gate passes can be approved"
        );
      }

      const result = await GatePassModel.approveGatePass(visitorId, tenantId, updatedBy);

      if (result) {
        await this.sendApprovalSMS(
          gatepass.mobile,
          gatepass.fname,
          gatepass.securityCode
        );

        return ResponseFormatter.success(
          {
            visitorId: result.visitorid || result.VisitorID,
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
      const gatepass = await GatePassModel.checkGatePassForCheckin(visitorId, tenantId);

      if (!gatepass) {
        return ResponseFormatter.error("Gate pass not found");
      }

      if (gatepass.statusId !== 2) {
        return ResponseFormatter.error(
          "Gate pass must be approved before check-in"
        );
      }

      if (gatepass.inTime && !gatepass.outTime) {
        return ResponseFormatter.error("Gate pass is already checked in");
      }

      const result = await GatePassModel.checkinGatePass(visitorId, tenantId, updatedBy);

      if (result) {
        return ResponseFormatter.success(
          {
            visitorId: result.visitorid || result.VisitorID,
            visitorName: gatepass.fname,
            mobile: gatepass.mobile,
            checkInTime: DateFormatter.formatDateTime(new Date()),
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

  // 5. CHECK-OUT GATEPASS - Sets OUTTime
  static async checkoutGatepass(visitorId, tenantId, updatedBy) {
    try {
      const gatepass = await GatePassModel.checkGatePassForCheckout(visitorId, tenantId);

      if (!gatepass) {
        return ResponseFormatter.error("Gate pass not found");
      }

      // Validation: Must be approved
      if (gatepass.statusId !== 2) {
        return ResponseFormatter.error("Gate pass must be approved");
      }

      if (!gatepass.inTime) {
        return ResponseFormatter.error(
          "Gate pass must be checked in before check-out"
        );
      }

      if (gatepass.outTime) {
        return ResponseFormatter.error("Gate pass is already checked out");
      }

      const result = await GatePassModel.checkoutGatePass(visitorId, tenantId, updatedBy);

      if (result) {
        return ResponseFormatter.success(
          {
            visitorId: result.visitorid || result.VisitorID,
            visitorName: gatepass.fname,
            mobile: gatepass.mobile,
            checkOutTime: DateFormatter.formatDateTime(new Date()),
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
      const result = await GatePassModel.getGatePassStatus(visitorId, tenantId);

      if (result) {
        return ResponseFormatter.success(
          result,
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
      const result = await GatePassModel.getPendingCheckins(tenantId);

      return ResponseFormatter.success({
        pendingCheckin: result,
        count: result.length,
      });
    } catch (error) {
      console.error("Error in getPendingCheckin:", error);
      return ResponseFormatter.error("Internal server error");
    }
  }

  // 8. GET PENDING CHECK-OUT - Gatepasses currently checked in
  static async getPendingCheckout(tenantId) {
    try {
      const result = await GatePassModel.getPendingCheckouts(tenantId);

      return ResponseFormatter.success({
        pendingCheckout: result,
        count: result.length,
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
      const result = await GatePassModel.exportGatePasses(tenantId, filters);

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

      result.forEach((row) => {
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
      const { tenantId, purposeName, createdBy, imageFile } = purposeData;

      if (!purposeName || purposeName.trim() === "") {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose name is required"
        };
      }

      if (purposeName.length > 250) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose name too long (max 250 characters)"
        };
      }

      const exists = await GatePassModel.checkPurposeExists(
        tenantId,
        purposeName.trim()
      );
      if (exists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose already exists for this tenant"
        };
      }

      // Handle image upload if provided
      let imageData = null;
      if (imageFile) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        imageData = {
          flag: 'Y',
          path: `purposes/${imageFile.filename}`,
          name: imageFile.filename,
          url: `/uploads/purposes/${imageFile.filename}`
        };
      }

      const newPurpose = await GatePassModel.addGatePassPurpose({
        tenantId,
        purposeName: purposeName.trim(),
        createdBy,
        imageData
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Purpose added successfully",
        data: newPurpose
      };
    } catch (error) {
      console.error("Error in addBusPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
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
      const purpose = await GatePassModel.checkPurposeStatus(purposeId, tenantId);

      if (!purpose) {
        return ResponseFormatter.error("Purpose not found or access denied");
      }

      if (purpose.isactive === "N" || purpose.IsActive === "N") {
        return ResponseFormatter.error("Purpose is already deleted");
      }

      const deletedPurpose = await GatePassModel.deleteGatePassPurpose(
        purposeId,
        tenantId,
        updatedBy
      );

      if (!deletedPurpose) {
        return ResponseFormatter.error("Failed to delete purpose");
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