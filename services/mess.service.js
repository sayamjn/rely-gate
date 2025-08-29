const MessModel = require('../models/mess.model');
const ResponseFormatter = require('../utils/response');

class MessService {

  // ===== MENU MANAGEMENT =====

  // Get menu for specific date
  static async getMenu(tenantId, menuDate, mealType = null) {
    try {
      const targetDate = menuDate || new Date().toISOString().split('T')[0];
      const menus = await MessModel.getMenu(tenantId, targetDate, mealType);
      
      if (menus.length === 0) {
        return ResponseFormatter.success('No menu found for this date', {
          date: targetDate,
          mealType: mealType || 'all',
          menus: []
        });
      }

      return ResponseFormatter.success('Menu retrieved successfully', {
        date: targetDate,
        mealType: mealType || 'all',
        menus
      });

    } catch (error) {
      console.error('Error in getMenu:', error);
      return ResponseFormatter.error('Failed to retrieve menu', error.message);
    }
  }

  // Get weekly menu
  static async getWeeklyMenu(tenantId, startDate) {
    try {
      const targetStartDate = startDate || new Date().toISOString().split('T')[0];
      const menus = await MessModel.getWeeklyMenu(tenantId, targetStartDate);
      
      // Group menus by date
      const weeklyMenu = {};
      menus.forEach(menu => {
        const dateKey = menu.menuDate.toISOString().split('T')[0];
        if (!weeklyMenu[dateKey]) {
          weeklyMenu[dateKey] = {};
        }
        weeklyMenu[dateKey][menu.mealType] = menu;
      });

      return ResponseFormatter.success('Weekly menu retrieved successfully', {
        startDate: targetStartDate,
        weeklyMenu,
        totalMenus: menus.length
      });

    } catch (error) {
      console.error('Error in getWeeklyMenu:', error);
      return ResponseFormatter.error('Failed to retrieve weekly menu', error.message);
    }
  }

  // Create or update menu
  static async createOrUpdateMenu(tenantId, menuData, createdBy) {
    try {
      const menu = await MessModel.createOrUpdateMenu(tenantId, menuData, createdBy);
      
      return ResponseFormatter.success('Menu created/updated successfully', {
        menu,
        action: 'upsert'
      });

    } catch (error) {
      console.error('Error in createOrUpdateMenu:', error);
      return ResponseFormatter.error('Failed to create/update menu', error.message);
    }
  }

  // Update existing menu
  static async updateMenu(tenantId, menuId, updateData, updatedBy) {
    try {
      const menu = await MessModel.updateMenu(tenantId, menuId, updateData, updatedBy);
      
      if (!menu) {
        return ResponseFormatter.error('Menu not found or no changes made');
      }

      return ResponseFormatter.success('Menu updated successfully', {
        menu
      });

    } catch (error) {
      console.error('Error in updateMenu:', error);
      return ResponseFormatter.error('Failed to update menu', error.message);
    }
  }

  // Delete menu
  static async deleteMenu(tenantId, menuId) {
    try {
      const deleted = await MessModel.deleteMenu(tenantId, menuId);
      
      if (!deleted) {
        return ResponseFormatter.error('Menu not found');
      }

      return ResponseFormatter.success('Menu deleted successfully', {
        menuId,
        deleted: true
      });

    } catch (error) {
      console.error('Error in deleteMenu:', error);
      return ResponseFormatter.error('Failed to delete menu', error.message);
    }
  }

  // ===== MEAL REGISTRATION MANAGEMENT =====

