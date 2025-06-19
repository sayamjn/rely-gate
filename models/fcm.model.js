const { query } = require('../config/database');

class FCMModel {
  static async registerToken(tenantId, firebaseId, androidId, userName, createdBy) {
    const sql = `
      INSERT INTO FCM (
        TenantID, FirebaseID, AndroidID, UserName, 
        IsActive, Custom_1, CreatedDate, UpdatedDate, CreatedBy
      ) VALUES ($1, $2, $3, $4, 'Y', 'Y', NOW(), NOW(), $5)
      ON CONFLICT (TenantID, AndroidID) 
      DO UPDATE SET 
        FirebaseID = EXCLUDED.FirebaseID,
        UpdatedDate = NOW()
      RETURNING FCMID
    `;

    const result = await query(sql, [tenantId, firebaseId, androidId, userName, createdBy]);
    return result.rows[0];
  }

  static async updateToken(tenantId, androidId, firebaseId) {
    const sql = `
      UPDATE FCM 
      SET FirebaseID = $3, UpdatedDate = NOW()
      WHERE TenantID = $1 AND AndroidID = $2
      RETURNING FCMID
    `;

    const result = await query(sql, [tenantId, androidId, firebaseId]);
    return result.rows[0];
  }

  static async updateNotificationFlag(tenantId, androidId, flag) {
    const sql = `
      UPDATE FCM 
      SET Custom_1 = $3, UpdatedDate = NOW()
      WHERE TenantID = $1 AND AndroidID = $2
      RETURNING Custom_1 as flag
    `;

    const result = await query(sql, [tenantId, androidId, flag]);
    return result.rows[0];
  }

  static async getFCMTokensForFlat(tenantId, flatName) {
    const sql = `
      SELECT f.FirebaseID as token, f.Custom_1 as flag
      FROM FCM f
      JOIN LoginUser lu ON f.AndroidID = lu.Mobile 
      WHERE f.TenantID = $1 
        AND lu.LinkeFlatName = $2
        AND f.IsActive = 'Y'
        AND lu.IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId, flatName]);
    return result.rows;
  }

  static async getAllFCMTokensExceptUser(tenantId, excludeLoginId) {
    const sql = `
      SELECT f.FirebaseID as token, f.Custom_1 as flag
      FROM FCM f
      JOIN LoginUser lu ON f.UserName = lu.UserName
      WHERE f.TenantID = $1 
        AND lu.LoginID != $2
        AND f.IsActive = 'Y'
        AND lu.IsActive = 'Y'
    `;

    const result = await query(sql, [tenantId, excludeLoginId]);
    return result.rows;
  }
}

module.exports = FCMModel;