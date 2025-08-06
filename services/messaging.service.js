const { query } = require("../config/database");
const http = require("http");
const https = require("https");
const querystring = require("querystring");
const OTPModel = require("../models/otp.model");

class MessagingService {
  static async getSMSGateway(tenantId) {
    const sql = `
      SELECT SMSGatewayID, SMSEnabledFlag, GatewayURL, ApiKeyFlag, 
             ApiKeyName, UserName, Passwrd, SenderVendor
      FROM SMSGatewayMaster
      WHERE TenantID = $1 AND IsActive = 'Y' AND SMSEnabledFlag = 'Y'
      LIMIT 1
    `;

    try {
      const result = await query(sql, [tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching SMS gateway:", error);
      return null;
    }
  }

  static async getMessageTemplate(tenantId, messageTypeId) {
    // For POC, returning hardcoded templates
    // In production, fetch from MessageTypeMaster table
    const templates = {
      1: "Your OTP for TENANT is NO. This OTP is valid for 10 minutes.",
      2: "Your security code for TENANT is NO.",
    };

    const tenantSql = `SELECT TenantName FROM Tenant WHERE TenantID = $1`;
    let tenantName = "Visitor Management";

    try {
      const result = await query(tenantSql, [tenantId]);
      if (result.rows[0]) {
        tenantName = result.rows[0].tenantname;
      }
    } catch (error) {
      console.error("Error fetching tenant name:", error);
    }

    let template = templates[messageTypeId] || templates[1];
    template = template.replace("TENANT", tenantName);

    return template;
  }

  static async sendSMS(gateway, mobile, message) {
    try {
      const encodedMessage = querystring.escape(message);

      const params = {
        authkey: gateway.apikeyname,
        mobiles: mobile,
        message: encodedMessage,
        sender: gateway.sendervendor,
        route: "4",
      };

      const postData = querystring.stringify(params);

      const gatewayUrl = new URL(gateway.gatewayurl);

      const options = {
        hostname: gatewayUrl.hostname,
        port: gatewayUrl.port || (gatewayUrl.protocol === "https:" ? 443 : 80),
        path: gatewayUrl.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      return new Promise((resolve, reject) => {
        const protocol = gatewayUrl.protocol === "https:" ? https : http;

        const req = protocol.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            console.log("SMS API Response:", data);
            resolve(true);
          });
        });

        req.on("error", (error) => {
          console.error("SMS API Error:", error);
          reject(error);
        });

        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error("Error in sendSMS:", error);
      return false;
    }
  }

  // ============ OTP METHODS ============

  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendOTP(tenantId, mobileNo, createdBy = "System") {
    try {
      if (!mobileNo || mobileNo.length !== 10) {
        throw new Error("Invalid mobile number");
      }
const result = await OTPModel.generateOTP(tenantId, mobileNo, createdBy);
      const refId = result.refId;
      const otpNumber = result.otpNumber;

      if (process.env.SMS_ENABLED === "Y") {
        await this.sendOTPSMS(tenantId, otpNumber, mobileNo);
      }

      // In development, log the OTP (now handled by SMS service)
      if (process.env.NODE_ENV === "development") {
        console.log(`OTP for ${mobileNo}: ${otpNumber} (now sent via SMS)`);
      }

      return {
        success: true,
        refId,
        message: "OTP sent successfully",
        ...(process.env.NODE_ENV === "development" && { otp: otpNumber }),
      };
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error;
    }
  }

  static async sendOTPSMS(tenantId, otp, mobile) {
    try {
      const gateway = await this.getSMSGateway(tenantId);

      if (!gateway || gateway.smsenabledflag !== "Y") {
        console.log("SMS gateway not enabled for tenant:", tenantId);
        return false;
      }

      const template = await this.getMessageTemplate(tenantId, 1);
      const message = template.replace("NO", otp);

      return await this.sendSMS(gateway, mobile, message);
    } catch (error) {
      console.error("Error sending OTP SMS:", error);
      return false;
    }
  }

  static async sendSecurityCode(tenantId, code, mobile) {
    try {
      const gateway = await this.getSMSGateway(tenantId);

      if (!gateway || gateway.smsenabledflag !== "Y") {
        console.log("SMS gateway not enabled for tenant:", tenantId);
        return false;
      }

      const template = await this.getMessageTemplate(tenantId, 2);
      const message = template.replace("NO", code);

      return await this.sendSMS(gateway, mobile, message);
    } catch (error) {
      console.error("Error sending security code SMS:", error);
      return false;
    }
  }

  static async verifyOTP(refId, otpNumber, mobile) {
    try {
      const result = await OTPModel.verifyOTP(refId, otpNumber, mobile);
      return result;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw error;
    }
  }

  static async resendOTP(mobileNo, tenantId, createdBy = "System") {
    try {
      const activeOTP = await OTPModel.getActiveOTP(mobileNo, tenantId);

      if (activeOTP) {
        await OTPModel.markOTPAsUsed(activeOTP.ppotpid);
      }

      return await this.sendOTP(tenantId, mobileNo, createdBy);
    } catch (error) {
      console.error("Error resending OTP:", error);
      throw error;
    }
  }

  static async cleanupExpiredOTPs(tenantId) {
    try {
      const cleaned = await OTPModel.cleanupOldOTPs();
      return { cleaned, message: `Cleaned ${cleaned} expired OTPs` };
    } catch (error) {
      console.error("Error cleaning up OTPs:", error);
      throw error;
    }
  }

  // ============ GENERIC SMS METHODS ============

  static async sendGenericSMS(tenantId, mobile, message) {
    try {
      const gateway = await this.getSMSGateway(tenantId);

      if (!gateway || gateway.smsenabledflag !== "Y") {
        console.log("SMS gateway not enabled for tenant:", tenantId);
        return false;
      }

      return await this.sendSMS(gateway, mobile, message);
    } catch (error) {
      console.error("Error sending generic SMS:", error);
      return false;
    }
  }

  // ============ ENHANCED OTP METHODS FOR VISITOR SERVICE ============

  static async sendVisitorOTP(mobile, tenantId, visitorTypeId, appuser) {
    try {
      if (!mobile || mobile.length !== 10 || !/^\d+$/.test(mobile)) {
        return {
          success: false,
          message: "Invalid mobile number",
        };
      }

      const result = await OTPModel.generateOTP(tenantId, mobile, appuser);
      const refId = result.refId;
      const otpNumber = result.otpNumber;

      if (process.env.SMS_ENABLED === "Y") {
        await this.sendOTPSMS(tenantId, otpNumber, mobile);
      }

      // In development, log the OTP (now handled by SMS service)
      if (process.env.NODE_ENV === "development") {
        console.log(`OTP for ${mobile}: ${otpNumber} (now sent via SMS)`);
      }

      return {
        success: true,
        refId,
        message: "OTP sent successfully",
        ...(process.env.NODE_ENV === "development" && { otp: otpNumber }),
      };
    } catch (error) {
      console.error("Error sending visitor OTP:", error);
      return {
        success: false,
        message: "Failed to send OTP",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  static async generateAndSendOTP(tenantId, mobile, createdBy = "System") {
    try {
        const result = await OTPModel.generateOTP(tenantId, mobile, createdBy);
      const refId = result.refId;
      const otpNumber = result.otpNumber;

      // Send SMS if enabled
      if (process.env.SMS_ENABLED === "Y") {
        await this.sendOTPSMS(tenantId, otpNumber, mobile);
      }

      // Log OTP in development (now handled by SMS service) 
      if (process.env.NODE_ENV === "development") {
        console.log(`Generated OTP for ${mobile}: ${otpNumber} (now sent via SMS)`);
      }

      return {
        refId,
        otpNumber:
          process.env.NODE_ENV === "development" ? otpNumber : undefined,
        success: true,
      };
    } catch (error) {
      console.error("Error generating and sending OTP:", error);
      throw error;
    }
  }
}

module.exports = MessagingService;