  // Get meal registrations list
  static async getMealRegistrationsList(tenantId, mealDate, mealType = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      const registrations = await MessModel.getMealRegistrationsList(tenantId, targetDate, mealType);
      
      // Group by meal type if no specific meal type requested
      let groupedData = {};
      if (!mealType) {
        registrations.forEach(reg => {
          if (!groupedData[reg.mealType]) {
            groupedData[reg.mealType] = [];
          }
          groupedData[reg.mealType].push(reg);
        });
      }

      return ResponseFormatter.success('Meal registrations retrieved successfully', {
        date: targetDate,
        mealType: mealType || 'all',
        totalRegistrations: registrations.length,
        registrations: mealType ? registrations : groupedData,
        summary: {
          total: registrations.length,
          consumed: registrations.filter(r => r.isConsumed === 'Y').length,
          pending: registrations.filter(r => r.isConsumed === 'N').length,
          special: registrations.filter(r => r.isSpecial === 'Y').length
        }
      });

    } catch (error) {
      console.error('Error in getMealRegistrationsList:', error);
      return ResponseFormatter.error('Failed to retrieve meal registrations', error.message);
    }
  }

  // Get student meal status
  static async getStudentMealStatus(tenantId, studentId, mealDate) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      const studentMeals = await MessModel.getStudentMealStatus(tenantId, studentId, targetDate);
      
      return ResponseFormatter.success('Student meal status retrieved successfully', {
        studentId,
        date: targetDate,
        meals: studentMeals,
        totalMeals: studentMeals.length,
        consumedMeals: studentMeals.filter(m => m.isConsumed === 'Y').length,
        specialRequests: studentMeals.filter(m => m.isSpecial === 'Y').length
      });

    } catch (error) {
      console.error('Error in getStudentMealStatus:', error);
      return ResponseFormatter.error('Failed to retrieve student meal status', error.message);
    }
  }

  // ===== SPECIAL MEAL REQUESTS =====

  // Get special meal requests
  static async getSpecialMealRequests(tenantId, mealDate = null, mealType = null, status = null) {
    try {
      const requests = await MessModel.getSpecialMealRequests(tenantId, mealDate, mealType, status);
      
      // Group by status for summary
      const statusSummary = {
        pending: requests.filter(r => r.status === 'confirmed' && r.isConsumed === 'N').length,
        fulfilled: requests.filter(r => r.status === 'confirmed' && r.isConsumed === 'Y').length,
        total: requests.length
      };

      return ResponseFormatter.success('Special meal requests retrieved successfully', {
        date: mealDate || 'all',
        mealType: mealType || 'all',
        status: status || 'all',
        totalRequests: requests.length,
        requests,
        summary: statusSummary
      });

    } catch (error) {
      console.error('Error in getSpecialMealRequests:', error);
      return ResponseFormatter.error('Failed to retrieve special meal requests', error.message);
    }
  }

  // Update special meal request
  static async updateSpecialMealRequest(tenantId, mealId, updateData, updatedBy) {
    try {
      const updatedRequest = await MessModel.updateSpecialMealRequest(tenantId, mealId, updateData, updatedBy);
      
      if (!updatedRequest) {
        return ResponseFormatter.error('Special meal request not found');
      }

      return ResponseFormatter.success('Special meal request updated successfully', {
        mealId,
        updatedRequest
      });

    } catch (error) {
      console.error('Error in updateSpecialMealRequest:', error);
      return ResponseFormatter.error('Failed to update special meal request', error.message);
    }
  }

  // ===== MEAL CONSUMPTION TRACKING =====

  // Get meal consumption details
  static async getMealConsumption(tenantId, mealDate, mealType = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      const consumption = await MessModel.getMealConsumption(tenantId, targetDate, mealType);
      
      // Calculate consumption statistics
      const stats = {
        total: consumption.length,
        consumed: consumption.filter(m => m.isConsumed === 'Y').length,
        pending: consumption.filter(m => m.isConsumed === 'N').length,
        special: consumption.filter(m => m.isSpecial === 'Y').length,
        consumptionRate: consumption.length > 0 ? 
          ((consumption.filter(m => m.isConsumed === 'Y').length / consumption.length) * 100).toFixed(2) : 0
      };

      return ResponseFormatter.success('Meal consumption data retrieved successfully', {
        date: targetDate,
        mealType: mealType || 'all',
        consumption,
        statistics: stats
      });

    } catch (error) {
      console.error('Error in getMealConsumption:', error);
      return ResponseFormatter.error('Failed to retrieve meal consumption data', error.message);
    }
  }

  // Mark meal as consumed
  static async markMealConsumption(tenantId, mealId, consumedBy) {
    try {
      const markedMeal = await MessModel.markMealConsumption(tenantId, mealId, consumedBy);
      
      if (!markedMeal) {
        return ResponseFormatter.error('Meal not found or already consumed');
      }

      return ResponseFormatter.success('Meal marked as consumed successfully', {
        mealId,
        markedMeal,
        consumedBy,
        consumedAt: markedMeal.consumedTime
      });

    } catch (error) {
      console.error('Error in markMealConsumption:', error);
      return ResponseFormatter.error('Failed to mark meal consumption', error.message);
    }
  }

  // ===== DASHBOARD AND ANALYTICS =====

  // Get mess dashboard data
  static async getMessDashboard(tenantId, mealDate) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      const dashboardData = await MessModel.getMessDashboardData(tenantId, targetDate);
      
      // Calculate totals across all meals
      const totals = dashboardData.reduce((acc, meal) => {
        acc.totalRegistrations += parseInt(meal.totalRegistrations);
        acc.totalConsumed += parseInt(meal.totalConsumed);
        acc.totalPending += parseInt(meal.totalPending);
        acc.specialRequests += parseInt(meal.specialRequests);
        acc.specialConsumed += parseInt(meal.specialConsumed);
        return acc;
      }, {
        totalRegistrations: 0,
        totalConsumed: 0,
        totalPending: 0,
        specialRequests: 0,
        specialConsumed: 0
      });

      totals.overallConsumptionRate = totals.totalRegistrations > 0 ? 
        ((totals.totalConsumed / totals.totalRegistrations) * 100).toFixed(2) : 0;

      return ResponseFormatter.success('Mess dashboard data retrieved successfully', {
        date: targetDate,
        mealWiseData: dashboardData,
        totals
      });

    } catch (error) {
      console.error('Error in getMessDashboard:', error);
      return ResponseFormatter.error('Failed to retrieve mess dashboard data', error.message);
    }
  }

  // Get mess analytics
  static async getMessAnalytics(tenantId, fromDate, toDate) {
    try {
      const endDate = toDate || new Date().toISOString().split('T')[0];
      const startDate = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const analytics = await MessModel.getMessAnalytics(tenantId, startDate, endDate);
      
      // Calculate summary statistics
      const summary = analytics.reduce((acc, record) => {
        acc.totalRegistrations += parseInt(record.totalRegistrations);
        acc.totalConsumed += parseInt(record.totalConsumed);
        acc.totalWasted += parseInt(record.totalWasted);
        acc.specialRequests += parseInt(record.specialRequests);
        return acc;
      }, {
        totalRegistrations: 0,
        totalConsumed: 0,
        totalWasted: 0,
        specialRequests: 0
      });

      summary.overallConsumptionRate = summary.totalRegistrations > 0 ? 
        ((summary.totalConsumed / summary.totalRegistrations) * 100).toFixed(2) : 0;
      summary.wastePercentage = summary.totalRegistrations > 0 ? 
        ((summary.totalWasted / summary.totalRegistrations) * 100).toFixed(2) : 0;

      return ResponseFormatter.success('Mess analytics retrieved successfully', {
        fromDate: startDate,
        toDate: endDate,
        analytics,
        summary,
        totalRecords: analytics.length
      });

    } catch (error) {
      console.error('Error in getMessAnalytics:', error);
      return ResponseFormatter.error('Failed to retrieve mess analytics', error.message);
    }
  }
}

module.exports = MessService;