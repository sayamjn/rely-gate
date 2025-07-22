const express = require('express');
const { query, validationResult } = require('express-validator');
const AnalyticsController = require('../controllers/analytics.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);

// GET /api/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', [
  query('date').optional().isDate().withMessage('Date must be valid date (YYYY-MM-DD)')
], handleValidationErrors, AnalyticsController.getDashboard);

// GET /api/analytics/visitor-frequency - Get visitor frequency analytics
router.get('/visitor-frequency', [
  query('days').optional().isNumeric().withMessage('Days must be numeric')
], handleValidationErrors, AnalyticsController.getVisitorFrequency);

// GET /api/analytics/peak-hours - Get peak hours analytics
router.get('/peak-hours', [
  query('days').optional().isNumeric().withMessage('Days must be numeric')
], handleValidationErrors, AnalyticsController.getPeakHours);

// GET /api/analytics/flat-wise - Get flat-wise analytics
router.get('/flat-wise', [
  query('days').optional().isNumeric().withMessage('Days must be numeric')
], handleValidationErrors, AnalyticsController.getFlatWise);

// GET /api/analytics/recent-activity - Get recent activity
router.get('/recent-activity', [
  query('limit').optional().isNumeric().withMessage('Limit must be numeric')
], handleValidationErrors, AnalyticsController.getRecentActivity);

// GET /api/analytics/gatepass - Get gate pass analytics
router.get('/gatepass', [
  query('days').optional().isNumeric().withMessage('Days must be numeric')
], handleValidationErrors, AnalyticsController.getGatePassAnalytics);

// GET /api/analytics/gatepass/entries-by-purpose - Get gate pass entries by purpose
router.get('/gatepass/entries-by-purpose', [
  query('days').optional().isNumeric().withMessage('Days must be numeric')
], handleValidationErrors, AnalyticsController.getGatePassEntriesByPurpose);

// GET /api/analytics/gatepass/exits-by-purpose - Get gate pass exits by purpose
router.get('/gatepass/exits-by-purpose', [
  query('fromDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('FromDate must be in DD/MM/YYYY format'),
  query('toDate').optional().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('ToDate must be in DD/MM/YYYY format')
], handleValidationErrors, AnalyticsController.getGatePassExitsByPurpose);

// GET /api/analytics/GetTrendByCategory - Get trend analytics by category (Student, Bus, Visitor, Staff)
router.get('/GetTrendByCategory', [
  query('fromDate').notEmpty().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('FromDate is required and must be in DD/MM/YYYY format'),
  query('toDate').notEmpty().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('ToDate is required and must be in DD/MM/YYYY format')
], handleValidationErrors, AnalyticsController.getTrendByCategory);

// GET /api/analytics/GetOverView - Get overview analytics by visitor subcategory
router.get('/GetOverView', [
  query('fromDate').notEmpty().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('FromDate is required and must be in DD/MM/YYYY format'),
  query('toDate').notEmpty().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('ToDate is required and must be in DD/MM/YYYY format')
], handleValidationErrors, AnalyticsController.getOverView);

// GET /api/analytics/GetTrendByPurpose - Get trend analytics by purpose/subcategory or category
router.get('/GetTrendByPurpose', [
  query('fromDate').notEmpty().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('FromDate is required and must be in DD/MM/YYYY format'),
  query('toDate').notEmpty().matches(/^\d{2}\/\d{2}\/\d{4}$/).withMessage('ToDate is required and must be in DD/MM/YYYY format'),
  query('subCatID').optional().isNumeric().withMessage('SubCatID must be numeric'),
  query('catID').optional().isNumeric().withMessage('CatID must be numeric')
], handleValidationErrors, AnalyticsController.getTrendByPurpose);

// GET /api/analytics/GetDashboardSummary - Get dashboard summary analytics
router.get('/GetDashboardSummary', [], handleValidationErrors, AnalyticsController.getDashboardSummary);

module.exports = router;
