const { query } = require('../config/database');


class FloorModel {
  static async getAll(tenantId, blockId = null) {
    let sql = `
      SELECT 
        FloorID,
        TenantID,
        IsActive,
        FloorName,
        BlockID,
        BlockName,
        CreatedDate,
        UpdatedDate,
        CreatedBy,
        UpdatedBy
      FROM FloorMaster
      WHERE TenantID = $1 AND IsActive = 'Y'
    `;

    const params = [tenantId];

    if (blockId) {
      sql += ` AND BlockID = $2`;
      params.push(blockId);
    }

    sql += ` ORDER BY FloorName`;

    const result = await query(sql, params);
    return result.rows;
  }

  static async getById(floorId, tenantId) {
    const sql = `
      SELECT *
      FROM FloorMaster
      WHERE FloorID = $1 AND TenantID = $2 AND IsActive = 'Y'
    `;
    
    const result = await query(sql, [floorId, tenantId]);
    return result.rows[0] || null;
  }
}

module.exports = FloorModel;

