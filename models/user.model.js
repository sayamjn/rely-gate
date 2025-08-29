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
        LinkeFlatName,
        PhotoFlag,
        PhotoPath,
        Photo as ProfileImage
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
        TenantCode,
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
        UpdatedDate,
        EntityLogoFlag,
        EntityLogo,
        EntityLogoPath
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

  // Get all users with pagination and filters
  static async getUsers({ tenantId, page = 1, pageSize = 20, search = '', role = '', status = '' }) {
    let sql = `
      SELECT 
        u.LoginID,
        u.TenantID,
        u.UserName,
        u.FirstN,
        u.MiddleN,
        u.LastN,
        u.DisplayN,
        u.Email,
        u.Mobile,
        u.RoleAccessID,
        u.RoleName,
        u.IsActive,
        u.LinkFlatFlag,
        u.LinkeFlatID,
        u.LinkeFlatName,
        u.PhotoFlag,
        u.PhotoPath,
        u.Photo as ProfileImage,
        u.CreatedDate,
        u.UpdatedDate,
        u.CreatedBy,
        u.UpdatedBy,
        creator.UserName as CreatedByUsername,
        updater.UserName as UpdatedByUsername
      FROM LoginUser u
      LEFT JOIN LoginUser creator ON (
        (u.CreatedBy = creator.LoginID::TEXT OR u.CreatedBy = creator.UserName) 
        AND creator.TenantID = u.TenantID
      )
      LEFT JOIN LoginUser updater ON (
        (u.UpdatedBy = updater.LoginID::TEXT OR u.UpdatedBy = updater.UserName) 
        AND updater.TenantID = u.TenantID
      )
      WHERE u.TenantID = $1
    `;
    
    const params = [tenantId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      sql += ` AND (u.FirstN ILIKE $${paramCount} OR u.LastN ILIKE $${paramCount} OR u.UserName ILIKE $${paramCount} OR u.Email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (role) {
      paramCount++;
      sql += ` AND u.RoleName = $${paramCount}`;
      params.push(role);
    }

    if (status) {
      paramCount++;
      sql += ` AND u.IsActive = $${paramCount}`;
      params.push(status);
    }

    sql += ` ORDER BY u.CreatedDate DESC`;

    const offset = (page - 1) * pageSize;
    sql += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(pageSize, offset);

    const countSql = `
      SELECT COUNT(*) as total
      FROM LoginUser u
      WHERE u.TenantID = $1
      ${search ? ` AND (u.FirstN ILIKE $2 OR u.LastN ILIKE $2 OR u.UserName ILIKE $2 OR u.Email ILIKE $2)` : ''}
      ${role ? ` AND u.RoleName = $${search ? 3 : 2}` : ''}
      ${status ? ` AND u.IsActive = $${(search ? 1 : 0) + (role ? 1 : 0) + 2}` : ''}
    `;

    try {
      const [result, countResult] = await Promise.all([
        query(sql, params),
        query(countSql, params.slice(0, paramCount))
      ]);

      // console.log("result: ",result)

      return {
        users: result.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        pageSize,
        totalPages: Math.ceil(countResult.rows[0].total / pageSize)
      };
    } catch (error) {
      throw error;
    }
  }

  // Create new user
  static async createNewUser({ tenantId, userName, firstName, middleName, lastName, displayName, email, mobile, password, roleName, isActive = 'Y', profileImage, createdBy }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const photoFlag = profileImage ? 'Y' : 'N';
    
    const sql = `
      INSERT INTO LoginUser (
        TenantID, UserName, Passwrd, FirstN, MiddleN, LastN, DisplayN, 
        Email, Mobile, RoleName, PhotoFlag, Photo, IsActive, CreatedDate, CreatedBy
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14)
      RETURNING LoginID, UserName, FirstN, LastN, Email, Mobile, RoleName, PhotoFlag, Photo as ProfileImage, IsActive, CreatedDate
    `;
    
    try {
      const result = await query(sql, [
        tenantId, userName, hashedPassword, firstName, middleName, lastName, 
        displayName, email, mobile, roleName, photoFlag, profileImage, isActive, createdBy
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async updateUser({ loginId, tenantId, userName, firstName, middleName, lastName, displayName, email, mobile, roleName, profileImage, isActive, updatedBy }) {
    const photoFlag = profileImage ? 'Y' : 'N';
    
    let sql, params;
    
    if (profileImage !== undefined) {
      // Update with profile image
      sql = `
        UPDATE LoginUser 
        SET 
          UserName = $3,
          FirstN = $4,
          MiddleN = $5,
          LastN = $6,
          DisplayN = $7,
          Email = $8,
          Mobile = $9,
          RoleName = $10,
          PhotoFlag = $11,
          Photo = $12,
          IsActive = $13,
          UpdatedDate = NOW(),
          UpdatedBy = $14
        WHERE LoginID = $1 AND TenantID = $2
        RETURNING LoginID, UserName, FirstN, LastN, Email, Mobile, RoleName, PhotoFlag, Photo as ProfileImage, IsActive, UpdatedDate
      `;
      params = [
        loginId, tenantId, userName, firstName, middleName, lastName, 
        displayName, email, mobile, roleName, photoFlag, profileImage, isActive, updatedBy
      ];
    } else {
      // Update without changing profile image
      sql = `
        UPDATE LoginUser 
        SET 
          UserName = $3,
          FirstN = $4,
          MiddleN = $5,
          LastN = $6,
          DisplayN = $7,
          Email = $8,
          Mobile = $9,
          RoleName = $10,
          IsActive = $11,
          UpdatedDate = NOW(),
          UpdatedBy = $12
        WHERE LoginID = $1 AND TenantID = $2
        RETURNING LoginID, UserName, FirstN, LastN, Email, Mobile, RoleName, PhotoFlag, Photo as ProfileImage, IsActive, UpdatedDate
      `;
      params = [
        loginId, tenantId, userName, firstName, middleName, lastName, 
        displayName, email, mobile, roleName, isActive, updatedBy
      ];
    }
    
    try {
      const result = await query(sql, params);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Reset user password
  static async resetPassword({ loginId, tenantId, newPassword, updatedBy }) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const sql = `
      UPDATE LoginUser 
      SET Passwrd = $3, UpdatedDate = NOW(), UpdatedBy = $4
      WHERE LoginID = $1 AND TenantID = $2
      RETURNING LoginID, UserName
    `;
    
    try {
      const result = await query(sql, [loginId, tenantId, hashedPassword, updatedBy]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete user (soft delete)
  static async deleteUser({ loginId, tenantId, updatedBy }) {
    const sql = `
      UPDATE LoginUser 
      SET IsActive = 'N', UpdatedDate = NOW(), UpdatedBy = $3
      WHERE LoginID = $1 AND TenantID = $2
      RETURNING LoginID, UserName
    `;
    
    try {
      const result = await query(sql, [loginId, tenantId, updatedBy]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user roles
  static async getUserRoles(tenantId) {
    const sql = `
      SELECT DISTINCT RoleName
      FROM LoginUser
      WHERE TenantID = $1 AND RoleName IS NOT NULL
      ORDER BY RoleName
    `;
    
    try {
      const result = await query(sql, [tenantId]);
      return result.rows.map(row => row.rolename);
    } catch (error) {
      throw error;
    }
  }

  // Check if username already exists (for validation)
  static async checkUsernameExists({ userName, tenantId, excludeLoginId = null }) {
    let sql = `
      SELECT 1 FROM LoginUser
      WHERE UserName = $1 AND TenantID = $2
    `;
    const params = [userName, tenantId];
    
    if (excludeLoginId) {
      sql += ` AND LoginID != $3`;
      params.push(excludeLoginId);
    }
    
    const result = await query(sql, params);
    return result.rowCount > 0;
  }

  // Check if email already exists (for validation)
  static async checkEmailExists({ email, tenantId, excludeLoginId = null }) {
    let sql = `
      SELECT 1 FROM LoginUser
      WHERE Email = $1 AND TenantID = $2
    `;
    const params = [email, tenantId];
    
    if (excludeLoginId) {
      sql += ` AND LoginID != $3`;
      params.push(excludeLoginId);
    }
    
    const result = await query(sql, params);
    return result.rowCount > 0;
  }
}

module.exports = UserModel;
