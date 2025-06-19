const VehicleService = require('../services/vehicle.service');

class VehicleController {
  static async searchVehicles(req, res) {
    try {
      const { vehicleNo, from, to, tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json(ResponseFormatter.error('Access denied for this tenant'));
      }

      const result = await VehicleService.searchVehicles(userTenantId, vehicleNo, from, to);
      res.json(result);
    } catch (error) {
      console.error('Error in vehicle search:', error);
      res.status(500).json(ResponseFormatter.error('Internal server error'));
    }
  }
}

module.exports = VehicleController
