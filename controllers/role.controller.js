const { validationResult } = require('express-validator');
const RoleService = require('../services/role.service');
const ResponseFormatter = require('../utils/response');

class RoleController {
  // Get all roles with pagination and filters
  static async getRoles(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId } = req.user;
      const { page, pageSize, search, status } = req.query;

      const result = await RoleService.getRoles({
        tenantId,
        page,
        pageSize,
        search,
        status
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getRoles controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Get role by ID
  static async getRoleById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId } = req.user;
      const { roleId } = req.params;

      const result = await RoleService.getRoleById({
        roleId: parseInt(roleId),
        tenantId
      });

      if (result.responseCode === 'E') {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getRoleById controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Create new role
  static async createRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId, loginId: createdBy } = req.user;
      const { roleCode, roleName, roleRemark, status } = req.body;

      const result = await RoleService.createRole({
        tenantId,
        roleCode,
        roleName,
        roleRemark,
        status,
        createdBy
      });

      if (result.responseCode === 'E') {
        return res.status(400).json(result);
      }

      if (result.responseCode === 'F') {
        return res.status(409).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Error in createRole controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Update role
  static async updateRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId, loginId: updatedBy } = req.user;
      const { roleId } = req.params;
      const { roleCode, roleName, roleRemark, status } = req.body;

      const result = await RoleService.updateRole({
        roleId: parseInt(roleId),
        tenantId,
        roleCode,
        roleName,
        roleRemark,
        status,
        updatedBy
      });

      if (result.responseCode === 'E') {
        return res.status(404).json(result);
      }

      if (result.responseCode === 'F') {
        return res.status(409).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in updateRole controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Delete role
  static async deleteRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId, loginId: updatedBy } = req.user;
      const { roleId } = req.params;

      const result = await RoleService.deleteRole({
        roleId: parseInt(roleId),
        tenantId,
        updatedBy
      });

      if (result.responseCode === 'E') {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteRole controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Get active roles for dropdown
  static async getActiveRoles(req, res) {
    try {
      const { tenantId } = req.user;

      const result = await RoleService.getActiveRoles({
        tenantId
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getActiveRoles controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Toggle role status
  static async toggleRoleStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId, loginId: updatedBy } = req.user;
      const { roleId } = req.params;

      const result = await RoleService.toggleRoleStatus({
        roleId: parseInt(roleId),
        tenantId,
        updatedBy
      });

      if (result.responseCode === 'E') {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in toggleRoleStatus controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }
}

module.exports = RoleController;