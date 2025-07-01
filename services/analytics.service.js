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
          pendingCheckin: parseInt(analytics.pending_checkin) || 0,
          pendingCheckout: parseInt(analytics.pending_checkout) || 0,
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

  // // Get gate pass trend data for charts
  // static async getGatePassTrends(tenantId, days = 7) {
  //   try {
  //     const trends = await AnalyticsModel.getGatePassTrendData(tenantId, days);
      
  //     const formattedTrends = trends.map(trend => ({
  //       date: trend.date,
  //       totalCreated: parseInt(trend.total_created) || 0,
  //       approved: parseInt(trend.approved) || 0,
  //       checkedIn: parseInt(trend.checked_in) || 0,
  //       completed: parseInt(trend.completed) || 0
  //     }));

  //     return {
  //       responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
  //       data: formattedTrends,
  //       responseMessage: 'Gate pass trends retrieved successfully'
  //     };
  //   } catch (error) {
  //     console.error('Error getting gate pass trends:', error);
  //     return {
  //       responseCode: responseUtils.RESPONSE_CODES.ERROR,
  //       responseMessage: 'Internal server error',
  //       error: process.env.NODE_ENV === 'development' ? error.message : undefined
  //     };
  //   }
  // }

  // // Get gate pass purpose statistics
  // static async getGatePassPurposeStats(tenantId, days = 7) {
  //   try {
  //     const purposeStats = await AnalyticsModel.getGatePassPurposeStats(tenantId, days);
      
  //     const formattedStats = purposeStats.map(stat => ({
  //       purposeId: parseInt(stat.purpose_id),
  //       purposeName: stat.purpose_name,
  //       totalCount: parseInt(stat.total_count) || 0,
  //       pendingCount: parseInt(stat.pending_count) || 0,
  //       approvedCount: parseInt(stat.approved_count) || 0,
  //       checkedInCount: parseInt(stat.checkedin_count) || 0,
  //       completedCount: parseInt(stat.completed_count) || 0,
  //       completionRate: stat.total_count > 0 ? 
  //         ((parseInt(stat.completed_count) / parseInt(stat.total_count)) * 100).toFixed(1) : 0
  //     }));

  //     return {
  //       responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
  //       data: formattedStats,
  //       responseMessage: 'Gate pass purpose statistics retrieved successfully'
  //     };
  //   } catch (error) {
  //     console.error('Error getting gate pass purpose stats:', error);
  //     return {
  //       responseCode: responseUtils.RESPONSE_CODES.ERROR,
  //       responseMessage: 'Internal server error',
  //       error: process.env.NODE_ENV === 'development' ? error.message : undefined
  //     };
  //   }
  // }
}

module.exports = AnalyticsService;