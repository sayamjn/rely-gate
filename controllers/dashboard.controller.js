const DashboardService = require('../services/dashboard.service');
const responseUtils = require('../utils/constants');

class DashboardController {
  static async getDashboardSummary(req, res) {
    try {
      
      const userTenantId = req.user.tenantId;


      const result = await DashboardService.getDashboardSummary(userTenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in dashboard summary:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }

  static async getVisitorLatestVisitDetails(req, res) {
    try {
      const { tenantId, catId, subCatId } = req.query;
      const userTenantId = req.user.tenantId;


      const result = await DashboardService.getVisitorLatestVisitDetails(
        userTenantId, 
        parseInt(catId), 
        parseInt(subCatId)
      );
      res.json(result);
    } catch (error) {
      console.error('Error in latest visit details:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }
}

module.exports = DashboardController;