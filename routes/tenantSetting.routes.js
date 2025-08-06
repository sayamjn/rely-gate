const express = require('express');
const { body, validationResult } = require('express-validator');
const TenantSettingController = require('../controllers/tenantSetting.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { uploadLogo, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/tenant-settings - Get current tenant settings
router.get('/', [
], handleValidationErrors, TenantSettingController.getTenantSettings);

// POST /api/tenant-settings - Create tenant settings for the first time
router.post('/', [
  body('entityName')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 450 })
    .withMessage('Entity name must be 450 characters or less'),
  
  body('entityAddress1')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 450 })
    .withMessage('Entity address 1 must be 450 characters or less'),
  
  body('entityAddress2')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 450 })
    .withMessage('Entity address 2 must be 450 characters or less'),
  
  body('entityAddress3')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 450 })
    .withMessage('Entity address 3 must be 450 characters or less'),
  
  body('entityMobile1')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Entity mobile 1 must be 50 characters or less'),
  
  body('entityMobile2')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Entity mobile 2 must be 50 characters or less'),
  
  body('entityLanline1')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Entity landline 1 must be 50 characters or less'),
  
  body('entityLanline2')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Entity landline 2 must be 50 characters or less'),
  
  body('tin')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 250 })
    .withMessage('TIN must be 250 characters or less'),
  
  body('pan')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 250 })
    .withMessage('PAN must be 250 characters or less'),
  
  body('serviceRegNo')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 250 })
    .withMessage('Service registration number must be 250 characters or less'),
  
  body('gstNo')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('GST number must be 50 characters or less'),
  
  body('companyNo')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Company number must be 50 characters or less'),
  
  body('currencyName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Currency name must be between 1 and 50 characters')
    .matches(/^[A-Z]{3}$|^[A-Za-z\s]+$/)
    .withMessage('Currency name must be either 3-letter code (USD, EUR, INR) or full name'),
  
  body('timeZone')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Timezone must be 100 characters or less')
    .matches(/^[A-Za-z]+\/[A-Za-z_]+$/)
    .withMessage('Timezone must be in IANA format (e.g., Asia/Kolkata, America/New_York)'),
  
  body('countryCode')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 5 })
    .withMessage('Country code must be between 2 and 5 characters')
    .matches(/^\+[1-9]\d{0,3}$/)
    .withMessage('Country code must be phone dialing code format (e.g., +91, +1, +44)'),
  
  body('country')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country name must be between 1 and 100 characters')
    .matches(/^[A-Za-z\s\-'\.]+$/)
    .withMessage('Country name can only contain letters, spaces, hyphens, apostrophes, and periods')
], handleValidationErrors, TenantSettingController.createTenantSettings);

// PUT /api/tenant-settings - Update tenant settings
router.put('/', [
  body('entityName')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 450 })
    .withMessage('Entity name must be 450 characters or less'),
  
  body('entityAddress1')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 450 })
    .withMessage('Entity address 1 must be 450 characters or less'),
  
  body('entityAddress2')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 450 })
    .withMessage('Entity address 2 must be 450 characters or less'),
  
  body('entityAddress3')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 450 })
    .withMessage('Entity address 3 must be 450 characters or less'),
  
  body('entityMobile1')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Entity mobile 1 must be 50 characters or less'),
  
  body('entityMobile2')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Entity mobile 2 must be 50 characters or less'),
  
  body('entityLanline1')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Entity landline 1 must be 50 characters or less'),
  
  body('entityLanline2')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Entity landline 2 must be 50 characters or less'),
  
  body('tin')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 250 })
    .withMessage('TIN must be 250 characters or less'),
  
  body('pan')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 250 })
    .withMessage('PAN must be 250 characters or less'),
  
  body('serviceRegNo')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 250 })
    .withMessage('Service registration number must be 250 characters or less'),
  
  body('gstNo')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('GST number must be 50 characters or less'),
  
  body('companyNo')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Company number must be 50 characters or less'),
  
  body('currencyName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Currency name must be between 1 and 50 characters')
    .matches(/^[A-Z]{3}$|^[A-Za-z\s]+$/)
    .withMessage('Currency name must be either 3-letter code (USD, EUR, INR) or full name'),
  
  body('timeZone')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Timezone must be 100 characters or less')
    .matches(/^[A-Za-z]+\/[A-Za-z_]+$/)
    .withMessage('Timezone must be in IANA format (e.g., Asia/Kolkata, America/New_York)'),
  
  body('countryCode')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 5 })
    .withMessage('Country code must be between 2 and 5 characters')
    .matches(/^\+[1-9]\d{0,3}$/)
    .withMessage('Country code must be phone dialing code format (e.g., +91, +1, +44)'),
  
  body('country')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country name must be between 1 and 100 characters')
    .matches(/^[A-Za-z\s\-'\.]+$/)
    .withMessage('Country name can only contain letters, spaces, hyphens, apostrophes, and periods')
], handleValidationErrors, TenantSettingController.updateTenantSettings);

