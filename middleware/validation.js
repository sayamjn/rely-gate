const { body, query, param, validationResult } = require('express-validator');
const responseUtils = require('../utils/constants');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Common validation rules
const validateTenantId = query('tenantId').optional().isNumeric().withMessage('TenantId must be numeric');
const validateMobile = body('mobile').notEmpty().matches(/^\d{10}$/).withMessage('Mobile must be 10 digits');
const validateOTP = body('otpNumber').notEmpty().matches(/^\d{6}$/).withMessage('OTP must be 6 digits');

// Visitor validation rules
const visitorValidation = {
  sendOTP: [
    validateMobile,
    validateTenantId,
    body('visitorTypeId').optional().isNumeric().withMessage('VisitorTypeId must be numeric')
  ],
  
  verifyOTP: [
    body('refId').notEmpty().isNumeric().withMessage('RefId is required and must be numeric'),
    validateOTP,
    validateMobile
  ],
  
  createUnregistered: [
    body('fname').notEmpty().withMessage('First name is required'),
    validateMobile,
    body('flatName').notEmpty().withMessage('Flat name is required'),
    body('visitorCatId').notEmpty().isNumeric().withMessage('Visitor category ID is required'),
    body('visitorSubCatId').notEmpty().isNumeric().withMessage('Visitor subcategory ID is required'),
    validateTenantId
  ],
  
  createRegistered: [
    body('vistorName').notEmpty().withMessage('Visitor name is required'),
    validateMobile,
    body('visitorCatId').notEmpty().isNumeric().withMessage('Visitor category ID is required'),
    body('visitorSubCatId').notEmpty().isNumeric().withMessage('Visitor subcategory ID is required'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    validateTenantId
  ]
};

module.exports = {
  handleValidationErrors,
  validateTenantId,
  validateMobile,
  validateOTP,
  visitorValidation
};