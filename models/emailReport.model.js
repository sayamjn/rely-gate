const { query } = require("../config/database");

class EmailReportModel {
  static getDateFilter(date, timeColumn) {
    return date
      ? `DATE(${timeColumn} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2`
      : `DATE(${timeColumn} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`;
  }

  static getQueryParams(tenantId, date) {
    return date ? [tenantId, date] : [tenantId];
  }

  static getTimezoneConversion(timeColumn) {
    return `${timeColumn} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'`;
  }

  static getDateComparison(date) {
    return date ? "$2" : "CURRENT_DATE";
  }

  static buildVisitorCategoryFilter(visitorCatId, date, timeColumn) {
    const dateFilter = this.getDateFilter(date, timeColumn);
    return `TenantID = $1 AND IsActive = 'Y' AND VisitorCatID = ${visitorCatId} AND ${dateFilter}`;
  }

  static buildCheckoutFilter(visitorCatId, date) {
    const dateComparison = this.getDateComparison(date);
    return `VisitorCatID = ${visitorCatId} AND DATE(OutTime AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${dateComparison}`;
  }

  static buildInsideFilter(visitorCatId) {
    return `VisitorCatID = ${visitorCatId} AND INTime IS NOT NULL AND OutTime IS NULL`;
  }

  static buildPurposeNameCase() {
    return `CASE 
      WHEN VisitPurposeID = -1 OR VisitPurpose IS NULL THEN 'Other'
      ELSE VisitPurpose
    END`;
  }
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
    const params = this.getQueryParams(tenantId, date);

    const sql = `
      WITH UnregisteredStats AS (
        SELECT 
          -- Visitor stats from VisitorMaster
          COUNT(CASE WHEN VisitorCatID = 1 AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as visitor_checkins,
          COUNT(CASE WHEN VisitorCatID = 1 AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as visitor_checkouts,
          
          -- Staff stats from VisitorMaster
          COUNT(CASE WHEN VisitorCatID = 3 AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as staff_checkins,
          COUNT(CASE WHEN VisitorCatID = 3 AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as staff_checkouts,
          
          -- Student stats from VisitorMaster
          COUNT(CASE WHEN VisitorCatID = 2 AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as student_checkins,
          COUNT(CASE WHEN VisitorCatID = 2 AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as student_checkouts,
          
          -- Bus stats from VisitorMaster
          COUNT(CASE WHEN VisitorCatID = 5 AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as bus_checkins,
          COUNT(CASE WHEN VisitorCatID = 5 AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as bus_checkouts,
          
          -- Gate Pass stats from VisitorMaster
          COUNT(CASE WHEN VisitorCatID = 6 AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as gatepass_checkins,
          COUNT(CASE WHEN VisitorCatID = 6 AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as gatepass_checkouts
          
        FROM VisitorMaster
        WHERE TenantID = $1 AND IsActive = 'Y'
      ),
      RegisteredStats AS (
        SELECT 
          -- Visitor stats from VisitorRegVisitHistory
          COUNT(CASE WHEN VisitorCatID = 1 AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as visitor_checkins,
          COUNT(CASE WHEN VisitorCatID = 1 AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as visitor_checkouts,
          
          -- Staff stats from VisitorRegVisitHistory
          COUNT(CASE WHEN VisitorCatID = 3 AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as staff_checkins,
          COUNT(CASE WHEN VisitorCatID = 3 AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as staff_checkouts,
          
          -- Student stats from VisitorRegVisitHistory
          COUNT(CASE WHEN VisitorCatID = 2 AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as student_checkins,
          COUNT(CASE WHEN VisitorCatID = 2 AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as student_checkouts,
          
          -- Bus stats from VisitorRegVisitHistory
          COUNT(CASE WHEN VisitorCatID = 5 AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as bus_checkins,
          COUNT(CASE WHEN VisitorCatID = 5 AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as bus_checkouts,
          
          -- Gate Pass stats from VisitorRegVisitHistory
          COUNT(CASE WHEN VisitorCatID = 6 AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as gatepass_checkins,
          COUNT(CASE WHEN VisitorCatID = 6 AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as gatepass_checkouts
          
        FROM VisitorRegVisitHistory
        WHERE TenantID = $1 AND IsActive = 'Y'
      )
      SELECT 
        -- Combined visitor stats
        (us.visitor_checkins + rs.visitor_checkins) as visitor_checkins,
        (us.visitor_checkouts + rs.visitor_checkouts) as visitor_checkouts,
        ((us.visitor_checkins + rs.visitor_checkins) - (us.visitor_checkouts + rs.visitor_checkouts)) as visitor_inside,
        
        -- Combined staff stats
        (us.staff_checkins + rs.staff_checkins) as staff_checkins,
        (us.staff_checkouts + rs.staff_checkouts) as staff_checkouts,
        ((us.staff_checkins + rs.staff_checkins) - (us.staff_checkouts + rs.staff_checkouts)) as staff_inside,
        
        -- Combined student stats
        (us.student_checkins + rs.student_checkins) as student_checkins,
        (us.student_checkouts + rs.student_checkouts) as student_checkouts,
        ((us.student_checkins + rs.student_checkins) - (us.student_checkouts + rs.student_checkouts)) as student_inside,
        
        -- Combined bus stats
        (us.bus_checkins + rs.bus_checkins) as bus_checkins,
        (us.bus_checkouts + rs.bus_checkouts) as bus_checkouts,
        ((us.bus_checkins + rs.bus_checkins) - (us.bus_checkouts + rs.bus_checkouts)) as bus_inside,
        
        -- Combined gate pass stats
        (us.gatepass_checkins + rs.gatepass_checkins) as gatepass_checkins,
        (us.gatepass_checkouts + rs.gatepass_checkouts) as gatepass_checkouts,
        ((us.gatepass_checkins + rs.gatepass_checkins) - (us.gatepass_checkouts + rs.gatepass_checkouts)) as gatepass_inside
        
      FROM UnregisteredStats us, RegisteredStats rs
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
    const params = this.getQueryParams(tenantId, date);

    const sql = `
      WITH UnregisteredPurposes AS (
        SELECT 
          ${this.buildPurposeNameCase()} as purpose_name,
          COUNT(CASE WHEN INTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as checkout_count
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 1
        GROUP BY ${this.buildPurposeNameCase()}
      ),
      RegisteredPurposes AS (
        SELECT 
          ${this.buildPurposeNameCase()} as purpose_name,
          COUNT(CASE WHEN INTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as checkout_count
        FROM VisitorRegVisitHistory
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 1
        GROUP BY ${this.buildPurposeNameCase()}
      )
      SELECT 
        COALESCE(up.purpose_name, rp.purpose_name) as purpose_name,
        (COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) as checkin_count,
        (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0)) as checkout_count,
        ((COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) - (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0))) as inside_count
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
    const params = this.getQueryParams(tenantId, date);

