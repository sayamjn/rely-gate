const { query } = require('../config/database');

class CategoryModel {
  static async getVisitorCategories(tenantId) {
    const sql = `
      SELECT 
        VisitorCatID, VisitorCatName, VisitorCatIconFlag,
        VisitorCatIconPath, VisitorCatIcon, IsActive
      FROM VisitorCategory
      WHERE TenantID = $1 AND IsActive = 'Y'
      ORDER BY VisitorCatName
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  static async getVisitorSubCategories(tenantId, visitorCatId = null) {
    let sql = `
      SELECT 
        VisitorSubCatID, VisitorCatID, VisitorCatName,
        VisitorSubCatName, VisitorSubCatIconFlag,
        VisitorSubCatIconPath, VisitorSubCatIcon, IsActive
      FROM VisitorSubCategory
      WHERE TenantID = $1 AND IsActive = 'Y'
    `;

    const params = [tenantId];

    if (visitorCatId) {
      sql += ` AND VisitorCatID = $2`;
      params.push(visitorCatId);
    }

    sql += ` ORDER BY VisitorSubCatName`;

    const result = await query(sql, params);
    return result.rows;
  }

  static async getVisitorPurposes(tenantId, purposeCatId = null) {
    let sql = `
      SELECT 
        VisitPurposeID, PurposeCatID, PurposeCatName,
        VisitPurpose, IsActive
      FROM VisitorPuposeMaster
      WHERE TenantID = $1 AND IsActive = 'Y'
    `;

    const params = [tenantId];

    if (purposeCatId) {
      sql += ` AND PurposeCatID = $2`;
      params.push(purposeCatId);
    }

    sql += ` ORDER BY VisitPurpose`;

    const result = await query(sql, params);
    return result.rows;
  }

  static async getIdentityTypes(tenantId) {
    const sql = `
      SELECT 
        IdentityID, IDName, IDIconFlag,
        IDIconPath, IDIconPic, IsActive
      FROM IDMaster
      WHERE TenantID = $1 AND IsActive = 'Y'
      ORDER BY IDName
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }
}

module.exports = CategoryModel;