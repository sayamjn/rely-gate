const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      responseCode: 'E',
      responseMessage: 'Access token is missing'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded; // { loginId, username, tenantId, roleAccessId, roleName }
    // console.log('User authenticated:', { loginId: decoded.loginId, username: decoded.username, tenantId: decoded.tenantId });
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(403).json({
      responseCode: 'E',
      responseMessage: 'Invalid or expired token'
    });
  }
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        responseCode: 'E',
        responseMessage: 'Unauthorized'
      });
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      return res.status(403).json({
        responseCode: 'E',
        responseMessage: 'Insufficient permissions'
      });
    }

    next();
  };
};

const validateTenantAccess = (req, res, next) => {
  // Check if user is authenticated first
  console.log('validateTenantAccess - req.user:', req.user);
  if (!req.user) {
    console.log('validateTenantAccess - No user found in request');
    return res.status(401).json({
      responseCode: 'E',
      responseMessage: 'Authentication required'
    });
  }

  const requestedTenantId = req.body.tenantId || req.query.tenantId || req.params.tenantId;
  console.log('validateTenantAccess - requestedTenantId:', requestedTenantId, 'userTenantId:', req.user.tenantId);

  if (requestedTenantId && parseInt(requestedTenantId) !== req.user.tenantId) {
    return res.status(403).json({
      responseCode: 'E',
      responseMessage: 'Access denied for this tenant'
    });
  }

  next();
};



module.exports = {
  authenticateToken,
  authorizeRole,
  validateTenantAccess
};
