const LinkedTenantsModel = require("../models/linkedTenants.model");
const responseUtils = require("../utils/constants");

class LinkedTenantsService {
  // Get all linked tenants for a user
  static async getMyLinkedTenants(loginId) {
    try {
      const tenants = await LinkedTenantsModel.getMyLinkedTenants(loginId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Linked tenants retrieved successfully",
        data: tenants,
        count: tenants.length,
      };
    } catch (error) {
      console.error("Error fetching linked tenants:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Create new tenant link
  static async createTenantLink(data) {
    try {
      const { loginId, tenantId, tenantName, email, mobile, isPrimary, createdBy } = data;

      // Check if link already exists
      const existing = await LinkedTenantsModel.verifyAccess(loginId, tenantId);
      if (existing) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.EXISTS,
          responseMessage: "User is already linked to this tenant",
        };
      }

      // If setting as primary, ensure only one primary per user
      if (isPrimary) {
        await LinkedTenantsModel.setPrimaryTenant(loginId, tenantId, createdBy);
      }

      const newLink = await LinkedTenantsModel.createTenantLink({
        loginId,
        tenantId,
        tenantName,
        email,
        mobile,
        isPrimary: isPrimary || false,
        createdBy
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Tenant link created successfully",
        data: newLink,
      };
    } catch (error) {
      console.error("Error creating tenant link:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Update tenant link
  static async updateTenantLink(id, data) {
    try {
      const { tenantName, email, mobile, isPrimary, updatedBy } = data;

      const existingLink = await LinkedTenantsModel.getTenantLinkById(id);
      if (!existingLink) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Tenant link not found",
        };
      }

      // If setting as primary, ensure only one primary per user
      if (isPrimary && !existingLink.isprimary) {
        await LinkedTenantsModel.setPrimaryTenant(existingLink.loginid, existingLink.tenantid, updatedBy);
      }

      const updatedLink = await LinkedTenantsModel.updateTenantLink(id, {
        tenantName,
        email,
        mobile,
        isPrimary,
        updatedBy
      });

      if (!updatedLink) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Failed to update tenant link",
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Tenant link updated successfully",
        data: updatedLink,
      };
    } catch (error) {
      console.error("Error updating tenant link:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Delete tenant link
  static async deleteTenantLink(id, updatedBy) {
    try {
      const existingLink = await LinkedTenantsModel.getTenantLinkById(id);
      if (!existingLink) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Tenant link not found",
        };
      }

      // Prevent deletion of primary tenant
      if (existingLink.isprimary) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Cannot delete primary tenant link. Set another tenant as primary first.",
        };
      }

      const deletedLink = await LinkedTenantsModel.deleteTenantLink(id, updatedBy);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Tenant link deleted successfully",
        data: deletedLink,
      };
    } catch (error) {
      console.error("Error deleting tenant link:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get single tenant link details
  static async getTenantLinkDetails(id) {
    try {
      const link = await LinkedTenantsModel.getTenantLinkById(id);
      
      if (!link) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Tenant link not found",
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Tenant link details retrieved successfully",
        data: link,
      };
    } catch (error) {
      console.error("Error fetching tenant link details:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Manage link/unlink operations
  static async manageTenantsLink(loginId, action, tenantData, updatedBy) {
    try {
      const result = await LinkedTenantsModel.manageTenantsLink(loginId, action, tenantData, updatedBy);

      const actionMessage = action === 'link' ? 'linked to' : 'unlinked from';
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: `User successfully ${actionMessage} tenant`,
        data: result,
      };
    } catch (error) {
      console.error(`Error ${action}ing tenant:`, error);
      
      // Handle specific error cases
      if (error.message.includes('already linked')) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.EXISTS,
          responseMessage: error.message,
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Admin function: Get all tenant links with pagination
  static async getAllTenantLinks(page = 1, pageSize = 20, filters = {}) {
    try {
      const result = await LinkedTenantsModel.getAllTenantLinks(page, pageSize, filters);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Tenant links retrieved successfully",
        data: result.data,
        count: result.data.length,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          totalItems: result.total
        }
      };
    } catch (error) {
      console.error("Error fetching all tenant links:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Verify tenant access (utility method)
  static async verifyTenantAccess(loginId, tenantId) {
    try {
      const hasAccess = await LinkedTenantsModel.verifyAccess(loginId, tenantId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        hasAccess: !!hasAccess,
        data: hasAccess
      };
    } catch (error) {
      console.error("Error verifying tenant access:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        hasAccess: false
      };
    }
  }
}

module.exports = LinkedTenantsService;