    const sql = `
      WITH UnregisteredPurposes AS (
        SELECT 
          ${this.buildPurposeNameCase()} as purpose_name,
          COUNT(CASE WHEN INTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as checkout_count
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 3
        GROUP BY ${this.buildPurposeNameCase()}
      ),
      RegisteredPurposes AS (
        SELECT 
          ${this.buildPurposeNameCase()} as purpose_name,
          COUNT(CASE WHEN INTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as checkout_count
        FROM VisitorRegVisitHistory
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 3
        GROUP BY ${this.buildPurposeNameCase()}
      )
      SELECT 
        COALESCE(up.purpose_name, rp.purpose_name) as purpose_name,
        (COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) as checkin_count,
        (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0)) as checkout_count,
        ((COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) - (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0))) as inside_count
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
    const params = this.getQueryParams(tenantId, date);

    const sql = `
      WITH UnregisteredPurposes AS (
        SELECT 
          ${this.buildPurposeNameCase()} as purpose_name,
          COUNT(CASE WHEN INTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as checkout_count
        FROM VisitorMaster
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 2
        GROUP BY ${this.buildPurposeNameCase()}
      ),
      RegisteredPurposes AS (
        SELECT 
          ${this.buildPurposeNameCase()} as purpose_name,
          COUNT(CASE WHEN INTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "INTime"
          )} THEN 1 END) as checkin_count,
          COUNT(CASE WHEN OutTime IS NOT NULL AND ${this.getDateFilter(
            date,
            "OutTime"
          )} THEN 1 END) as checkout_count
        FROM VisitorRegVisitHistory
        WHERE TenantID = $1 
          AND IsActive = 'Y'
          AND VisitorCatID = 2
        GROUP BY ${this.buildPurposeNameCase()}
      )
      SELECT 
        COALESCE(up.purpose_name, rp.purpose_name) as purpose_name,
        (COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) as checkin_count,
        (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0)) as checkout_count,
        ((COALESCE(up.checkin_count, 0) + COALESCE(rp.checkin_count, 0)) - (COALESCE(up.checkout_count, 0) + COALESCE(rp.checkout_count, 0))) as inside_count
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
    const params = this.getQueryParams(tenantId, date);

    const sql = `
      SELECT 
        ${this.buildPurposeNameCase()} as purpose_name,
        COUNT(CASE WHEN INTime IS NOT NULL AND ${this.getDateFilter(
          date,
          "INTime"
        )} THEN 1 END) as checkin_count,
        COUNT(CASE WHEN OutTime IS NOT NULL AND ${this.getDateFilter(
          date,
          "OutTime"
        )} THEN 1 END) as checkout_count,
        (COUNT(CASE WHEN INTime IS NOT NULL AND ${this.getDateFilter(
          date,
          "INTime"
        )} THEN 1 END) - COUNT(CASE WHEN OutTime IS NOT NULL AND ${this.getDateFilter(
          date,
          "OutTime"
        )} THEN 1 END)) as inside_count
      FROM VisitorMaster
      WHERE TenantID = $1 
        AND IsActive = 'Y'
        AND VisitorCatID = 6
      GROUP BY ${this.buildPurposeNameCase()}
      HAVING COUNT(CASE WHEN INTime IS NOT NULL AND ${this.getDateFilter(
        date,
        "INTime"
      )} THEN 1 END) > 0 
        OR COUNT(CASE WHEN OutTime IS NOT NULL AND ${this.getDateFilter(
          date,
          "OutTime"
        )} THEN 1 END) > 0
      ORDER BY checkin_count DESC
    `;

    const result = await query(sql, params);
    console.log("getGatePassPurposeStats result:", result.rows);
    return result.rows;
  }

  // Get all tenants that have email recipients configured
  static async getTenantsWithEmailRecipients() {
    const sql = `
      SELECT DISTINCT t.tenantid as "TenantID", t.tenantname as "TenantName", t.tenantcode as "TenantCode"
      FROM Tenant t
      INNER JOIN EmailRecipients er ON t.tenantid = er.TenantID
      WHERE t.isactive = 'Y' AND er.IsActive = 'Y'
      ORDER BY t.tenantname
    `;
    const result = await query(sql);
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