// GET /api/tenant-settings/tenant-details - Get tenant details with settings
router.get('/tenant-details', [
], handleValidationErrors, TenantSettingController.getTenantDetails);

// GET /api/tenant-settings/timezones - Get common timezones
router.get('/timezones', [
], handleValidationErrors, TenantSettingController.getCommonTimezones);

// GET /api/tenant-settings/countries - Get common countries
router.get('/countries', [
], handleValidationErrors, TenantSettingController.getCommonCountries);

// GET /api/tenant-settings/currencies - Get common currencies
router.get('/currencies', TenantSettingController.getCommonCurrencies);

// GET /api/tenant-settings/common-data - Get all common data (countries, timezones, currencies)
router.get('/country-data', [
], handleValidationErrors, TenantSettingController.getCommonData);

// GET /api/tenant-settings/exists - Check if tenant settings exist
router.get('/exists', [
], handleValidationErrors, TenantSettingController.checkSettingsExist);

// POST /api/tenant-settings/validate - Validate tenant settings data
router.post('/validate', [
  body('entityName').optional().isString().trim(),
  body('entityAddress1').optional().isString().trim(),
  body('entityAddress2').optional().isString().trim(),
  body('entityAddress3').optional().isString().trim(),
  body('entityMobile1').optional().isString().trim(),
  body('entityMobile2').optional().isString().trim(),
  body('entityLanline1').optional().isString().trim(),
  body('entityLanline2').optional().isString().trim(),
  body('tin').optional().isString().trim(),
  body('pan').optional().isString().trim(),
  body('serviceRegNo').optional().isString().trim(),
  body('gstNo').optional().isString().trim(),
  body('companyNo').optional().isString().trim(),
  body('currencyName').optional().isString().trim(),
  body('timeZone').optional().isString().trim(),
  body('countryCode').optional().isString().trim(),
  body('country').optional().isString().trim()
], handleValidationErrors, TenantSettingController.validateSettings);

// PUT /api/tenant-settings/update-name - Update tenant name and basic details
router.put('/update-name', [
  body('tenantName')
    .notEmpty()
    .withMessage('Tenant name is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Tenant name must be between 1 and 200 characters'),
], handleValidationErrors, TenantSettingController.updateTenantName);

// PUT /api/tenant-settings/update-logo - Update tenant logo (base64)
router.put('/update-logo', [
  body('logo')
    .notEmpty()
    .withMessage('Logo data is required')
    .isString()
    .withMessage('Logo must be a string')
    .isLength({ min: 20 })
    .withMessage('Logo data appears to be too short (minimum 20 characters)'),
  
  body('logoFlag')
    .optional()
    .isIn(['Y', 'N'])
    .withMessage('Logo flag must be Y or N')
], handleValidationErrors, TenantSettingController.updateTenantLogo);

// PUT /api/tenant-settings/upload-logo - Update tenant logo (file upload)
router.put('/upload-logo', uploadLogo, handleUploadError, [
  body('logoFlag')
    .optional()
    .isIn(['Y', 'N'])
    .withMessage('Logo flag must be Y or N')
], handleValidationErrors, TenantSettingController.uploadTenantLogo);

module.exports = router;