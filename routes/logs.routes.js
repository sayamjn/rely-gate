const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { 
  getLogStats, 
  readLogsForDate, 
  cleanupOldLogs, 
  getCurrentLogFilePath,
  logToFileOnly 
} = require('../utils/logger');

const router = express.Router();

// Apply authentication to all log routes
router.use(authenticateToken);

// GET /api/logs/stats - Get logging statistics (Admin only)
router.get('/stats', 
  authorizeRole('Admin', 'SuperAdmin'), 
  async (req, res) => {
    try {
      const stats = getLogStats();
      res.json({
        responseCode: 'S',
        responseMessage: 'Log statistics retrieved successfully',
        data: {
          ...stats,
          currentLogFile: getCurrentLogFilePath(),
          totalSizeMB: (stats.totalSizeBytes / (1024 * 1024)).toFixed(2)
        }
      });
    } catch (error) {
      console.error('Error getting log statistics:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Failed to get log statistics',
        data: { error: error.message }
      });
    }
  }
);

// GET /api/logs/read - Read logs for a specific date (Admin only)
router.get('/read', [
  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{2}-\d{2}-\d{4}$/)
    .withMessage('Date must be in format DD-MM-YYYY')
], handleValidationErrors, authorizeRole('Admin', 'SuperAdmin'), async (req, res) => {
  try {
    const { date } = req.query;
    const logs = readLogsForDate(date);
    
    if (logs === null) {
      return res.status(404).json({
        responseCode: 'E',
        responseMessage: `No logs found for date: ${date}`,
        data: null
      });
    }

    res.json({
      responseCode: 'S',
      responseMessage: `Logs retrieved for date: ${date}`,
      data: {
        date,
        logs: logs.split('\n').filter(line => line.trim()), // Split into array of log lines
        totalLines: logs.split('\n').filter(line => line.trim()).length
      }
    });
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({
      responseCode: 'E',
      responseMessage: 'Failed to read logs',
      data: { error: error.message }
    });
  }
});

// POST /api/logs/cleanup - Cleanup old logs (Admin only)
router.post('/cleanup', [
  body('daysToKeep')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days to keep must be between 1 and 365')
], handleValidationErrors, authorizeRole('Admin', 'SuperAdmin'), async (req, res) => {
  try {
    const daysToKeep = req.body.daysToKeep || 30;
    
    // Log the cleanup action
    logToFileOnly('info', `Log cleanup initiated by user: ${req.user.username}, keeping logs for ${daysToKeep} days`);
    
    cleanupOldLogs(daysToKeep);
    
    res.json({
      responseCode: 'S',
      responseMessage: `Log cleanup completed. Kept logs for last ${daysToKeep} days`,
      data: { daysToKeep }
    });
  } catch (error) {
    console.error('Error during log cleanup:', error);
    res.status(500).json({
      responseCode: 'E',
      responseMessage: 'Failed to cleanup logs',
      data: { error: error.message }
    });
  }
});

// GET /api/logs/current - Get current log file info
router.get('/current',
  authorizeRole('Admin', 'SuperAdmin'), 
  async (req, res) => {
    try {
      const currentLogPath = getCurrentLogFilePath();
      const stats = getLogStats();
      
      res.json({
        responseCode: 'S',
        responseMessage: 'Current log file info retrieved',
        data: {
          currentLogFile: currentLogPath,
          exists: require('fs').existsSync(currentLogPath),
          lastModified: require('fs').existsSync(currentLogPath) 
            ? require('fs').statSync(currentLogPath).mtime.toISOString()
            : null,
          size: require('fs').existsSync(currentLogPath) 
            ? require('fs').statSync(currentLogPath).size 
            : 0,
          sizeKB: require('fs').existsSync(currentLogPath) 
            ? (require('fs').statSync(currentLogPath).size / 1024).toFixed(2)
            : 0,
          totalLogFiles: stats.totalFiles
        }
      });
    } catch (error) {
      console.error('Error getting current log info:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Failed to get current log info',
        data: { error: error.message }
      });
    }
  }
);

// POST /api/logs/test - Test logging functionality (Admin only)
router.post('/test',
  authorizeRole('Admin', 'SuperAdmin'),
  async (req, res) => {
    try {
      const testId = Date.now();
      
      // Test different log levels
      console.log(`🧪 [TEST-${testId}] Testing file-based logging system`);
      console.info(`ℹ️ [TEST-${testId}] Info level log test`);
      console.warn(`⚠️ [TEST-${testId}] Warning level log test`);
      console.error(`❌ [TEST-${testId}] Error level log test`);
      
      // Test logging an object
      console.log(`📊 [TEST-${testId}] Object test:`, { 
        testId, 
        timestamp: new Date().toISOString(),
        user: req.user.username,
        tenantId: req.user.tenantId 
      });
      
      // Log only to file (not console)
      logToFileOnly('debug', `🔍 [TEST-${testId}] File-only debug log - this should only appear in log files`);
      
      res.json({
        responseCode: 'S',
        responseMessage: 'Logging test completed successfully',
        data: {
          testId,
          message: 'Check the log files to verify all test entries were written',
          currentLogFile: getCurrentLogFilePath(),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error during logging test:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Logging test failed',
        data: { error: error.message }
      });
    }
  }
);

// GET /api/logs/health - Log system health check
router.get('/health', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(process.cwd(), 'logs');
    const currentLogPath = getCurrentLogFilePath();
    
    const health = {
      status: 'healthy',
      logsDirectoryExists: fs.existsSync(logsDir),
      currentLogFileExists: fs.existsSync(currentLogPath),
      canWrite: false,
      timestamp: new Date().toISOString()
    };
    
    // Test write capability
    try {
      const testMessage = `Health check at ${new Date().toISOString()}`;
      logToFileOnly('info', `🏥 [HEALTH-CHECK] ${testMessage}`);
      health.canWrite = true;
    } catch (writeError) {
      health.canWrite = false;
      health.writeError = writeError.message;
    }
    
    if (!health.logsDirectoryExists || !health.canWrite) {
      health.status = 'unhealthy';
    }
    
    res.json({
      responseCode: 'S',
      responseMessage: `Log system is ${health.status}`,
      data: health
    });
  } catch (error) {
    console.error('Error checking log health:', error);
    res.status(500).json({
      responseCode: 'E',
      responseMessage: 'Failed to check log system health',
      data: { error: error.message }
    });
  }
});

module.exports = router;