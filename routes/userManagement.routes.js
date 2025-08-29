const express = require('express');
const { body, query, param } = require('express-validator');
const UserManagementController = require('../controllers/userManagement.controller');
const { authenticateToken, validateTenantAccess } = require('../middleware/auth');
const { uploadUserPhoto, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('userName')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
    
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name cannot exceed 100 characters'),
    
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name cannot exceed 100 characters'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('mobile')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
    
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('retypePassword')
    .notEmpty()
    .withMessage('Please confirm your password'),
    
  body('role')
    .notEmpty()
    .withMessage('Role is required'),
    
  body('status')
    .optional()
    .isIn(['Active', 'In-Active'])
    .withMessage('Status must be either Active or In-Active')
];

const updateUserValidation = [
  param('loginId')
    .isInt({ gt: 0 })
    .withMessage('Valid login ID is required'),
    
  body('userName')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
    
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name cannot exceed 100 characters'),
    
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name cannot exceed 100 characters'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('mobile')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
    
  body('role')
    .notEmpty()
    .withMessage('Role is required'),
    
  body('status')
    .isIn(['Active', 'In-Active'])
    .withMessage('Status must be either Active or In-Active')
];

const resetPasswordValidation = [
  param('loginId')
    .isInt({ gt: 0 })
    .withMessage('Valid login ID is required'),
    
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('retypePassword')
    .notEmpty()
    .withMessage('Please confirm your password')
];

const getUsersValidation = [
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
    
  query('role')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Role cannot exceed 50 characters'),
    
  query('status')
    .optional()
    .isIn(['Y', 'N', 'Active', 'In-Active', ''])
    .withMessage('Status must be Y, N, Active, or In-Active')
];

const userIdValidation = [
  param('loginId')
    .isInt({ gt: 0 })
    .withMessage('Valid login ID is required')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes
router.get('/', getUsersValidation, UserManagementController.getUsers);
router.get('/roles', UserManagementController.getUserRoles);
router.get('/:loginId', userIdValidation, UserManagementController.getUserById);
router.post('/', uploadUserPhoto, handleUploadError, createUserValidation, UserManagementController.createUser);
router.put('/:loginId', uploadUserPhoto, handleUploadError, updateUserValidation, UserManagementController.updateUser);
router.put('/:loginId/password', resetPasswordValidation, UserManagementController.resetPassword);
router.put('/:loginId/toggle-status', userIdValidation, UserManagementController.toggleUserStatus);
router.delete('/:loginId', userIdValidation, UserManagementController.deleteUser);

module.exports = router;