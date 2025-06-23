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

  const  rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    
    return (req, res, next) => {
      const key = `${req.ip}-${req.user?.tenantId || 'anonymous'}`;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (requests.has(key)) {
        const userRequests = requests.get(key).filter(time => time > windowStart);
        requests.set(key, userRequests);
      }
      
      const userRequests = requests.get(key) || [];
      
      if (userRequests.length >= maxRequests) {
        return res.status(429).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      userRequests.push(now);
      requests.set(key, userRequests);
      
      next();
    };
  }

module.exports = {
  authenticateToken,
  authorizeRole,
  validateTenantAccess
};
