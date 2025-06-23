const StaffService = require('../services/staff.service');
const responseUtils = require('../utils/constants');

class StaffController {
  // GET /api/staff - List staff with pagination and search
  static async getStaff(req, res) {
    try {
      const { page = 1, pageSize = 10, search = '', tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await StaffService.getStaff(
        userTenantId,
        parseInt(page),
        parseInt(pageSize),
        search
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getStaff:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/staff/:staffId/checkin - Check-in staff member (First action)
  static async checkinStaff(req, res) {
    try {
      const { staffId } = req.params;
      const { tenantId } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      if (!staffId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff ID is required'
        });
      }

      const result = await StaffService.checkinStaff(
        parseInt(staffId),
        userTenantId,
        createdBy
      );

      res.json(result);
    } catch (error) {
      console.error('Error in checkinStaff:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/staff/:staffId/checkout - Check-out staff member (Second action)
  static async checkoutStaff(req, res) {
    try {
      const { staffId } = req.params;
      const { tenantId } = req.body;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      if (!staffId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff ID is required'
        });
      }

      const result = await StaffService.checkoutStaff(
        parseInt(staffId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error('Error in checkoutStaff:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/staff/:staffId/history - Get staff visit history
  static async getStaffHistory(req, res) {
    try {
      const { staffId } = req.params;
      const { tenantId, limit = 10 } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await StaffService.getStaffHistory(
        parseInt(staffId),
        userTenantId,
        parseInt(limit)
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getStaffHistory:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/staff/pending-checkout - Get staff currently checked in
  static async getPendingCheckout(req, res) {
    try {
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await StaffService.getPendingCheckout(userTenantId);

      res.json(result);
    } catch (error) {
      console.error('Error in getPendingCheckout:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/staff/:staffId/status - Get staff's current status
  static async getStaffStatus(req, res) {
    try {
      const { staffId } = req.params;
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      if (!staffId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff ID is required'
        });
      }

      const result = await StaffService.getStaffStatus(parseInt(staffId), userTenantId);

      res.json(result);
    } catch (error) {
      console.error('Error in getStaffStatus:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }
}

module.exports = StaffController;