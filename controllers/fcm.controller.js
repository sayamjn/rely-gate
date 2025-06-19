const FCMTokenService = require("../services/fcm-token.service");

class FCMController {
  static async registerFCMToken(req, res) {
    try {
      const { firebaseId, androidId, userName, tenantId } = req.body;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json(
          ResponseFormatter.error('Access denied for this tenant')
        );
      }

      const result = await FCMTokenService.registerToken(
        firebaseId,
        androidId, 
        userName || req.user.username,
        userTenantId,
        req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error('Error registering FCM token:', error);
      res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  static async updateFCMToken(req, res) {
    try {
      const { firebaseId, androidId, tenantId } = req.body;
      const userTenantId = req.user.tenantId;

      const result = await FCMTokenService.updateToken(
        firebaseId,
        androidId,
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error('Error updating FCM token:', error);
      res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  static async updateNotificationFlag(req, res) {
    try {
      const { androidId, notificationFlag, tenantId } = req.body;
      const userTenantId = req.user.tenantId;

      const result = await FCMTokenService.updateNotificationFlag(
        androidId,
        notificationFlag,
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error('Error updating notification flag:', error);
      res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }
}

module.exports = FCMController