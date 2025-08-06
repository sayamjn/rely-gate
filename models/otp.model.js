const { query } = require('../config/database');

class OTPModel {
  static async generateOTP(tenantId, mobile, createdBy) {
    const otpNumber = Math.floor(100000 + Math.random() * 900000).toString();
    
    const sql = `
      INSERT INTO PortalOTP (
        TenantID, MobileNo, OTPNumber, IsActive, CreatedDate, CreatedBy
      ) VALUES ($1, $2, $3, 'Y', NOW(), $4)
      RETURNING PPOTPID, OTPNumber
    `;

    const result = await query(sql, [tenantId, mobile, otpNumber, createdBy]);
    return {
      refId: result.rows[0].ppotpid,
      otpNumber: result.rows[0].otpnumber
    };
  }

  // Verify OTP
  static async verifyOTP(refId, otpNumber, mobile) {
    const sql = `
      SELECT 
        PPOTPID,
        TenantID,
        MobileNo,
        OTPNumber,
        CreatedDate,
        IsActive
      FROM PortalOTP
      WHERE PPOTPID = $1 
        AND OTPNumber = $2 
        AND MobileNo = $3 
        AND IsActive = 'Y'
        AND CreatedDate > NOW() - INTERVAL '10 minutes'
    `;

    const result = await query(sql, [refId, otpNumber, mobile]);
    
    if (result.rows.length > 0) {
      await this.markOTPAsUsed(refId);
      return {
        verified: true,
        tenantId: result.rows[0].tenantid,
        mobile: result.rows[0].mobileno
      };
    }

    return { verified: false };
  }

  // Mark OTP as used
  static async markOTPAsUsed(refId) {
    const sql = `
      UPDATE PortalOTP 
      SET IsActive = 'N'
      WHERE PPOTPID = $1
    `;

    await query(sql, [refId]);
  }

  // Clean up old OTPs (older than 1 hour)
  static async cleanupOldOTPs() {
    const sql = `
      DELETE FROM PortalOTP
      WHERE CreatedDate < NOW() - INTERVAL '1 hour'
    `;

    await query(sql);
  }

  // Get active OTP for mobile
  static async getActiveOTP(mobile, tenantId) {
    const sql = `
      SELECT 
        PPOTPID,
        OTPNumber,
        CreatedDate
      FROM PortalOTP
      WHERE MobileNo = $1 
        AND TenantID = $2
        AND IsActive = 'Y'
        AND CreatedDate > NOW() - INTERVAL '10 minutes'
      ORDER BY CreatedDate DESC
      LIMIT 1
    `;

    const result = await query(sql, [mobile, tenantId]);
    return result.rows[0] || null;
  }

  // Verify OTP by phone and code (for enhanced API)
  static async verifyOTPByPhoneAndCode(tenantId, mobile, otpCode) {
    const sql = `
      SELECT 
        PPOTPID,
        TenantID,
        MobileNo,
        OTPNumber,
        CreatedDate,
        IsActive
      FROM PortalOTP
      WHERE TenantID = $1 
        AND MobileNo = $2 
        AND OTPNumber = $3 
        AND IsActive = 'Y'
        AND CreatedDate > NOW() - INTERVAL '10 minutes'
      ORDER BY CreatedDate DESC
      LIMIT 1
    `;

    const result = await query(sql, [tenantId, mobile, otpCode]);
    
    if (result.rows.length > 0) {
      await this.markOTPAsUsed(result.rows[0].ppotpid);
      return {
        verified: true,
        tenantId: result.rows[0].tenantid,
        mobile: result.rows[0].mobileno
      };
    }

    return { verified: false };
  }
}

module.exports = OTPModel;