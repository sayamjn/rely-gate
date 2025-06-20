const { query } = require("../config/database");

class StudentModel {
  
  // Get students with pagination and search
  static async getStudents(tenantId, pageSize, offset, search = '') {
    const sql = `
      SELECT 
        vr.VisitorRegID,
        vr.VisitorRegNo,
        vr.SecurityCode,
        vr.VistorName,
        vr.Mobile,
        vr.Email,
        vr.VisitorCatID,
        vr.VisitorCatName,
        vr.VisitorSubCatID,
        vr.VisitorSubCatName,
        vr.FlatID,
        vr.FlatName,
        vr.AssociatedFlat,
        vr.VehiclelNo,
        vr.PhotoFlag,
        vr.PhotoPath,
        vr.PhotoName,
        vr.CreatedDate,
        vr.UpdatedDate,
        vr.IsActive,
        -- Add custom fields for course and hostel from bulk upload if available
        COALESCE(bvu.Course, 'N/A') as Course,
        COALESCE(bvu.Hostel, 'N/A') as Hostel,
        COUNT(*) OVER() as total_count
      FROM VisitorRegistration vr
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'Student'
      WHERE vr.TenantID = $1 
        AND vr.IsActive = 'Y'
        AND vr.VisitorCatID = 3
        ${search ? `AND (
          vr.VistorName ILIKE $4 OR 
          vr.Mobile ILIKE $4 OR 
          vr.VisitorRegNo ILIKE $4 OR
          vr.SecurityCode ILIKE $4 OR
          bvu.StudentID ILIKE $4 OR
          bvu.Course ILIKE $4 OR
          bvu.Hostel ILIKE $4
        )` : ''}
      ORDER BY vr.CreatedDate DESC
      LIMIT $2 OFFSET $3
    `;

    const params = search 
      ? [tenantId, pageSize, offset, `%${search}%`]
      : [tenantId, pageSize, offset];

    const result = await query(sql, params);
    return result.rows;
  }

  // Get student by ID
  static async getStudentById(studentId, tenantId) {
    const sql = `
      SELECT 
        vr.VisitorRegID,
        vr.VisitorRegNo,
        vr.SecurityCode,
        vr.VistorName,
        vr.Mobile,
        vr.Email,
        vr.VisitorCatID,
        vr.VisitorCatName,
        vr.VisitorSubCatID,
        vr.VisitorSubCatName,
        vr.FlatID,
        vr.FlatName,
        vr.AssociatedFlat,
        vr.AssociatedBlock,
        vr.VehiclelNo,
        vr.PhotoFlag,
        vr.PhotoPath,
        vr.PhotoName,
        vr.IsActive,
        COALESCE(bvu.Course, 'N/A') as Course,
        COALESCE(bvu.Hostel, 'N/A') as Hostel
      FROM VisitorRegistration vr
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'Student'
      WHERE vr.VisitorRegID = $1 
        AND vr.TenantID = $2 
        AND vr.IsActive = 'Y'
        AND vr.VisitorCatID = 3
    `;

    const result = await query(sql, [studentId, tenantId]);
    return result.rows[0];
  }

  // Get active visit for student (latest uncompleted visit)
  static async getActiveVisit(studentId, tenantId) {
    const sql = `
      SELECT 
        RegVisitorHistoryID,
        VisitorRegID,
        VistorName,
        Mobile,
        INTime,
        INTimeTxt,
        OutTime,
        OutTimeTxt,
        CreatedDate,
        UpdatedDate
      FROM VisitorRegVisitHistory
      WHERE VisitorRegID = $1 
        AND TenantID = $2 
        AND IsActive = 'Y'
      ORDER BY CreatedDate DESC
      LIMIT 1
    `;

    const result = await query(sql, [studentId, tenantId]);
    return result.rows[0];
  }

  // Create visit history record for checkout
  static async createVisitHistory(visitData) {
    const {
      tenantId,
      visitorRegId,
      visitorRegNo,
      securityCode,
      vistorName,
      mobile,
      vehicleNo,
      visitorCatId,
      visitorCatName,
      visitorSubCatId,
      visitorSubCatName,
      associatedFlat,
      associatedBlock,
      createdBy,
    } = visitData;

    const sql = `
      INSERT INTO VisitorRegVisitHistory (
        TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
        VistorName, Mobile, VehiclelNo, VisitorCatID, VisitorCatName,
        VisitorSubCatID, VisitorSubCatName, AssociatedFlat, AssociatedBlock,
        INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES (
        $1, 'Y', 'Y', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        NOW(), TO_CHAR(NOW(), 'HH12:MI AM'), NOW(), NOW(), $14, $14
      ) RETURNING RegVisitorHistoryID
    `;

    const result = await query(sql, [
      tenantId,
      visitorRegId,
      visitorRegNo,
      securityCode,
      vistorName,
      mobile,
      vehicleNo,
      visitorCatId,
      visitorCatName,
      visitorSubCatId,
      visitorSubCatName,
      associatedFlat,
      associatedBlock,
      createdBy,
    ]);

    return result.rows[0];
  }

  // Update visit history for check-in
  static async updateVisitHistoryCheckin(historyId, tenantId, updatedBy) {
    const sql = `
      UPDATE VisitorRegVisitHistory 
      SET OutTime = NOW(), 
          OutTimeTxt = TO_CHAR(NOW(), 'HH12:MI AM'),
          UpdatedDate = NOW(),
          UpdatedBy = $3
      WHERE RegVisitorHistoryID = $1 AND TenantID = $2
      RETURNING RegVisitorHistoryID
    `;

    const result = await query(sql, [historyId, tenantId, updatedBy]);
    return result.rows[0];
  }

