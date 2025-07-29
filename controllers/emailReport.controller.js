const EmailReportService = require('../services/emailReport.service');
const CronJobService = require('../services/cronJob.service');
const responseUtils = require('../utils/constants');
const { validationResult } = require('express-validator');

class EmailReportController {
  static async getEmailRecipients(req, res) {
    try {
      const userTenantId = req.user.tenantId;

      const result = await EmailReportService.getEmailRecipients(userTenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in get email recipients:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }

  static async addEmailRecipient(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Validation failed',
          errors: errors.array()
        });
      }

      const userTenantId = req.user.tenantId;
      const userId = req.user.userId;
      const { recipientEmail, recipientName } = req.body;

      const result = await EmailReportService.addEmailRecipient(
        userTenantId, 
        recipientEmail, 
        recipientName, 
        userId
      );
      res.json(result);
    } catch (error) {
      console.error('Error in add email recipient:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }

  static async deleteEmailRecipient(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const userId = req.user.userId;
      const { recipientId } = req.params;

      const result = await EmailReportService.deleteEmailRecipient(
        parseInt(recipientId), 
        userTenantId, 
        userId
      );
      res.json(result);
    } catch (error) {
      console.error('Error in delete email recipient:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }

  static async sendDailyReport(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const { date } = req.body;

      const result = await EmailReportService.generateAndSendDailyReport(userTenantId, date);
      res.json(result);
    } catch (error) {
      console.error('Error in send daily report:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }

  static async triggerCronJob(req, res) {
    try {
      const { date } = req.body;

      console.log('Manually triggering daily email report cron job...');
      await CronJobService.triggerDailyReportManually(date);
      
      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Daily email report cron job triggered successfully',
        data: {
          date: date || 'previous day',
          triggeredAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error triggering cron job:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to trigger daily email report cron job',
        error: error.message
      });
    }
  }
}

module.exports = EmailReportController;