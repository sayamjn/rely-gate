const TenantSettingService = require('../services/tenantSetting.service');
const responseUtils = require('../utils/constants');

class TenantSettingController {
  // GET /api/tenant-settings - Get tenant settings
  static async getTenantSettings(req, res) {
    try {
      const userTenantId = req.user.tenantId;

      const result = await TenantSettingService.getTenantSettings(userTenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getTenantSettings:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/tenant-settings - Create tenant settings for the first time
  static async createTenantSettings(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;
      const settingsData = req.body;

      // Validate the incoming data
      const validation = TenantSettingService.validateSettingsData(settingsData);
      if (!validation.isValid) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Validation failed',
          errors: validation.errors
        });
      }

      // Check if settings already exist
      const existingSettings = await TenantSettingService.getTenantSettings(userTenantId);
      if (existingSettings.responseCode === responseUtils.RESPONSE_CODES.SUCCESS) {
        return res.status(409).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant settings already exist. Use PUT method to update.'
        });
      }

      const result = await TenantSettingService.createTenantSettings(
        userTenantId,
        settingsData,
        createdBy
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Error in createTenantSettings:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PUT /api/tenant-settings - Update tenant settings
  static async updateTenantSettings(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username;
      const settingsData = req.body;

      // Validate the incoming data
      const validation = TenantSettingService.validateSettingsData(settingsData);
      if (!validation.isValid) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Validation failed',
          errors: validation.errors
        });
      }

      const result = await TenantSettingService.updateTenantSettings(
        userTenantId,
        settingsData,
        updatedBy
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Error in updateTenantSettings:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/tenant-settings/tenant-details - Get tenant details with settings
  static async getTenantDetails(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const username = req.user.username;
      const loginId = req.user.loginId;

      const result = await TenantSettingService.getTenantWithSettings(userTenantId);
      
      // Add user context information from token
      if (result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS && result.data) {
        result.data.userContext = {
          loginId: loginId,
          username: username,
          tenantId: userTenantId,
          roleAccessId: req.user.roleAccessId,
          roleName: req.user.roleName
        };
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getTenantDetails:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/tenant-settings/timezones - Get common timezones
  static async getCommonTimezones(req, res) {
    try {
      const result = TenantSettingService.getCommonTimezones();
      res.json(result);
    } catch (error) {
      console.error('Error in getCommonTimezones:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/tenant-settings/countries - Get common countries
  static async getCommonCountries(req, res) {
    try {
      const result = TenantSettingService.getCommonCountries();
      res.json(result);
    } catch (error) {
      console.error('Error in getCommonCountries:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/tenant-settings/exists - Check if tenant settings exist
  static async checkSettingsExist(req, res) {
    try {
      const userTenantId = req.user.tenantId;

      const result = await TenantSettingService.getTenantSettings(userTenantId);
      const exists = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS;

      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: exists ? 'Tenant settings exist' : 'Tenant settings do not exist',
        data: {
          exists: exists,
          tenantId: userTenantId,
          needsSetup: !exists
        }
      });
    } catch (error) {
      console.error('Error in checkSettingsExist:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/tenant-settings/validate - Validate tenant settings data
  static async validateSettings(req, res) {
    try {
      const settingsData = req.body;

      const validation = TenantSettingService.validateSettingsData(settingsData);

      if (validation.isValid) {
        res.json({
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: 'Settings data is valid',
          data: { valid: true }
        });
      } else {
        res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Settings data validation failed',
          data: { valid: false },
          errors: validation.errors
        });
      }
    } catch (error) {
      console.error('Error in validateSettings:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getCommonCurrencies(req, res) {
  try {
    const result = TenantSettingService.getCommonCurrencies();
    res.json(result);
  } catch (error) {
    console.error('Error in getCommonCurrencies:', error);
    res.status(500).json({
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

  // PUT /api/tenant-settings/update-name - Update tenant name and basic details
  static async updateTenantName(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username;
      const { tenantName, shortname, email, mobile, address1, address2, address3 } = req.body;

      // Validate required fields
      if (!tenantName || tenantName.trim() === '') {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant name is required'
        });
      }

      const result = await TenantSettingService.updateTenantName(
        userTenantId,
        {
          tenantName: tenantName.trim(),
          shortname: shortname?.trim(),
          email: email?.trim(),
          mobile: mobile?.trim(),
          address1: address1?.trim(),
          address2: address2?.trim(),
          address3: address3?.trim()
        },
        updatedBy
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Error in updateTenantName:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PUT /api/tenant-settings/update-logo - Update tenant logo
  static async updateTenantLogo(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username;
      const { logo, logoFlag = 'Y' } = req.body;

      // Validate logo data
      if (!logo || logo.trim() === '') {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Logo data is required (base64 format)'
        });
      }

      const result = await TenantSettingService.updateTenantLogo(
        userTenantId,
        {
          logo: logo.trim(),
          logoFlag: logoFlag
        },
        updatedBy
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Error in updateTenantLogo:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = TenantSettingController;