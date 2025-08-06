const { query } = require('../config/database');

class CountryDataMasterModel {
  // Get all countries
  static async getCountries() {
    try {
      const sql = `
        SELECT 
          CommonDataID as "id",
          Code as "countryCode",
          Name as "name",
          PhoneCode as "code",
          DefaultTimezone as "timezone",
          DefaultCurrency as "currency",
          SortOrder as "sortOrder"
        FROM CountryDataMaster 
        WHERE DataType = 'COUNTRY' AND IsActive = TRUE 
        ORDER BY SortOrder ASC, Name ASC
      `;
      
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('Error in getCountries:', error);
      throw error;
    }
  }

  // Get all timezones
  static async getTimezones() {
    try {
      const sql = `
        SELECT 
          CommonDataID as "id",
          Code as "code",
          Name as "name",
          UTCOffset as "offset",
          SortOrder as "sortOrder"
        FROM CountryDataMaster 
        WHERE DataType = 'TIMEZONE' AND IsActive = TRUE 
        ORDER BY SortOrder ASC, Name ASC
      `;
      
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('Error in getTimezones:', error);
      throw error;
    }
  }

  // Get all currencies
  static async getCurrencies() {
    try {
      const sql = `
        SELECT 
          CommonDataID as "id",
          Code as "code",
          Name as "name",
          Symbol as "symbol",
          CountryCode as "country",
          SortOrder as "sortOrder"
        FROM CountryDataMaster 
        WHERE DataType = 'CURRENCY' AND IsActive = TRUE 
        ORDER BY SortOrder ASC, Name ASC
      `;
      
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('Error in getCurrencies:', error);
      throw error;
    }
  }

  // Get all common data at once
  static async getAllCommonData() {
    try {
      const sql = `
        SELECT 
          CommonDataID as "id",
          DataType as "dataType",
          Code as "code",
          Name as "name",
          PhoneCode as "phoneCode",
          Symbol as "symbol",
          UTCOffset as "utcOffset",
          CountryCode as "countryCode",
          DefaultTimezone as "defaultTimezone",
          DefaultCurrency as "defaultCurrency",
          SortOrder as "sortOrder"
        FROM CountryDataMaster 
        WHERE IsActive = TRUE 
        ORDER BY DataType ASC, SortOrder ASC, Name ASC
      `;
      
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('Error in getAllCommonData:', error);
      throw error;
    }
  }

  // Get data by type
  static async getDataByType(dataType) {
    try {
      const sql = `
        SELECT 
          CommonDataID as "id",
          Code as "code",
          Name as "name",
          PhoneCode as "phoneCode",
          Symbol as "symbol",
          UTCOffset as "utcOffset",
          CountryCode as "countryCode",
          DefaultTimezone as "defaultTimezone",
          DefaultCurrency as "defaultCurrency",
          SortOrder as "sortOrder"
        FROM CountryDataMaster 
        WHERE DataType = $1 AND IsActive = TRUE 
        ORDER BY SortOrder ASC, Name ASC
      `;
      
      const result = await query(sql, [dataType.toUpperCase()]);
      return result.rows;
    } catch (error) {
      console.error('Error in getDataByType:', error);
      throw error;
    }
  }

