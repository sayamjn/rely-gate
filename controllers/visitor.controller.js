const VisitorModel = require("../models/visitor.model");
const VisitorService = require("../services/visitor.service");
const AnalyticsService = require("../services/analytics.service");
const MessagingService = require("../services/messaging.service");
const FileService = require("../services/file.service");
const responseUtils = require("../utils/constants");

class VisitorController {
  // GET /api/visitors/subcategories
  static async getVisitorSubCategories(req, res) {
    try {
      const { visitorCatId = 0 } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await VisitorService.getVisitorSubCategories(
        userTenantId,
        parseInt(visitorCatId)
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getVisitorSubCategories:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/visitors/send-otp
  static async sendOTP(req, res) {
    try {
      const { mobile, visitorTypeId } = req.body;
      const userTenantId = req.user.tenantId;
      const appUser = req.user.username;

      if (!mobile) {
        return res.status(400).json({
          responseCode: "E",
          responseMessage: "Mobile number is required",
        });
      }

      const result = await VisitorService.sendOTP(
        mobile,
        userTenantId,
        visitorTypeId,
        appUser
      );

      res.json(result);
    } catch (error) {
      console.error("Error in sendOTP:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/visitors/send-unregistered-otp
  static async sendUnregisteredOTP(req, res) {
    try {
      const { mobile } = req.body;
      const userTenantId = req.user.tenantId;
      const appUser = req.user.username;

      if (!mobile) {
        return res.status(400).json({
          responseCode: "E",
          responseMessage: "Mobile number is required",
        });
      }

      const result = await VisitorService.sendUnregisteredOTP(
        mobile,
        userTenantId,
        appUser
      );

      res.json(result);
    } catch (error) {
      console.error("Error in sendUnregisteredOTP:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/visitors/verify-otp
  static async verifyOTP(req, res) {
    try {
      const { refId, otpNumber, mobile } = req.body;

      if (!refId || !otpNumber || !mobile) {
        return res.status(400).json({
          responseCode: "E",
          responseMessage: "RefId, OTP number, and mobile are required",
        });
      }

      const userTenantId = req.user.tenantId;
      const result = await VisitorService.verifyOTP(
        refId,
        otpNumber,
        mobile,
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error("Error in verifyOTP:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/visitors/create-unregistered (Form Data with images)
  static async createUnregisteredVisitor(req, res) {
    try {
      // Use req.body for fields, req.files for images (multer)
      const {
        fname,
        mobile,
        vehicleNo,
        flatName,
        visitorCatId,
        visitorCatName,
        visitPurposeId,
        visitPurpose,
        totalVisitor,
        remark,
      } = req.body;

      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;

      // Images: req.files.photo, req.files.vehiclePhoto
      let photoPath = null;
      let vehiclePhotoPath = null;

      if (req.files) {
        if (req.files.photo && req.files.photo[0]) {
          photoPath = req.files.photo[0].path;
        }
        if (req.files.vehiclePhoto && req.files.vehiclePhoto[0]) {
          vehiclePhotoPath = req.files.vehiclePhoto[0].path;
        }
      }

      // Validate required fields
      if (!fname || !mobile || !flatName || !visitorCatId) {
        return res.status(400).json({
          responseCode: "E",
          responseMessage:
            "Required fields: fname, mobile, flatName, visitorCatId",
        });
      }

      const visitorData = {
        tenantId: userTenantId,
        fname,
        mobile,
        vehicleNo,
        flatName,
        visitorCatId: parseInt(visitorCatId),
        visitorCatName,
        visitPurposeId: visitPurposeId ? parseInt(visitPurposeId) : null,
        visitPurpose,
        totalVisitor: totalVisitor ? parseInt(totalVisitor) : 1,
        photoData: photoPath,
        vehiclePhotoData: vehiclePhotoPath,
        createdBy,
        remark,
      };

      const result = await VisitorService.createUnregisteredVisitor(
        visitorData
      );

      res.json(result);
    } catch (error) {
      console.error("Error in createUnregisteredVisitor:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/visitors/create-registered
  static async createRegisteredVisitor(req, res) {
    try {
      const {
        vistorName,
        mobile,
        email,
        visitorCatId,
        visitorCatName,
        visitorSubCatId,
        visitorSubCatName,
        flatId,
        flatName,
        vehicleNo,
        identityId,
        idName,
        idNumber,
        photoPath,
        vehiclePhotoPath,
        idPhotoPath,
      } = req.body;

      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;

      if (!vistorName || !mobile || !visitorCatId || !visitorSubCatId) {
        return res.status(400).json({
          responseCode: "E",
          responseMessage:
            "Required fields: vistorName, mobile, visitorCatId, visitorSubCatId",
        });
      }

      const visitorData = {
        tenantId: userTenantId,
        vistorName,
        mobile,
        email,
        visitorCatId: parseInt(visitorCatId),
        visitorCatName,
        visitorSubCatId: parseInt(visitorSubCatId),
        visitorSubCatName,
        flatId: flatId ? parseInt(flatId) : null,
        flatName,
        vehicleNo,
        identityId: identityId ? parseInt(identityId) : null,
        idName,
        idNumber,
        photoPath,
        vehiclePhotoPath,
        idPhotoPath,
        createdBy,
      };

      const result = await VisitorService.createRegisteredVisitor(visitorData);

      res.json(result);
    } catch (error) {
      console.error("Error in createRegisteredVisitor:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/registered
  static async getRegisteredVisitors(req, res) {
    try {
      const { visitorCatId = 0, visitorSubCatId = 0 } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await VisitorService.getRegisteredVisitors(
        userTenantId,
        parseInt(visitorCatId),
        parseInt(visitorSubCatId)
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getRegisteredVisitors:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/unregistered - Get unregistered visitors flat-wise list (legacy format)
  static async getUnregisteredVisitorsList(req, res) {
    try {
      const {
        subcatid = 0,
        from = "",
        to = "",
        flatname = "",
        flatid = 0,
        page = 1,
        pageSize = 50,
      } = req.query;

      const userTenantId = req.user.tenantId;

      const filters = {
        subcatid: parseInt(subcatid),
        from,
        to,
        flatname,
        flatid: parseInt(flatid),
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      };

      const result = await VisitorService.getUnregisteredVisitorsList(
        userTenantId,
        filters
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getUnregisteredVisitorsList:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // PUT /api/visitors/:visitorId/checkout
  static async checkoutVisitor(req, res) {
    try {
      const { visitorId } = req.params;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username || "System";

      if (!visitorId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visitor ID is required",
        });
      }

      const result = await VisitorService.checkoutVisitor(
        parseInt(visitorId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error("Error in checkoutVisitor:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/:visitorId/status - Get visitor's current status
  static async getVisitorStatus(req, res) {
    try {
      const { visitorId } = req.params;
      const userTenantId = req.user.tenantId;

      if (!visitorId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visitor ID is required",
        });
      }

      const result = await VisitorService.getVisitorStatus(
        parseInt(visitorId),
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getVisitorStatus:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  static async checkinVisitor(req, res) {
    try {
      const { visitorRegId } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;

      if (!visitorRegId) {
        return res.status(400).json({
          responseCode: "E",
          responseMessage: "Visitor registration ID is required",
        });
      }

      const result = await VisitorService.checkinRegisteredVisitor(
        parseInt(visitorRegId),
        userTenantId,
        createdBy
      );

      res.json(result);
    } catch (error) {
      console.error("Error in checkinVisitor:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // PUT /api/visitors/history/:historyId/checkout
  static async checkoutVisitorHistory(req, res) {
    try {
      const { historyId } = req.params;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username;

      if (!historyId) {
        return res.status(400).json({
          responseCode: "E",
          responseMessage: "History ID is required",
        });
      }

      const result = await VisitorService.checkoutRegisteredVisitor(
        parseInt(historyId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error("Error in checkoutVisitorHistory:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/:visitorRegId/history
  static async getVisitorHistory(req, res) {
    try {
      const { visitorRegId } = req.params;
      const { limit = 10 } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await VisitorService.getVisitHistory(
        parseInt(visitorRegId),
        userTenantId,
        parseInt(limit)
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getVisitorHistory:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/pending-checkout
  static async getPendingCheckout(req, res) {
    try {
      const userTenantId = req.user.tenantId;

      const result = await VisitorService.getVisitorsPendingCheckout(
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getPendingCheckout:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/visitors/:visitorRegId/qr
  static async generateQR(req, res) {
    try {
      const { visitorRegId } = req.params;
      const userTenantId = req.user.tenantId;

      const result = await VisitorService.generateVisitorQR(
        parseInt(visitorRegId),
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error("Error in generateQR:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/visitors/scan-qr
  static async scanQR(req, res) {
    try {
      const { qrString } = req.body;
      const userTenantId = req.user.tenantId;

      if (!qrString) {
        return res.status(400).json({
          responseCode: "E",
          responseMessage: "QR string is required",
        });
      }

      const result = await VisitorService.scanQRCode(
        qrString,
        userTenantId,
        req.user
      );

      res.json(result);
    } catch (error) {
      console.error("Error in scanQR:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/search
  static async searchVisitors(req, res) {
    try {
      const { ...searchParams } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await VisitorService.searchVisitors(
        userTenantId,
        searchParams
      );

      res.json(result);
    } catch (error) {
      console.error("Error in searchVisitors:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/history/comprehensive
  static async getComprehensiveHistory(req, res) {
    try {
      const { tenantId, ...filters } = req.query;
      const userTenantId = req.user.tenantId;

      const history = await VisitorModel.getComprehensiveVisitHistory(
        userTenantId,
        filters
      );

      const totalCount =
        history.length > 0 ? parseInt(history[0].total_count) : 0;
      const currentPage = parseInt(filters.page) || 1;
      const pageSize = parseInt(filters.pageSize) || 50;
      const totalPages = Math.ceil(totalCount / pageSize);

      const historyWithUrls = history.map((record) => {
        const { total_count, ...historyData } = record;
        return {
          ...historyData,
          photoUrl: record.photoname
            ? FileService.getFileUrl(
                FileService.categories.REGISTERED_VISITORS,
                record.photoname
              )
            : null,
          vehiclePhotoUrl: record.vehiclephotoname
            ? FileService.getFileUrl(
                FileService.categories.VEHICLES,
                record.vehiclephotoname
              )
            : null,
          duration:
            record.intime && record.outtime
              ? AnalyticsService.calculateDuration(
                  record.intime,
                  record.outtime
                )
              : null,
          status:
            !record.outtime || !record.outtimetxt || record.outtimetxt === ""
              ? "CHECKED_IN"
              : "CHECKED_OUT",
        };
      });

      res.json({
        responseCode: "S",
        data: historyWithUrls,
        pagination: {
          currentPage,
          pageSize,
          totalCount,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      });
    } catch (error) {
      console.error("Error in getComprehensiveHistory:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  static async listVisitors(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = "",
        visitorCatId = null,
        visitorSubCatId = null,
        purposeId = null,
        flatName = "",
        mobile = "",
        fromDate = null,
        toDate = null,
        status = null, // ACTIVE, INACTIVE, CHECKED_IN, CHECKED_OUT
        tenantId,
      } = req.body;

      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Access denied for this tenant",
        });
      }

      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        visitorCatId: visitorCatId ? parseInt(visitorCatId) : null,
        visitorSubCatId: visitorSubCatId ? parseInt(visitorSubCatId) : null,
        purposeId: purposeId ? parseInt(purposeId) : null,
        flatName,
        mobile,
        fromDate,
        toDate,
        status,
      };

      const result = await VisitorService.getVisitorsWithFilters(
        userTenantId,
        filters
      );

      res.json(result);
    } catch (error) {
      console.error("Error in listVisitors:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/export - Export visitors data
  static async exportVisitors(req, res) {
    try {
      const {
        visitorCatId,
        visitorSubCatId,
        status,
        fromDate,
        toDate,
        format = "csv",
        tenantId,
      } = req.query;

      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Access denied for this tenant",
        });
      }

      const filters = {
        visitorCatId: visitorCatId ? parseInt(visitorCatId) : null,
        visitorSubCatId: visitorSubCatId ? parseInt(visitorSubCatId) : null,
        status,
        fromDate,
        toDate,
      };

      const result = await VisitorService.exportVisitors(userTenantId, filters);

      if (result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS) {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="visitors_${Math.floor(Date.now() / 1000)}.csv"`
        );
        res.send(result.csvData);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in exportVisitors:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/template - Download CSV template
  static async downloadTemplate(req, res) {
    try {
      const { visitorCatId = 1 } = req.query; // Default to Unregistered category

      const templates = {
        2: "Name,Mobile,Email,Flat_Name,Vehicle_Number,ID_Type,ID_Number,Purpose",
        3: "Student_ID,Name,Mobile,Email,Course,Hostel,Vehicle_Number",
        1: "Staff_ID,Name,Mobile,Email,Designation,Department,Address,Vehicle_Number",
        4: "Name,Mobile,Email,Flat_Name,Vehicle_Number,Relationship,Purpose",
        5: "Bus_Number,Registration_Number,Driver_Name,Driver_Mobile,Route,Purpose",
      };

      const template = templates[visitorCatId] || templates[2];

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="visitor_template_cat${visitorCatId}.csv"`
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

  // GET /api/visitors - List visitors with pagination and search (legacy)
  static async getVisitors(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = "",
        visitorSubCatId = 0,
        purposeId = 0,
        fromDate = null,
        toDate = null,
      } = req.query;

      const userTenantId = req.user.tenantId;

      const result = await VisitorService.getVisitors(
        userTenantId,
        parseInt(page),
        parseInt(pageSize),
        search,
        parseInt(visitorSubCatId),
        fromDate,
        toDate,
        parseInt(purposeId)
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getVisitors:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/visitors/unregistered/checkins
  static async getUnregisteredCheckins(req, res) {
    try {
      const {
        subcatid = 0,
        from = "",
        to = "",
        flatname = "",
        flatid = 0,
        page = 1,
        pageSize = 50,
      } = req.query;

      const userTenantId = req.user.tenantId;

      const filters = {
        subcatid: parseInt(subcatid),
        from,
        to,
        flatname,
        flatid: parseInt(flatid),
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status: "checked_in",
      };

      const result = await VisitorService.getUnregisteredVisitorsByStatus(
        userTenantId,
        filters
      );
      console.log("result checkins: ", result);
      res.json(result);
    } catch (error) {
      console.error("Error in getUnregisteredCheckins:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/unregistered/checkouts
  static async getUnregisteredCheckouts(req, res) {
    try {
      const {
        subcatid = 0,
        from = "",
        to = "",
        flatname = "",
        flatid = 0,
        page = 1,
        pageSize = 50,
      } = req.query;

      const userTenantId = req.user.tenantId;

      const filters = {
        subcatid: parseInt(subcatid),
        from,
        to,
        flatname,
        flatid: parseInt(flatid),
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status: "checked_out",
      };

      const result = await VisitorService.getUnregisteredVisitorsByStatus(
        userTenantId,
        filters
      );
console.log("result checkouts: ", result)
      res.json(result);
    } catch (error) {
      console.error("Error in getUnregisteredCheckouts:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/unregistered
  static async getUnregisteredVisitors(req, res) {
    try {
      const {
        subcatid = 0,
        from = "",
        to = "",
        flatname = "",
        flatid = 0,
        page = 1,
        pageSize = 50,
      } = req.query;

      const userTenantId = req.user.tenantId;

      const filters = {
        subcatid: parseInt(subcatid),
        from,
        to,
        flatname,
        flatid: parseInt(flatid),
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status: "all",
      };

      const result = await VisitorService.getUnregisteredVisitorsByStatus(
        userTenantId,
        filters
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getUnregisteredVisitors:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/visitors/purposes
  static async getVisitorPurposes(req, res) {
    try {
      const { purposeCatId = 1 } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await VisitorService.getVisitorPurposes(
        userTenantId,
        parseInt(purposeCatId)
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getVisitorPurposes:", error);
      res.status(500).json({
        responseCode: "E",
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/visitors/purposes - Add new purpose
  static async addVisitorPurpose(req, res) {
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
        imageFile: req.file || null,
      };

      const result = await VisitorService.addVisitorPurpose(purposeData);

      const statusCode = result.responseCode === "S" ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in addVisitorPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // PUT /api/visitors/purposes/:purposeId - Update purpose
  static async updateVisitorPurpose(req, res) {
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

      const result = await VisitorService.updateVisitorPurpose(
        parseInt(purposeId),
        userTenantId,
        purposeName.trim(),
        updatedBy
      );

      const statusCode = result.responseCode === "S" ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in updateVisitorPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // DELETE /api/visitors/purposes/:purposeId - Delete purpose
  static async deleteVisitorPurpose(req, res) {
    try {
      const { purposeId } = req.params;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username || "System";

      if (!purposeId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose ID is required",
        });
      }

      const result = await VisitorService.deleteVisitorPurpose(
        parseInt(purposeId),
        userTenantId,
        updatedBy
      );

      const statusCode = result.responseCode === "S" ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in deleteVisitorPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }
}

module.exports = VisitorController;
