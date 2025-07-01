const express = require('express');
const DashboardController = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);

// GET /api/dashboard/summary
router.get('/summary', handleValidationErrors, DashboardController.getDashboardSummary);

// GET /api/dashboard/visitor-details  
router.get('/visitor-details', handleValidationErrors, DashboardController.getVisitorLatestVisitDetails);

module.exports = router;