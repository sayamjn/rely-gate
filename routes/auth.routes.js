const express = require("express");
const { body, validationResult, query } = require("express-validator");
const AuthController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const { authLimit } = require("../middleware/rateLimit");

const router = express.Router();


// POST /auth/register
router.post(
  "/register",
  authLimit, // Apply strict rate limiting to registration
  [
    body("userName").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("tenantId")
      .notEmpty()
      .isNumeric()
      .withMessage("Valid tenant ID is required"),
  ],
  handleValidationErrors,
  AuthController.register
);

// POST /auth/login
router.post(
  "/login",
  authLimit, // Apply strict rate limiting to login attempts
  [
    body("username").notEmpty().trim().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("tenantid")
      .notEmpty()
      .isNumeric()
      .withMessage("Valid tenant ID is required"),
  ],
  handleValidationErrors,
  AuthController.login
);

router.post(
  "/token",
  authLimit, // Apply strict rate limiting
  [
    body("username")
      .notEmpty()
      .trim()
      .withMessage("Username is required"),
    body("tenantId")
      .notEmpty()
      .isInt()
      .withMessage("Valid tenant ID is required"),
  ],
  handleValidationErrors,
  AuthController.token
);


// GET /auth/userinfo
router.get(
  "/userinfo",
  handleValidationErrors,
  authenticateToken,
  AuthController.getUserInfo
);

// POST /auth/switch-tenant - Switch tenant and get new JWT
router.post(
  "/switch-tenant",
  [
    body("targetTenantId")
      .notEmpty()
      .isNumeric()
      .withMessage("Valid target tenant ID is required"),
  ],
  handleValidationErrors,
  authenticateToken,
  AuthController.switchTenant
);

// GET /auth/my-linked-tenants - Get user's linked tenants
router.get(
  "/my-linked-tenants",
  authenticateToken,
  AuthController.getMyLinkedTenants
);

module.exports = router;