const { validationResult } = require('express-validator');
const UserManagementService = require('../services/userManagement.service');
const ResponseFormatter = require('../utils/response');

class UserManagementController {
  // Get all users with pagination and filters
  static async getUsers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId } = req.user;
      const { page, pageSize, search, role, status } = req.query;

      console.log("status: ",status)

      const result = await UserManagementService.getUsers({
        tenantId,
        page,
        pageSize,
        search,
        role,
        status
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getUsers controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId } = req.user;
      const { loginId } = req.params;

      const result = await UserManagementService.getUserById({
        loginId: parseInt(loginId),
        tenantId
      });

      if (result.responseCode === 'E') {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getUserById controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Create new user
  static async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId, loginId: createdBy } = req.user;
      const {
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
        status
      } = req.body;

      // Handle uploaded profile image
      let profileImagePath = null;
      if (req.file) {
        profileImagePath = req.file.path;
      }

      const result = await UserManagementService.createUser({
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
        status,
        profileImagePath,
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
      console.error('Error in createUser controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId, loginId: updatedBy } = req.user;
      const { loginId } = req.params;
      const {
        userName,
        firstName,
        middleName,
        lastName,
        displayName,
        email,
        mobile,
        role,
        status
      } = req.body;

      // Handle uploaded profile image
      let profileImagePath = null;
      if (req.file) {
        profileImagePath = req.file.path;
      }

      console.log("req.file: ", req.file);
      console.log("req.body: ", req.body);
      console.log("profileImagePath: ", profileImagePath)

      const result = await UserManagementService.updateUser({
        loginId: parseInt(loginId),
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
      });

      console.log("result: ",result)

      if (result.responseCode === 'E') {
        return res.status(404).json(result);
      }

      if (result.responseCode === 'F') {
        return res.status(409).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in updateUser controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Reset user password
  static async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId, loginId: updatedBy } = req.user;
      const { loginId } = req.params;
      const { newPassword, retypePassword } = req.body;

      const result = await UserManagementService.resetPassword({
        loginId: parseInt(loginId),
        tenantId,
        newPassword,
        retypePassword,
        updatedBy
      });

      if (result.responseCode === 'E') {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in resetPassword controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId, loginId: updatedBy } = req.user;
      const { loginId } = req.params;

      const result = await UserManagementService.deleteUser({
        loginId: parseInt(loginId),
        tenantId,
        updatedBy
      });

      if (result.responseCode === 'E') {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteUser controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Get available roles
  static async getUserRoles(req, res) {
    try {
      const { tenantId } = req.user;

      const result = await UserManagementService.getUserRoles({
        tenantId
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getUserRoles controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  // Toggle user status
  static async toggleUserStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ResponseFormatter.error('Validation failed', errors.array())
        );
      }

      const { tenantId, loginId: updatedBy } = req.user;
      const { loginId } = req.params;

      const result = await UserManagementService.toggleUserStatus({
        loginId: parseInt(loginId),
        tenantId,
        updatedBy
      });

      if (result.responseCode === 'E') {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in toggleUserStatus controller:', error);
      return res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }
}

module.exports = UserManagementController;