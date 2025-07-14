const AnalyticsService = require('../services/analytics.service');

class AnalyticsController {
  // GET /api/analytics/dashboard
  static async getDashboard(req, res) {
    try {
      const { date } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await AnalyticsService.getDashboardAnalytics(userTenantId, date);
      res.json(result);
    } catch (error) {
      console.error('Error in getDashboard:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/analytics/visitor-frequency
  static async getVisitorFrequency(req, res) {
    try {
      const { days = 30 } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await AnalyticsService.getVisitorFrequencyAnalytics(
        userTenantId, 
        parseInt(days)
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getVisitorFrequency:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/analytics/peak-hours
  static async getPeakHours(req, res) {
    try {
      const { days = 7 } = req.query;
      const userTenantId = req.user.tenantId;


      const result = await AnalyticsService.getPeakHoursAnalytics(
        userTenantId, 
        parseInt(days)
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getPeakHours:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/analytics/flat-wise
  static async getFlatWise(req, res) {
    try {
      const { days = 30 } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await AnalyticsService.getFlatWiseAnalytics(
        userTenantId, 
        parseInt(days)
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getFlatWise:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/analytics/recent-activity
  static async getRecentActivity(req, res) {
    try {
      const { limit = 20 } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await AnalyticsService.getRecentActivity(
        userTenantId, 
        parseInt(limit)
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/analytics/gatepass - Get gate pass analytics
  static async getGatePassAnalytics(req, res) {
    try {
      const { days = 7 } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await AnalyticsService.getGatePassAnalytics(
        userTenantId, 
        parseInt(days)
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getGatePassAnalytics:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/analytics/gatepass/entries-by-purpose - Get gate pass entries by purpose
  static async getGatePassEntriesByPurpose(req, res) {
    try {
      const { days = 7 } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await AnalyticsService.getGatePassEntriesByPurpose(
        userTenantId, 
        parseInt(days)
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getGatePassEntriesByPurpose:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/analytics/gatepass/exits-by-purpose - Get gate pass exits by purpose
  static async getGatePassExitsByPurpose(req, res) {
    try {
      const { fromDate, toDate } = req.query;
      const userTenantId = req.user.tenantId;

      // Convert DD/MM/YYYY format to YYYY-MM-DD for PostgreSQL
      const convertToPostgresDate = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };

      const pgFromDate = convertToPostgresDate(fromDate);
      const pgToDate = convertToPostgresDate(toDate);

      const result = await AnalyticsService.getGatePassExitsByPurpose(
        userTenantId, 
        pgFromDate,
        pgToDate
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getGatePassExitsByPurpose:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/analytics/GetTrendByCategory - Get trend analytics by category
  static async getTrendByCategory(req, res) {
    try {
      const { fromDate, toDate } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await AnalyticsService.getTrendByCategory(
        parseInt(userTenantId),
        fromDate,
        toDate
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getTrendByCategory:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/analytics/GetOverView - Get overview analytics by visitor subcategory
  static async getOverView(req, res) {
    try {
      const { fromDate, toDate } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await AnalyticsService.getOverView(
        parseInt(userTenantId),
        fromDate,
        toDate
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getOverView:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/analytics/GetTrendByPurpose - Get trend analytics by purpose/subcategory
  static async getTrendByPurpose(req, res) {
    try {
      const { fromDate, toDate, subCatID } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await AnalyticsService.getTrendByPurpose(
        parseInt(userTenantId),
        fromDate,
        toDate,
        parseInt(subCatID)
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getTrendByPurpose:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/analytics/GetDashboardSummary - Get dashboard summary analytics
  static async getDashboardSummary(req, res) {
    try {
      const userTenantId = req.user.tenantId;

      const result = await AnalyticsService.getDashboardSummary(
        parseInt(userTenantId)
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getDashboardSummary:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }
}

module.exports = AnalyticsController;