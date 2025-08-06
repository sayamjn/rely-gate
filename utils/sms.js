const axios = require('axios');
const querystring = require('querystring');

class SMSUtil {
  static async sendSMS(mobile, message) {
    try {
      const { SMS_API_KEY, SENDERVERNDOR, GATEWAY_URL } = process.env;
      
      if (!SMS_API_KEY || !SENDERVERNDOR || !GATEWAY_URL) {
        console.error('SMS credentials not found in environment variables');
        return {
          success: false,
          message: 'SMS service not configured'
        };
      }

      if (!mobile || !/^\d{10}$/.test(mobile)) {
        return {
          success: false,
          message: 'Invalid mobile number format'
        };
      }

      const params = {
        authkey: SMS_API_KEY,
        mobiles: mobile,
        message: message,
        sender: SENDERVERNDOR,
        route: '4'
      };

      const response = await axios.post(GATEWAY_URL, querystring.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('SMS API Response:', response.data);

      return {
        success: true,
        message: 'SMS sent successfully',
        response: response.data
      };

    } catch (error) {
      console.error('SMS sending error:', error.message);
      
      return {
        success: false,
        message: 'Failed to send SMS',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  static async sendOTPSMS(mobile, otp, tenantName = 'RelyGate') {
    const message = `Your OTP for ${tenantName} is: ${otp}. Please do not share with anyone. - RELYTH`;
    return await this.sendSMS(mobile, message);
  }

  static async sendSecurityCodeSMS(mobile, code, tenantName = 'RelyGate') {
    const message = `Your Security Code for ${tenantName} is: ${code}`;
    return await this.sendSMS(mobile, message);
  }


  static async testSMS(mobile) {
    const testMessage = 'Test SMS from RelyGate system - RELYTH';
    console.log(`Testing SMS functionality to ${mobile}`);
    return await this.sendSMS(mobile, testMessage);
  }
}

module.exports = SMSUtil;