require('dotenv').config();
const express = require('express');
const cors = require('cors');

const config = require('./config/default');
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const protectedRoutes = require('./routes/protected.routes');

const app = express();
const PORT = config.port || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes); 

const server = app.listen(PORT, async () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);

  try {
    await testConnection();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