  // Get country by code
  static async getCountryByCode(countryCode) {
    try {
      const sql = `
        SELECT 
          CommonDataID as "id",
          Code as "countryCode",
          Name as "name",
          PhoneCode as "code",
          DefaultTimezone as "timezone",
          DefaultCurrency as "currency"
        FROM CountryDataMaster 
        WHERE DataType = 'COUNTRY' AND Code = $1 AND IsActive = TRUE
      `;
      
      const result = await query(sql, [countryCode.toUpperCase()]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getCountryByCode:', error);
      throw error;
    }
  }

  // Get timezone by code
  static async getTimezoneByCode(timezoneCode) {
    try {
      const sql = `
        SELECT 
          CommonDataID as "id",
          Code as "code",
          Name as "name",
          UTCOffset as "offset"
        FROM CountryDataMaster 
        WHERE DataType = 'TIMEZONE' AND Code = $1 AND IsActive = TRUE
      `;
      
      const result = await query(sql, [timezoneCode]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getTimezoneByCode:', error);
      throw error;
    }
  }

  // Get currency by code
  static async getCurrencyByCode(currencyCode) {
    try {
      const sql = `
        SELECT 
          CommonDataID as "id",
          Code as "code",
          Name as "name",
          Symbol as "symbol",
          CountryCode as "country"
        FROM CountryDataMaster 
        WHERE DataType = 'CURRENCY' AND Code = $1 AND IsActive = TRUE
      `;
      
      const result = await query(sql, [currencyCode.toUpperCase()]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getCurrencyByCode:', error);
      throw error;
    }
  }

  // Add or update data
  static async addOrUpdateData(dataType, code, data, createdBy = 'SYSTEM') {
    try {
      const {
        name,
        phoneCode,
        symbol,
        utcOffset,
        countryCode,
        defaultTimezone,
        defaultCurrency,
        sortOrder = 0
      } = data;

      const sql = `
        INSERT INTO CountryDataMaster (
          DataType, Code, Name, PhoneCode, Symbol, UTCOffset, 
          CountryCode, DefaultTimezone, DefaultCurrency, SortOrder, 
          CreatedBy, UpdatedBy, CreatedDate, UpdatedDate, IsActive
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, NOW(), NOW(), TRUE)
        ON CONFLICT (DataType, Code) 
        DO UPDATE SET 
          Name = EXCLUDED.Name,
          PhoneCode = EXCLUDED.PhoneCode,
          Symbol = EXCLUDED.Symbol,
          UTCOffset = EXCLUDED.UTCOffset,
          CountryCode = EXCLUDED.CountryCode,
          DefaultTimezone = EXCLUDED.DefaultTimezone,
          DefaultCurrency = EXCLUDED.DefaultCurrency,
          SortOrder = EXCLUDED.SortOrder,
          UpdatedBy = EXCLUDED.UpdatedBy,
          UpdatedDate = NOW(),
          IsActive = TRUE
        RETURNING 
          CommonDataID as "id",
          DataType as "dataType",
          Code as "code",
          Name as "name",
          PhoneCode as "phoneCode",
          Symbol as "symbol",
          UTCOffset as "utcOffset",
          CountryCode as "countryCode",
          DefaultTimezone as "defaultTimezone",
          DefaultCurrency as "defaultCurrency",
          SortOrder as "sortOrder",
          IsActive as "isActive"
      `;

      const values = [
        dataType.toUpperCase(),
        code.toUpperCase(),
        name,
        phoneCode,
        symbol,
        utcOffset,
        countryCode,
        defaultTimezone,
        defaultCurrency,
        sortOrder,
        createdBy
      ];

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in addOrUpdateData:', error);
      throw error;
    }
  }

  // Create new data entry
  static async createData(dataType, code, data, createdBy = 'SYSTEM') {
    try {
      const {
        name,
        phoneCode,
        symbol,
        utcOffset,
        countryCode,
        defaultTimezone,
        defaultCurrency,
        sortOrder = 0
      } = data;

      const sql = `
        INSERT INTO CountryDataMaster (
          DataType, Code, Name, PhoneCode, Symbol, UTCOffset, 
          CountryCode, DefaultTimezone, DefaultCurrency, SortOrder, 
          CreatedBy, UpdatedBy, CreatedDate, UpdatedDate, IsActive
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, NOW(), NOW(), TRUE)
        RETURNING 
          CommonDataID as "id",
          DataType as "dataType",
          Code as "code",
          Name as "name",
          PhoneCode as "phoneCode",
          Symbol as "symbol",
          UTCOffset as "utcOffset",
          CountryCode as "countryCode",
          DefaultTimezone as "defaultTimezone",
          DefaultCurrency as "defaultCurrency",
          SortOrder as "sortOrder",
          IsActive as "isActive"
      `;

      const values = [
        dataType.toUpperCase(),
        code.toUpperCase(),
        name,
        phoneCode,
        symbol,
        utcOffset,
        countryCode,
        defaultTimezone,
        defaultCurrency,
        sortOrder,
        createdBy
      ];

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in createData:', error);
      throw error;
    }
  }

  // Update existing data
  static async updateData(dataType, code, data, updatedBy = 'SYSTEM') {
    try {
      const {
        name,
        phoneCode,
        symbol,
        utcOffset,
        countryCode,
        defaultTimezone,
        defaultCurrency,
        sortOrder
      } = data;

      const sql = `
        UPDATE CountryDataMaster 
        SET 
          Name = $3,
          PhoneCode = $4,
          Symbol = $5,
          UTCOffset = $6,
          CountryCode = $7,
          DefaultTimezone = $8,
          DefaultCurrency = $9,
          SortOrder = $10,
          UpdatedBy = $11,
          UpdatedDate = NOW()
        WHERE DataType = $1 AND Code = $2 AND IsActive = TRUE
        RETURNING 
          CommonDataID as "id",
          DataType as "dataType",
          Code as "code",
          Name as "name",
          PhoneCode as "phoneCode",
          Symbol as "symbol",
          UTCOffset as "utcOffset",
          CountryCode as "countryCode",
          DefaultTimezone as "defaultTimezone",
          DefaultCurrency as "defaultCurrency",
          SortOrder as "sortOrder",
          IsActive as "isActive"
      `;

      const values = [
        dataType.toUpperCase(),
        code.toUpperCase(),
        name,
        phoneCode,
        symbol,
        utcOffset,
        countryCode,
        defaultTimezone,
        defaultCurrency,
        sortOrder,
        updatedBy
      ];

      const result = await query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in updateData:', error);
      throw error;
    }
  }

  // Soft delete data
  static async deleteData(dataType, code, deletedBy = 'SYSTEM') {
    try {
      const sql = `
        UPDATE CountryDataMaster 
        SET 
          IsActive = FALSE, 
          UpdatedBy = $3,
          UpdatedDate = NOW()
        WHERE DataType = $1 AND Code = $2 AND IsActive = TRUE
        RETURNING 
          CommonDataID as "id",
          DataType as "dataType",
          Code as "code",
          Name as "name",
          IsActive as "isActive"
      `;

      const result = await query(sql, [dataType.toUpperCase(), code.toUpperCase(), deletedBy]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in deleteData:', error);
      throw error;
    }
  }

  // Check if data exists
  static async checkDataExists(dataType, code) {
    try {
      const sql = `
        SELECT 
          CommonDataID as "id",
          IsActive as "isActive"
        FROM CountryDataMaster 
        WHERE DataType = $1 AND Code = $2
      `;

      const result = await query(sql, [dataType.toUpperCase(), code.toUpperCase()]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in checkDataExists:', error);
      throw error;
    }
  }

  // Get data by ID
  static async getDataById(id) {
    try {
      const sql = `
        SELECT 
          CommonDataID as "id",
          DataType as "dataType",
          Code as "code",
          Name as "name",
          PhoneCode as "phoneCode",
          Symbol as "symbol",
          UTCOffset as "utcOffset",
          CountryCode as "countryCode",
          DefaultTimezone as "defaultTimezone",
          DefaultCurrency as "defaultCurrency",
          SortOrder as "sortOrder",
          IsActive as "isActive",
          CreatedBy as "createdBy",
          UpdatedBy as "updatedBy",
          CreatedDate as "createdDate",
          UpdatedDate as "updatedDate"
        FROM CountryDataMaster 
        WHERE CommonDataID = $1
      `;

      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getDataById:', error);
      throw error;
    }
  }

  // Get countries with pagination and filters
  static async getCountriesWithFilters(filters = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        isActive = true
      } = filters;

      let whereConditions = ['DataType = $1'];
      let params = ['COUNTRY'];
      let paramIndex = 2;

      if (isActive !== null) {
        whereConditions.push(`IsActive = $${paramIndex}`);
        params.push(isActive);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`(Name ILIKE $${paramIndex} OR Code ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * pageSize;

      // Get total count
      const countSql = `
        SELECT COUNT(*) as total
        FROM CountryDataMaster
        WHERE ${whereClause}
      `;
      const countResult = await query(countSql, params);
      const totalCount = parseInt(countResult.rows[0].total);

      // Get paginated data
      const dataSql = `
        SELECT 
          CommonDataID as "id",
          Code as "countryCode",
          Name as "name",
          PhoneCode as "code",
          DefaultTimezone as "timezone",
          DefaultCurrency as "currency",
          SortOrder as "sortOrder",
          IsActive as "isActive"
        FROM CountryDataMaster 
        WHERE ${whereClause}
        ORDER BY SortOrder ASC, Name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(pageSize, offset);
      const dataResult = await query(dataSql, params);

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: dataResult.rows,
        totalCount,
        totalPages,
        currentPage: page,
        pageSize
      };
    } catch (error) {
      console.error('Error in getCountriesWithFilters:', error);
      throw error;
    }
  }
}

module.exports = CountryDataMasterModel;