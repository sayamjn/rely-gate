const BusService = require('../services/bus.service');
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
      const { tenantId, purposeCatId = 2 } = req.query; // Bus category = 2
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
}

module.exports = BusController;