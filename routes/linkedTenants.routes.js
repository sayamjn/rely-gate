const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const LinkedTenantsController = require('../controllers/linkedTenants.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/linked-tenants/my-tenants - Get user's linked tenants
router.get('/my-tenants', 
  LinkedTenantsController.getMyLinkedTenants
);

// GET /api/linked-tenants/details/:id - Get single tenant link details
router.get('/details/:id', [
  param('id').isNumeric().withMessage('Link ID must be numeric')
], handleValidationErrors, LinkedTenantsController.getTenantLinkDetails);

// POST /api/linked-tenants/ - Create new tenant link
router.post('/', [
  body('loginId')
    .notEmpty()
    .withMessage('Login ID is required'),
  body('tenantId')
    .notEmpty()
    .isNumeric()
    .withMessage('Valid tenant ID is required'),
  body('tenantName')
    .notEmpty()
    .withMessage('Tenant name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Tenant name must be between 3 and 200 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email address is required'),
  body('mobile')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be boolean')
], handleValidationErrors, LinkedTenantsController.createTenantLink);

// PUT /api/linked-tenants/:id - Update tenant link
router.put('/:id', [
  param('id').isNumeric().withMessage('Link ID must be numeric'),
  body('tenantName')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Tenant name must be between 3 and 200 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email address is required'),
  body('mobile')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be boolean')
], handleValidationErrors, LinkedTenantsController.updateTenantLink);

// DELETE /api/linked-tenants/:id - Delete tenant link
router.delete('/:id', [
  param('id').isNumeric().withMessage('Link ID must be numeric')
], handleValidationErrors, LinkedTenantsController.deleteTenantLink);

// POST /api/linked-tenants/manage - Link/Unlink tenant dynamically
router.post('/manage', [
  body('loginId')
    .notEmpty()
    .withMessage('Login ID is required'),
  body('action')
    .notEmpty()
    .isIn(['link', 'unlink'])
    .withMessage('Action must be "link" or "unlink"'),
  body('tenantId')
    .notEmpty()
    .isNumeric()
    .withMessage('Valid tenant ID is required'),
  body('tenantName')
    .if(body('action').equals('link'))
    .notEmpty()
    .withMessage('Tenant name is required for linking')
    .isLength({ min: 3, max: 200 })
    .withMessage('Tenant name must be between 3 and 200 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email address is required'),
  body('mobile')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Mobile must be 10 digits')
], handleValidationErrors, LinkedTenantsController.manageTenantsLink);

// GET /api/linked-tenants/all - Admin: Get all tenant links with pagination
router.get('/all', [
  query('page')
    .optional()
    .isNumeric()
    .withMessage('Page must be numeric'),
  query('pageSize')
    .optional()
    .isNumeric()
    .withMessage('Page size must be numeric'),
  query('loginId')
    .optional()
    .notEmpty()
    .withMessage('Login ID cannot be empty'),
  query('tenantId')
    .optional()
    .isNumeric()
    .withMessage('Tenant ID must be numeric')
], handleValidationErrors, authorizeRole('Admin', 'SuperAdmin'), LinkedTenantsController.getAllTenantLinks);

// GET /api/linked-tenants/verify-access/:loginId/:tenantId - Verify tenant access
router.get('/verify-access/:loginId/:tenantId', [
  param('loginId').notEmpty().withMessage('Login ID is required'),
  param('tenantId').isNumeric().withMessage('Tenant ID must be numeric')
], handleValidationErrors, LinkedTenantsController.verifyTenantAccess);

module.exports = router;