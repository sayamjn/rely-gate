const VehicleService = require('../services/vehicle.service');
const responseUtils = require('../utils/constants');

class VehicleController {
  static async searchVehicles(req, res) {
    try {
      const {
        vehicleNo,
        phoneNo,
        visitorName,
        address,
        flatName,
        from,
        to,
        category = 'all',
        page = 1,
        pageSize = 50
      } = req.query;
      
      const userTenantId = req.user.tenantId;

      const filters = {
        vehicleNo,
        phoneNo,
        visitorName,
        address,
        flatName,
        from,
        to,
        category,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };

      const result = await VehicleService.searchVehicles(userTenantId, filters);
      res.json(result);
    } catch (error) {
      console.error('Error in vehicle search:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }

  static async searchUnregisteredVehicles(req, res) {
    try {
      const {
        vehicleNo,
        phoneNo,
        visitorName,
        address,
        from,
        to,
        page = 1,
        pageSize = 50
      } = req.query;
      
      const userTenantId = req.user.tenantId;

      const filters = {
        vehicleNo,
        phoneNo,
        visitorName,
        address,
        from,
        to,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };

      const result = await VehicleService.searchUnregisteredVehicles(userTenantId, filters);
      res.json(result);
    } catch (error) {
      console.error('Error in unregistered vehicle search:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }
}

module.exports = VehicleController;