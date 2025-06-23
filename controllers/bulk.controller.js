const BulkService = require('../services/bulk.service');
const responseUtils = require('../utils/constants');
const fs = require('fs');

class BulkController {
  static async uploadStudentData(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'No file uploaded'
        });
      }

      const { type, tenantId } = req.body;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await BulkService.processStudentCSV(
        req.file.path,
        type,
        userTenantId,
        req.user.username
      );

      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in bulk upload:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }

  static async uploadVisitorData(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'No file uploaded'
        });
      }

      const { visitorCatId, tenantId } = req.body;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await BulkService.processVisitorCSV(
        req.file.path,
        parseInt(visitorCatId),
        userTenantId,
        req.user.username
      );

      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in visitor bulk upload:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }

   static async uploadStaffData(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'No file uploaded'
        });
      }

      const { tenantId } = req.body;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await BulkService.processStaffCSV(
        req.file.path,
        userTenantId,
        req.user.username
      );

      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in staff bulk upload:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      });
    }
  }
}

module.exports = BulkController;