  // Get student's visit history
  static async getStudentHistory(studentId, tenantId, limit = 10) {
    const sql = `
      SELECT 
        RegVisitorHistoryID,
        VisitorRegID,
        VistorName,
        Mobile,
        VehiclelNo,
        VisitorCatName,
        VisitorSubCatName,
        AssociatedFlat,
        INTime,
        INTimeTxt,
        OutTime,
        OutTimeTxt,
        CreatedDate,
        UpdatedDate,
        -- Calculate duration if both times exist
        CASE 
          WHEN OutTime IS NOT NULL AND INTime IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (OutTime - INTime))/3600
          ELSE NULL 
        END as DurationHours
      FROM VisitorRegVisitHistory
      WHERE VisitorRegID = $1 
        AND TenantID = $2 
        AND IsActive = 'Y'
      ORDER BY CreatedDate DESC
      LIMIT $3
    `;

    const result = await query(sql, [studentId, tenantId, limit]);
    return result.rows;
  }

  // Get students pending check-in (currently checked out)
  static async getStudentsPendingCheckin(tenantId) {
    const sql = `
      SELECT 
        vh.RegVisitorHistoryID,
        vh.VisitorRegID,
        vh.VistorName,
        vh.Mobile,
        vh.VisitorCatName,
        vh.VisitorSubCatName,
        vh.AssociatedFlat,
        vh.INTime,
        vh.INTimeTxt,
        vr.PhotoPath,
        vr.PhotoName,
        COALESCE(bvu.Course, 'N/A') as Course,
        COALESCE(bvu.Hostel, 'N/A') as Hostel
      FROM VisitorRegVisitHistory vh
      JOIN VisitorRegistration vr ON vh.VisitorRegID = vr.VisitorRegID
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'Student'
      WHERE vh.TenantID = $1 
        AND vh.IsActive = 'Y'
        AND vh.VisitorCatID = 3
        AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '')
      ORDER BY vh.INTime DESC
    `;

    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  // Get student statistics
  static async getStudentStats(tenantId, dateFrom = null, dateTo = null) {
    const sql = `
      SELECT 
        COUNT(DISTINCT vr.VisitorRegID) as TotalStudents,
        COUNT(vh.RegVisitorHistoryID) as TotalVisits,
        COUNT(CASE WHEN vh.OutTime IS NULL THEN 1 END) as CurrentlyOut,
        COUNT(CASE WHEN vh.OutTime IS NOT NULL THEN 1 END) as CompletedVisits
      FROM VisitorRegistration vr
      LEFT JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID 
        AND vh.IsActive = 'Y'
        ${dateFrom && dateTo ? 'AND vh.CreatedDate BETWEEN $2 AND $3' : ''}
      WHERE vr.TenantID = $1 
        AND vr.IsActive = 'Y'
        AND vr.VisitorCatID = 3
    `;

    const params = dateFrom && dateTo 
      ? [tenantId, dateFrom, dateTo]
      : [tenantId];

    const result = await query(sql, params);
    return result.rows[0];
  }

  // Search students by multiple criteria
  // static async searchStudents(tenantId, searchParams = {}) {
  //   const {
  //     search = "",
  //     course = "",
  //     hostel = "",
  //     page = 1,
  //     pageSize = 20,
  //   } = searchParams;

  //   let sql = `
  //     SELECT 
  //       vr.VisitorRegID,
  //       vr.VisitorRegNo,
  //       vr.VistorName,
  //       vr.Mobile,
  //       vr.Email,
  //       vr.VisitorSubCatName,
  //       vr.FlatName,
  //       vr.PhotoPath,
  //       vr.PhotoName,
  //       COALESCE(bvu.Course, 'N/A') as Course,
  //       COALESCE(bvu.Hostel, 'N/A') as Hostel,
  //       vr.CreatedDate,
  //       COUNT(*) OVER() as total_count
  //     FROM VisitorRegistration vr
  //     LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'Student'
  //     WHERE vr.TenantID = $1 
  //       AND vr.IsActive = 'Y' 
  //       AND vr.VisitorCatID = 3
  //   `;

  //   const params = [tenantId];
  //   let paramIndex = 2;

  //   if (search) {
  //     sql += ` AND (
  //       vr.VistorName ILIKE $${paramIndex} OR 
  //       vr.Mobile ILIKE $${paramIndex} OR 
  //       vr.VisitorRegNo ILIKE $${paramIndex} OR
  //       bvu.StudentID ILIKE $${paramIndex}
  //     )`;
  //     params.push(`%${search}%`);
  //     paramIndex++;
  //   }

  //   if (course) {
  //     sql += ` AND bvu.Course ILIKE $${paramIndex}`;
  //     params.push(`%${course}%`);
  //     paramIndex++;
  //   }

  //   if (hostel) {
  //     sql += ` AND bvu.Hostel ILIKE $${paramIndex}`;
  //     params.push(`%${hostel}%`);
  //     paramIndex++;
  //   }

  //   const offset = (page - 1) * pageSize;
  //   sql += ` ORDER BY vr.CreatedDate DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  //   params.push(pageSize, offset);

  //   const result = await query(sql, params);
  //   return result.rows;
  // }
}

module.exports = StudentModel;