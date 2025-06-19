class FCMTokenService {
  static async registerToken(firebaseId, androidId, userName, tenantId, createdBy) {
    try {
      const sql = `
        INSERT INTO "FCM" (
          "TenantID", "FirebaseID", "AndroidID", "UserName", 
          "IsActive", "Custom_1", "CreatedDate", "UpdatedDate", "CreatedBy"
        ) VALUES ($1, $2, $3, $4, 'Y', 'Y', NOW(), NOW(), $5)
        ON CONFLICT ("AndroidID", "TenantID") 
        DO UPDATE SET 
          "FirebaseID" = EXCLUDED."FirebaseID",
          "UpdatedDate" = NOW()
      `;

      await query(sql, [tenantId, firebaseId, androidId, userName, createdBy]);

      return ResponseFormatter.success(
        null,
        'FCM token registered successfully'
      );
    } catch (error) {
      console.error('Error registering FCM token:', error);
      return ResponseFormatter.error('Failed to register FCM token');
    }
  }

  static async updateToken(firebaseId, androidId, tenantId) {
    try {
      const sql = `
        UPDATE "FCM" 
        SET "FirebaseID" = $1, "UpdatedDate" = NOW()
        WHERE "AndroidID" = $2 AND "TenantID" = $3
      `;

      const result = await query(sql, [firebaseId, androidId, tenantId]);

      if (result.rowCount > 0) {
        return ResponseFormatter.success(
          null,
          'FCM token updated successfully'
        );
      } else {
        return ResponseFormatter.error('FCM token not found');
      }
    } catch (error) {
      console.error('Error updating FCM token:', error);
      return ResponseFormatter.error('Failed to update FCM token');
    }
  }

  static async updateNotificationFlag(androidId, flag, tenantId) {
    try {
      // Match C# UpdateFCMNoticeFlag stored procedure
      const sql = `
        UPDATE "FCM" 
        SET "Custom_1" = $1, "UpdatedDate" = NOW()
        WHERE "AndroidID" = $2 AND "TenantID" = $3
        RETURNING "Custom_1" as "FLAG"
      `;

      const result = await query(sql, [flag, androidId, tenantId]);

      if (result.rows.length > 0) {
        const updatedFlag = result.rows[0].FLAG;
        return ResponseFormatter.success(
          { flag: updatedFlag },
          'Notification preference updated'
        );
      } else {
        return ResponseFormatter.error('FCM token not found');
      }
    } catch (error) {
      console.error('Error updating notification flag:', error);
      return ResponseFormatter.error('Failed to update notification preference');
    }
  }
}

module.exports = FCMTokenService