const { query } = require("../config/database");

class EmailReportModel {
  // Get all email recipients for a tenant
  static async getEmailRecipients(tenantId) {
    const sql = `
      SELECT EmailRecipientID, RecipientEmail, RecipientName, IsActive, CreatedAt
      FROM EmailRecipients
      WHERE TenantID = $1 AND IsActive = 'Y'
      ORDER BY CreatedAt DESC
    `;
    const result = await query(sql, [tenantId]);
    console.log("getEmailRecipients result:", result.rows);
    return result.rows;
  }

  // Add email recipient
  static async addEmailRecipient(
    tenantId,
    recipientEmail,
    recipientName,
    createdBy
  ) {
    const sql = `
      INSERT INTO EmailRecipients (TenantID, RecipientEmail, RecipientName, IsActive, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
      VALUES ($1, $2, $3, 'Y', NOW(), NOW(), $4, $4)
      RETURNING EmailRecipientID, TenantID, RecipientEmail, RecipientName, IsActive, CreatedAt
    `;
    const result = await query(sql, [
      tenantId,
      recipientEmail,
      recipientName,
      createdBy,
    ]);
    console.log("addEmailRecipient result:", result.rows[0]);
    return result.rows[0];
  }

  // Delete email recipient
  static async deleteEmailRecipient(recipientId, tenantId, updatedBy) {
    const sql = `
      UPDATE EmailRecipients
      SET IsActive = 'N', UpdatedAt = NOW(), UpdatedBy = $1
      WHERE EmailRecipientID = $2 AND TenantID = $3
    `;
    const result = await query(sql, [updatedBy, recipientId, tenantId]);
    console.log("deleteEmailRecipient result:", result.rowCount > 0);
    return result.rowCount > 0;
  }

  // Check if email already exists
  static async emailExists(tenantId, recipientEmail) {
    const sql = `
      SELECT COUNT(*) as count
      FROM EmailRecipients
      WHERE TenantID = $1 AND RecipientEmail = $2 AND IsActive = 'Y'
    `;
    const result = await query(sql, [tenantId, recipientEmail]);
    console.log("emailExists result:", parseInt(result.rows[0].count) > 0);
    return parseInt(result.rows[0].count) > 0;
  }

