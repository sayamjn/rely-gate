const { query } = require("../config/database");
const ResponseFormatter = require("../utils/response");

class ReportService {
  static async getRegisteredSummaryReport(tenantId, subCatId, fromDate, toDate, catId) {
    try {
      const sql = `
        SELECT 
          vr."VistorName",
          vr."Mobile", 
          vr."VisitorCatName",
          vr."VisitorSubCatName",
          vr."FlatName",
          COUNT(vh."RegVisitorHistoryID") as "visitCount",
          MAX(vh."CreatedDate") as "lastVisit"
        FROM "VisitorRegistration" vr
        LEFT JOIN "VisitorRegVisitHistory" vh ON vr."VisitorRegID" = vh."VisitorRegID"
        WHERE vr."TenantID" = $1
          AND vr."VisitorCatID" = $2  
          AND vr."VisitorSubCatID" = $3
          AND vh."CreatedDate" BETWEEN $4 AND $5
          AND vh."IsActive" = 'Y'
        GROUP BY vr."VisitorRegID", vr."VistorName", vr."Mobile", 
                 vr."VisitorCatName", vr."VisitorSubCatName", vr."FlatName"
        ORDER BY "visitCount" DESC
      `;

      const result = await query(sql, [tenantId, catId, subCatId, fromDate, toDate]);
      return ResponseFormatter.success(result.rows, 'Summary report generated', result.rows.length);
    } catch (error) {
      console.error('Error in summary report:', error);
      return ResponseFormatter.error('Failed to generate summary report');
    }
  }

  static async getVisitorVisitHistory(startDate, endDate, tenantId, catId, subCatId, remark) {
    try {
      const sql = `
        SELECT 
          vh."RegVisitorHistoryID",
          vr."VistorName",
          vr."Mobile",
          vr."VisitorCatName", 
          vr."VisitorSubCatName",
          vr."FlatName",
          vh."INTimeTxt",
          vh."OutTimeTxt", 
          vh."CreatedDate",
          vr."PhotoPath"
        FROM "VisitorRegVisitHistory" vh
        JOIN "VisitorRegistration" vr ON vh."VisitorRegID" = vr."VisitorRegID"
        WHERE vh."TenantID" = $1
          AND vh."CreatedDate" BETWEEN $2 AND $3
          AND vr."VisitorCatID" = $4
          AND vr."VisitorSubCatID" = $5
          AND vh."IsActive" = 'Y'
        ORDER BY vh."CreatedDate" DESC
      `;

      const result = await query(sql, [tenantId, startDate, endDate, catId, subCatId]);
      return ResponseFormatter.success(result.rows, 'Visit history retrieved', result.rows.length);
    } catch (error) {
      console.error('Error in visit history:', error);
      return ResponseFormatter.error('Failed to get visit history');
    }
  }
}

module.exports = ReportService