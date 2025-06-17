module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/nora-ai',
  
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiration: '24h',
};