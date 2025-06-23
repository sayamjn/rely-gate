const { authenticateToken } = require('../middleware/auth');
const express = require("express");
const multer = require("multer");
const BulkController = require('../controllers/bulk.controller');
const router = express.Router();

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

router.use(authenticateToken);

// POST /api/bulk/students
router.post('/students', upload.single('file'), BulkController.uploadStudentData);

// POST /api/bulk/visitors
router.post('/visitors', upload.single('file'), BulkController.uploadVisitorData);

router.post('/staff', upload.single('file'), BulkController.uploadStaffData);

module.exports = router;