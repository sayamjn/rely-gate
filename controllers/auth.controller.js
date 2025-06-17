const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');

const RESPONSE_CODES = {
  SUCCESS: 'S',
  ERROR: 'E',
  EXISTS: 'F',
  MOBILE_EXISTS: 'X'
};

const RESPONSE_MESSAGES = {
  SUCCESS: 'Record(s) saved successfully',
  ERROR: 'Record(s) failed to save',
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'User registered successfully',
  USER_EXISTS: 'User already exists',
  INVALID_CREDENTIALS: 'Invalid username or password',
  USER_INACTIVE: 'User account is inactive',
  MISSING_FIELDS: 'Username, password, and tenantId are required'
};

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

class AuthController {
  // POST /auth/register
  static async register(req, res) {
    try {
      const { tenantId, userName, password } = req.body;

      if (!tenantId || !userName || !password) {
        return res.status(400).json({
          responseCode: RESPONSE_CODES.ERROR,
          responseMessage: RESPONSE_MESSAGES.MISSING_FIELDS
        });
      }

      const exists = await UserModel.checkUserExists(userName, tenantId);

      if (exists) {
        return res.status(409).json({
          responseCode: RESPONSE_CODES.EXISTS,
          responseMessage: RESPONSE_MESSAGES.USER_EXISTS
        });
      }

      const newUser = await UserModel.createUser({ tenantId, userName, password });

      const token = generateToken({ loginId: newUser.loginid, tenantId });

      res.status(201).json({
        responseCode: RESPONSE_CODES.SUCCESS,
        responseMessage: RESPONSE_MESSAGES.REGISTER_SUCCESS,
        token,
        loginuser: {
          id: newUser.loginid,
          userName: newUser.username,
          tenantId: newUser.tenantid
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        responseCode: RESPONSE_CODES.ERROR,
        responseMessage: RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /auth/login
  static async login(req, res) {
    try {
      const { username, password, tenantid } = req.body;

      if (!username || !password || !tenantid) {
        return res.status(400).json({
          responseCode: RESPONSE_CODES.ERROR,
          responseMessage: RESPONSE_MESSAGES.MISSING_FIELDS
        });
      }

      const user = await UserModel.findByUsernameAndTenant(username, tenantid);

      if (!user) {
        return res.status(401).json({
          responseCode: RESPONSE_CODES.ERROR,
          responseMessage: RESPONSE_MESSAGES.INVALID_CREDENTIALS
        });
      }

      const isValidPassword = await UserModel.verifyPassword(password, user.passwrd);

      if (!isValidPassword) {
        return res.status(401).json({
          responseCode: RESPONSE_CODES.ERROR,
          responseMessage: RESPONSE_MESSAGES.INVALID_CREDENTIALS
        });
      }

      if (user.isactive !== 'Y') {
        return res.status(403).json({
          responseCode: RESPONSE_CODES.ERROR,
          responseMessage: RESPONSE_MESSAGES.USER_INACTIVE
        });
      }

      await UserModel.updateLastLogin(user.loginid, tenantid);
      const tenantDetails = await UserModel.getTenantDetails(tenantid);

      const tokenPayload = {
        loginId: user.loginid,
        username: user.username,
        tenantId: user.tenantid,
        roleAccessId: user.roleaccessid,
        roleName: user.rolename
      };

      const token = generateToken(tokenPayload);

      const userResponse = {
        loginId: user.loginid,
        tenantId: user.tenantid,
        isActive: user.isactive,
        roleAccessId: user.roleaccessid,
        roleName: user.rolename,
        firstName: user.firstn,
        middleName: user.middlen,
        lastName: user.lastn,
        userName: user.username,
        displayName: user.displayn,
        email: user.email,
        mobile: user.mobile,
        linkFlatFlag: user.linkflatflag,
        linkeFlatId: user.linkeflatid,
        linkeFlatName: user.linkeflatname,
        tenantName: tenantDetails ? tenantDetails.tenantname : null
      };

      res.json({
        responseCode: RESPONSE_CODES.SUCCESS,
        responseMessage: RESPONSE_MESSAGES.LOGIN_SUCCESS,
        token,
        loginuser: userResponse
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        responseCode: RESPONSE_CODES.ERROR,
        responseMessage: RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

static async getUserInfo(req, res) {
  try {
    const user = req.user; 

    if (!user) {
      return res.status(401).json({
        responseCode: RESPONSE_CODES.ERROR,
        responseMessage: 'Unauthorized: Invalid or missing token'
      });
    }

    const fullUser = await UserModel.findByLoginIdAndTenant(user.loginId, user.tenantId);

    if (!fullUser) {
      return res.status(404).json({
        responseCode: RESPONSE_CODES.ERROR,
        responseMessage: 'User not found'
      });
    }

    const userInfo = {
      loginId: fullUser.loginid,
      tenantId: fullUser.tenantid,
      isActive: fullUser.isactive,
      roleAccessId: fullUser.roleaccessid,
      roleName: fullUser.rolename,
      firstName: fullUser.firstn,
      middleName: fullUser.middlen,
      lastName: fullUser.lastn,
      userName: fullUser.username,
      displayName: fullUser.displayn,
      email: fullUser.email,
      mobile: fullUser.mobile
    };

    res.json({
      responseCode: RESPONSE_CODES.SUCCESS,
      loginuser: userInfo
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      responseCode: RESPONSE_CODES.ERROR,
      responseMessage: RESPONSE_MESSAGES.ERROR
    });
  }
}

}

module.exports = AuthController;
