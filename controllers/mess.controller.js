const MessService = require('../services/mess.service');
const responseUtils = require('../utils/constants');

class MessController {

  // ===== MENU MANAGEMENT =====

  // GET /api/mess/menu - Get menu for specific date and meal type
  static async getMenu(req, res) {
    try {
      const { date, mealType } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await MessService.getMenu(userTenantId, date, mealType);
      res.json(result);
    } catch (error) {
      console.error('Error in getMenu:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/mess/menu/week - Get weekly menu
  static async getWeeklyMenu(req, res) {
    try {
      const { startDate } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await MessService.getWeeklyMenu(userTenantId, startDate);
      res.json(result);
    } catch (error) {
      console.error('Error in getWeeklyMenu:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/mess/menu - Create/Update menu
  static async createOrUpdateMenu(req, res) {
    try {
      const { menuDate, mealType, menuItems, menuDescription, isVegetarian, isAvailable } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username || 'System';

      const menuData = {
        menuDate,
        mealType,
        menuItems,
        menuDescription,
        isVegetarian,
        isAvailable
      };

      const result = await MessService.createOrUpdateMenu(userTenantId, menuData, createdBy);
      res.json(result);
    } catch (error) {
      console.error('Error in createOrUpdateMenu:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PUT /api/mess/menu/:menuId - Update menu
  static async updateMenu(req, res) {
    try {
      const { menuId } = req.params;
      const { menuItems, menuDescription, isVegetarian, isAvailable } = req.body;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username || 'System';

      const updateData = {
        menuItems,
        menuDescription,
        isVegetarian,
        isAvailable
      };

      const result = await MessService.updateMenu(userTenantId, parseInt(menuId), updateData, updatedBy);
      res.json(result);
    } catch (error) {
      console.error('Error in updateMenu:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // DELETE /api/mess/menu/:menuId - Delete menu
  static async deleteMenu(req, res) {
    try {
      const { menuId } = req.params;
      const userTenantId = req.user.tenantId;

      const result = await MessService.deleteMenu(userTenantId, parseInt(menuId));
      res.json(result);
    } catch (error) {
      console.error('Error in deleteMenu:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ===== MEAL REGISTRATION MANAGEMENT =====

  // GET /api/mess/meal/list - Get meal registrations list
  static async getMealRegistrationsList(req, res) {
    try {
      const { date, mealType } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await MessService.getMealRegistrationsList(userTenantId, date, mealType);
      res.json(result);
    } catch (error) {
      console.error('Error in getMealRegistrationsList:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/mess/meal/status/:studentId - Get student meal status
  static async getStudentMealStatus(req, res) {
    try {
      const { studentId } = req.params;
      const { date } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await MessService.getStudentMealStatus(userTenantId, parseInt(studentId), date);
      res.json(result);
    } catch (error) {
      console.error('Error in getStudentMealStatus:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ===== SPECIAL MEAL REQUESTS =====

  // GET /api/mess/meal/special-requests - Get special meal requests
  static async getSpecialMealRequests(req, res) {
    try {
      const { date, mealType, status } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await MessService.getSpecialMealRequests(userTenantId, date, mealType, status);
      res.json(result);
    } catch (error) {
      console.error('Error in getSpecialMealRequests:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PUT /api/mess/meal/special-request/:mealId - Update special meal request
  static async updateSpecialMealRequest(req, res) {
    try {
      const { mealId } = req.params;
      const { specialRemarks, status, fulfillmentNotes } = req.body;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username || 'System';

      const updateData = {
        specialRemarks,
        status
      };

      const result = await MessService.updateSpecialMealRequest(userTenantId, parseInt(mealId), updateData, updatedBy);
      res.json(result);
    } catch (error) {
      console.error('Error in updateSpecialMealRequest:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ===== MEAL CONSUMPTION TRACKING =====

  // GET /api/mess/meal/consumption - Get meal consumption details
  static async getMealConsumption(req, res) {
    try {
      const { date, mealType } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await MessService.getMealConsumption(userTenantId, date, mealType);
      res.json(result);
    } catch (error) {
      console.error('Error in getMealConsumption:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/mess/meal/mark-consumption/:mealId - Mark meal as consumed
  static async markMealConsumption(req, res) {
    try {
      const { mealId } = req.params;
      const { consumedBy, notes } = req.body;
      const userTenantId = req.user.tenantId;
      const markedBy = consumedBy || req.user.username || 'Mess Staff';

      const result = await MessService.markMealConsumption(userTenantId, parseInt(mealId), markedBy);
      res.json(result);
    } catch (error) {
      console.error('Error in markMealConsumption:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ===== DASHBOARD AND ANALYTICS =====

  // GET /api/mess/dashboard - Get mess dashboard data
  static async getMessDashboard(req, res) {
    try {
      const { date } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await MessService.getMessDashboard(userTenantId, date);
      res.json(result);
    } catch (error) {
      console.error('Error in getMessDashboard:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/mess/analytics - Get mess analytics
  static async getMessAnalytics(req, res) {
    try {
      const { fromDate, toDate } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await MessService.getMessAnalytics(userTenantId, fromDate, toDate);
      res.json(result);
    } catch (error) {
      console.error('Error in getMessAnalytics:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = MessController;