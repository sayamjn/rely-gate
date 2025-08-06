const TenantSettingModel = require('../models/tenantSetting.model');
const CountryDataMasterModel = require('../models/countryDataMaster.model');
const FileService = require('./file.service');
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
        entityLogo: settings.entitylogo, // Legacy base64 field from TenantSetting table
        entityLogoPath: settings.entitylogopath,
        entityLogoUrl: settings.entitylogopath ? FileService.getFileUrl('logos', settings.entitylogopath.replace('uploads/logos/', '')) : null,
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
    // Validate required fields that are being updated
    const { currencyName, timeZone, countryCode, country } = settingsData;

    // Validate timezone format if provided
    if (settingsData.hasOwnProperty('timeZone') && timeZone && !TenantSettingModel.isValidTimezone(timeZone)) {
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Invalid timezone format. Please use IANA timezone format (e.g., Asia/Kolkata, America/New_York)'
      };
    }

    // Validate country code format if provided
    if (settingsData.hasOwnProperty('countryCode') && countryCode && !TenantSettingModel.isValidCountryCode(countryCode)) {
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
      // Create new settings if they don't exist
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

    // Sync only the fields that were updated to Tenant table
    const fieldsToSync = {};
    if (settingsData.hasOwnProperty('currencyName')) fieldsToSync.currencyName = currencyName;
    if (settingsData.hasOwnProperty('timeZone')) fieldsToSync.timeZone = timeZone;
    if (settingsData.hasOwnProperty('countryCode')) fieldsToSync.countryCode = countryCode;
    if (settingsData.hasOwnProperty('country')) fieldsToSync.country = country;

    if (Object.keys(fieldsToSync).length > 0) {
      await TenantSettingModel.syncTenantTable(tenantId, fieldsToSync);
    }

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
        // Complete tenant information
        tenant: {
          tenantId: tenantData.tenantid,
          tenantCode: tenantData.tenantcode,
          tenantName: tenantData.tenantname,
          shortName: tenantData.shortname,
          pan: tenantData.pan,
          tin: tenantData.tin,
          serviceRef: tenantData.serviceref,
          address1: tenantData.address1,
          address2: tenantData.address2,
          address3: tenantData.address3,
          tenantDesc: tenantData.tenantdesc,
          fax: tenantData.fax,
          email: tenantData.email,
          vatNo: tenantData.vatno,
          dlNo: tenantData.dlno,
          cstNo: tenantData.cstno,
          landline: tenantData.lanline,
          mobile: tenantData.mobile,
          website: tenantData.website,
          isActive: tenantData.isactive,
          statusId: tenantData.statusid,
          subscriptionStartDate: tenantData.suscriptionstartdate,
          subscriptionEndDate: tenantData.suscriptionenddate,
          tenantRemark: tenantData.tenantremark,
          financialYear: tenantData.financialyear,
          entityLogoFlag: tenantData.entitylogoflag,
          entityLogo: tenantData.entitylogo, // May be null if using file storage
          entityLogoPath: tenantData.entitylogopath,
          entityLogoUrl: tenantData.entitylogopath ? FileService.getFileUrl('logos', tenantData.entitylogopath.replace('uploads/logos/', '')) : null,
          companyNo: tenantData.companyno,
          gstNo: tenantData.gstno,
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
          entityAddress4: tenantData.entityaddress_4,
          entityAddress5: tenantData.entityaddress_5,
          entityMobile1: tenantData.entitymobile_1,
          entityMobile2: tenantData.entitymobile_2,
          entityLanline1: tenantData.entitylanline_1,
          entityLanline2: tenantData.entitylanline_2,
          entityLogoFlag: tenantData.settingentitylogoflag,
          entityLogo: tenantData.settingentitylogo, // From TenantSetting table (legacy)
          entityLogoPath: tenantData.settingentitylogopath,
          entityLogoUrl: tenantData.settingentitylogopath ? FileService.getFileUrl('logos', tenantData.settingentitylogopath.replace('uploads/logos/', '')) : null,
          tin: tenantData.settingtin,
          pan: tenantData.settingpan,
          serviceRegNo: tenantData.serviceregno,
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
  static async getCommonTimezones() {
    try {
      const timezones = await CountryDataMasterModel.getTimezones();
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Common timezones retrieved successfully',
        data: timezones
      };
    } catch (error) {
      console.error('Error in getCommonTimezones service:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Error retrieving timezones',
        data: null
      };
    }
  }

  // Get common countries
  static async getCommonCountries() {
    try {
      const countries = await CountryDataMasterModel.getCountries();
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Common countries retrieved successfully',
        data: countries
      };
    } catch (error) {
      console.error('Error in getCommonCountries service:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Error retrieving countries',
        data: null
      };
    }
  }

  static async getCommonCurrencies() {
    try {
      const currencies = await CountryDataMasterModel.getCurrencies();
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Common currencies retrieved successfully',
        data: currencies
      };
    } catch (error) {
      console.error('Error in getCommonCurrencies service:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Error retrieving currencies',
        data: null
      };
    }
  }

  // Get all common data (countries, timezones, currencies) in one response
  static async getCommonData() {
    try {
      const countries = await CountryDataMasterModel.getCountries();
      const timezones = await CountryDataMasterModel.getTimezones();
      const currencies = await CountryDataMasterModel.getCurrencies();

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Common data retrieved successfully',
        data: {
          countries,
          // timezones,
          // currencies
        }
      };
    } catch (error) {
      console.error('Error in getCommonData service:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Error retrieving common data',
        data: null
      };
    }
  }

  // Update tenant name and basic details
  static async updateTenantName(tenantId, nameData, updatedBy) {
    try {
      const result = await TenantSettingModel.updateTenantName(tenantId, nameData, updatedBy);

      if (result.affectedRows === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant not found or no changes made'
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Tenant name and details updated successfully',
        data: {
          tenantId: tenantId,
          updatedFields: Object.keys(nameData).filter(key => nameData[key] !== undefined && nameData[key] !== null),
          updatedBy: updatedBy,
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error updating tenant name:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to update tenant name and details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Update tenant logo
  static async updateTenantLogo(tenantId, logoData, updatedBy) {
    try {
      // Save the logo file to filesystem
      const customFilename = `tenant_${tenantId}_logo_${Date.now()}.png`;
      const fileResult = await FileService.saveBase64Image(
        logoData.logo,
        FileService.categories.LOGOS,
        customFilename
      );

      if (!fileResult.success) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Failed to save logo file',
          error: fileResult.error
        };
      }

      // Update database with logo info and file path only (no base64 in database)
      const logoDataWithPath = {
        logoFlag: logoData.logoFlag,
        logoPath: `uploads/logos/${fileResult.filename}` // Store relative path only
      };

      const result = await TenantSettingModel.updateTenantLogo(tenantId, logoDataWithPath, updatedBy);

      // Also update TenantSetting table if it exists
      const settingsExist = await TenantSettingModel.settingsExist(tenantId);
      if (settingsExist) {
        await TenantSettingModel.updateTenantSettingLogo(tenantId, logoDataWithPath, updatedBy);
      }

      if (result.affectedRows === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant not found or no changes made'
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Tenant logo updated successfully',
        data: {
          tenantId: tenantId,
          logoFlag: logoData.logoFlag,
          logoPath: logoDataWithPath.logoPath,
          logoUrl: fileResult.url,
          fileSize: fileResult.size,
          updatedBy: updatedBy,
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error updating tenant logo:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to update tenant logo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Update tenant logo from uploaded file
  static async updateTenantLogoFromFile(tenantId, fileData, updatedBy) {
    try {
      // The file is already saved by multer, just need to update database
      const logoDataWithPath = {
        logoFlag: fileData.logoFlag,
        logoPath: `uploads/logos/${fileData.filename}` // Store relative path
      };

      const result = await TenantSettingModel.updateTenantLogo(tenantId, logoDataWithPath, updatedBy);

      // Also update TenantSetting table if it exists
      const settingsExist = await TenantSettingModel.settingsExist(tenantId);
      if (settingsExist) {
        await TenantSettingModel.updateTenantSettingLogo(tenantId, logoDataWithPath, updatedBy);
      }

      if (result.affectedRows === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Tenant not found or no changes made'
        };
      }

      // Get file info for response
      const fileInfo = await FileService.getFileInfo('logos', fileData.filename);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Tenant logo uploaded successfully',
        data: {
          tenantId: tenantId,
          logoFlag: fileData.logoFlag,
          logoPath: logoDataWithPath.logoPath,
          logoUrl: FileService.getFileUrl('logos', fileData.filename),
          fileSize: fileInfo.success ? fileInfo.data.size : null,
          updatedBy: updatedBy,
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error updating tenant logo from file:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to update tenant logo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

}

module.exports = TenantSettingService;