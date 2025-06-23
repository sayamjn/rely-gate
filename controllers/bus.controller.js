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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

  // GET /api/buses/purposes - Get available purposes for buses
  static async getBusPurposes(req, res) {
    try {
      const { tenantId, purposeCatId = 2 } = req.query; // Bus category = 2
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

  // GET /api/buses/:busId/status - Check bus current check-in/out status
  static async getBusStatus(req, res) {
    try {
      const { busId } = req.params;
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId, limit = 10 } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
}

module.exports = BusController;