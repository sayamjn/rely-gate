const { query } = require('../config/database');
const http = require('http');
const https = require('https');
const querystring = require('querystring');

class SMSService {
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
      console.error('Error fetching SMS gateway:', error);
      return null;
    }
  }

  // Get message template
  static async getMessageTemplate(tenantId, messageTypeId) {
    // For POC, returning hardcoded templates
    // In production, fetch from MessageTypeMaster table
    const templates = {
      1: 'Your OTP for TENANT is NO. This OTP is valid for 10 minutes.',
      2: 'Your security code for TENANT is NO.'
    };
    
    const tenantSql = `SELECT TenantName FROM Tenant WHERE TenantID = $1`;
    let tenantName = 'Visitor Management';
    
    try {
      const result = await query(tenantSql, [tenantId]);
      if (result.rows[0]) {
        tenantName = result.rows[0].tenantname;
      }
    } catch (error) {
      console.error('Error fetching tenant name:', error);
    }
    
    let template = templates[messageTypeId] || templates[1];
    template = template.replace('TENANT', tenantName);
    
    return template;
  }

  static async sendOTP(tenantId, otp, mobile) {
    try {
      const gateway = await this.getSMSGateway(tenantId);
      
      if (!gateway || gateway.smsenabledflag !== 'Y') {
        console.log('SMS gateway not enabled for tenant:', tenantId);
        return false;
      }

      const template = await this.getMessageTemplate(tenantId, 1);
      const message = template.replace('NO', otp);
      
      return await this.sendSMS(gateway, mobile, message);
    } catch (error) {
      console.error('Error sending OTP SMS:', error);
      return false;
    }
  }

  static async sendSecurityCode(tenantId, code, mobile) {
    try {
      const gateway = await this.getSMSGateway(tenantId);
      
      if (!gateway || gateway.smsenabledflag !== 'Y') {
        console.log('SMS gateway not enabled for tenant:', tenantId);
        return false;
      }

      const template = await this.getMessageTemplate(tenantId, 2);
      const message = template.replace('NO', code);
      
      return await this.sendSMS(gateway, mobile, message);
    } catch (error) {
      console.error('Error sending security code SMS:', error);
      return false;
    }
  }

  static async sendSMS(gateway, mobile, message) {
    try {
      const encodedMessage = querystring.escape(message);
      
      const params = {
        authkey: gateway.apikeyname,
        mobiles: mobile,
        message: encodedMessage,
        sender: gateway.sendervendor,
        route: '4'
      };
      
      const postData = querystring.stringify(params);
      
      const gatewayUrl = new URL(gateway.gatewayurl);
      
      const options = {
        hostname: gatewayUrl.hostname,
        port: gatewayUrl.port || (gatewayUrl.protocol === 'https:' ? 443 : 80),
        path: gatewayUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      return new Promise((resolve, reject) => {
        const protocol = gatewayUrl.protocol === 'https:' ? https : http;
        
        const req = protocol.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            console.log('SMS API Response:', data);
            resolve(true);
          });
        });
        
        req.on('error', (error) => {
          console.error('SMS API Error:', error);
          reject(error);
        });
        
        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error('Error in sendSMS:', error);
      return false;
    }
  }
}

module.exports = SMSService;