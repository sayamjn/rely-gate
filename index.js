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

const app = express();
const PORT = config.port || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api/visitors', visitorRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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