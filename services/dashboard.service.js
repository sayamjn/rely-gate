class DashboardService {
  static async getDashboardSummary(tenantId) {
    try {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM "VisitorRegistration" 
           WHERE "TenantID" = $1 AND "IsActive" = 'Y') as "totalRegistered",
          
          (SELECT COUNT(*) FROM "VisitorRegVisitHistory" 
           WHERE "TenantID" = $1 AND "IsActive" = 'Y' 
           AND DATE("CreatedDate") = CURRENT_DATE) as "todayCheckins",
           
          (SELECT COUNT(*) FROM "VisitorRegVisitHistory" 
           WHERE "TenantID" = $1 AND "IsActive" = 'Y' 
           AND ("OutTime" IS NULL OR "OutTimeTxt" IS NULL OR "OutTimeTxt" = '')) as "currentlyInside",
           
          (SELECT COUNT(*) FROM "VisitorMaster" 
           WHERE "TenantID" = $1 AND "IsActive" = 'Y' 
           AND DATE("CreatedDate") = CURRENT_DATE) as "todayUnregistered"
      `;

      const result = await query(sql, [tenantId]);
      const summary = result.rows[0];

      return ResponseFormatter.success(summary, 'Dashboard summary retrieved');
    } catch (error) {
      console.error('Error in dashboard summary:', error);
      return ResponseFormatter.error('Failed to get dashboard summary');
    }
  }

  static async getVisitorLatestVisitDetails(tenantId, catId, subCatId) {
    try {
      const sql = `
        SELECT 
          vr."VistorName" as "visitorName",
          vr."Mobile",
          vr."VisitorCatName",
          vr."VisitorSubCatName", 
          vr."FlatName",
          vh."INTimeTxt",
          vh."OutTimeTxt",
          vh."CreatedDate",
          vr."PhotoPath",
          vr."PhotoName"
        FROM "VisitorRegistration" vr
        LEFT JOIN "VisitorRegVisitHistory" vh ON vr."VisitorRegID" = vh."VisitorRegID"
        WHERE vr."TenantID" = $1 
          AND vr."VisitorCatID" = $2
          AND vr."VisitorSubCatID" = $3
          AND vh."IsActive" = 'Y'
        ORDER BY vh."CreatedDate" DESC
        LIMIT 10
      `;

      const result = await query(sql, [tenantId, catId, subCatId]);
      return ResponseFormatter.success(result.rows, 'Latest visit details retrieved', result.rows.length);
    } catch (error) {
      console.error('Error in latest visit details:', error);
      return ResponseFormatter.error('Failed to get visit details');
    }
  }
}


module.exports = DashboardService