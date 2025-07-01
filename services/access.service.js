class AccessService {
  // Utility.CheckUserAccess method
  static async checkUserAccess(tenantId, role, username) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM "LoginUser"
        WHERE "UserName" = $1 
          AND "TenantID" = $2 
          AND "IsActive" = 'Y'
      `;

      const result = await query(sql, [username, tenantId]);
      return result.rows[0].count > 0;
    } catch (error) {
      console.error('Error checking user access:', error);
      return false;
    }
  }

  // Role-based access control
  static async checkRoleAccess(userId, tenantId, requiredRole) {
    try {
      const sql = `
        SELECT "RoleName", "RoleAccessID"
        FROM "LoginUser" 
        WHERE "LoginID" = $1 AND "TenantID" = $2 AND "IsActive" = 'Y'
      `;

      const result = await query(sql, [userId, tenantId]);
      if (result.rows.length === 0) return false;

      const userRole = result.rows[0].RoleName;
      return userRole === requiredRole || userRole === 'Admin';
    } catch (error) {
      console.error('Error checking role access:', error);
      return false;
    }
  }
}

module.exports = AccessService