const jwt = require('jsonwebtoken');
const config = require('../config/default');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded; 
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
    }
  }

  res.status(401).json({ success: false, message: 'Not authorized, no token' });
};

module.exports = { protect };
