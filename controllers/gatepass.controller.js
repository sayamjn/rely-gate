const GatepassService = require("../services/gatepass.service");
const StaffService = require("../services/staff.service");
const responseUtils = require("../utils/constants");

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
        statusId = 1,
        tenantId,
        remark = "",
      } = req.body;
      console.log("purposeName : ", purposeName)
      const finalTenantId = tenantId || (req.user ? req.user.tenantId : null);
      const createdBy = (req.user ? req.user.username : null) || "System";


      if (!finalTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required in request body",
        });
      }

      const gatepassData = {
        fname: fname.trim(),
        mobile: mobile.trim(),
        visitDate,
        purposeId: purposeId,
        purposeName: purposeName,
        statusId: parseInt(statusId),
        tenantId: finalTenantId,
        remark: remark.trim(),
        createdBy,
      };

      console.log(gatepassData.purposeName, "gatepassData.purposeName")

      const result = await GatepassService.createGatepass(gatepassData);
      console.log(result, "result in createGatepass")
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
        tenantId 
      } = req.query;

      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

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
            toDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 23:59:59`;
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
        tenantId,
      } = req.body;

      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

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
      const { tenantId } = req.body;
      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);
      const updatedBy = (req.user ? req.user.username : null) || "System";

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

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
      const { tenantId } = req.body;
      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);
      const updatedBy = (req.user ? req.user.username : null) || "System";

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

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
      const { tenantId } = req.body;
      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);
      const updatedBy = (req.user ? req.user.username : null) || "System";

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

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
      const { tenantId } = req.query;
      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

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
      const { tenantId } = req.query;
      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

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
      const { tenantId } = req.query;
      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

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

  // GET /api/gatepass/purposes - Get available purposes
  static async getGatepassPurposes(req, res) {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

      const result = await GatepassService.getGatepassPurposes(tenantId);
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
        tenantId,
      } = req.query;

      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
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
      const { purposeName, tenantId } = req.body;
      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);
      const createdBy = (req.user ? req.user.username : null) || "System";

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

      const purposeData = {
        tenantId: userTenantId,
        purposeName: purposeName.trim(),
        createdBy,
        imageFile: req.file || null
      };

      const result = await GatepassService.addGatePassPurpose(purposeData);

      const statusCode = result.responseCode === "S" ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in addBusPurpose:", error);
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
      const { purposeName, tenantId } = req.body;
      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);
      const updatedBy = (req.user ? req.user.username : null) || "System";

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

      const result = await GatepassService.updateGatePassPurpose(
        parseInt(purposeId),
        userTenantId,
        purposeName.trim(),
        updatedBy
      );

      const statusCode = result.responseCode === "S" ? 200 : 400;
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
      const { tenantId } = req.query;
      const updatedBy = "System";

      if (!purposeId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose ID is required",
        });
      }

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

      const result = await GatepassService.deleteGatePassPurpose(
        parseInt(purposeId),
        parseInt(tenantId),
        updatedBy
      );

      const statusCode = result.responseCode === "S" ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in deleteGatePassPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }
}

module.exports = GatepassController;
