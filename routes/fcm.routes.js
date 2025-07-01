const express = require('express');
const { body } = require('express-validator');
const FCMController = require('../controllers/fcm.controller');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(authenticateToken);

// POST /api/fcm/register
router.post('/register', [
  body('firebaseId').notEmpty().withMessage('Firebase ID is required'),
  body('androidId').notEmpty().withMessage('Android ID is required'),
  body('userName').optional(),
  body('tenantId').optional().isNumeric()
], handleValidationErrors, FCMController.registerFCMToken);

// PUT /api/fcm/update
router.put('/update', [
  body('firebaseId').notEmpty().withMessage('Firebase ID is required'),
  body('androidId').notEmpty().withMessage('Android ID is required'),
  body('tenantId').optional().isNumeric()
], handleValidationErrors, FCMController.updateFCMToken);

// PUT /api/fcm/notification-preferences
router.put('/notification-preferences', [
  body('androidId').notEmpty().withMessage('Android ID is required'),
  body('notificationFlag').notEmpty().withMessage('Notification flag is required'),
  body('tenantId').optional().isNumeric()
], handleValidationErrors, FCMController.updateNotificationFlag);

module.exports = router;