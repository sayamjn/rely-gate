const { query } = require("../config/database");

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
      createdBy,
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
      entityName || "",
      entityAddress1 || "",
      entityAddress2 || "",
      entityAddress3 || "",
      entityMobile1 || "",
      entityMobile2 || "",
      entityLanline1 || "",
      entityLanline2 || "",
      tin || "",
      pan || "",
      serviceRegNo || "",
      gstNo || "",
      companyNo || "",
      currencyName,
      timeZone,
      countryCode,
      country,
      createdBy,
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
      updatedBy,
    } = settingsData;

    // Build dynamic SET clause - only include fields that are provided
    const setFields = [];
    const values = [tenantId]; // tenantId is always the first parameter
    let paramCounter = 2; // Start from $2 since $1 is tenantId

    // Helper function to add field to update if it exists in settingsData
    const addFieldIfExists = (fieldName, dbColumnName, value) => {
      if (settingsData.hasOwnProperty(fieldName)) {
        setFields.push(`${dbColumnName} = $${paramCounter}`);
        values.push(value || ""); // Convert null/undefined to empty string
        paramCounter++;
      }
    };

    // Add fields to update only if they exist in the request
    addFieldIfExists("entityName", "EntityName", entityName);
    addFieldIfExists("entityAddress1", "EntityAddress_1", entityAddress1);
    addFieldIfExists("entityAddress2", "EntityAddress_2", entityAddress2);
    addFieldIfExists("entityAddress3", "EntityAddress_3", entityAddress3);
    addFieldIfExists("entityMobile1", "EntityMobile_1", entityMobile1);
    addFieldIfExists("entityMobile2", "EntityMobile_2", entityMobile2);
    addFieldIfExists("entityLanline1", "EntityLanline_1", entityLanline1);
    addFieldIfExists("entityLanline2", "EntityLanline_2", entityLanline2);
    addFieldIfExists("tin", "TIN", tin);
    addFieldIfExists("pan", "PAN", pan);
    addFieldIfExists("serviceRegNo", "ServiceRegNo", serviceRegNo);
    addFieldIfExists("gstNo", "GSTNo", gstNo);
    addFieldIfExists("companyNo", "CompanyNo", companyNo);

    // Handle currency with its flag
    if (settingsData.hasOwnProperty("currencyName")) {
      setFields.push(
        `CurrencyFlag = CASE WHEN $${paramCounter}::VARCHAR IS NOT NULL AND $${paramCounter}::VARCHAR != '' THEN 'Y' ELSE 'N' END`
      );
      setFields.push(`CurrencyName = $${paramCounter}`);
      values.push(currencyName);
      paramCounter++;
    }

    addFieldIfExists("timeZone", "TimeZone", timeZone);
    addFieldIfExists("countryCode", "CountryCode", countryCode);
    addFieldIfExists("country", "Country", country);

    // Always update these fields
    setFields.push(`UpdatedDate = NOW()`);
    if (updatedBy) {
      setFields.push(`UpdatedBy = $${paramCounter}`);
      values.push(updatedBy);
      paramCounter++;
    }

    // If no fields to update (except UpdatedDate), return error
    if (setFields.length <= 1) {
      throw new Error("No valid fields provided for update");
    }

    const sql = `
    UPDATE TenantSetting SET
      ${setFields.join(", ")}
    WHERE TenantID = $1 AND IsActive = 'Y'
    RETURNING SettingID, TenantID, CurrencyName, TimeZone, CountryCode, Country, UpdatedDate
  `;

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

  // Update tenant name and basic details in the Tenant table
  static async updateTenantName(tenantId, nameData, updatedBy) {
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    // Build dynamic update query based on provided fields
    if (nameData.tenantName !== undefined) {
      updateFields.push(`TenantName = $${++paramCount}`);
      values.push(nameData.tenantName);
    }
    if (nameData.shortname !== undefined) {
      updateFields.push(`ShortName = $${++paramCount}`);
      values.push(nameData.shortname);
    }
    if (nameData.email !== undefined) {
      updateFields.push(`Email = $${++paramCount}`);
      values.push(nameData.email);
    }
    if (nameData.mobile !== undefined) {
      updateFields.push(`Mobile = $${++paramCount}`);
      values.push(nameData.mobile);
    }
    if (nameData.address1 !== undefined) {
      updateFields.push(`Address1 = $${++paramCount}`);
      values.push(nameData.address1);
    }
    if (nameData.address2 !== undefined) {
      updateFields.push(`Address2 = $${++paramCount}`);
      values.push(nameData.address2);
    }
    if (nameData.address3 !== undefined) {
      updateFields.push(`Address3 = $${++paramCount}`);
      values.push(nameData.address3);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields provided for update');
    }

    // Add UpdatedDate
    updateFields.push(`UpdatedDate = NOW()`);

    // Add WHERE clause parameters
    values.push(tenantId);
    const tenantIdParam = ++paramCount;

    const sql = `
      UPDATE Tenant 
      SET ${updateFields.join(', ')}
      WHERE TenantID = $${tenantIdParam} AND IsActive = 'Y'
    `;

    const result = await query(sql, values);
    return result;
  }

  // Update tenant logo in the Tenant table
  static async updateTenantLogo(tenantId, logoData, updatedBy) {
    const sql = `
      UPDATE Tenant 
      SET 
        EntityLogoFlag = $1,
        EntityLogo = $2,
        EntityLogoPath = $3,
        UpdatedDate = NOW()
      WHERE TenantID = $4 AND IsActive = 'Y'
    `;

    const values = [
      logoData.logoFlag,
      logoData.logo,
      logoData.logoPath,
      tenantId
    ];

    const result = await query(sql, values);
    return result;
  }
}

module.exports = TenantSettingModel;
