const { query } = require('../config/database');

class TenantSettingModel {
  // Get tenant settings by tenant ID
  static async getTenantSettings(tenantId) {
    const sql = `
      SELECT 
        SettingID,
        TenantID,
        EntityName,
        EntityAddress_1,
        EntityAddress_2,
        EntityAddress_3,
        EntityAddress_4,
        EntityAddress_5,
        EntityMobile_1,
        EntityMobile_2,
        EntityLanline_1,
        EntityLanline_2,
        EntityLogoFlag,
        EntityLogo,
        TIN,
        PAN,
        ServiceRegNo,
        IsActive,
        FinancialYearFrom,
        FinancialYearTo,
        RegNPrefix,
        MoneyRecPrefix,
        BillRefPrefix,
        KeyActivateFlag,
        ActivateDate,
        KeyCode,
        SuscriptionPlanID,
        SuscriptionPlan,
        PlanStartDate,
        PlanEndDate,
        CompanyNo,
        GSTNo,
        Custom_1,
        Custom_2,
        Custom_3,
        CurrencyFlag,
        CurrencyName,
        TimeZone,
        CountryCode,
        Country,
        CreatedDate,
        UpdatedDate,
        UpdatedBy
      FROM TenantSetting
      WHERE TenantID = $1 AND IsActive = 'Y'
    `;
    
    try {
      const result = await query(sql, [tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Create tenant settings
  static async createTenantSettings(settingsData) {
    const {
      tenantId,
      entityName,
      entityAddress1,
      entityAddress2,
      entityAddress3,
      entityMobile1,
      entityMobile2,
      entityLanline1,
      entityLanline2,
      tin,
      pan,
      serviceRegNo,
      gstNo,
      companyNo,
      currencyName,
      timeZone,
      countryCode,
      country,
      createdBy
    } = settingsData;

    const sql = `
      INSERT INTO TenantSetting (
        TenantID,
        EntityName,
        EntityAddress_1,
        EntityAddress_2,
        EntityAddress_3,
        EntityMobile_1,
        EntityMobile_2,
        EntityLanline_1,
        EntityLanline_2,
        TIN,
        PAN,
        ServiceRegNo,
        GSTNo,
        CompanyNo,
        CurrencyFlag,
        CurrencyName,
        TimeZone,
        CountryCode,
        Country,
        IsActive,
        CreatedDate,
        UpdatedDate,
        UpdatedBy
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
        CASE WHEN $15::VARCHAR IS NOT NULL AND $15::VARCHAR != '' THEN 'Y' ELSE 'N' END,
        $15, $16, $17, $18, 'Y', NOW(), NOW(), $19
      )
      RETURNING SettingID, TenantID, CurrencyName, TimeZone, CountryCode, Country
    `;

    const values = [
      tenantId,
      entityName || '',
      entityAddress1 || '',
      entityAddress2 || '',
      entityAddress3 || '',
      entityMobile1 || '',
      entityMobile2 || '',
      entityLanline1 || '',
      entityLanline2 || '',
      tin || '',
      pan || '',
      serviceRegNo || '',
      gstNo || '',
      companyNo || '',
      currencyName,
      timeZone,
      countryCode,
      country,
      createdBy
    ];

    try {
      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update tenant settings
  static async updateTenantSettings(tenantId, settingsData) {
    const {
      entityName,
      entityAddress1,
      entityAddress2,
      entityAddress3,
      entityMobile1,
      entityMobile2,
      entityLanline1,
      entityLanline2,
      tin,
      pan,
      serviceRegNo,
      gstNo,
      companyNo,
      currencyName,
      timeZone,
      countryCode,
      country,
      updatedBy
    } = settingsData;

    const sql = `
      UPDATE TenantSetting SET
        EntityName = $2,
        EntityAddress_1 = $3,
        EntityAddress_2 = $4,
        EntityAddress_3 = $5,
        EntityMobile_1 = $6,
        EntityMobile_2 = $7,
        EntityLanline_1 = $8,
        EntityLanline_2 = $9,
        TIN = $10,
        PAN = $11,
        ServiceRegNo = $12,
        GSTNo = $13,
        CompanyNo = $14,
        CurrencyFlag = CASE WHEN $15::VARCHAR IS NOT NULL AND $15::VARCHAR != '' THEN 'Y' ELSE 'N' END,
        CurrencyName = $15,
        TimeZone = $16,
        CountryCode = $17,
        Country = $18,
        UpdatedDate = NOW(),
        UpdatedBy = $19
      WHERE TenantID = $1 AND IsActive = 'Y'
      RETURNING SettingID, TenantID, CurrencyName, TimeZone, CountryCode, Country, UpdatedDate
    `;

    const values = [
      tenantId,
      entityName || '',
      entityAddress1 || '',
      entityAddress2 || '',
      entityAddress3 || '',
      entityMobile1 || '',
      entityMobile2 || '',
      entityLanline1 || '',
      entityLanline2 || '',
      tin || '',
      pan || '',
      serviceRegNo || '',
      gstNo || '',
      companyNo || '',
      currencyName,
      timeZone,
      countryCode,
      country,
      updatedBy
    ];

    try {
      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update tenant table with settings data for easier access
  static async syncTenantTable(tenantId, settingsData) {
    const { currencyName, timeZone, countryCode, country } = settingsData;

    const sql = `
      UPDATE Tenant SET
        Currency = $2,
        TimeZone = $3,
        CountryCode = $4,
        Country = $5,
        UpdatedDate = NOW()
      WHERE TenantID = $1
      RETURNING TenantID, Currency, TimeZone, CountryCode, Country
    `;

    const values = [tenantId, currencyName, timeZone, countryCode, country];

    try {
      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Check if tenant settings exist
  static async settingsExist(tenantId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM TenantSetting
      WHERE TenantID = $1 AND IsActive = 'Y'
    `;

    try {
      const result = await query(sql, [tenantId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get tenant settings with basic tenant info
  static async getTenantWithSettings(tenantId) {
    const sql = `
      SELECT 
        t.TenantID,
        t.TenantCode,
        t.TenantName,
        t.ShortName,
        t.Email,
        t.Mobile,
        t.IsActive,
        t.Currency,
        t.TimeZone,
        t.CountryCode,
        t.Country,
        ts.SettingID,
        ts.EntityName,
        ts.EntityAddress_1,
        ts.EntityAddress_2,
        ts.EntityAddress_3,
        ts.EntityMobile_1,
        ts.EntityMobile_2,
        ts.EntityLanline_1,
        ts.EntityLanline_2,
        ts.TIN,
        ts.PAN,
        ts.ServiceRegNo,
        ts.GSTNo,
        ts.CompanyNo,
        ts.CurrencyFlag,
        ts.CurrencyName,
        ts.TimeZone as SettingTimeZone,
        ts.CountryCode as SettingCountryCode,
        ts.Country as SettingCountry,
        ts.UpdatedDate as SettingsUpdatedDate
      FROM Tenant t
      LEFT JOIN TenantSetting ts ON t.TenantID = ts.TenantID AND ts.IsActive = 'Y'
      WHERE t.TenantID = $1 AND t.IsActive = 'Y'
    `;

    try {
      const result = await query(sql, [tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Validate timezone format (basic IANA timezone validation)
  static isValidTimezone(timezone) {
    if (!timezone) return false;
    
    // Basic validation for IANA timezone format
    const timezoneRegex = /^[A-Za-z]+\/[A-Za-z_]+$/;
    return timezoneRegex.test(timezone);
  }

  // Validate country code format (Phone dialing codes)
  static isValidCountryCode(countryCode) {
    if (!countryCode) return false;
    
    // Validation for phone dialing codes (+1 to +9999)
    const countryCodeRegex = /^\+[1-9]\d{0,3}$/;
    return countryCodeRegex.test(countryCode);
  }
}

module.exports = TenantSettingModel;