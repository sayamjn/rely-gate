const BusModel = require('../models/bus.model');
const BusService = require('../services/bus.service');
const FileService = require('../services/file.service');
const QRService = require('../services/qr.service');
const responseUtils = require("../utils/constants");

class BusController {
  // POST /api/buses/list - List buses with filters 
  static async listBuses(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        purposeId = null,
        busNumber = '',
        registrationNumber = '',
        driverName = '',
        fromDate = null,
        toDate = null,
        tenantId
      } = req.body;
      
      const userTenantId = req.user.tenantId;


      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        purposeId: purposeId ? parseInt(purposeId) : null,
        busNumber,
        registrationNumber,
        driverName,
        fromDate,
        toDate
      };

      const result = await BusService.getBusesWithFilters(userTenantId, filters);
      res.json(result);
    } catch (error) {
      console.error('Error in listBuses:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/buses/:busId/status - Check bus current check-in/out status
  static async getBusStatus(req, res) {
    try {
      const { busId } = req.params;
      const userTenantId = req.user.tenantId;


      if (!busId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Bus ID is required'
        });
      }

      const result = await BusService.getBusStatus(
        parseInt(busId),
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getBusStatus:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/buses/:busId/checkout - Checkout bus with purpose support
  static async checkoutBus(req, res) {
    try {
      const { busId } = req.params;
      const { tenantId, purposeId, purposeName } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;


      if (!busId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Bus ID is required'
        });
      }

      if (purposeId === -1 && (!purposeName || purposeName.trim() === '')) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Purpose name is required when using custom purpose'
        });
      }

      const result = await BusService.checkoutBus(
        parseInt(busId),
        userTenantId,
        purposeId ? parseInt(purposeId) : null,
        purposeName,
        createdBy
      );

      res.json(result);
    } catch (error) {
      console.error('Error in checkoutBus:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/buses/:busId/checkin - Checkin bus
  static async checkinBus(req, res) {
    try {
      const { busId } = req.params;
      const { tenantId } = req.body;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username;


      if (!busId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Bus ID is required'
        });
      }

      const result = await BusService.checkinBus(
        parseInt(busId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error('Error in checkinBus:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/buses/:busId/history - Get bus visit history
  static async getBusHistory(req, res) {
    try {
      const { busId } = req.params;
      const { limit = 10 } = req.query;
      const userTenantId = req.user.tenantId;


      const result = await BusService.getBusHistory(
        parseInt(busId),
        userTenantId,
        parseInt(limit)
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getBusHistory:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/buses/pending-checkin - Get buses currently checked out
  static async getPendingCheckin(req, res) {
    try {
      
      const userTenantId = req.user.tenantId;


      const result = await BusService.getBusesPendingCheckin(userTenantId);

      res.json(result);
    } catch (error) {
      console.error('Error in getPendingCheckin:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/buses/export - Export buses data
  static async exportBuses(req, res) {
    try {
      const {
        purposeId,
        registrationNumber,
        driverName,
        fromDate,
        toDate,
        format = 'csv',
        tenantId
      } = req.query;
      
      const userTenantId = req.user.tenantId;


      const filters = {
        purposeId: purposeId ? parseInt(purposeId) : null,
        registrationNumber,
        driverName,
        fromDate,
        toDate
      };

      const result = await BusService.exportBuses(userTenantId, filters);
      
      if (result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="buses_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(result.csvData);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in exportBuses:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/buses/template - Download CSV template for bulk upload
  static async downloadTemplate(req, res) {
    try {
      const template = `Bus Number,Bus Name,Driver Mobile,Bus Type,Driver Name\n`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="bus_template.csv"');
      res.send(template);
    } catch (error) {
      console.error('Error in downloadTemplate:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/buses - List buses with pagination and search (legacy)
static async getBuses(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      search = '', 
      category = 0,
      tenantId 
    } = req.query;
    
    const userTenantId = req.user.tenantId;

    if (tenantId && parseInt(tenantId) !== userTenantId) {
      return res.status(403).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Access denied for this tenant'
      });
    }

    const result = await BusService.getBuses(
      userTenantId,
      parseInt(page),
      parseInt(pageSize),
      search,
      category
    );

    // Map response to only return required fields
    if (result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS && result.data) {
      const mappedData = result.data.map(bus => ({
        VisitorRegNo: bus.VisitorRegNo || bus.visitorregno,
        VisitorName: bus.VistorName || bus.vistorname,
        mobile: bus.Mobile || bus.mobile,
        VisitorSubCatName: bus.VisitorSubCatName || bus.visitorsubcatname,
        flatName: bus.FlatName || bus.flatname || ''
      }));

      res.json({
        ...result,
        data: mappedData
      });
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Error in getBuses:', error);
    res.status(500).json({
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// GET /api/buses/pending-checkout - Get buses currently checked in
static async getPendingCheckout(req, res) {
  try {
    
    const userTenantId = req.user.tenantId;

    if (tenantId && parseInt(tenantId) !== userTenantId) {
      return res.status(403).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Access denied for this tenant'
      });
    }

    const result = await BusService.getPendingCheckout(userTenantId);
    res.json(result);
  } catch (error) {
    console.error('Error in getPendingCheckout:', error);
    res.status(500).json({
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: 'Internal server error'
    });
  }
  }


    // GET /api/buses/purposes - Get available purposes for buses
  static async getBusPurposes(req, res) {
    try {
      const { tenantId, purposeCatId = 3 } = req.query; // Bus category = 2
      const userTenantId = req.user.tenantId;


      const result = await BusService.getBusPurposes(
        userTenantId, 
        parseInt(purposeCatId)
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getBusPurposes:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/buses/purposes - Add new purpose
  static async addBusPurpose(req, res) {
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

      const result = await BusService.addBusPurpose(purposeData);

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

  // PUT /api/buses/purposes/:purposeId - Update purpose
  static async updateBusPurpose(req, res) {
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

      const result = await BusService.updateBusPurpose(
        parseInt(purposeId),
        userTenantId,
        purposeName.trim(),
        updatedBy
      );

      const statusCode = result.responseCode === "S" ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in updateBusPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // DELETE /api/buses/purposes/:purposeId - Delete purpose
  static async deleteBusPurpose(req, res) {
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

      const result = await BusService.deleteBusPurpose(
        parseInt(purposeId),
        userTenantId,
        updatedBy
      );

      const statusCode = result.responseCode === "S" ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in deleteBusPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/buses/list - New comprehensive list endpoint with all filters
  static async getBusesList(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        purposeId = 0,
        busNumber = '',
        VisitorSubCatID = 0,
        registrationNumber = '',
        driverName = '',
        busType = '',
        route = '',
        fromDate = '',
        toDate = ''
      } = req.query;

      const userTenantId = req.user.tenantId;

      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search: search.trim(),
        purposeId: parseInt(purposeId),
        busNumber: busNumber.trim(),
        registrationNumber: registrationNumber.trim(),
        VisitorSubCatID: parseInt(VisitorSubCatID),
        driverName: driverName.trim(),
        busType: busType.trim(),
        route: route.trim(),
        fromDate: fromDate.trim(),
        toDate: toDate.trim()
      };

      const result = await BusService.getBusesList(userTenantId, filters);
      res.json(result);
    } catch (error) {
      console.error('Error in getBusesList:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/buses/sub-categories - List of bus sub categories
  static async getBusSubCategories(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const result = await BusService.getBusSubCategories(userTenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getBusSubCategories:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }


  // POST /api/buses/:busId/generate-qr - Generate QR code for bus
static async generateBusQR(req, res) {
  console.log(">> Entering generateBusQR");
  try {
    const { busId } = req.params;
    console.log("Received busId:", busId);

    const userTenantId = req.user.tenantId;
    const createdBy = req.user.username || 'System';
    console.log("User tenantId:", userTenantId, "Created by:", createdBy);

    if (!busId) {
      console.warn("Bus ID is missing in the request.");
      return res.status(400).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Bus ID is required'
      });
    }

    // Get bus details
    console.log("Fetching bus details...");
    const bus = await BusService.getBusStatus(parseInt(busId), userTenantId);
    console.log("Bus details fetched:", bus);

    if (bus.responseCode !== responseUtils.RESPONSE_CODES.SUCCESS) {
      console.warn("Bus not found with ID:", busId);
      return res.status(404).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Bus not found'
      });
    }

    // Generate QR data
    console.log("Generating QR data...");
    const qrData = QRService.generateQRData({
      tenantId: userTenantId,
      visitorRegNo: bus.data.busRegNo,
      visitorCatId: 5,
      SecurityCode: bus.data.busRegNo
    }, 'checkin-checkout');
    console.log("Generated qrData:", qrData);

    // Generate QR code image
    console.log("Generating QR code image...");
    const qrResult = await QRService.generateQRCode(qrData);
    console.log("QR code generation result:", qrResult);

    if (!qrResult.success) {
      console.error("Failed to generate QR code.");
      return res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to generate QR code'
      });
    }

    // Save QR image
    const fileName = `bus_qr_${busId}_${Date.now()}.png`;
    console.log("Saving QR image with filename:", fileName);
    const filePath = await FileService.saveBase64Image(
      qrResult.qrBase64,
      FileService.categories.QR_CODES,
      fileName
    );
    console.log("QR image saved at path:", filePath);

    const responsePayload = {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      responseMessage: 'QR code generated successfully',
      data: {
        busId: parseInt(busId),
        qrData: qrResult.qrData,
        qrImage: qrResult.qrImage,
        qrFilePath: filePath,
        bus: {
          name: bus.data.busName,
          regNo: bus.data.busCode,
          mobile: bus.data.mobile
        }
      }
    };

    console.log("Sending response:", responsePayload);
    res.json(responsePayload);

  } catch (error) {
    console.error('Error in generateBusQR:', error);
    res.status(500).json({
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: 'Internal server error'
    });
  }
}

// POST /api/buses/scan-qr - Process QR code scan and return check-in/check-out status
static async processBusQRScan(req, res) {
  console.log(">> Entering processBusQRScan");
  try {
    const { qrData } = req.body;
    const userTenantId = req.user.tenantId;
    console.log("Received qrData:", qrData);
    console.log("User tenantId:", userTenantId);

    // Normalize QR input
    let qrString;
    if (typeof qrData === 'string') {
      qrString = qrData;
    } else if (typeof qrData === 'object') {
      qrString = JSON.stringify(qrData);
    } else {
      console.warn("Invalid QR data format.");
      return res.status(400).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Invalid QR data format'
      });
    }

    console.log("Normalized QR string:", qrString);

    // Parse QR data
    console.log("Parsing QR string...");
    const qrParseResult = QRService.parseQRData(qrString);
    console.log("QR parse result:", qrParseResult);

    if (!qrParseResult.success) {
      console.warn("Invalid QR code format.");
      return res.status(400).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Invalid QR code format'
      });
    }

    const { tenantid, mainid, type } = qrParseResult.data;
    console.log("Parsed tenantid:", tenantid, "mainid:", mainid, "type:", type);

    if (parseInt(tenantid) !== userTenantId) {
      console.warn("Access denied. QR tenant:", tenantid, "User tenant:", userTenantId);
      return res.status(403).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Access denied for this tenant'
      });
    }

    if (type !== 'bus') {
      console.warn("QR type is not bus:", type);
      return res.status(400).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'QR code is not for a bus'
      });
    }

    console.log("Fetching bus by reg no:", mainid);
    const bus = await BusModel.getBusByRegNo(mainid, userTenantId);
    console.log("Bus fetched:", bus);

    if (!bus) {
      console.warn("Bus not found for reg no:", mainid);
      return res.status(404).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Bus not found'
      });
    }

    console.log("Fetching bus status for bus ID:", bus.id);
    const statusResult = await BusService.getBusStatus(bus.visitorregid, userTenantId);
    console.log("Bus status result:", statusResult);

    if (statusResult.responseCode !== responseUtils.RESPONSE_CODES.SUCCESS) {
      console.warn("Bus status fetch failed for ID:", bus.id);
      return res.status(404).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Bus not found'
      });
    }

    let currentStatus;
    let nextAction;

    if (statusResult.data.action === 'CHECKIN') {
      currentStatus = 'CHECKED_OUT';
      nextAction = 'checkin';
    } else {
      currentStatus = 'AVAILABLE';
      nextAction = 'checkout';
    }

    const responsePayload = {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      responseMessage: 'QR scan processed successfully',
      data: {
        busId: statusResult.data.busId,
        tenantId: parseInt(tenantid),
        nextAction: nextAction,
        currentStatus: currentStatus,
        visitorRegId: statusResult.data.busId,
        visitorRegNo: mainid,
        bus: {
          name: statusResult.data.busName,
          regNo: statusResult.data.busCode,
          mobile: statusResult.data.mobile,
          course: statusResult.data.course || 'N/A',
          hostel: statusResult.data.hostel || 'N/A'
        },
        actionPrompt: nextAction === 'checkin' 
          ? 'Bus is currently checked out. Do you want to check in?' 
          : 'Bus is currently available. Do you want to check out?',
        statusMessage: statusResult.data.message
      }
    };

    console.log("Sending response:", responsePayload);
    res.json(responsePayload);

  } catch (error) {
    console.error('Error in processBusQRScan:', error);
    res.status(500).json({
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: 'Internal server error'
    });
  }
}


}

module.exports = BusController;