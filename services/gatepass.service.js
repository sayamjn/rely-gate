const ResponseFormatter = require("../utils/response");
const GatePassModel = require("../models/gatepass.model");
const DateFormatter = require("../utils/dateFormatter");
const responseUtils = require("../utils/constants");
const SMSUtil = require("../utils/sms");
const MessagingService = require("./messaging.service");

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

        // Only send SMS if status is 2 (Approved)
        let smsResult = { success: false, message: 'SMS not sent - awaiting approval' };
        
        if (statusId === 2) {
          // Approved - send approval SMS with security code
          smsResult = await this.sendApprovalSMS(mobile, fname, securityCode, tenantId);
        }
        // For status 1 (Pending) - NO SMS sent, user will get SMS after admin approval

        let responseMessage;
        if (statusId === 2) {
          responseMessage = `Your gate pass has been approved! Your security code is ${securityCode}. Please present this code to the security at the gate.`;
        } else {
          responseMessage = "Gate pass request submitted successfully. You will receive your security code once approved by the administrator.";
        }

        return ResponseFormatter.success(
          {
            visitorId,
            securityCode: statusId === 2 ? securityCode : undefined, // Only show security code if approved
            status: statusName,
            fname,
            mobile,
            visitDate,
            purposeName,
            purposeId,
            visitDateTxt,
            remark,
            smsSent: smsResult.success,
            smsMessage: smsResult.message,
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
        const smsResult = await this.sendApprovalSMS(
          gatepass.mobile,
          gatepass.fname,
          gatepass.securityCode,
          tenantId
        );

        return ResponseFormatter.success(
          {
            visitorId: result.visitorid || result.VisitorID,
            status: "Approved",
            securityCode: gatepass.securityCode,
            fname: gatepass.fname,
            mobile: gatepass.mobile,
            currentState: "APPROVED_READY_FOR_CHECKIN",
            smsSent: smsResult.success,
            smsMessage: smsResult.message,
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
      // Validate tenantId
      if (!tenantId) {
        return ResponseFormatter.error("Tenant ID is required");
      }
      
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

  static async sendApprovalSMS(mobile, name, securityCode, tenantId = 1) {
    try {
      console.log(`Sending Gate Pass SMS to ${mobile} with security code: ${securityCode}`);
      
      // Get tenant name for template
      const { query } = require("../config/database");
      let tenantName = "RelyGate";
      
      try {
        const tenantSql = `SELECT TenantName FROM Tenant WHERE TenantID = $1`;
        const tenantResult = await query(tenantSql, [tenantId]);
        if (tenantResult.rows[0]) {
          tenantName = tenantResult.rows[0].tenantname;
        }
      } catch (error) {
        console.error("Error fetching tenant name:", error);
      }
      
      // Use direct SMS utility with proper template
      const message = `Your Security Code for ${tenantName} : ${securityCode}`;
      console.log(`SMS Message: ${message}`);
      
      const smsResult = await SMSUtil.sendSMS(mobile, message);
      
      console.log(`SMS API Response:`, smsResult);
      
      if (smsResult.success) {
        console.log(`Gate Pass approval SMS sent successfully to ${mobile}`);
        return { success: true, message: 'SMS sent successfully' };
      } else {
        console.error(`Failed to send Gate Pass approval SMS to ${mobile}:`, smsResult.message);
        return { success: false, message: 'Failed to send SMS' };
      }
      
    } catch (error) {
      console.error("Error sending approval SMS:", error);
      return { success: false, message: error.message };
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
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 9002}`;
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

  // OTP sending for gatepass
  static async sendOTP(mobile, tenantId) {
    try {
      if (!mobile || mobile.length !== 10 || !/^\d+$/.test(mobile)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid mobile number",
        };
      }

      const otpResult = await MessagingService.generateAndSendOTP(
        tenantId,
        mobile,
      );

      // Send actual SMS with OTP
      const smsResult = await SMSUtil.sendOTPSMS(mobile, otpResult.otpNumber);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.OTP_SENT,
        refId: otpResult.refId,
        smsSent: smsResult.success,
        smsMessage: smsResult.message,
        otp:
          process.env.NODE_ENV === "development"
            ? otpResult.otpNumber
            : undefined,
      };
    } catch (error) {
      console.error("Error sending OTP for gatepass:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // OTP verification for gatepass
  static async verifyOTP(refId, otpNumber, mobile, tenantId) {
    try {
      const result = await MessagingService.verifyOTP(
        refId,
        otpNumber,
        mobile
      );

      if (result.verified) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: "OTP verified successfully",
          data: {
            verified: true,
            tenantId: result.tenantId,
            mobile: result.mobile,
          },
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid OTP or OTP expired",
        };
      }
    } catch (error) {
      console.error("Error verifying OTP for gatepass:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get all tenants
  static async getTenants() {
    try {
      const tenants = await GatePassModel.getTenants();
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Tenants retrieved successfully",
        data: tenants,
        count: tenants.length,
      };
    } catch (error) {
      console.error("Error getting tenants for gatepass:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }
}

module.exports = GatepassService;