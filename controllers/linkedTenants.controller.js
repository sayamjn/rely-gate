const LinkedTenantsService = require("../services/linkedTenants.service");
const responseUtils = require("../utils/constants");

class LinkedTenantsController {
  // GET /api/linked-tenants/my-tenants - Get user's linked tenants
  static async getMyLinkedTenants(req, res) {
    try {
      const loginId = req.user.loginId;
      const result = await LinkedTenantsService.getMyLinkedTenants(loginId);
      
      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 500;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in getMyLinkedTenants:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      });
    }
  }

  // GET /api/linked-tenants/details/:id - Get single tenant link details
  static async getTenantLinkDetails(req, res) {
    try {
      const { id } = req.params;
      const result = await LinkedTenantsService.getTenantLinkDetails(parseInt(id));
      
      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 404;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in getTenantLinkDetails:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      });
    }
  }

  // POST /api/linked-tenants/ - Create new tenant link
  static async createTenantLink(req, res) {
    try {
      const { loginId, tenantId, tenantName, email, mobile, isPrimary } = req.body;
      const createdBy = req.user.username;

      const data = {
        loginId,
        tenantId: parseInt(tenantId),
        tenantName,
        email,
        mobile,
        isPrimary: isPrimary || false,
        createdBy
      };

      const result = await LinkedTenantsService.createTenantLink(data);
      
      let statusCode = 200;
      if (result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS) {
        statusCode = 201;
      } else if (result.responseCode === responseUtils.RESPONSE_CODES.EXISTS) {
        statusCode = 409;
      } else {
        statusCode = 500;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in createTenantLink:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      });
    }
  }

  // PUT /api/linked-tenants/:id - Update tenant link
  static async updateTenantLink(req, res) {
    try {
      const { id } = req.params;
      const { tenantName, email, mobile, isPrimary } = req.body;
      const updatedBy = req.user.username;

      const data = {
        tenantName,
        email,
        mobile,
        isPrimary,
        updatedBy
      };

      const result = await LinkedTenantsService.updateTenantLink(parseInt(id), data);
      
      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 404;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in updateTenantLink:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      });
    }
  }

  // DELETE /api/linked-tenants/:id - Delete tenant link
  static async deleteTenantLink(req, res) {
    try {
      const { id } = req.params;
      const updatedBy = req.user.username;

      const result = await LinkedTenantsService.deleteTenantLink(parseInt(id), updatedBy);
      
      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 404;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in deleteTenantLink:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      });
    }
  }

  // POST /api/linked-tenants/manage - Link/Unlink tenant dynamically
  static async manageTenantsLink(req, res) {
    try {
      const { loginId, action, tenantId, tenantName, email, mobile } = req.body;
      const updatedBy = req.user.username;

      if (!['link', 'unlink'].includes(action)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid action. Use "link" or "unlink"',
        });
      }

      const tenantData = {
        tenantId: parseInt(tenantId),
        tenantName,
        email,
        mobile
      };

      const result = await LinkedTenantsService.manageTenantsLink(loginId, action, tenantData, updatedBy);
      
      let statusCode = 200;
      if (result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS) {
        statusCode = action === 'link' ? 201 : 200;
      } else if (result.responseCode === responseUtils.RESPONSE_CODES.EXISTS) {
        statusCode = 409;
      } else {
        statusCode = 500;
      }

      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in manageTenantsLink:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      });
    }
  }

  // GET /api/linked-tenants/all - Admin: Get all tenant links with pagination
  static async getAllTenantLinks(req, res) {
    try {
      const { page = 1, pageSize = 20, loginId, tenantId } = req.query;
      
      const filters = {};
      if (loginId) filters.loginId = loginId;
      if (tenantId) filters.tenantId = parseInt(tenantId);

      const result = await LinkedTenantsService.getAllTenantLinks(
        parseInt(page), 
        parseInt(pageSize), 
        filters
      );
      
      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 500;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in getAllTenantLinks:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      });
    }
  }

  // GET /api/linked-tenants/verify-access/:loginId/:tenantId - Verify tenant access
  static async verifyTenantAccess(req, res) {
    try {
      const { loginId, tenantId } = req.params;
      const result = await LinkedTenantsService.verifyTenantAccess(loginId, parseInt(tenantId));
      
      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 500;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in verifyTenantAccess:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        hasAccess: false
      });
    }
  }
}

module.exports = LinkedTenantsController;