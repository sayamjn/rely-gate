const { query } = require('../config/database');


class BlockModel {
  static async getAll(tenantId) {
    const sql = `
      SELECT 
        BlockID,
        TenantID,
        IsActive,
        BlockName,
        CreatedDate,
        UpdatedDate,
        CreatedBy,
        UpdatedBy
      FROM BlockMaster
      WHERE TenantID = $1 AND IsActive = 'Y'
      ORDER BY BlockName
    `;
    
    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  static async getById(blockId, tenantId) {
    const sql = `
      SELECT *
      FROM BlockMaster
      WHERE BlockID = $1 AND TenantID = $2 AND IsActive = 'Y'
    `;
    
    const result = await query(sql, [blockId, tenantId]);
    return result.rows[0] || null;
  }
}

module.exports = BlockModel