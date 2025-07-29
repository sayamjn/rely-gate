const TenantSettingModel = require('../models/tenantSetting.model');
const responseUtils = require('../utils/constants');

class TenantSettingService {
  // Get tenant settings
  static async getTenantSettings(tenantId) {
    try {
      const settings = await TenantSettingModel.getTenantSettings(tenantId);

      if (!settings) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant settings not found',
          data: null
        };
      }

      // Map the database response to a cleaner format
      const mappedSettings = {
        settingId: settings.settingid,
        tenantId: settings.tenantid,
        entityName: settings.entityname,
        entityAddress1: settings.entityaddress_1,
        entityAddress2: settings.entityaddress_2,
        entityAddress3: settings.entityaddress_3,
        entityAddress4: settings.entityaddress_4,
        entityAddress5: settings.entityaddress_5,
        entityMobile1: settings.entitymobile_1,
        entityMobile2: settings.entitymobile_2,
        entityLanline1: settings.entitylanline_1,
        entityLanline2: settings.entitylanline_2,
        entityLogoFlag: settings.entitylogoflag,
        entityLogo: settings.entitylogo,
        tin: settings.tin,
        pan: settings.pan,
        serviceRegNo: settings.serviceregno,
        gstNo: settings.gstno,
        companyNo: settings.companyno,
        currencyFlag: settings.currencyflag,
        currencyName: settings.currencyname,
        timeZone: settings.timezone,
        countryCode: settings.countrycode,
        country: settings.country,
        isActive: settings.isactive,
        createdDate: settings.createddate,
        updatedDate: settings.updateddate,
        updatedBy: settings.updatedby
      };

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Tenant settings retrieved successfully',
        data: mappedSettings
      };
    } catch (error) {
      console.error('Error in getTenantSettings service:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to retrieve tenant settings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Create tenant settings for the first time
  static async createTenantSettings(tenantId, settingsData, createdBy) {
    try {
      // Validate required fields
      const { currencyName, timeZone, countryCode, country } = settingsData;

      // Validate timezone format
      if (timeZone && !TenantSettingModel.isValidTimezone(timeZone)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid timezone format. Please use IANA timezone format (e.g., Asia/Kolkata, America/New_York)'
        };
      }

      // Validate country code format
      if (countryCode && !TenantSettingModel.isValidCountryCode(countryCode)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid country code format. Please use phone dialing code format (e.g., +91, +1, +44)'
        };
      }

      // Check if settings already exist
      const settingsExist = await TenantSettingModel.settingsExist(tenantId);
      if (settingsExist) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant settings already exist. Use update method instead.'
        };
      }

      // Create new settings
      const result = await TenantSettingModel.createTenantSettings({
        tenantId,
        ...settingsData,
        createdBy
      });

      if (!result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Failed to create tenant settings'
        };
      }

      // Sync the settings to Tenant table for easier access
      await TenantSettingModel.syncTenantTable(tenantId, {
        currencyName,
        timeZone,
        countryCode,
        country
      });

      // Return the created settings
      const createdSettings = await this.getTenantSettings(tenantId);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Tenant settings created successfully',
        data: createdSettings.data
      };
    } catch (error) {
      console.error('Error in createTenantSettings service:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to create tenant settings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Update tenant settings
  static async updateTenantSettings(tenantId, settingsData, updatedBy) {
    try {
      // Validate required fields
      const { currencyName, timeZone, countryCode, country } = settingsData;

      // Validate timezone format
      if (timeZone && !TenantSettingModel.isValidTimezone(timeZone)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid timezone format. Please use IANA timezone format (e.g., Asia/Kolkata, America/New_York)'
        };
      }

      // Validate country code format
      if (countryCode && !TenantSettingModel.isValidCountryCode(countryCode)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid country code format. Please use phone dialing code format (e.g., +91, +1, +44)'
        };
      }

      // Check if settings exist
      const settingsExist = await TenantSettingModel.settingsExist(tenantId);

      let result;
      if (settingsExist) {
        // Update existing settings
        result = await TenantSettingModel.updateTenantSettings(tenantId, {
          ...settingsData,
          updatedBy
        });
      } else {
        // Create new settings
        result = await TenantSettingModel.createTenantSettings({
          tenantId,
          ...settingsData,
          createdBy: updatedBy
        });
      }

      if (!result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Failed to update tenant settings'
        };
      }

      // Sync the settings to Tenant table for easier access
      await TenantSettingModel.syncTenantTable(tenantId, {
        currencyName,
        timeZone,
        countryCode,
        country
      });

      // Return the updated settings
      const updatedSettings = await this.getTenantSettings(tenantId);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: settingsExist ? 'Tenant settings updated successfully' : 'Tenant settings created successfully',
        data: updatedSettings.data
      };
    } catch (error) {
      console.error('Error in updateTenantSettings service:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to update tenant settings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get tenant details with settings
  static async getTenantWithSettings(tenantId) {
    try {
      const tenantData = await TenantSettingModel.getTenantWithSettings(tenantId);

      if (!tenantData) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant not found',
          data: null
        };
      }

      // Map the response to include both tenant and settings data
      const mappedData = {
        // Basic tenant information
        tenant: {
          tenantId: tenantData.tenantid,
          tenantCode: tenantData.tenantcode,
          tenantName: tenantData.tenantname,
          shortName: tenantData.shortname,
          email: tenantData.email,
          mobile: tenantData.mobile,
          isActive: tenantData.isactive,
          currency: tenantData.currency,
          timeZone: tenantData.timezone,
          countryCode: tenantData.countrycode,
          country: tenantData.country
        },
        // Detailed settings (if available)
        settings: tenantData.settingid ? {
          settingId: tenantData.settingid,
          entityName: tenantData.entityname,
          entityAddress1: tenantData.entityaddress_1,
          entityAddress2: tenantData.entityaddress_2,
          entityAddress3: tenantData.entityaddress_3,
          entityMobile1: tenantData.entitymobile_1,
          entityMobile2: tenantData.entitymobile_2,
          entityLanline1: tenantData.entitylanline_1,
          entityLanline2: tenantData.entitylanline_2,
          tin: tenantData.tin,
          pan: tenantData.pan,
          serviceRegNo: tenantData.serviceregno,
          gstNo: tenantData.gstno,
          companyNo: tenantData.companyno,
          currencyFlag: tenantData.currencyflag,
          currencyName: tenantData.currencyname,
          timeZone: tenantData.settingtimezone,
          countryCode: tenantData.settingcountrycode,
          country: tenantData.settingcountry,
          updatedDate: tenantData.settingsupdateddate
        } : null
      };

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Tenant details with settings retrieved successfully',
        data: mappedData
      };
    } catch (error) {
      console.error('Error in getTenantWithSettings service:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to retrieve tenant details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Validate settings data
  static validateSettingsData(settingsData) {
    const errors = [];

    const {
      currencyName,
      timeZone,
      countryCode,
      country,
      entityName,
      entityMobile1
    } = settingsData;

    // Currency validation
    if (currencyName && currencyName.length > 50) {
      errors.push('Currency name must be 50 characters or less');
    }

    // Timezone validation
    if (timeZone) {
      if (timeZone.length > 100) {
        errors.push('Timezone must be 100 characters or less');
      }
      if (!TenantSettingModel.isValidTimezone(timeZone)) {
        errors.push('Invalid timezone format. Use IANA format (e.g., Asia/Kolkata)');
      }
    }

    // Country code validation
    if (countryCode) {
      if (countryCode.length > 5) {
        errors.push('Country code must be 5 characters or less');
      }
      if (!TenantSettingModel.isValidCountryCode(countryCode)) {
        errors.push('Invalid country code format. Use phone dialing code format (e.g., +91, +1, +44)');
      }
    }

    // Country validation
    if (country && country.length > 100) {
      errors.push('Country name must be 100 characters or less');
    }

    // Entity name validation
    if (entityName && entityName.length > 450) {
      errors.push('Entity name must be 450 characters or less');
    }

    // Mobile validation
    if (entityMobile1 && entityMobile1.length > 50) {
      errors.push('Mobile number must be 50 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Get available timezones (common ones)
  static getCommonTimezones() {
    return {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      responseMessage: 'Common timezones retrieved successfully',
      data: [
        { code: 'Asia/Kolkata', name: 'India Standard Time (IST)', offset: 'UTC+05:30' },
        { code: 'America/New_York', name: 'Eastern Time (EST/EDT)', offset: 'UTC-05:00/-04:00' },
        { code: 'America/Los_Angeles', name: 'Pacific Time (PST/PDT)', offset: 'UTC-08:00/-07:00' },
        { code: 'Europe/London', name: 'Greenwich Mean Time (GMT/BST)', offset: 'UTC+00:00/+01:00' },
        { code: 'Europe/Berlin', name: 'Central European Time (CET/CEST)', offset: 'UTC+01:00/+02:00' },
        { code: 'Asia/Tokyo', name: 'Japan Standard Time (JST)', offset: 'UTC+09:00' },
        { code: 'Asia/Shanghai', name: 'China Standard Time (CST)', offset: 'UTC+08:00' },
        { code: 'Australia/Sydney', name: 'Australian Eastern Time (AEST/AEDT)', offset: 'UTC+10:00/+11:00' },
        { code: 'Asia/Dubai', name: 'Gulf Standard Time (GST)', offset: 'UTC+04:00' },
        { code: 'Asia/Singapore', name: 'Singapore Standard Time (SGT)', offset: 'UTC+08:00' }
      ]
    };
  }

  // Get common countries
  static getCommonCountries() {
    return {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      responseMessage: 'Common countries retrieved successfully',
      data: [
        { code: '+91', name: 'India' },
        { code: '+1', name: 'United States' },
        { code: '+44', name: 'United Kingdom' },
        { code: '+1', name: 'Canada' },
        { code: '+61', name: 'Australia' },
        { code: '+49', name: 'Germany' },
        { code: '+33', name: 'France' },
        { code: '+81', name: 'Japan' },
        { code: '+86', name: 'China' },
        { code: '+65', name: 'Singapore' },
        { code: '+971', name: 'United Arab Emirates' },
        { code: '+55', name: 'Brazil' }
      ]
    };
  }
}

module.exports = TenantSettingService;