const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// General API rate limit - 100 requests per 15 minutes
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: {
    responseCode: 'E',
    responseMessage: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60) // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use IP + tenant ID for multi-tenant rate limiting
    const ip = ipKeyGenerator(req);
    return `${ip}-${req.user?.tenantId || 'anonymous'}`;
  }
});

// Strict rate limit for authentication endpoints - 5 attempts per 15 minutes
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, 
  message: {
    responseCode: 'E',
    responseMessage: 'Too many login attempts from this IP, please try again after 15 minutes.',
    retryAfter: Math.ceil(15 * 60) // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

// OTP rate limit - 5 OTP requests per 5 minutes
const otpLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, 
  message: {
    responseCode: 'E',
    responseMessage: 'Too many OTP requests, please try again after 5 minutes.',
    retryAfter: Math.ceil(5 * 60) // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + mobile number for OTP rate limiting
    const ip = ipKeyGenerator(req);
    const mobile = req.body.mobile || req.query.mobile || '';
    return `${ip}-${mobile}`;
  }
});

// Visitor registration rate limit - 100 registrations per hour
const visitorRegistrationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    responseCode: 'E',
    responseMessage: 'Too many visitor registrations from this IP, please try again after an hour.',
    retryAfter: Math.ceil(60 * 60) // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    return `${ip}-${req.user?.tenantId || 'anonymous'}`;
  }
});

// File upload rate limit - 20 uploads per hour
const fileUploadLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, 
  message: {
    responseCode: 'E',
    responseMessage: 'Too many file uploads from this IP, please try again after an hour.',
    retryAfter: Math.ceil(60 * 60) // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    return `${ip}-${req.user?.tenantId || 'anonymous'}`;
  }
});

// Bulk operations rate limit - 5 bulk operations per hour
const bulkOperationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, 
  message: {
    responseCode: 'E',
    responseMessage: 'Too many bulk operations from this IP, please try again after an hour.',
    retryAfter: Math.ceil(60 * 60) // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    return `${ip}-${req.user?.tenantId || 'anonymous'}`;
  }
});

// Custom rate limiter factory for specific use cases
const createCustomRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      responseCode: 'E',
      responseMessage: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ip = ipKeyGenerator(req);
      return `${ip}-${req.user?.tenantId || 'anonymous'}`;
    }
  });
};

module.exports = {
  generalLimit,
  authLimit,
  otpLimit,
  visitorRegistrationLimit,
  fileUploadLimit,
  bulkOperationLimit,
  createCustomRateLimit
};