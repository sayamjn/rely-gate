const { query } = require('../config/database');

class BulkModel {
  static async insertStudentRecord(studentData) {
    const sql = `
      INSERT INTO BulkVisitorUpload (
        StudentID, Name, Mobile, Course, Hostel, TenantID, Type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await query(sql, [
      studentData.studentId,
      studentData.name,
      studentData.mobile,
      studentData.course,
      studentData.hostel,
      studentData.tenantId,
      studentData.type
    ]);
  }

  static async clearBulkData(tenantId) {
    const sql = `DELETE FROM BulkVisitorUpload WHERE TenantID = $1`;
    await query(sql, [tenantId]);
  }

  static async processBulkVisitors(tenantId) {
    const sql = `
      INSERT INTO VisitorRegistration (
        TenantID, VistorName, Mobile, VisitorCatID, VisitorCatName,
        VisitorSubCatID, VisitorSubCatName, VisitorRegNo, SecurityCode,
        StatusID, StatusName, IsActive, CreatedDate, UpdatedDate, 
        CreatedBy, UpdatedBy
      )
      SELECT 
        CAST(bvu.TenantID AS INTEGER),
        bvu.Name,
        bvu.Mobile, 
        CASE bvu.Type 
          WHEN 'student' THEN 3
          WHEN 'staff' THEN 1
          ELSE 2
        END,
        CASE bvu.Type
          WHEN 'student' THEN 'Student'
          WHEN 'staff' THEN 'Staff' 
          ELSE 'General'
        END,
        CASE bvu.Type
          WHEN 'student' THEN 6
          WHEN 'staff' THEN 1
          ELSE 4
        END,
        CASE bvu.Type
          WHEN 'student' THEN 'Regular Student'
          WHEN 'staff' THEN 'Security'
          ELSE 'Walk-in Visitor'
        END,
        CONCAT(
          CASE bvu.Type 
            WHEN 'student' THEN 'STU'
            WHEN 'staff' THEN 'STA'
            ELSE 'VIS'
          END,
          bvu.TenantID,
          EXTRACT(EPOCH FROM NOW())::bigint,
          LPAD((RANDOM() * 99)::int::text, 2, '0')
        ),
        LPAD((RANDOM() * 999999)::int::text, 6, '0'),
        1,
        'ACTIVE',
        'Y',
        NOW(),
        NOW(),
        'System',
        'System'
      FROM BulkVisitorUpload bvu
      WHERE bvu.TenantID = $1
        AND NOT EXISTS (
          SELECT 1 FROM VisitorRegistration vr 
          WHERE vr.Mobile = bvu.Mobile 
            AND vr.TenantID = CAST(bvu.TenantID AS INTEGER)
            AND vr.IsActive = 'Y'
        )
    `;
    
    const result = await query(sql, [tenantId]);
    return result.rowCount;
  }
}

module.exports = BulkModel;