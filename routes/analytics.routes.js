const express = require('express');
const { query, validationResult } = require('express-validator');
const AnalyticsController = require('../controllers/analytics.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      responseCode: 'E',
      responseMessage: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

router.use(authenticateToken);

// GET /api/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('date').optional().isDate().withMessage('Date must be valid date (YYYY-MM-DD)')
], handleValidationErrors, AnalyticsController.getDashboard);

// GET /api/analytics/visitor-frequency - Get visitor frequency analytics
router.get('/visitor-frequency', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('days').optional().isNumeric().withMessage('Days must be numeric')
], handleValidationErrors, AnalyticsController.getVisitorFrequency);

// GET /api/analytics/peak-hours - Get peak hours analytics
router.get('/peak-hours', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('days').optional().isNumeric().withMessage('Days must be numeric')
], handleValidationErrors, AnalyticsController.getPeakHours);

// GET /api/analytics/flat-wise - Get flat-wise analytics
router.get('/flat-wise', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('days').optional().isNumeric().withMessage('Days must be numeric')
], handleValidationErrors, AnalyticsController.getFlatWise);

// GET /api/analytics/recent-activity - Get recent activity
router.get('/recent-activity', [
  query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric'),
  query('limit').optional().isNumeric().withMessage('Limit must be numeric')
], handleValidationErrors, AnalyticsController.getRecentActivity);

module.exports = router;
