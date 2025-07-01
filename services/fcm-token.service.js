const FCMModel = require('../models/fcm.model');
const responseUtils = require('../utils/constants');

class FCMTokenService {
  static async registerToken(firebaseId, androidId, userName, tenantId, createdBy) {
    try {
      await FCMModel.registerToken(tenantId, firebaseId, androidId, userName, createdBy);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS
      };
    } catch (error) {
      console.error('Error registering FCM token:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      };
    }
  }

  static async updateToken(firebaseId, androidId, tenantId) {
    try {
      const result = await FCMModel.updateToken(tenantId, androidId, firebaseId);

      if (result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'FCM token not found'
        };
      }
    } catch (error) {
      console.error('Error updating FCM token:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      };
    }
  }

  static async updateNotificationFlag(androidId, flag, tenantId) {
    try {
      const result = await FCMModel.updateNotificationFlag(tenantId, androidId, flag);

      if (result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          data: { flag: result.flag },
          responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'FCM token not found'
        };
      }
    } catch (error) {
      console.error('Error updating notification flag:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      };
    }
  }
}

module.exports = FCMTokenService;