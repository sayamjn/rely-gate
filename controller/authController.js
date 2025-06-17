const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/default');
const pool = require('../config/database');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiration
  });
};

const registerUser = async (req, res, next) => {
  try {
    const { tenantId, userName, password } = req.body;

    const existingUser = await pool.query(
      'SELECT * FROM users WHERE userName = $1 AND tenantId = $2',
      [userName, tenantId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (userName, tenantId, password) VALUES ($1, $2, $3) RETURNING id, userName, tenantId',
      [userName, tenantId, hashedPassword]
    );

    const user = newUser.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        userName: user.userName,
        tenantId: user.tenantId,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { tenantId, userName, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE userName = $1 AND tenantId = $2',
      [userName, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        userName: user.userName,
        tenantId: user.tenantId,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
};
