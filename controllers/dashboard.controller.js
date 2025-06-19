class DashboardController {
  static async getDashboardSummary(req, res) {
    try {
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json(ResponseFormatter.error('Access denied'));
      }

      const result = await DashboardService.getDashboardSummary(userTenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in dashboard summary:', error);
      res.status(500).json(ResponseFormatter.error('Internal server error'));
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
      res.status(500).json(ResponseFormatter.error('Internal server error'));
    }
  }
}

module.exports = DashboardController