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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { loginId, username, tenantId, roleAccessId, roleName }
    next();
  } catch (error) {
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
  const requestedTenantId = req.body.tenantId || req.query.tenantId || req.params.tenantId;

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
