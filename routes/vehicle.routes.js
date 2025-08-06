const express = require('express');
const { query } = require('express-validator');
const VehicleController = require('../controllers/vehicle.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);

// GET /api/vehicles/search - Comprehensive vehicle search for unregistered visitors
router.get('/search', [
  query('vehicleNo').optional().isString().withMessage('Vehicle number must be a string'),
  query('phoneNo').optional().isString().withMessage('Phone number must be a string'),
  query('visitorName').optional().isString().withMessage('Visitor name must be a string'),
  query('address').optional().isString().withMessage('Address must be a string'),
  query('flatName').optional().isString().withMessage('Flat name must be a string'),
  query('from').optional().custom((value) => {
    // Accept YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY formats
    const dateRegex = /^(\d{4}-\d{2}-\d{2})|(\d{2}-\d{2}-\d{4})|(\d{2}\/\d{2}\/\d{4})$/;
    if (!dateRegex.test(value)) {
      throw new Error('From date must be in format YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY');
    }
    return true;
  }),
  query('to').optional().custom((value) => {
    // Accept YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY formats
    const dateRegex = /^(\d{4}-\d{2}-\d{2})|(\d{2}-\d{2}-\d{4})|(\d{2}\/\d{2}\/\d{4})$/;
    if (!dateRegex.test(value)) {
      throw new Error('To date must be in format YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY');
    }
    return true;
  }),
  query('category').optional().isIn(['registered', 'unregistered', 'all']).withMessage('Category must be registered, unregistered, or all'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100'),
], handleValidationErrors, VehicleController.searchVehicles);

// GET /api/vehicles - Specific search for unregistered visitors only
router.get('/', [
  query('vehicleNo').optional().isString().withMessage('Vehicle number must be a string'),
  query('phoneNo').optional().isString().withMessage('Phone number must be a string'),
  query('visitorName').optional().isString().withMessage('Visitor name must be a string'),
  query('address').optional().isString().withMessage('Address must be a string'),
  query('from').optional().custom((value) => {
    // Accept YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY formats
    const dateRegex = /^(\d{4}-\d{2}-\d{2})|(\d{2}-\d{2}-\d{4})|(\d{2}\/\d{2}\/\d{4})$/;
    if (!dateRegex.test(value)) {
      throw new Error('From date must be in format YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY');
    }
    return true;
  }),
  query('to').optional().custom((value) => {
    // Accept YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY formats
    const dateRegex = /^(\d{4}-\d{2}-\d{2})|(\d{2}-\d{2}-\d{4})|(\d{2}\/\d{2}\/\d{4})$/;
    if (!dateRegex.test(value)) {
      throw new Error('To date must be in format YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY');
    }
    return true;
  }),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100'),
], handleValidationErrors, VehicleController.searchUnregisteredVehicles);

module.exports = router;