const VehicleService = require('../services/vehicle.service');
const responseUtils = require('../utils/constants');

class VehicleController {
  static async searchVehicles(req, res) {
    try {
      const { vehicleNo, from, to, tenantId } = req.query;
      const userTenantId = req.user.tenantId;


      const result = await VehicleService.searchVehicles(userTenantId, vehicleNo, from, to);
      res.json(result);
    } catch (error) {
      console.error('Error in vehicle search:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }
}

module.exports = VehicleController;