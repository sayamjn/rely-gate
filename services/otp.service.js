const OTPModel = require('../models/otp.model');
const SMSService = require('./sms.service');

class OTPService {z
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendOTP(tenantId, mobileNo, createdBy = 'System') {
    try {
      if (!mobileNo || mobileNo.length !== 10) {
        throw new Error('Invalid mobile number');
      }

      const otpNumber = this.generateOTP();

      const refId = await OTPModel.create(tenantId, mobileNo, otpNumber, createdBy);

      if (process.env.SMS_ENABLED === 'Y') {
        await SMSService.sendOTP(tenantId, otpNumber, mobileNo);
      }

      // In development, log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log(`OTP for ${mobileNo}: ${otpNumber}`);
      }

      return {
        success: true,
        refId,
        message: 'OTP sent successfully',
        ...(process.env.NODE_ENV === 'development' && { otp: otpNumber })
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  static async verifyOTP(refId, otpNumber, tenantId) {
    try {
      const result = await OTPModel.verify(refId, otpNumber, tenantId);
      return result;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  static async resendOTP(mobileNo, tenantId, createdBy = 'System') {
    try {
      const activeOTP = await OTPModel.getActiveOTP(mobileNo, tenantId);
      
      if (activeOTP) {
        await OTPModel.markAsUsed(activeOTP.ppotpid, tenantId);
      }

      return await this.sendOTP(tenantId, mobileNo, createdBy);
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw error;
    }
  }

  static async cleanupExpiredOTPs(tenantId) {
    try {
      const cleaned = await OTPModel.cleanupOldOTPs(tenantId);
      return { cleaned, message: `Cleaned ${cleaned} expired OTPs` };
    } catch (error) {
      console.error('Error cleaning up OTPs:', error);
      throw error;
    }
  }
}

module.exports = OTPService;