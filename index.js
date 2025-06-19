// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config/default');
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const protectedRoutes = require('./routes/protected.routes');
const visitorRoutes = require('./routes/visitor.routes');
const fileRoutes = require('./routes/file.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();
const PORT = config.port || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


const fs = require('fs');
const uploadDirs = [
  'uploads',
  'uploads/visitors',
  'uploads/registered_visitors', 
  'uploads/vehicles',
  'uploads/visitor_ids',
  'uploads/qr_codes'
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Serve static files with proper headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache for 1 day
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jpeg') || filePath.endsWith('.jpg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    }
    
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'public, max-age=86400'); // 1 day
  }
}));

// Serve static files for uploaded images
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// File info endpoint for testing
app.get('/api/files/info/:category/:filename', (req, res) => {
  const { category, filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', category, filename);
  
  fs.stat(filePath, (err, stats) => {
    if (err) {
      return res.status(404).json({
        responseCode: 'E',
        responseMessage: 'File not found'
      });
    }
    
    res.json({
      responseCode: 'S',
      data: {
        filename,
        category,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `${req.protocol}://${req.get('host')}/uploads/${category}/${filename}`
      }
    });
  });
});
// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    responseCode: 'E',
    responseMessage: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    responseCode: 'E',
    responseMessage: 'Route not found'
  });
});

const server = app.listen(PORT, async () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);

  try {
    await testConnection();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1))
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});