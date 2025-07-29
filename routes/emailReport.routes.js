const express = require('express');
const EmailReportController = require('../controllers/emailReport.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

router.use(authenticateToken);

// GET /api/email-reports/recipients
router.get('/recipients', handleValidationErrors, EmailReportController.getEmailRecipients);

// POST /api/email-reports/recipients  
router.post('/recipients', [
  body('recipientEmail')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('recipientName')
    .notEmpty()
    .withMessage('Recipient name is required')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Recipient name must be between 2 and 255 characters')
], handleValidationErrors, EmailReportController.addEmailRecipient);

// DELETE /api/email-reports/recipients/:recipientId
router.delete('/recipients/:recipientId', handleValidationErrors, EmailReportController.deleteEmailRecipient);

// POST /api/email-reports/send-daily-report
router.post('/send-daily-report', [
  body('date')
    .optional()
    .isDate()
    .withMessage('Date must be in valid format (YYYY-MM-DD)')
], handleValidationErrors, EmailReportController.sendDailyReport);

// POST /api/email-reports/trigger-cron-job
router.post('/trigger-cron-job', [
  body('date')
    .optional()
    .isDate()
    .withMessage('Date must be in valid format (YYYY-MM-DD)')
], handleValidationErrors, EmailReportController.triggerCronJob);

module.exports = router;