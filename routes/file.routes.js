const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const FileController = require('../controllers/file.controller');

const router = express.Router();

router.use(authenticateToken);

// GET /api/files/:category/:filename/info - Get file information
router.get('/:category/:filename/info', FileController.getFileInfo);

// DELETE /api/files/:category/:filename - Delete file
router.delete('/:category/:filename', FileController.deleteFile);

// POST /api/files/cleanup/:category - Cleanup old files
router.post('/cleanup/:category', FileController.cleanupFiles);

module.exports = router;