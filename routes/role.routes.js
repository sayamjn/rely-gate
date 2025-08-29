const express = require('express');
const { body, query, param } = require('express-validator');
const RoleController = require('../controllers/role.controller');
const { authenticateToken, validateTenantAccess } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createRoleValidation = [
  body('roleCode')
    .notEmpty()
    .withMessage('Role code is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Role code can only contain uppercase letters, numbers, and underscores'),
    
  body('roleName')
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ max: 250 })
    .withMessage('Role name cannot exceed 250 characters'),
    
  body('roleRemark')
    .optional()
    .isLength({ max: 450 })
    .withMessage('Role remark cannot exceed 450 characters'),
    
  body('status')
    .optional()
    .isIn(['Active', 'In-Active'])
    .withMessage('Status must be either Active or In-Active')
];

const updateRoleValidation = [
  param('roleId')
    .isInt({ gt: 0 })
    .withMessage('Valid role ID is required'),
    
  body('roleCode')
    .notEmpty()
    .withMessage('Role code is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Role code can only contain uppercase letters, numbers, and underscores'),
    
  body('roleName')
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ max: 250 })
    .withMessage('Role name cannot exceed 250 characters'),
    
  body('roleRemark')
    .optional()
    .isLength({ max: 450 })
    .withMessage('Role remark cannot exceed 450 characters'),
    
  body('status')
    .isIn(['Active', 'In-Active'])
    .withMessage('Status must be either Active or In-Active')
];

const getRolesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),
    
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
    
  query('status')
    .optional()
    .isIn(['Y', 'N', 'Active', 'In-Active', 'all', ''])
    .withMessage('Status must be Y, N, Active, In-Active, or all')
];

const roleIdValidation = [
  param('roleId')
    .isInt({ gt: 0 })
    .withMessage('Valid role ID is required')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes
router.get('/', getRolesValidation, RoleController.getRoles);
router.get('/active', RoleController.getActiveRoles);
router.get('/:roleId', roleIdValidation, RoleController.getRoleById);
router.post('/', createRoleValidation, RoleController.createRole);
router.put('/:roleId', updateRoleValidation, RoleController.updateRole);
router.put('/:roleId/toggle-status', roleIdValidation, RoleController.toggleRoleStatus);
router.delete('/:roleId', roleIdValidation, RoleController.deleteRole);

module.exports = router;