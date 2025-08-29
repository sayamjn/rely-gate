const UserModel = require('../models/user.model');
const RoleService = require('./role.service');
const ResponseFormatter = require('../utils/response');
const FileService = require('./file.service');

class UserManagementService {
  // Get all users with pagination and filters
  static async getUsers({ tenantId, page = 1, pageSize = 20, search = '', role = '', status = '' }) {
    try {

      console.log("status: ",status)
      const result = await UserModel.getUsers({
        tenantId,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        role,
        status
      });
      

      // Format the response
      const formattedUsers = result.users.map(user => ({
        loginId: user.loginid,
        fullName: `${user.firstn || ''} ${user.middlen || ''} ${user.lastn || ''}`.trim(),
        userName: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.rolename,
        status: user.isactive === 'Y' ? 'Active' : 'In-Active',
        profileImage: user.profileimage,
        profileImageUrl: user.profileimage 
          ? FileService.getFileUrl(FileService.categories.USERS, user.profileimage)
          : null,
        createdBy: user.createdbyusername || user.createdby || 'System',
        createdDate: user.createddate,
        updatedBy: user.updatedbyusername || user.updatedby || null,
        updatedDate: user.updateddate
      }));

      return ResponseFormatter.success({
        users: formattedUsers,
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
      console.error('Error in getUsers service:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById({ loginId, tenantId }) {
    try {
      const user = await UserModel.findByLoginIdAndTenant(loginId, tenantId);
      
      if (!user) {
        return ResponseFormatter.error('User not found');
      }

      const formattedUser = {
        loginId: user.loginid,
        fullName: `${user.firstn || ''} ${user.middlen || ''} ${user.lastn || ''}`.trim(),
        firstName: user.firstn,
        middleName: user.middlen,
        lastName: user.lastn,
        displayName: user.displayn,
        userName: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.rolename,
        status: user.isactive === 'Y' ? 'Active' : 'In-Active',
        profileImage: user.profileimage,
        profileImageUrl: user.profileimage 
          ? FileService.getFileUrl(FileService.categories.USERS, user.profileimage)
          : null,
        linkFlatFlag: user.linkflatflag,
        linkeFlatId: user.linkeflatid,
        linkeFlatName: user.linkeflatname
      };

      return ResponseFormatter.success(formattedUser);
    } catch (error) {
      console.error('Error in getUserById service:', error);
      throw error;
    }
  }

  // Create new user
  static async createUser({ 
    tenantId, 
    userName, 
    firstName, 
    middleName, 
    lastName, 
    displayName, 
    email, 
    mobile, 
    password, 
    retypePassword, 
    role, 
    status = 'Active', 
    profileImagePath, 
    createdBy 
  }) {
    try {
      // Validate passwords match
      if (password !== retypePassword) {
        return ResponseFormatter.error('Passwords do not match');
      }

      // Check if username already exists
      const usernameExists = await UserModel.checkUsernameExists({ userName, tenantId });
      if (usernameExists) {
        return ResponseFormatter.exists('Username already exists');
      }

      // Check if email already exists
      if (email) {
        const emailExists = await UserModel.checkEmailExists({ email, tenantId });
        if (emailExists) {
          return ResponseFormatter.exists('Email already exists');
        }
      }

      // Use the uploaded profile image path if provided
      let profileImageFilename = null;
      if (profileImagePath) {
        // Extract filename from the full path
        const path = require('path');
        profileImageFilename = path.basename(profileImagePath);
      }

      // Get role details to validate role exists
      const rolesResult = await RoleService.getActiveRoles({ tenantId });
      const availableRoles = rolesResult.data.roles;
      const selectedRole = availableRoles.find(r => r.roleName === role);
      
      if (!selectedRole) {
        return ResponseFormatter.error('Invalid role selected');
      }

      // Create user
      const newUser = await UserModel.createNewUser({
        tenantId,
        userName,
        firstName,
        middleName,
        lastName,
        displayName: displayName || `${firstName} ${lastName}`.trim(),
        email,
        mobile,
        password,
        roleName: role,
        isActive: status === 'Active' ? 'Y' : 'N',
        profileImage: profileImageFilename,
        createdBy
      });

      const formattedUser = {
        loginId: newUser.loginid,
        userName: newUser.username,
        fullName: `${newUser.firstn || ''} ${newUser.lastn || ''}`.trim(),
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.rolename,
        status: newUser.isactive === 'Y' ? 'Active' : 'In-Active',
        profileImage: newUser.profileimage,
        profileImageUrl: newUser.profileimage 
          ? FileService.getFileUrl(FileService.categories.USERS, newUser.profileimage)
          : null,
        createdDate: newUser.createddate
      };

      return ResponseFormatter.success(formattedUser, 'User created successfully');
    } catch (error) {
      console.error('Error in createUser service:', error);
      throw error;
    }
  }

  // Update user
  static async updateUser({ 
    loginId, 
    tenantId, 
    userName, 
    firstName, 
    middleName, 
    lastName, 
    displayName, 
    email, 
    mobile, 
    role, 
    status, 
    profileImagePath, 
    updatedBy 
  }) {
    try {
      // Check if user exists
      const existingUser = await UserModel.findByLoginIdAndTenant(loginId, tenantId);
      if (!existingUser) {
        return ResponseFormatter.error('User not found');
      }

      // Check if username already exists (excluding current user)
      const usernameExists = await UserModel.checkUsernameExists({ 
        userName, 
        tenantId, 
        excludeLoginId: loginId 
      });
      if (usernameExists) {
        return ResponseFormatter.exists('Username already exists');
      }

      // Check if email already exists (excluding current user)
      if (email) {
        const emailExists = await UserModel.checkEmailExists({ 
          email, 
          tenantId, 
          excludeLoginId: loginId 
        });
        if (emailExists) {
          return ResponseFormatter.exists('Email already exists');
        }
      }

      // Use the uploaded profile image path if provided, otherwise keep existing
      let profileImageFilename = existingUser.profileimage;
      if (profileImagePath) {
        // Extract filename from the full path
        const path = require('path');
        profileImageFilename = path.basename(profileImagePath);
      }

      // Get role details to validate role exists
      const rolesResult = await RoleService.getActiveRoles({ tenantId });
      const availableRoles = rolesResult.data.roles;
      const selectedRole = availableRoles.find(r => r.roleName === role);
      
      if (!selectedRole) {
        return ResponseFormatter.error('Invalid role selected');
      }

      // Update user
      const updatedUser = await UserModel.updateUser({
        loginId,
        tenantId,
        userName,
        firstName,
        middleName,
        lastName,
        displayName: displayName || `${firstName} ${lastName}`.trim(),
        email,
        mobile,
        roleName: role,
        profileImage: profileImageFilename,
        isActive: status === 'Active' ? 'Y' : 'N',
        updatedBy
      });

      const formattedUser = {
        loginId: updatedUser.loginid,
        userName: updatedUser.username,
        fullName: `${updatedUser.firstn || ''} ${updatedUser.lastn || ''}`.trim(),
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        role: updatedUser.rolename,
        status: updatedUser.isactive === 'Y' ? 'Active' : 'In-Active',
        profileImage: updatedUser.profileimage,
        profileImageUrl: updatedUser.profileimage 
          ? FileService.getFileUrl(FileService.categories.USERS, updatedUser.profileimage)
          : null,
        updatedDate: updatedUser.updateddate
      };

      return ResponseFormatter.success(formattedUser, 'User updated successfully');
    } catch (error) {
      console.error('Error in updateUser service:', error);
      throw error;
    }
  }

  // Reset user password
  static async resetPassword({ loginId, tenantId, newPassword, retypePassword, updatedBy }) {
    try {
      // Validate passwords match
      if (newPassword !== retypePassword) {
        return ResponseFormatter.error('Passwords do not match');
      }

      // Check if user exists
      const existingUser = await UserModel.findByLoginIdAndTenant(loginId, tenantId);
      if (!existingUser) {
        return ResponseFormatter.error('User not found');
      }

      // Reset password
      const result = await UserModel.resetPassword({
        loginId,
        tenantId,
        newPassword,
        updatedBy
      });

      return ResponseFormatter.success(
        { userName: result.username },
        'Password reset successfully'
      );
    } catch (error) {
      console.error('Error in resetPassword service:', error);
      throw error;
    }
  }

  // Delete user (soft delete)
  static async deleteUser({ loginId, tenantId, updatedBy }) {
    try {
      // Check if user exists
      const existingUser = await UserModel.findByLoginIdAndTenant(loginId, tenantId);
      if (!existingUser) {
        return ResponseFormatter.error('User not found');
      }

      // Delete user
      const result = await UserModel.deleteUser({
        loginId,
        tenantId,
        updatedBy
      });

      return ResponseFormatter.success(
        { userName: result.username },
        'User deleted successfully'
      );
    } catch (error) {
      console.error('Error in deleteUser service:', error);
      throw error;
    }
  }

  // Get available roles
  static async getUserRoles({ tenantId }) {
    try {
      const result = await RoleService.getActiveRoles({ tenantId });
      return result;
    } catch (error) {
      console.error('Error in getUserRoles service:', error);
      throw error;
    }
  }

  // Toggle user status
  static async toggleUserStatus({ loginId, tenantId, updatedBy }) {
    try {
      const existingUser = await UserModel.findByLoginIdAndTenant(loginId, tenantId);
      if (!existingUser) {
        return ResponseFormatter.error('User not found');
      }

      const newStatus = existingUser.isactive === 'Y' ? 'N' : 'Y';
      
      const updatedUser = await UserModel.updateUser({
        loginId,
        tenantId,
        userName: existingUser.username,
        firstName: existingUser.firstn,
        middleName: existingUser.middlen,
        lastName: existingUser.lastn,
        displayName: existingUser.displayn,
        email: existingUser.email,
        mobile: existingUser.mobile,
        roleName: existingUser.rolename,
        profileImage: existingUser.profileimage,
        isActive: newStatus,
        updatedBy
      });

      const statusText = newStatus === 'Y' ? 'activated' : 'deactivated';
      
      return ResponseFormatter.success(
        { 
          userName: updatedUser.username,
          status: newStatus === 'Y' ? 'Active' : 'In-Active'
        },
        `User ${statusText} successfully`
      );
    } catch (error) {
      console.error('Error in toggleUserStatus service:', error);
      throw error;
    }
  }
}

module.exports = UserManagementService;