const AnalyticsService = require('../services/analytics.service');

class AnalyticsController {
  // GET /api/analytics/dashboard
  static async getDashboard(req, res) {
    try {
      const { tenantId, date } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId, days = 30 } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId, days = 7 } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId, days = 30 } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId, limit = 20 } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId, days = 7 } = req.query;
      // const userTenantId = req.user.tenantId;

      // if (tenantId && parseInt(tenantId) !== userTenantId) {
      //   return res.status(403).json({
      //     responseCode: 'E',
      //     responseMessage: 'Access denied for this tenant'
      //   });
      // }

      const result = await AnalyticsService.getGatePassAnalytics(
        tenantId, 
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
      const { tenantId, days = 7 } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId, days = 7 } = req.query;
      // const userTenantId = req.user.tenantId;

      const result = await AnalyticsService.getGatePassExitsByPurpose(
        tenantId, 
        parseInt(days)
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
}

module.exports = AnalyticsController;