const { query } = require('../config/database');

class FlatModel {
  static async getAllFlats(tenantId, blockId = null, floorId = null) {
    let sql = `
      SELECT 
        FlatID, TenantID, FlatName, FloorID, FloorName,
        BlockID, BlockName, OwnerFName, OwnerMName, OwnerLName,
        OwnerMobile, OwnerMobile_2, RentFlag, IsVacant,
        SocietyFeePerMonth, NoFamilyMember, NoChildren, NoMaid,
        IsActive, CreatedDate, UpdatedDate
      FROM FlatMaster
      WHERE TenantID = $1 AND IsActive = 'Y'
    `;

    const params = [tenantId];
    let paramIndex = 2;

    if (blockId) {
      sql += ` AND BlockID = $${paramIndex}`;
      params.push(blockId);
      paramIndex++;
    }

    if (floorId) {
      sql += ` AND FloorID = $${paramIndex}`;
      params.push(floorId);
    }

    sql += ` ORDER BY FlatName`;

    const result = await query(sql, params);
    return result.rows;
  }

  static async getFlatById(flatId, tenantId) {
    const sql = `
      SELECT * FROM FlatMaster
      WHERE FlatID = $1 AND TenantID = $2 AND IsActive = 'Y'
    `;

    const result = await query(sql, [flatId, tenantId]);
    return result.rows[0];
  }

  static async getFlatByName(flatName, tenantId) {
    const sql = `
      SELECT FlatID, FlatName, BlockName, FloorName
      FROM FlatMaster
      WHERE FlatName = $1 AND TenantID = $2 AND IsActive = 'Y'
    `;

    const result = await query(sql, [flatName, tenantId]);
    return result.rows[0];
  }
}

module.exports = FlatModel;