const https = require('https');

class FCMService {
  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY;
    this.apiUrl = 'https://fcm.googleapis.com/fcm/send';
  }

  async sendDataMessage(fcmId, title, message, type, icon, id, custom1, custom2, image, custom4) {
    try {
      if (!this.serverKey) {
        console.log('FCM Server Key not configured');
        return false;
      }

      const payload = {
        to: fcmId,
        data: {
          message: message,
          tittle: title, 
          type: type,
          image: icon,
          id: id,
          custom_1: custom1,
          custom_2: custom2, 
          custom_3: image,
          custom_4: custom4
        }
      };

      const postData = JSON.stringify(payload);

      const options = {
        hostname: 'fcm.googleapis.com',
        port: 443,
        path: '/fcm/send',
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            console.log('FCM Response:', data);
            resolve(data);
          });
        });
        
        req.on('error', (error) => {
          console.error('FCM Error:', error);
          reject(error);
        });
        
        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error('Error sending FCM message:', error);
      return false;
    }
  }

  // Get FCM tokens for flat owners
  async getFCMTokensForFlat(tenantId, flatName, visitorId = null) {
    try {
      const sql = `
        SELECT 
          f."FirebaseID" as "firebaseID",
          CASE 
            WHEN $3 IS NOT NULL THEN 
              CONCAT($4, '/uploads/visitors/', vm."PhotoName")
            ELSE ''
          END as "VisitorImage"
        FROM "FCM" f
        JOIN "LoginUser" lu ON f."AndroidID" = lu."Mobile" 
        LEFT JOIN "VisitorMaster" vm ON vm."VisitorID" = $3
        WHERE f."TenantID" = $1 
          AND lu."LinkeFlatName" = $2
          AND f."IsActive" = 'Y'
          AND lu."IsActive" = 'Y'
      `;

      const apiUrl = process.env.API_URL || 'http://localhost:3000';
      const result = await query(sql, [tenantId, flatName, visitorId, apiUrl]);
      return result.rows;
    } catch (error) {
      console.error('Error getting FCM tokens:', error);
      return [];
    }
  }

  // Get all FCM tokens except specific user
  async getAllFCMTokensExceptUser(tenantId, excludeLoginId) {
    try {
      const sql = `
        SELECT 
          f."FirebaseID" as "firebaseID",
          f."Custom_1" as "flag"
        FROM "FCM" f
        JOIN "LoginUser" lu ON f."UserName" = lu."UserName"
        WHERE f."TenantID" = $1 
          AND lu."LoginID" != $2
          AND f."IsActive" = 'Y'
          AND lu."IsActive" = 'Y'
      `;

      const result = await query(sql, [tenantId, excludeLoginId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting all FCM tokens:', error);
      return [];
    }
  }

  // Send notification to flat owners on visitor check-in
  async notifyFlatOwnersCheckin(tenantId, flatName, visitorName, visitorCategory, visitorId = null) {
    try {
      const fcmTokens = await this.getFCMTokensForFlat(tenantId, flatName, visitorId);
      
      const title = "New Visitor CHECK IN";
      const message = `${visitorName} (${visitorCategory}) has CHECKED IN on: ${new Date().toLocaleString()}`;
      const imageUrl = visitorId ? `${process.env.API_URL}/uploads/visitors/` : '';
      
      const promises = fcmTokens.map(token => 
        this.sendDataMessage(
          token.firebaseID,
          title,
          message, 
          "CHECKEDIN",
          token.VisitorImage || imageUrl,
          visitorId?.toString() || '',
          '', '', '', ''
        )
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error notifying flat owners:', error);
      return false;
    }
  }

  // Send notification to flat owners on visitor check-out  
  async notifyFlatOwnersCheckout(tenantId, flatName, visitorName, visitorCategory, visitorId = null) {
    try {
      const fcmTokens = await this.getFCMTokensForFlat(tenantId, flatName, visitorId);
      
      const title = "Visitor CHECK OUT";
      const message = `${visitorName} (${visitorCategory}) has CHECKED OUT on: ${new Date().toLocaleString()}`;
      const imageUrl = visitorId ? `${process.env.API_URL}/uploads/visitors/` : '';
      
      const promises = fcmTokens.map(token => 
        this.sendDataMessage(
          token.firebaseID,
          title,
          message,
          "CHECKEDOUT", 
          token.VisitorImage || imageUrl,
          visitorId?.toString() || '',
          '', '', '', ''
        )
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error notifying flat owners checkout:', error);
      return false;
    }
  }

  // Send discussion notifications (
  async notifyDiscussionUpdate(tenantId, excludeUserId, title, message, discussionId, remark, createdBy, imageUrl = '') {
    try {
      const fcmTokens = await this.getAllFCMTokensExceptUser(tenantId, excludeUserId);
      
      const promises = fcmTokens.map(token => {
        if (token.flag === 'Y') { 
          return this.sendDataMessage(
            token.firebaseID,
            title,
            message,
            "DISCUSSION",
            imageUrl,
            discussionId.toString(),
            remark,
            createdBy,
            imageUrl,
            message
          );
        }
      });

      await Promise.all(promises.filter(Boolean));
      return true;
    } catch (error) {
      console.error('Error notifying discussion update:', error);
      return false;
    }
  }

   // Send FCM notification
  static async sendNotification(tokens, title, message, data = {}) {
    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens to send notification to');
      return { success: false, message: 'No tokens available' };
    }

    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) {
      console.error('FCM_SERVER_KEY not configured');
      return { success: false, message: 'FCM not configured' };
    }

    const payload = {
      registration_ids: tokens,
      data: {
        message: message,
        title: title,
        ...data
      },
      notification: {
        title: title,
        body: message,
        sound: 'default'
      }
    };

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${serverKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('FCM notification sent successfully:', result);
        return { success: true, result };
      } else {
        console.error('FCM notification failed:', result);
        return { success: false, error: result };
      }
    } catch (error) {
      console.error('Error sending FCM notification:', error);
      return { success: false, error: error.message };
    }
  }

   // Notify visitor check-in
  static async notifyVisitorCheckIn({ tenantId, flatName, visitorName, visitorCategory, photoUrl, type }) {
    try {
      const tokens = await this.getFCMTokensForFlat(tenantId, flatName);
      
      if (tokens.length === 0) {
        console.log(`No FCM tokens found for flat: ${flatName}`);
        return { success: false, message: 'No recipients found' };
      }

      const title = 'Visitor Check-In';
      const message = `${visitorName} (${visitorCategory}) has checked in at ${new Date().toLocaleString()}`;
      
      const data = {
        type: type || 'VISITOR_CHECKIN',
        flat: flatName,
        visitor_name: visitorName,
        visitor_category: visitorCategory,
        image: photoUrl || '',
        timestamp: new Date().toISOString()
      };

      return await this.sendNotification(
        tokens.map(t => t.token), 
        title, 
        message, 
        data
      );
    } catch (error) {
      console.error('Error in notifyVisitorCheckIn:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify visitor check-out
  static async notifyVisitorCheckOut({ tenantId, flatName, visitorName, visitorCategory, type }) {
    try {
      const tokens = await this.getFCMTokensForFlat(tenantId, flatName);
      
      if (tokens.length === 0) {
        console.log(`No FCM tokens found for flat: ${flatName}`);
        return { success: false, message: 'No recipients found' };
      }

      const title = 'Visitor Check-Out';
      const message = `${visitorName} (${visitorCategory}) has checked out at ${new Date().toLocaleString()}`;
      
      const data = {
        type: type || 'VISITOR_CHECKOUT',
        flat: flatName,
        visitor_name: visitorName,
        visitor_category: visitorCategory,
        timestamp: new Date().toISOString()
      };

      return await this.sendNotification(
        tokens.map(t => t.token), 
        title, 
        message, 
        data
      );
    } catch (error) {
      console.error('Error in notifyVisitorCheckOut:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify family member pass request
  static async notifyFamilyMemberPass({ tenantId, flatName, memberName, photoUrl, passId }) {
    try {
      const tokens = await this.getFCMTokensForFlat(tenantId, flatName);
      
      if (tokens.length === 0) {
        console.log(`No FCM tokens found for flat: ${flatName}`);
        return { success: false, message: 'No recipients found' };
      }

      const title = 'Child Pass Request';
      const message = `Allow ${memberName} to leave the apartment?`;
      
      const data = {
        type: 'CHILD_PASS',
        flat: flatName,
        member_name: memberName,
        image: photoUrl || '',
        pass_id: passId.toString(),
        timestamp: new Date().toISOString()
      };

      return await this.sendNotification(
        tokens.map(t => t.token), 
        title, 
        message, 
        data
      );
    } catch (error) {
      console.error('Error in notifyFamilyMemberPass:', error);
      return { success: false, error: error.message };
    }
  }


    static async updateFCMToken(tenantId, loginId, androidId, firebaseId) {
    const sql = `
      INSERT INTO fcm (tenantid, loginid, androidid, firebaseid, isactive, customfield, createddate, updateddate)
      VALUES ($1, $2, $3, $4, 'Y', 'Y', NOW(), NOW())
      ON CONFLICT (tenantid, loginid, androidid) 
      DO UPDATE SET 
        firebaseid = $4,
        updateddate = NOW(),
        isactive = 'Y'
      RETURNING *
    `;

    try {
      const result = await query(sql, [tenantId, loginId, androidId, firebaseId]);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error updating FCM token:', error);
      return { success: false, error: error.message };
    }
  }

    static async updateNotificationPreferences(tenantId, androidId, enabled) {
    const sql = `
      UPDATE fcm 
      SET customfield = $3, updateddate = NOW()
      WHERE tenantid = $1 AND androidid = $2
      RETURNING *
    `;

    try {
      const result = await query(sql, [tenantId, androidId, enabled ? 'Y' : 'N']);
      return { 
        success: result.rows.length > 0, 
        data: result.rows[0],
        updated: result.rows.length > 0
      };
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return { success: false, error: error.message };
    }
  }

    // Send custom notification
  static async sendCustomNotification({ tenantId, recipients, title, message, data = {}, flatName = null }) {
    try {
      let tokens = [];

      if (recipients === 'ALL') {
        const tokenData = await this.getAllFCMTokensForTenant(tenantId);
        tokens = tokenData.map(t => t.token);
      } else if (recipients === 'FLAT' && flatName) {
        const tokenData = await this.getFCMTokensForFlat(tenantId, flatName);
        tokens = tokenData.map(t => t.token);
      } else if (Array.isArray(recipients)) {
        tokens = recipients;
      }

      if (tokens.length === 0) {
        return { success: false, message: 'No recipients found' };
      }

      return await this.sendNotification(tokens, title, message, data);
    } catch (error) {
      console.error('Error in sendCustomNotification:', error);
      return { success: false, error: error.message };
    }
  }

  
}
module.exports = FCMService