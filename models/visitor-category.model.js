const { query } = require('../config/database');

class VisitorCategoryModel {
  static async getAll(tenantId) {
    const sql = `
      SELECT 
        VisitorCatID,
        TenantID,
        IsActive,
        VisitorCatName,
        VisitorCatIconFlag,
        VisitorCatIconPath,
        VisitorCatIcon,
        CreatedDate,
        UpdatedDate,
        CreatedBy,
        UpdatedBy
      FROM VisitorCategory
      WHERE TenantID = $1 AND IsActive = 'Y'
      ORDER BY VisitorCatName
    `;
    
    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  static async getById(visitorCatId, tenantId) {
    const sql = `
      SELECT *
      FROM VisitorCategory
      WHERE VisitorCatID = $1 AND TenantID = $2 AND IsActive = 'Y'
    `;
    
    const result = await query(sql, [visitorCatId, tenantId]);
    return result.rows[0] || null;
  }
}

module.exports = VisitorCategoryModel