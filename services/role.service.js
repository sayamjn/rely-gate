const RoleModel = require('../models/role.model');
const ResponseFormatter = require('../utils/response');

class RoleService {
  // Get all roles with pagination and filters
  static async getRoles({ tenantId, page = 1, pageSize = 20, search = '', status = '' }) {
    try {
      // Convert status values
      let dbStatus = status;
      if (status === 'Active') dbStatus = 'Y';
      else if (status === 'In-Active') dbStatus = 'N';
      else if (status === 'all') dbStatus = '';

      const result = await RoleModel.getRoles({
        tenantId,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        status: dbStatus
      });

      // Format the response
      const formattedRoles = result.roles.map(role => ({
        roleId: role.roleid,
        roleCode: role.rolecode,
        roleName: role.rolename,
        roleRemark: role.roleremark,
        status: role.isactive === 'Y' ? 'Active' : 'In-Active',
        createdBy: role.createdby,
        updatedBy: role.updatedby,
        createdDate: role.createddate,
        updatedDate: role.updateddate
      }));

      return ResponseFormatter.success({
        roles: formattedRoles,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          totalItems: result.total,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1
        }
      });
    } catch (error) {
      console.error('Error in getRoles service:', error);
      throw error;
    }
  }

  // Get role by ID
  static async getRoleById({ roleId, tenantId }) {
    try {
      const role = await RoleModel.findByRoleIdAndTenant(roleId, tenantId);
      
      if (!role) {
        return ResponseFormatter.error('Role not found');
      }

      const formattedRole = {
        roleId: role.roleid,
        roleCode: role.rolecode,
        roleName: role.rolename,
        roleRemark: role.roleremark,
        status: role.isactive === 'Y' ? 'Active' : 'In-Active',
        createdBy: role.createdby,
        updatedBy: role.updatedby,
        createdDate: role.createddate,
        updatedDate: role.updateddate
      };

      return ResponseFormatter.success(formattedRole);
    } catch (error) {
      console.error('Error in getRoleById service:', error);
      throw error;
    }
  }

  // Create new role
  static async createRole({ tenantId, roleCode, roleName, roleRemark, status = 'Active', createdBy }) {
    try {
      // Validate required fields
      if (!roleCode || !roleName) {
        return ResponseFormatter.error('Role code and role name are required');
      }

      // Ensure roleCode is a string and convert to uppercase
      const normalizedRoleCode = String(roleCode).toUpperCase();

      // Check if role code already exists
      const roleCodeExists = await RoleModel.checkRoleCodeExists({ roleCode: normalizedRoleCode, tenantId });
      if (roleCodeExists) {
        return ResponseFormatter.exists('Role code already exists');
      }

      // Check if role name already exists
      const roleNameExists = await RoleModel.checkRoleNameExists({ roleName, tenantId });
      if (roleNameExists) {
        return ResponseFormatter.exists('Role name already exists');
      }

      // Create role
      const newRole = await RoleModel.createRole({
        tenantId,
        roleCode: normalizedRoleCode,
        roleName,
        roleRemark,
        isActive: status === 'Active' ? 'Y' : 'N',
        createdBy
      });

      const formattedRole = {
        roleId: newRole.roleid,
        roleCode: newRole.rolecode,
        roleName: newRole.rolename,
        roleRemark: newRole.roleremark,
        status: newRole.isactive === 'Y' ? 'Active' : 'In-Active',
        createdBy: newRole.createdby,
        createdDate: newRole.createddate
      };

      return ResponseFormatter.success(formattedRole, 'Role created successfully');
    } catch (error) {
      console.error('Error in createRole service:', error);
      throw error;
    }
  }

  // Update role
  static async updateRole({ roleId, tenantId, roleCode, roleName, roleRemark, status, updatedBy }) {
    try {
      // Validate required fields
      if (!roleCode || !roleName) {
        return ResponseFormatter.error('Role code and role name are required');
      }

      // Check if role exists
      const existingRole = await RoleModel.findByRoleIdAndTenant(roleId, tenantId);
      if (!existingRole) {
        return ResponseFormatter.error('Role not found');
      }

      // Ensure roleCode is a string and convert to uppercase
      const normalizedRoleCode = String(roleCode).toUpperCase();

      // Check if role code already exists (excluding current role)
      const roleCodeExists = await RoleModel.checkRoleCodeExists({ 
        roleCode: normalizedRoleCode, 
        tenantId, 
        excludeRoleId: roleId 
      });
      if (roleCodeExists) {
        return ResponseFormatter.exists('Role code already exists');
      }

      // Check if role name already exists (excluding current role)
      const roleNameExists = await RoleModel.checkRoleNameExists({ 
        roleName, 
        tenantId, 
        excludeRoleId: roleId 
      });
      if (roleNameExists) {
        return ResponseFormatter.exists('Role name already exists');
      }

      // Update role
      const updatedRole = await RoleModel.updateRole({
        roleId,
        tenantId,
        roleCode: normalizedRoleCode,
        roleName,
        roleRemark,
        isActive: status === 'Active' ? 'Y' : 'N',
        updatedBy
      });

      const formattedRole = {
        roleId: updatedRole.roleid,
        roleCode: updatedRole.rolecode,
        roleName: updatedRole.rolename,
        roleRemark: updatedRole.roleremark,
        status: updatedRole.isactive === 'Y' ? 'Active' : 'In-Active',
        updatedBy: updatedRole.updatedby,
        updatedDate: updatedRole.updateddate
      };

      return ResponseFormatter.success(formattedRole, 'Role updated successfully');
    } catch (error) {
      console.error('Error in updateRole service:', error);
      throw error;
    }
  }

  // Delete role (soft delete)
  static async deleteRole({ roleId, tenantId, updatedBy }) {
    try {
      // Check if role exists
      const existingRole = await RoleModel.findByRoleIdAndTenant(roleId, tenantId);
      if (!existingRole) {
        return ResponseFormatter.error('Role not found');
      }

      // Check if role is being used by any users
      const roleInUse = await RoleModel.checkRoleInUse({ roleId, tenantId });
      if (roleInUse) {
        return ResponseFormatter.error('Cannot delete role as it is assigned to users');
      }

      // Delete role
      const result = await RoleModel.deleteRole({
        roleId,
        tenantId,
        updatedBy
      });

      return ResponseFormatter.success(
        { roleName: result.rolename },
        'Role deleted successfully'
      );
    } catch (error) {
      console.error('Error in deleteRole service:', error);
      throw error;
    }
  }

  // Get active roles for dropdown
  static async getActiveRoles({ tenantId }) {
    try {
      const roles = await RoleModel.getActiveRoles(tenantId);
      
      const formattedRoles = roles.map(role => ({
        roleId: role.roleid,
        roleCode: role.rolecode,
        roleName: role.rolename,
        roleRemark: role.roleremark
      }));

      return ResponseFormatter.success({ roles: formattedRoles });
    } catch (error) {
      console.error('Error in getActiveRoles service:', error);
      throw error;
    }
  }

  // Toggle role status
  static async toggleRoleStatus({ roleId, tenantId, updatedBy }) {
    try {
      const existingRole = await RoleModel.findByRoleIdAndTenant(roleId, tenantId);
      if (!existingRole) {
        return ResponseFormatter.error('Role not found');
      }

      // If deactivating, check if role is being used by any users
      if (existingRole.isactive === 'Y') {
        const roleInUse = await RoleModel.checkRoleInUse({ roleId, tenantId });
        if (roleInUse) {
          return ResponseFormatter.error('Cannot deactivate role as it is assigned to users');
        }
      }

      const newStatus = existingRole.isactive === 'Y' ? 'N' : 'Y';
      
      const updatedRole = await RoleModel.updateRole({
        roleId,
        tenantId,
        roleCode: existingRole.rolecode,
        roleName: existingRole.rolename,
        roleRemark: existingRole.roleremark,
        isActive: newStatus,
        updatedBy
      });

      const statusText = newStatus === 'Y' ? 'activated' : 'deactivated';
      
      return ResponseFormatter.success(
        { 
          roleName: updatedRole.rolename,
          status: newStatus === 'Y' ? 'Active' : 'In-Active'
        },
        `Role ${statusText} successfully`
      );
    } catch (error) {
      console.error('Error in toggleRoleStatus service:', error);
      throw error;
    }
  }
}

module.exports = RoleService;