const express = require("express");
const { body, validationResult } = require("express-validator");
const AuthController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();


// POST /auth/register
router.post(
  "/register",
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

// GET /auth/userinfo
router.get(
  "/userinfo",
  handleValidationErrors,
  authenticateToken,
  AuthController.getUserInfo
);

module.exports = router;