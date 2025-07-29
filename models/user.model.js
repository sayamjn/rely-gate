const { query } = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
  // Find user by username and tenant ID
  static async findByUsernameAndTenant(username, tenantId) {
    const sql = `
      SELECT 
        LoginID,
        TenantID,
        UserName,
        Passwrd,
        FirstN,
        MiddleN,
        LastN,
        DisplayN,
        Email,
        Mobile,
        RoleAccessID,
        RoleName,
        IsActive,
        LinkFlatFlag,
        LinkeFlatID,
        LinkeFlatName,
        EXTRACT(EPOCH FROM LastLogin) AS LastLogin
      FROM LoginUser
      WHERE UserName = $1 AND TenantID = $2 AND IsActive = 'Y'
    `;
    
    try {
      const result = await query(sql, [username, tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by LoginID and tenant ID
  static async findByLoginIdAndTenant(loginId, tenantId) {
    const sql = `
      SELECT 
        LoginID,
        TenantID,
        UserName,
        FirstN,
        MiddleN,
        LastN,
        DisplayN,
        Email,
        Mobile,
        RoleAccessID,
        RoleName,
        IsActive,
        LinkFlatFlag,
        LinkeFlatID,
        LinkeFlatName
      FROM LoginUser
      WHERE LoginID = $1 AND TenantID = $2
    `;
    
    try {
      const result = await query(sql, [loginId, tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(userId, tenantId) {
    const sql = `
      SELECT 
        LoginID,
        TenantID,
        UserName,
        FirstN,
        MiddleN,
        LastN,
        DisplayN,
        Email,
        Mobile,
        RoleAccessID,
        RoleName,
        IsActive,
        LinkFlatFlag,
        LinkeFlatID,
        LinkeFlatName
      FROM LoginUser
      WHERE LoginID = $1 AND TenantID = $2 AND IsActive = 'Y'
    `;
    
    try {
      const result = await query(sql, [userId, tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw error;
    }
  }

  // Update last login
  static async updateLastLogin(userId, tenantId) {
    const sql = `
      UPDATE LoginUser 
      SET LastLogin = NOW(), UpdatedDate = NOW()
      WHERE LoginID = $1 AND TenantID = $2
    `;
    
    try {
      await query(sql, [userId, tenantId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get tenant details
  static async getTenantDetails(tenantId) {
    const sql = `
      SELECT 
        TenantID, 
        TenantName, 
        IsActive,
        Currency,
        TimeZone,
        CountryCode,
        Country
      FROM Tenant
      WHERE TenantID = $1 AND IsActive = 'Y'
    `;
    
    try {
      const result = await query(sql, [tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      console.log('Tenant table might not exist, returning default');
      return { TenantID: tenantId, TenantName: 'Default Tenant', IsActive: 'Y' };
    }
  }

  // Get comprehensive tenant information
  static async getComprehensiveTenantInfo(tenantId) {
    const sql = `
      SELECT 
        TenantID,
        TenantCode,
        TenantName,
        ShortName,
        Email,
        Mobile,
        Currency,
        TimeZone,
        CountryCode,
        Country,
        CreatedDate,
        UpdatedDate
      FROM Tenant
      WHERE TenantID = $1 AND IsActive = 'Y'
    `;
    
    try {
      const result = await query(sql, [tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      console.log('Error fetching comprehensive tenant info:', error);
      return null;
    }
  }

  // Create user
  static async createUser({ tenantId, userName, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO LoginUser (TenantID, UserName, Passwrd, IsActive, CreatedDate)
      VALUES ($1, $2, $3, 'Y', NOW())
      RETURNING LoginID, UserName, TenantID
    `;
    const result = await query(sql, [tenantId, userName, hashedPassword]);
    return result.rows[0];
  }

  static async checkUserExists({ userName, tenantId }) {
    const sql = `
      SELECT 1 FROM LoginUser
      WHERE UserName = $1 AND TenantID = $2 AND IsActive = 'Y'
    `;
    const result = await query(sql, [userName, tenantId]);
    return result.rowCount > 0;
  }
}

module.exports = UserModel;