  // Get daily statistics for email report
  static async getDailyStats(tenantId, date = null) {
    const dateFilter = date
      ? `DATE(INTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
      : `DATE(INTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`;
    const params = date ? [tenantId, date] : [tenantId];

    const sql = `
      SELECT 
        -- Visitor stats
        COUNT(CASE WHEN VisitorCatID = 1 AND ${dateFilter} THEN 1 END) as visitor_checkins,
        COUNT(CASE WHEN VisitorCatID = 1 AND DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${
          date ? "$2" : "CURRENT_DATE"
        } THEN 1 END) as visitor_checkouts,
        COUNT(CASE WHEN VisitorCatID = 1 AND INTime IS NOT NULL AND OutTime IS NULL THEN 1 END) as visitor_inside,
        
        -- Staff stats  
        COUNT(CASE WHEN VisitorCatID = 3 AND ${dateFilter} THEN 1 END) as staff_checkins,
        COUNT(CASE WHEN VisitorCatID = 3 AND DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${
          date ? "$2" : "CURRENT_DATE"
        } THEN 1 END) as staff_checkouts,
        COUNT(CASE WHEN VisitorCatID = 3 AND INTime IS NOT NULL AND OutTime IS NULL THEN 1 END) as staff_inside,
        
        -- Student stats
        COUNT(CASE WHEN VisitorCatID = 2 AND ${dateFilter} THEN 1 END) as student_checkins,
        COUNT(CASE WHEN VisitorCatID = 2 AND DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${
          date ? "$2" : "CURRENT_DATE"
        } THEN 1 END) as student_checkouts,
        COUNT(CASE WHEN VisitorCatID = 2 AND INTime IS NOT NULL AND OutTime IS NULL THEN 1 END) as student_inside,
        
        -- Bus stats
        COUNT(CASE WHEN VisitorCatID = 5 AND ${dateFilter} THEN 1 END) as bus_checkins,
        COUNT(CASE WHEN VisitorCatID = 5 AND DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${
          date ? "$2" : "CURRENT_DATE"
        } THEN 1 END) as bus_checkouts,
        COUNT(CASE WHEN VisitorCatID = 5 AND INTime IS NOT NULL AND OutTime IS NULL THEN 1 END) as bus_inside,
        
        -- Gate Pass stats
        COUNT(CASE WHEN VisitorCatID = 6 AND ${dateFilter} THEN 1 END) as gatepass_checkins,
        COUNT(CASE WHEN VisitorCatID = 6 AND DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${
          date ? "$2" : "CURRENT_DATE"
        } THEN 1 END) as gatepass_checkouts,
        COUNT(CASE WHEN VisitorCatID = 6 AND INTime IS NOT NULL AND OutTime IS NULL THEN 1 END) as gatepass_inside
        
      FROM VisitorMaster
      WHERE TenantID = $1 AND IsActive = 'Y'
    `;

    const result = await query(sql, params);
    console.log("getDailyStats result:", result.rows[0]);
    return result.rows[0];
  }

  // Get tenant information
  static async getTenantInfo(tenantId) {
    const sql = `
      SELECT TenantID, TenantName, TenantCode, Mobile, Email
      FROM Tenant
      WHERE TenantID = $1 AND IsActive = 'Y'
    `;
    const result = await query(sql, [tenantId]);
    console.log("getTenantInfo result:", result.rows[0]);
    return result.rows[0];
  }

  // Get purpose-based analytics for visitors
  static async getVisitorPurposeStats(tenantId, date = null) {
    const dateFilter = date
      ? `DATE(COALESCE(INTime, InTime) AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
      : `DATE(COALESCE(INTime, InTime) AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`;
    const params = date ? [tenantId, date] : [tenantId];

    const sql = `
      WITH UnregisteredPurposes AS (
        SELECT 
          CASE 
            WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
            ELSE VisitPurpose
          END as purpose_name,
          COUNT(CASE WHEN InTime IS NOT NULL AND ${dateFilter} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${
            date
              ? `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
              : `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`
          } THEN 1 END) as checkout_count
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 1
        GROUP BY CASE 
          WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
          ELSE VisitPurpose
        END
      ),
      RegisteredPurposes AS (
        SELECT 
          CASE 
            WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
            ELSE VisitPurpose
          END as purpose_name,
          COUNT(CASE WHEN INTime IS NOT NULL AND ${dateFilter} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${
            date
              ? `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
              : `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`
          } THEN 1 END) as checkout_count
        FROM VisitorRegVisitHistory
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 1
        GROUP BY CASE 
          WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
          ELSE VisitPurpose
        END
      )
      SELECT 
        COALESCE(up.purpose_name, rp.purpose_name) as purpose_name,
        (COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) as checkin_count,
        (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0)) as checkout_count
      FROM UnregisteredPurposes up
      FULL OUTER JOIN RegisteredPurposes rp ON up.purpose_name = rp.purpose_name
      WHERE (COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) > 0 
        OR (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0)) > 0
      ORDER BY checkin_count DESC
    `;

    const result = await query(sql, params);
    console.log("getVisitorPurposeStats result:", result.rows);
    return result.rows;
  }

  // Get purpose-based analytics for staff
  static async getStaffPurposeStats(tenantId, date = null) {
    const dateFilter = date
      ? `DATE(COALESCE(INTime, InTime) AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
      : `DATE(COALESCE(INTime, InTime) AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`;
    const params = date ? [tenantId, date] : [tenantId];

    const sql = `
      WITH UnregisteredPurposes AS (
        SELECT 
          CASE 
            WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
            ELSE VisitPurpose
          END as purpose_name,
          COUNT(CASE WHEN InTime IS NOT NULL AND ${dateFilter} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${
            date
              ? `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
              : `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`
          } THEN 1 END) as checkout_count
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 3
        GROUP BY CASE 
          WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
          ELSE VisitPurpose
        END
      ),
      RegisteredPurposes AS (
        SELECT 
          CASE 
            WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
            ELSE VisitPurpose
          END as purpose_name,
          COUNT(CASE WHEN INTime IS NOT NULL AND ${dateFilter} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${
            date
              ? `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
              : `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`
          } THEN 1 END) as checkout_count
        FROM VisitorRegVisitHistory
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 3
        GROUP BY CASE 
          WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
          ELSE VisitPurpose
        END
      )
      SELECT 
        COALESCE(up.purpose_name, rp.purpose_name) as purpose_name,
        (COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) as checkin_count,
        (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0)) as checkout_count
      FROM UnregisteredPurposes up
      FULL OUTER JOIN RegisteredPurposes rp ON up.purpose_name = rp.purpose_name
      WHERE (COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) > 0 
        OR (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0)) > 0
      ORDER BY checkin_count DESC
    `;

    const result = await query(sql, params);
    console.log("getStaffPurposeStats result:", result.rows);
    return result.rows;
  }

  // Get purpose-based analytics for students
  static async getStudentPurposeStats(tenantId, date = null) {
    const dateFilter = date
      ? `DATE(COALESCE(INTime, InTime) AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
      : `DATE(COALESCE(INTime, InTime) AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`;
    const params = date ? [tenantId, date] : [tenantId];

    const sql = `
      WITH UnregisteredPurposes AS (
        SELECT 
          CASE 
            WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
            ELSE VisitPurpose
          END as purpose_name,
          COUNT(CASE WHEN InTime IS NOT NULL AND ${dateFilter} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${
            date
              ? `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
              : `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`
          } THEN 1 END) as checkout_count
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 2
        GROUP BY CASE 
          WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
          ELSE VisitPurpose
        END
      ),
      RegisteredPurposes AS (
        SELECT 
          CASE 
            WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
            ELSE VisitPurpose
          END as purpose_name,
          COUNT(CASE WHEN INTime IS NOT NULL AND ${dateFilter} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${
            date
              ? `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
              : `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`
          } THEN 1 END) as checkout_count
        FROM VisitorRegVisitHistory
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 2
        GROUP BY CASE 
          WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
          ELSE VisitPurpose
        END
      )
      SELECT 
        COALESCE(up.purpose_name, rp.purpose_name) as purpose_name,
        (COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) as checkin_count,
        (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0)) as checkout_count
      FROM UnregisteredPurposes up
      FULL OUTER JOIN RegisteredPurposes rp ON up.purpose_name = rp.purpose_name
      WHERE (COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) > 0 
        OR (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0)) > 0
      ORDER BY checkin_count DESC
    `;

    const result = await query(sql, params);
    console.log("getStudentPurposeStats result:", result.rows);
    return result.rows;
  }

  // Get purpose-based analytics for gate pass
  static async getGatePassPurposeStats(tenantId, date = null) {
    const dateFilter = date
      ? `DATE(InTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
      : `DATE(InTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`;
    const params = date ? [tenantId, date] : [tenantId];

    const sql = `
      SELECT 
        CASE 
          WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
          ELSE VisitPurpose
        END as purpose_name,
        COUNT(CASE WHEN InTime IS NOT NULL AND ${dateFilter} THEN 1 END) as checkin_count,
        COUNT(CASE WHEN OutTime IS NOT NULL AND ${
          date
            ? `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
            : `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`
        } THEN 1 END) as checkout_count
      FROM VisitorMaster
      WHERE TenantID = $1 
        AND IsActive = 'Y'
        AND VisitorCatID = 6
      GROUP BY CASE 
        WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
        ELSE VisitPurpose
      END
      HAVING COUNT(CASE WHEN InTime IS NOT NULL AND ${dateFilter} THEN 1 END) > 0 
        OR COUNT(CASE WHEN OutTime IS NOT NULL AND ${
          date
            ? `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
            : `DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`
        } THEN 1 END) > 0
      ORDER BY checkin_count DESC
    `;

    const result = await query(sql, params);
    console.log("getGatePassPurposeStats result:", result.rows);
    return result.rows;
  }

  // Create EmailRecipients table if it doesn't exist
  // static async createEmailRecipientsTable() {
  //   const sql = `
  //     CREATE TABLE IF NOT EXISTS EmailRecipients (
  //       EmailRecipientID SERIAL PRIMARY KEY,
  //       TenantID INT NOT NULL,
  //       RecipientEmail VARCHAR(255) NOT NULL,
  //       RecipientName VARCHAR(255),
  //       IsActive CHAR(1) DEFAULT 'Y' CHECK (IsActive IN ('Y', 'N')),
  //       CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  //       UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  //       CreatedBy INT,
  //       UpdatedBy INT,

  //       CONSTRAINT fk_email_recipients_tenant
  //         FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON DELETE CASCADE,

  //       CONSTRAINT uk_email_recipients_tenant_email
  //         UNIQUE (TenantID, RecipientEmail, IsActive)
  //     );
  //   `;
  //   await query(sql);

  //   // Create indexes
  //   const indexes = [
  //     'CREATE INDEX IF NOT EXISTS idx_email_recipients_tenant_id ON EmailRecipients(TenantID);',
  //     'CREATE INDEX IF NOT EXISTS idx_email_recipients_active ON EmailRecipients(IsActive);'
  //   ];

  //   for (const indexSQL of indexes) {
  //     await query(indexSQL);
  //   }
  // }
}

module.exports = EmailReportModel;
