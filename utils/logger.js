const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

class FileLogger {
  constructor() {
    this.baseLogDir = path.join(process.cwd(), 'logs');
    this.timezone = process.env.TIMEZONE || 'Asia/Kolkata';
    this.isInitialized = false;
    
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };
    
    this.initializeLogger();
  }

  // Initialize logger and create necessary directories
  initializeLogger() {
    try {
      // Create logs directory if it doesn't exist
      if (!fs.existsSync(this.baseLogDir)) {
        fs.mkdirSync(this.baseLogDir, { recursive: true });
      }
      
      this.isInitialized = true;
      this.originalConsole.log('📁 File-based logging system initialized');
    } catch (error) {
      this.originalConsole.error('❌ Failed to initialize file-based logging:', error);
    }
  }

  // Get current date info for file structure
  getCurrentDateInfo() {
    const now = moment().tz(this.timezone);
    return {
      month: now.format('MMMM').toLowerCase(), // e.g., 'august'
      date: now.format('DD-MM-YYYY'), // e.g., '29-08-2025'
      timestamp: now.format('YYYY-MM-DD HH:mm:ss.SSS'),
      year: now.format('YYYY')
    };
  }

  // Create month directory if it doesn't exist
  ensureMonthDirectoryExists(month, year) {
    const monthDir = path.join(this.baseLogDir, year, month);
    if (!fs.existsSync(monthDir)) {
      fs.mkdirSync(monthDir, { recursive: true });
      this.originalConsole.log(`📁 Created log directory: ${monthDir}`);
    }
    return monthDir;
  }

  // Get log file path for current date
  getCurrentLogFilePath() {
    const { month, date, year } = this.getCurrentDateInfo();
    const monthDir = this.ensureMonthDirectoryExists(month, year);
    return path.join(monthDir, `${date}.log`);
  }

  // Write log entry to file
  writeToFile(level, message, ...args) {
    if (!this.isInitialized) return;

    try {
      const { timestamp } = this.getCurrentDateInfo();
      const logFilePath = this.getCurrentLogFilePath();
      
      // Format the complete message
      let fullMessage = '';
      if (typeof message === 'string') {
        fullMessage = message;
      } else {
        fullMessage = this.formatMessage(message);
      }

      // Add additional arguments if any
      if (args.length > 0) {
        const additionalArgs = args.map(arg => this.formatMessage(arg)).join(' ');
        fullMessage += ` ${additionalArgs}`;
      }

      // Create log entry
      const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${fullMessage}\n`;
      
      // Append to file (create if doesn't exist)
      fs.appendFileSync(logFilePath, logEntry, 'utf8');
      
    } catch (error) {
      this.originalConsole.error('❌ Error writing to log file:', error);
    }
  }

  // Format different types of messages
  formatMessage(obj) {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
    if (obj instanceof Error) {
      return `${obj.message}\nStack: ${obj.stack}`;
    }
    if (typeof obj === 'object') {
      try {
        return JSON.stringify(obj, null, 2);
      } catch (err) {
        return '[Object - could not stringify]';
      }
    }
    return String(obj);
  }

  // Override console methods to include file logging
  overrideConsole() {
    // Override console.log
    console.log = (...args) => {
      this.originalConsole.log(...args);
      this.writeToFile('info', ...args);
    };

    // Override console.error
    console.error = (...args) => {
      this.originalConsole.error(...args);
      this.writeToFile('error', ...args);
    };

    // Override console.warn
    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      this.writeToFile('warn', ...args);
    };

    // Override console.info
    console.info = (...args) => {
      this.originalConsole.info(...args);
      this.writeToFile('info', ...args);
    };

    // Override console.debug
    console.debug = (...args) => {
      this.originalConsole.debug(...args);
      this.writeToFile('debug', ...args);
    };

    this.originalConsole.log('🔄 Console methods overridden for file logging');
  }

  // Restore original console methods
  restoreConsole() {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
    
    this.originalConsole.log('🔄 Console methods restored to original');
  }

  // Custom logger methods that only write to file (don't console output)
  logToFileOnly(level, ...args) {
    this.writeToFile(level, ...args);
  }

  // Cleanup old log files (optional - for maintenance)
  cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = moment().tz(this.timezone).subtract(daysToKeep, 'days');
      
      // Recursively check log directories
      const years = fs.readdirSync(this.baseLogDir).filter(item => {
        const itemPath = path.join(this.baseLogDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

      years.forEach(year => {
        const yearPath = path.join(this.baseLogDir, year);
        const months = fs.readdirSync(yearPath).filter(item => {
          const itemPath = path.join(yearPath, item);
          return fs.statSync(itemPath).isDirectory();
        });

        months.forEach(month => {
          const monthPath = path.join(yearPath, month);
          const logFiles = fs.readdirSync(monthPath).filter(file => file.endsWith('.log'));

          logFiles.forEach(file => {
            const filePath = path.join(monthPath, file);
            const fileDate = file.replace('.log', '');
            const logDate = moment(fileDate, 'DD-MM-YYYY');

            if (logDate.isBefore(cutoffDate)) {
              fs.unlinkSync(filePath);
              this.originalConsole.log(`🗑️ Cleaned up old log file: ${filePath}`);
            }
          });

          // Remove empty month directories
          if (fs.readdirSync(monthPath).length === 0) {
            fs.rmdirSync(monthPath);
            this.originalConsole.log(`🗑️ Removed empty month directory: ${monthPath}`);
          }
        });

        // Remove empty year directories
        if (fs.readdirSync(yearPath).length === 0) {
          fs.rmdirSync(yearPath);
          this.originalConsole.log(`🗑️ Removed empty year directory: ${yearPath}`);
        }
      });

    } catch (error) {
      this.originalConsole.error('❌ Error during log cleanup:', error);
    }
  }

  // Get log statistics
  getLogStats() {
    try {
      const stats = {
        totalFiles: 0,
        totalSizeBytes: 0,
        oldestLogDate: null,
        newestLogDate: null,
        logsByMonth: {}
      };

      if (!fs.existsSync(this.baseLogDir)) return stats;

      const years = fs.readdirSync(this.baseLogDir).filter(item => {
        const itemPath = path.join(this.baseLogDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

      years.forEach(year => {
        const yearPath = path.join(this.baseLogDir, year);
        const months = fs.readdirSync(yearPath).filter(item => {
          const itemPath = path.join(yearPath, item);
          return fs.statSync(itemPath).isDirectory();
        });

        months.forEach(month => {
          const monthPath = path.join(yearPath, month);
          const logFiles = fs.readdirSync(monthPath).filter(file => file.endsWith('.log'));
          
          if (!stats.logsByMonth[`${year}-${month}`]) {
            stats.logsByMonth[`${year}-${month}`] = { files: 0, sizeBytes: 0 };
          }

          logFiles.forEach(file => {
            const filePath = path.join(monthPath, file);
            const fileStat = fs.statSync(filePath);
            
            stats.totalFiles++;
            stats.totalSizeBytes += fileStat.size;
            stats.logsByMonth[`${year}-${month}`].files++;
            stats.logsByMonth[`${year}-${month}`].sizeBytes += fileStat.size;

            const fileDate = moment(file.replace('.log', ''), 'DD-MM-YYYY');
            if (!stats.oldestLogDate || fileDate.isBefore(stats.oldestLogDate)) {
              stats.oldestLogDate = fileDate.format('DD-MM-YYYY');
            }
            if (!stats.newestLogDate || fileDate.isAfter(stats.newestLogDate)) {
              stats.newestLogDate = fileDate.format('DD-MM-YYYY');
            }
          });
        });
      });

      return stats;
    } catch (error) {
      this.originalConsole.error('❌ Error getting log statistics:', error);
      return null;
    }
  }

  // Read logs for a specific date
  readLogsForDate(date) {
    try {
      const logDate = moment(date, 'DD-MM-YYYY');
      const month = logDate.format('MMMM').toLowerCase();
      const year = logDate.format('YYYY');
      const fileName = `${date}.log`;
      
      const logFilePath = path.join(this.baseLogDir, year, month, fileName);
      
      if (fs.existsSync(logFilePath)) {
        return fs.readFileSync(logFilePath, 'utf8');
      } else {
        return null;
      }
    } catch (error) {
      this.originalConsole.error(`❌ Error reading logs for date ${date}:`, error);
      return null;
    }
  }
}

// Create and export singleton instance
const logger = new FileLogger();

// Export the logger instance and utility methods
module.exports = {
  logger,
  initializeFileLogging: () => {
    logger.overrideConsole();
  },
  restoreConsole: () => {
    logger.restoreConsole();
  },
  logToFileOnly: (level, ...args) => {
    logger.logToFileOnly(level, ...args);
  },
  cleanupOldLogs: (daysToKeep) => {
    logger.cleanupOldLogs(daysToKeep);
  },
  getLogStats: () => {
    return logger.getLogStats();
  },
  readLogsForDate: (date) => {
    return logger.readLogsForDate(date);
  },
  getCurrentLogFilePath: () => {
    return logger.getCurrentLogFilePath();
  }
};