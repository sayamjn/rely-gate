const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({
  dest: 'uploads/temp/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

class BulkController {
  static async uploadStudentData(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json(
          ResponseFormatter.error('No file uploaded')
        );
      }

      const { type, tenantId } = req.body;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json(
          ResponseFormatter.error('Access denied for this tenant')
        );
      }

      const result = await BulkService.processStudentCSV(
        req.file.path,
        type,
        userTenantId,
        req.user.username
      );

      fs.unlinkSync(req.file.path);

      res.json(result);
    } catch (error) {
      console.error('Error in bulk upload:', error);
      res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }

  static async uploadVisitorData(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json(
          ResponseFormatter.error('No file uploaded')
        );
      }

      const { visitorCatId, tenantId } = req.body;
      const userTenantId = req.user.tenantId;

      const result = await BulkService.processVisitorCSV(
        req.file.path,
        parseInt(visitorCatId),
        userTenantId,
        req.user.username
      );

      fs.unlinkSync(req.file.path);

      res.json(result);
    } catch (error) {
      console.error('Error in visitor bulk upload:', error);
      res.status(500).json(
        ResponseFormatter.error('Internal server error')
      );
    }
  }
}

module.exports = BulkController