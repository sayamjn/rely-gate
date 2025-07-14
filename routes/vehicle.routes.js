const express = require('express');
const { query } = require('express-validator');
const VehicleController = require('../controllers/vehicle.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);

// GET /api/vehicles/search
router.get('/search', [
  query('vehicleNo').optional(),
  query('from').optional().isDate().withMessage('From date must be valid'),
  query('to').optional().isDate().withMessage('To date must be valid'),
], handleValidationErrors, VehicleController.searchVehicles);

module.exports = router;