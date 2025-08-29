const GatepassService = require("../services/gatepass.service");
const StaffService = require("../services/staff.service");
const MessagingService = require("../services/messaging.service");
const responseUtils = require("../utils/constants");
const visitorService = require("../services/visitor.service");
const VisitorService = require("../services/visitor.service");
class GatepassController {
  // POST /api/gatepass - Create new gatepass
  static async createGatepass(req, res) {
    try {
      const {
        fname,
        mobile,
        visitDate,
        purposeId,
        purposeName,
        tenantId,
        statusId = 1,
        remark = "",
      } = req.body;

      const createdBy = (req.user ? req.user.username : null) || "System";

      // Purpose validation and lookup logic
      let finalPurposeName;
      const parsedPurposeId = parseInt(purposeId);

      if (parsedPurposeId === -1) {
        // Custom purpose - use provided purposeName
        if (!purposeName || purposeName.trim() === "") {
          return res.status(400).json({
            responseCode: responseUtils.RESPONSE_CODES.ERROR,
            responseMessage: "Purpose name is required for custom purpose",
          });
        }
        finalPurposeName = purposeName.trim();
      } else {
        // Fetch purpose from database - ONLY gate pass purposes (PurposeCatID = 6)
        const purposeResult = await VisitorService.getPurposeById(
          parsedPurposeId,
          tenantId
        );

        if (!purposeResult) {
          return res.status(400).json({
            responseCode: responseUtils.RESPONSE_CODES.ERROR,
            responseMessage:
              "Invalid purpose ID or purpose not available for gate pass",
          });
        }

        finalPurposeName = purposeResult.purposeName;
      }

      const gatepassData = {
        fname: fname.trim(),
        mobile: mobile.trim(),
        visitDate,
        purposeId: parsedPurposeId,
        purposeName: finalPurposeName,
        statusId: parseInt(statusId),
        tenantId: tenantId,
        remark: remark.trim(),
        createdBy,
      };

      const result = await GatepassService.createGatepass(gatepassData);
      res.json(result);
    } catch (error) {
      console.error("Error in createGatepass:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/gatepass - List gatepasses (simple)
  static async listGatepasses(req, res) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        search = "", 
        statusId = null,
        purposeId = null,
        StartDate = null,
        EndDate = null,
      } = req.query;

      const userTenantId = req.user.tenantId;

      // Convert DD/MM/YYYY format to ISO format for database query
      let fromDate = null;
      let toDate = null;
      
      if (StartDate) {
        try {
          const [day, month, year] = StartDate.split('/');
          if (day && month && year) {
            fromDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        } catch (error) {
          console.warn('Invalid StartDate format:', StartDate);
        }
      }
      
      if (EndDate) {
        try {
          const [day, month, year] = EndDate.split('/');
          if (day && month && year) {
            toDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        } catch (error) {
          console.warn('Invalid EndDate format:', EndDate);
        }
      }

      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search: search.trim(),
        statusId: statusId ? parseInt(statusId) : null,
        purposeId: purposeId ? parseInt(purposeId) : null,
        fromDate,
        toDate,
      };

      const result = await GatepassService.getGatepassesWithFilters(
        userTenantId,
        filters
      );
      res.json(result);
    } catch (error) {
      console.error("Error in listGatepasses:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/gatepass/list - List gatepasses with advanced filtering
  static async listGatepassesAdvanced(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = "",
        purposeId = null,
        statusId = null,
        fromDate = null,
        toDate = null,
      } = req.body;

      const userTenantId =  req.user.tenantId;

      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search: search.trim(),
        purposeId: purposeId ? parseInt(purposeId) : null,
        statusId: statusId ? parseInt(statusId) : null,
        fromDate,
        toDate,
      };

      const result = await GatepassService.getGatepassesWithFilters(
        userTenantId,
        filters
      );
      res.json(result);
    } catch (error) {
      console.error("Error in listGatepassesAdvanced:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // PUT /api/gatepass/:visitorId/approve - Approve gatepass (NO auto check-in)
  static async approveGatepass(req, res) {
    try {
      const { visitorId } = req.params;
      const userTenantId = req.user.tenantId;
      const updatedBy = (req.user ? req.user.username : null) || "System";

      if (!visitorId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visitor ID is required",
        });
      }

      const result = await GatepassService.approveGatepass(
        parseInt(visitorId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error("Error in approveGatepass:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/gatepass/:visitorId/checkin - Check-in gatepass (sets INTime)
  static async checkinGatepass(req, res) {
    try {
      const { visitorId } = req.params;
      const userTenantId = req.user?.tenantId
      const updatedBy = (req.user ? req.user.username : null) || "System";

      if (!visitorId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visitor ID is required",
        });
      }

      const result = await GatepassService.checkinGatepass(
        parseInt(visitorId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error("Error in checkinGatepass:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/gatepass/:visitorId/checkout - Check-out gatepass (sets OutTime)
  static async checkoutGatepass(req, res) {
    try {
      const { visitorId } = req.params;
      const userTenantId = req.user?.tenantId;
      const updatedBy = (req.user ? req.user.username : null) || "System";

      if (!visitorId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visitor ID is required",
        });
      }

      const result = await GatepassService.checkoutGatepass(
        parseInt(visitorId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error("Error in checkoutGatepass:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/gatepass/:visitorId/status - Get gatepass current status
  static async getGatepassStatus(req, res) {
    try {
      const { visitorId } = req.params;
      const userTenantId = req.user.tenantId;



      if (!visitorId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visitor ID is required",
        });
      }

      const result = await GatepassService.getGatepassStatus(
        parseInt(visitorId),
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getGatepassStatus:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/gatepass/pending-checkin - Get gatepasses ready for check-in
  static async getPendingCheckin(req, res) {
    try {
      const userTenantId = req.user?.tenantId;



      const result = await GatepassService.getPendingCheckin(userTenantId);
      res.json(result);
    } catch (error) {
      console.error("Error in getPendingCheckin:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/gatepass/pending-checkout - Get gatepasses that need check-out
  static async getPendingCheckout(req, res) {
    try {
      
      const userTenantId = req.user?.tenantId;



      const result = await GatepassService.getPendingCheckout(userTenantId);
      res.json(result);
    } catch (error) {
      console.error("Error in getPendingCheckout:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/gatepass/purposes/:tenantId - Get available purposes
  static async getGatepassPurposes(req, res) {
    try {
      // Get tenantId from path parameters
      const pathTenantId = req.params.tenantId ? parseInt(req.params.tenantId) : null;
      console.log("pathTenantId: ", req.params.tenantId)
      // Get tenantId from user object in request as fallback
      const userTenantId = req.user?.tenantId;
      
      // Use path param tenantId if provided, otherwise use the user's tenantId
      const tenantId = pathTenantId || userTenantId;
    
      const result = await visitorService.getVisitorPurposes(tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error in getGatepassPurposes:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/gatepass/export - Export gatepasses to CSV
  static async exportGatepasses(req, res) {
    try {
      const {
        purposeId = null,
        statusId = null,
        fromDate = null,
        toDate = null,
      } = req.query;

      const userTenantId = req.user?.tenantId;

      if (!userTenantId) {
        return res.status(401).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Authentication required. Please login again.",
        });
      }

      const filters = {
        purposeId: purposeId ? parseInt(purposeId) : null,
        statusId: statusId ? parseInt(statusId) : null,
        fromDate,
        toDate,
      };

      const result = await GatepassService.exportGatepasses(
        userTenantId,
        filters
      );

      if (result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS) {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="gatepasses_${
            new Date().toISOString().split("T")[0]
          }.csv"`
        );
        res.send(result.csvData);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in exportGatepasses:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/gatepass/template - Download CSV template
  static async downloadTemplate(req, res) {
    try {
      const template =
        'Name,Mobile,Visit_Date,Purpose_ID,Purpose_Name,Status_ID,Remark\n"John Doe","9876543210","2024-06-26T10:00:00.000Z","1","Meeting","1","Sample gatepass"';

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="gatepass_template.csv"'
      );
      res.send(template);
    } catch (error) {
      console.error("Error in downloadTemplate:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }


  // POST /api/gatepass/purposes - Add new purpose
  static async addGatePassPurpose(req, res) {
    try {
      const { purposeName, tenantId: bodyTenantId } = req.body;
      
      // Check for tenantId in body, query params, or user object (in that order of precedence)
      const queryTenantId = req.query.tenantId ? parseInt(req.query.tenantId) : null;
      const userTenantId = req.user?.tenantId;
      
      // Use tenantId from body if provided, then query param, then user's tenantId
      const tenantId = bodyTenantId ? parseInt(bodyTenantId) : (queryTenantId || userTenantId);
      const createdBy = (req.user ? req.user.username : null) || "System";

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Tenant ID is required. Please provide it in the request body, as a query parameter, or login.",
        });
      }

      const purposeData = {
        tenantId: tenantId,
        purposeName: purposeName.trim(),
        createdBy,
        imageFile: req.file || null
      };

      const result = await GatepassService.addGatePassPurpose(purposeData);

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in addGatePassPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }
  // PUT /api/gatepass/purposes/:purposeId - Update purpose
  static async updateGatePassPurpose(req, res) {
    try {
      const { purposeId } = req.params;
      const { purposeName, tenantId: bodyTenantId } = req.body;
      
      // Check for tenantId in body, query params, or user object (in that order of precedence)
      const queryTenantId = req.query.tenantId ? parseInt(req.query.tenantId) : null;
      const userTenantId = req.user?.tenantId;
      
      // Use tenantId from body if provided, then query param, then user's tenantId
      const tenantId = bodyTenantId ? parseInt(bodyTenantId) : (queryTenantId || userTenantId);
      const updatedBy = (req.user ? req.user.username : null) || "System";

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Tenant ID is required. Please provide it in the request body, as a query parameter, or login.",
        });
      }

      const result = await GatepassService.updateGatePassPurpose(
        parseInt(purposeId),
        tenantId,
        purposeName.trim(),
        updatedBy
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in updateGatePassPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // DELETE /api/gatepass/purposes/:purposeId - Delete purpose
  static async deleteGatePassPurpose(req, res) {
    try {
      const { purposeId } = req.params;
      
      // Check for tenantId in body, query params, or user object (in that order of precedence)
      const bodyTenantId = req.body.tenantId ? parseInt(req.body.tenantId) : null;
      const queryTenantId = req.query.tenantId ? parseInt(req.query.tenantId) : null;
      const userTenantId = req.user?.tenantId;
      
      // Use tenantId from body if provided, then query param, then user's tenantId
      const tenantId = bodyTenantId ? parseInt(bodyTenantId) : (queryTenantId || userTenantId);
      const updatedBy = (req.user ? req.user.username : null) || "System";

      if (!purposeId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose ID is required",
        });
      }

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Tenant ID is required. Please provide it in the request body, as a query parameter, or login.",
        });
      }

      const result = await GatepassService.deleteGatePassPurpose(
        parseInt(purposeId),
        tenantId,
        updatedBy
      );
      
      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in deleteGatePassPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/gatepass/send-otp - Send OTP for gatepass registration
  static async sendOTP(req, res) {
    try {
      const { mobile, tenantId } = req.body;
      const appUser = req.user ? req.user.username : "System";

      if (!mobile) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Mobile number is required",
        });
      }


      const result = await GatepassService.sendOTP(
        mobile,
        tenantId
            );

      res.json(result);
    } catch (error) {
      console.error("Error in sendOTP:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/gatepass/verify-otp - Verify OTP for gatepass
  static async verifyOTP(req, res) {
    try {
      const { refId, otpNumber, mobile, tenantId } = req.body;

      if (!refId || !otpNumber || !mobile) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "RefId, OTP number, and mobile are required",
        });
      }

      const result = await GatepassService.verifyOTP(
        refId,
        otpNumber,
        mobile,
        tenantId
      );

      res.json(result);
    } catch (error) {
      console.error("Error in verifyOTP:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/gatepass/tenants - Get all tenants
  static async getTenants(req, res) {
    try {
      const result = await GatepassService.getTenants();
      res.json(result);
    } catch (error) {
      console.error("Error in getTenants:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }
}

module.exports = GatepassController;
