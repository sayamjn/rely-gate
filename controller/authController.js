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
    const { tentantId, userName, password } = req.body;

    const existingUser = await pool.query('SELECT * FROM users WHERE userName = $1 AND tentantId = $2', [userName, tentantId]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (userName, tentantId, password) VALUES ($1, $2, $3) RETURNING id, userName, tentantId',
      [userName, tentantId, hashedPassword]
    );

    const user = newUser.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        userName: user.userName,
        tentantId: user.tentantId,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { tentantId, userName, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE userName = $1 AND tentantId = $2',
      [userName, tentantId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        userName: user.userName,
        tentantId: user.tentantId,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    next(error);
  }
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token
  });
};

module.exports = {
  registerUser,
  loginUser,
  sendTokenResponse
};
