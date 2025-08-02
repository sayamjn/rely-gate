const { query } = require("../config/database");

class LinkedTenantsModel {
  // Verify if a user has access to a specific tenant
  static async verifyAccess(loginId, tenantId) {
    const sql = `
      SELECT id, tenantId, tenantName, isPrimary
      FROM linkedTenants 
      WHERE loginId = $1 
        AND tenantId = $2 
        AND isActive = TRUE
    `;
    
    const result = await query(sql, [loginId, tenantId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Get all linked tenants for a user
  static async getMyLinkedTenants(loginId) {
    const sql = `
      SELECT 
        lt.id,
        lt.tenantId,
        lt.tenantName,
        lt.email,
        lt.mobile,
        lt.isPrimary,
        lt.createdAt,
        t.TenantName as actualTenantName,
        t.TenantCode,
        t.IsActive as tenantIsActive
      FROM linkedTenants lt
      LEFT JOIN Tenant t ON lt.tenantId = t.TenantID
      WHERE lt.loginId = $1 
        AND lt.isActive = TRUE
        AND t.IsActive = 'Y'
      ORDER BY lt.isPrimary DESC, lt.tenantName ASC
    `;
    
    const result = await query(sql, [loginId]);
    return result.rows;
  }

  // Create new tenant link
  static async createTenantLink(data) {
    const { loginId, tenantId, tenantName, email, mobile, isPrimary = false, createdBy } = data;
    
    const sql = `
      INSERT INTO linkedTenants 
      (loginId, tenantId, tenantName, email, mobile, isPrimary, createdBy, updatedBy)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      RETURNING *
    `;
    
    const params = [loginId, tenantId, tenantName, email, mobile, isPrimary, createdBy];
    const result = await query(sql, params);
    return result.rows[0];
  }

  // Update tenant link
  static async updateTenantLink(id, data) {
    const { tenantName, email, mobile, isPrimary, updatedBy } = data;
    
    const sql = `
      UPDATE linkedTenants 
      SET tenantName = $2,
          email = $3,
          mobile = $4,
          isPrimary = $5,
          updatedBy = $6,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = $1 AND isActive = TRUE
      RETURNING *
    `;
    
    const params = [id, tenantName, email, mobile, isPrimary, updatedBy];
    const result = await query(sql, params);
    return result.rows[0];
  }

  // Delete (soft delete) tenant link
  static async deleteTenantLink(id, updatedBy) {
    const sql = `
      UPDATE linkedTenants 
      SET isActive = FALSE,
          updatedBy = $2,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(sql, [id, updatedBy]);
    return result.rows[0];
  }

  // Get single tenant link by ID
  static async getTenantLinkById(id) {
    const sql = `
      SELECT 
        lt.*,
        t.TenantName as actualTenantName,
        t.TenantCode,
        lu.UserName
      FROM linkedTenants lt
      LEFT JOIN Tenant t ON lt.tenantId = t.TenantID
      LEFT JOIN loginUser lu ON lt.loginId = lu.loginId
      WHERE lt.id = $1
    `;
    
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Check if user has any linked tenants
  static async hasLinkedTenants(loginId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM linkedTenants 
      WHERE loginId = $1 AND isActive = TRUE
    `;
    
    const result = await query(sql, [loginId]);
    return parseInt(result.rows[0].count) > 0;
  }

  // Get user's primary tenant
  static async getPrimaryTenant(loginId) {
    const sql = `
      SELECT *
      FROM linkedTenants 
      WHERE loginId = $1 
        AND isPrimary = TRUE 
        AND isActive = TRUE
    `;
    
    const result = await query(sql, [loginId]);
    return result.rows[0];
  }

  // Set primary tenant (ensures only one primary per user)
  static async setPrimaryTenant(loginId, tenantId, updatedBy) {
    try {
      // Start transaction
      await query('BEGIN');

      // Remove primary flag from all user's tenants
      await query(`
        UPDATE linkedTenants 
        SET isPrimary = FALSE, updatedBy = $2, updatedAt = CURRENT_TIMESTAMP
        WHERE loginId = $1
      `, [loginId, updatedBy]);

      // Set new primary tenant
      const result = await query(`
        UPDATE linkedTenants 
        SET isPrimary = TRUE, updatedBy = $3, updatedAt = CURRENT_TIMESTAMP
        WHERE loginId = $1 AND tenantId = $2 AND isActive = TRUE
        RETURNING *
      `, [loginId, tenantId, updatedBy]);

      await query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  // Bulk link/unlink management
  static async manageTenantsLink(loginId, action, tenantData, updatedBy) {
    const { tenantId, tenantName, email, mobile } = tenantData;

    if (action === 'link') {
      // Check if already linked
      const existing = await this.verifyAccess(loginId, tenantId);
      if (existing) {
        throw new Error('User is already linked to this tenant');
      }

      return await this.createTenantLink({
        loginId,
        tenantId,
        tenantName,
        email,
        mobile,
        createdBy: updatedBy
      });
    } else if (action === 'unlink') {
      const sql = `
        UPDATE linkedTenants 
        SET isActive = FALSE, updatedBy = $3, updatedAt = CURRENT_TIMESTAMP
        WHERE loginId = $1 AND tenantId = $2
        RETURNING *
      `;
      
      const result = await query(sql, [loginId, tenantId, updatedBy]);
      return result.rows[0];
    } else {
      throw new Error('Invalid action. Use "link" or "unlink"');
    }
  }

  // Get tenant info by ID (for JWT switching)
  static async getTenantInfo(tenantId) {
    const sql = `
      SELECT TenantID as tenantId, TenantName as tenantName, TenantCode
      FROM Tenant 
      WHERE TenantID = $1 AND IsActive = TRUE
    `;
    
    const result = await query(sql, [tenantId]);
    return result.rows[0];
  }

  // Admin function: Get all tenant links with pagination
  static async getAllTenantLinks(page = 1, pageSize = 20, filters = {}) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE lt.isActive = TRUE';
    let params = [];
    let paramIndex = 1;

    if (filters.loginId) {
      whereClause += ` AND lt.loginId = $${paramIndex}`;
      params.push(filters.loginId);
      paramIndex++;
    }

    if (filters.tenantId) {
      whereClause += ` AND lt.tenantId = $${paramIndex}`;
      params.push(filters.tenantId);
      paramIndex++;
    }

    const sql = `
      SELECT 
        lt.*,
        t.TenantName as actualTenantName,
        lu.UserName
      FROM linkedTenants lt
      LEFT JOIN Tenant t ON lt.tenantId = t.TenantID
      LEFT JOIN loginUser lu ON lt.loginId = lu.loginId
      ${whereClause}
      ORDER BY lt.createdAt DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);
    const result = await query(sql, params);

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM linkedTenants lt
      ${whereClause}
    `;
    const countResult = await query(countSql, params.slice(0, -2));

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      pageSize,
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / pageSize)
    };
  }
}

module.exports = LinkedTenantsModel;