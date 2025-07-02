const VisitorModel = require('../models/visitor.model');
const AnalyticsModel = require('../models/analytics.model');
const FileService = require('./file.service');
const responseUtils = require('../utils/constants');

class AnalyticsService {
  // Get comprehensive dashboard analytics
  static async getDashboardAnalytics(tenantId, date = null) {
    try {
      const analytics = await VisitorModel.getDashboardAnalytics(tenantId, date);
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: {
          date: date || new Date().toISOString().split('T')[0],
          summary: analytics.today_stats || {
            total_visits_today: 0,
            currently_inside: 0,
            completed_visits_today: 0
          },
          categoryBreakdown: analytics.category_stats || [],
          weeklyTrend: analytics.weekly_stats || [],
          unregisteredToday: analytics.unregistered_today || 0
        }
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get visitor frequency analytics
  static async getVisitorFrequencyAnalytics(tenantId, days = 30) {
    try {
      const analytics = await VisitorModel.getVisitorFrequencyAnalytics(tenantId, days);
      
      const analyticsWithUrls = analytics.map(visitor => ({
        ...visitor,
        photoUrl: visitor.photoname ? 
          FileService.getFileUrl(FileService.categories.REGISTERED_VISITORS, visitor.photoname) : null,
        avg_duration_hours: visitor.avg_duration_hours ? 
          parseFloat(visitor.avg_duration_hours).toFixed(2) : null
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: analyticsWithUrls,
        summary: {
          totalAnalyzed: analyticsWithUrls.length,
          topVisitor: analyticsWithUrls[0] || null,
          averageVisitsPerVisitor: analyticsWithUrls.length > 0 ? 
            (analyticsWithUrls.reduce((sum, v) => sum + parseInt(v.visit_count), 0) / analyticsWithUrls.length).toFixed(1) : 0
        }
      };
    } catch (error) {
      console.error('Error getting visitor frequency analytics:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get peak hours analytics
  static async getPeakHoursAnalytics(tenantId, days = 7) {
    try {
      const analytics = await VisitorModel.getPeakHoursAnalytics(tenantId, days);
      
      const formattedAnalytics = analytics.map(hour => ({
        hour: parseInt(hour.hour_of_day),
        hourLabel: `${hour.hour_of_day}:00`,
        visit_count: parseInt(hour.visit_count),
        avg_duration_hours: hour.avg_duration_hours ? 
          parseFloat(hour.avg_duration_hours).toFixed(2) : null
      }));

      const peakHour = formattedAnalytics.reduce((max, current) => 
        current.visit_count > max.visit_count ? current : max, 
        formattedAnalytics[0] || { visit_count: 0 }
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: formattedAnalytics,
        summary: {
          peakHour: peakHour,
          totalHoursAnalyzed: formattedAnalytics.length,
          averageVisitsPerHour: formattedAnalytics.length > 0 ? 
            (formattedAnalytics.reduce((sum, h) => sum + h.visit_count, 0) / formattedAnalytics.length).toFixed(1) : 0
        }
      };
    } catch (error) {
      console.error('Error getting peak hours analytics:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get flat-wise analytics
  static async getFlatWiseAnalytics(tenantId, days = 30) {
    try {
      const analytics = await VisitorModel.getFlatWiseAnalytics(tenantId, days);
      
      const formattedAnalytics = analytics.map(flat => ({
        ...flat,
        total_visits: parseInt(flat.total_visits),
        unique_visitors: parseInt(flat.unique_visitors),
        avg_duration_hours: flat.avg_duration_hours ? 
          parseFloat(flat.avg_duration_hours).toFixed(2) : null,
        visitor_frequency: flat.unique_visitors > 0 ? 
          (flat.total_visits / flat.unique_visitors).toFixed(1) : 0
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: formattedAnalytics,
        summary: {
          totalFlatsWithVisitors: formattedAnalytics.length,
          totalVisitsAnalyzed: formattedAnalytics.reduce((sum, f) => sum + f.total_visits, 0),
          busiestFlat: formattedAnalytics[0] || null
        }
      };
    } catch (error) {
      console.error('Error getting flat-wise analytics:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get recent activity
  static async getRecentActivity(tenantId, limit = 20) {
    try {
      const activities = await VisitorModel.getRecentActivity(tenantId, limit);
      
      const activitiesWithUrls = activities.map(activity => ({
        ...activity,
        photoUrl: activity.photoname ? 
          FileService.getFileUrl(FileService.categories.REGISTERED_VISITORS, activity.photoname) : null,
        duration: activity.intime && activity.outtime ? 
          this.calculateDuration(activity.intime, activity.outtime) : null
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: activitiesWithUrls,
        count: activitiesWithUrls.length
      };
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Helper method to calculate duration
  static calculateDuration(inTime, outTime) {
    try {
      const inDate = new Date(inTime);
      const outDate = new Date(outTime);
      const diffMs = outDate - inDate;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        hours: diffHours,
        minutes: diffMinutes,
        totalMinutes: Math.floor(diffMs / (1000 * 60)),
        formatted: `${diffHours}h ${diffMinutes}m`
      };
    } catch {
      return null;
    }
  }

  // Get gate pass analytics (counts for dashboard)
  static async getGatePassAnalytics(tenantId, days = 7) {
    try {
      const analytics = await AnalyticsModel.getGatePassAnalytics(tenantId, days);
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: {
          pendingApproval: parseInt(analytics.pending_approval) || 0,
          checkedOutGatePass: parseInt(analytics.checked_out_count) || 0,
          checkedInGatePass: parseInt(analytics.checked_in_count) || 0,
          completed: parseInt(analytics.completed) || 0,
          totalGatePasses: parseInt(analytics.total_gatepasses) || 0,
          todayTotal: parseInt(analytics.today_total) || 0
        },
        responseMessage: 'Gate pass analytics retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting gate pass analytics:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get gate pass entries by purpose for charts
  static async getGatePassEntriesByPurpose(tenantId, days = 7) {
    try {
      const entriesData = await AnalyticsModel.getGatePassEntriesByPurpose(tenantId, days);
      
      const formattedData = entriesData.map(entry => ({
        purposeName: entry.purpose_name,
        checkInCount: parseInt(entry.checkin_count) || 0,
        checkOutCount: parseInt(entry.checkout_count) || 0,
        totalEntries: parseInt(entry.total_entries) || 0
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: formattedData,
        responseMessage: 'Gate pass entries by purpose retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting gate pass entries by purpose:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get gate pass exits by purpose for charts
  static async getGatePassExitsByPurpose(tenantId, fromDate = null, toDate = null) {
    try {
      const exitsData = await AnalyticsModel.getGatePassExitsByPurpose(tenantId, fromDate, toDate);
      
      const formattedData = exitsData.map(exit => ({
        purposeName: exit.purpose_name,
        exitCount: parseInt(exit.exit_count) || 0
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: formattedData,
        responseMessage: 'Gate pass exits by purpose retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting gate pass exits by purpose:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }
}

module.exports = AnalyticsService;