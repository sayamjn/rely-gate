const { query } = require('../config/database');

class RoleModel {
  // Get all roles with pagination and filters
  static async getRoles({ tenantId, page = 1, pageSize = 20, search = '', status = '' }) {
    let sql = `
      SELECT 
        RoleID,
        TenantID,
        RoleCode,
        RoleName,
        RoleRemark,
        IsActive,
        CreatedDate,
        UpdatedDate,
        CreatedBy,
        UpdatedBy
      FROM RoleMaster
      WHERE TenantID = $1
    `;
    
    const params = [tenantId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      sql += ` AND (RoleName ILIKE $${paramCount} OR RoleCode ILIKE $${paramCount} OR RoleRemark ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (status && status !== '' && status !== 'all') {
      paramCount++;
      sql += ` AND IsActive = $${paramCount}`;
      params.push(status);
    } else if (!status || status === '') {
      // Default to showing only active roles
      sql += ` AND IsActive = 'Y'`;
    }
    // If status === 'all', don't add any IsActive filter

    sql += ` ORDER BY RoleName ASC`;

    const offset = (page - 1) * pageSize;
    sql += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(pageSize, offset);

    let countSql = `
      SELECT COUNT(*) as total
      FROM RoleMaster
      WHERE TenantID = $1
    `;
    
    if (search) {
      countSql += ` AND (RoleName ILIKE $2 OR RoleCode ILIKE $2 OR RoleRemark ILIKE $2)`;
    }
    
    if (status && status !== '' && status !== 'all') {
      countSql += ` AND IsActive = $${search ? 3 : 2}`;
    } else if (!status || status === '') {
      countSql += ` AND IsActive = 'Y'`;
    }
    // If status === 'all', don't add any IsActive filter

    try {
      const [result, countResult] = await Promise.all([
        query(sql, params),
        query(countSql, params.slice(0, paramCount))
      ]);

      return {
        roles: result.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        pageSize,
        totalPages: Math.ceil(countResult.rows[0].total / pageSize)
      };
    } catch (error) {
      throw error;
    }
  }

  // Get role by ID
  static async findByRoleIdAndTenant(roleId, tenantId) {
    const sql = `
      SELECT 
        RoleID,
        TenantID,
        RoleCode,
        RoleName,
        RoleRemark,
        IsActive,
        CreatedDate,
        UpdatedDate,
        CreatedBy,
        UpdatedBy
      FROM RoleMaster
      WHERE RoleID = $1 AND TenantID = $2
    `;
    
    try {
      const result = await query(sql, [roleId, tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Create new role
  static async createRole({ tenantId, roleCode, roleName, roleRemark, isActive = 'Y', createdBy }) {
    const sql = `
      INSERT INTO RoleMaster (
        TenantID, RoleCode, RoleName, RoleRemark, IsActive, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $6)
      RETURNING RoleID, TenantID, RoleCode, RoleName, RoleRemark, IsActive, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
    `;
    
    try {
      const result = await query(sql, [tenantId, roleCode, roleName, roleRemark, isActive, createdBy]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update role
  static async updateRole({ roleId, tenantId, roleCode, roleName, roleRemark, isActive, updatedBy }) {
    const sql = `
      UPDATE RoleMaster 
      SET 
        RoleCode = $3,
        RoleName = $4,
        RoleRemark = $5,
        IsActive = $6,
        UpdatedDate = NOW(),
        UpdatedBy = $7
      WHERE RoleID = $1 AND TenantID = $2
      RETURNING RoleID, TenantID, RoleCode, RoleName, RoleRemark, IsActive, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
    `;
    
    try {
      const result = await query(sql, [roleId, tenantId, roleCode, roleName, roleRemark, isActive, updatedBy]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete role (soft delete)
  static async deleteRole({ roleId, tenantId, updatedBy }) {
    const sql = `
      UPDATE RoleMaster 
      SET IsActive = 'N', UpdatedDate = NOW(), UpdatedBy = $3
      WHERE RoleID = $1 AND TenantID = $2
      RETURNING RoleID, RoleName
    `;
    
    try {
      const result = await query(sql, [roleId, tenantId, updatedBy]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Check if role code already exists
  static async checkRoleCodeExists({ roleCode, tenantId, excludeRoleId = null }) {
    let sql = `
      SELECT 1 FROM RoleMaster
      WHERE RoleCode = $1 AND TenantID = $2 AND IsActive = 'Y'
    `;
    const params = [roleCode, tenantId];
    
    if (excludeRoleId) {
      sql += ` AND RoleID != $3`;
      params.push(excludeRoleId);
    }
    
    const result = await query(sql, params);
    return result.rowCount > 0;
  }

  // Check if role name already exists
  static async checkRoleNameExists({ roleName, tenantId, excludeRoleId = null }) {
    let sql = `
      SELECT 1 FROM RoleMaster
      WHERE RoleName = $1 AND TenantID = $2 AND IsActive = 'Y'
    `;
    const params = [roleName, tenantId];
    
    if (excludeRoleId) {
      sql += ` AND RoleID != $3`;
      params.push(excludeRoleId);
    }
    
    const result = await query(sql, params);
    return result.rowCount > 0;
  }

  // Get active roles for dropdown
  static async getActiveRoles(tenantId) {
    const sql = `
      SELECT RoleID, RoleCode, RoleName, RoleRemark
      FROM RoleMaster
      WHERE TenantID = $1 AND IsActive = 'Y'
      ORDER BY RoleName
    `;
    
    try {
      const result = await query(sql, [tenantId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Check if role is being used by any users
  static async checkRoleInUse({ roleId, tenantId }) {
    const sql = `
      SELECT COUNT(*) as count
      FROM LoginUser
      WHERE RoleAccessID = $1 AND TenantID = $2 AND IsActive = 'Y'
    `;
    
    try {
      const result = await query(sql, [roleId, tenantId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RoleModel;