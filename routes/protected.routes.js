const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to protected route',
    user: req.user
  });
});

module.exports = router;
