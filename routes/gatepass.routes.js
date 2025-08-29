const express = require("express");
const { body, query, param } = require("express-validator");
const GatepassController = require("../controllers/gatepass.controller");
const { authenticateToken } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const { uploadPurposeImage, handleUploadError } = require("../middleware/upload");
const { otpLimit } = require("../middleware/rateLimit");

const router = express.Router();


// POST /api/gatepass/send-otp - Send OTP for gatepass mobile verification
router.post(
  "/send-otp",
  otpLimit, // Apply OTP rate limiting
  [
    body("mobile")
      .notEmpty()
      .withMessage("Mobile is required")
      .matches(/^\d{10}$/)
      .withMessage("Mobile must be 10 digits"),
    body("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
  ],
  handleValidationErrors,
  GatepassController.sendOTP
);

// POST /api/gatepass/verify-otp - Verify OTP for gatepass mobile verification
router.post(
  "/verify-otp",
  [
    body("refId")
      .notEmpty()
      .withMessage("RefId is required")
      .isNumeric()
      .withMessage("RefId must be numeric"),
    body("otpNumber")
      .notEmpty()
      .withMessage("OTP number is required")
      .matches(/^\d{6}$/)
      .withMessage("OTP must be 6 digits"),
    body("mobile")
      .notEmpty()
      .withMessage("Mobile is required")
      .matches(/^\d{10}$/)
      .withMessage("Mobile must be 10 digits"),
    body("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
  ],
  handleValidationErrors,
  GatepassController.verifyOTP
);

// GATEPASS CRUD ROUTES

// POST /api/gatepass - Create new gatepass
router.post(
  "/",
  [
    body("fname").notEmpty().withMessage("First name is required"),
    body("mobile")
      .notEmpty()
      .withMessage("Mobile is required")
      .matches(/^\d{10}$/)
      .withMessage("Mobile must be 10 digits"),
    body("visitDate")
      .notEmpty()
      .withMessage("Visit date is required")
      .isISO8601()
      .withMessage("Visit date must be a valid ISO date"),
    body("purposeId")
      .notEmpty()
      .withMessage("Purpose ID is required")
      .isNumeric()
      .withMessage("Purpose ID must be numeric"),
    body("purposeName").optional().isString().trim(),
    body().custom((value) => {
      const { purposeId, purposeName } = value;
      if (
        parseInt(purposeId) === -1 &&
        (!purposeName || purposeName.trim() === "")
      ) {
        throw new Error(
          "Purpose name is required when purposeId is -1 (custom purpose)"
        );
      }
      return true;
    }),
    body("statusId")
      .optional()
      .isInt({ min: 1, max: 2 })
      .withMessage("Status ID must be 1 (Pending) or 2 (Approved)"),
    body("remark")
      .optional()
      .isString()
      .trim()
      .withMessage("Remark must be a string"),
  ],
  handleValidationErrors,
  // authenticateToken,
  GatepassController.createGatepass
);

// GET /api/gatepass - List gatepasses
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("pageSize")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("PageSize must be between 1 and 100"),
    query("search")
      .optional()
      .isString()
      .trim()
      .withMessage("Search must be a string"),
    query("purposeId")
      .optional()
      .isInt()
      .withMessage("PurposeId must be an integer"),
    query("statusId")
      .optional()
      .isInt()
      .withMessage("StatusId must be an integer"),
    query("StartDate")
      .optional()
      .matches(/^\d{2}\/\d{2}\/\d{4}$/)
      .withMessage("StartDate must be in DD/MM/YYYY format"),
    query("EndDate")
      .optional()
      .matches(/^\d{2}\/\d{2}\/\d{4}$/)
      .withMessage("EndDate must be in DD/MM/YYYY format"),
  ],
  handleValidationErrors,
  authenticateToken,
  GatepassController.listGatepasses
);

// POST /api/gatepass/list - List gatepasses with advanced filtering
router.post(
  "/list",
  [
    body("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    body("pageSize")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("PageSize must be between 1 and 100"),
    body("search")
      .optional()
      .isString()
      .trim()
      .withMessage("Search must be a string"),
    body("purposeId")
      .optional()
      .isInt()
      .withMessage("PurposeId must be an integer"),
    body("statusId")
      .optional()
      .isInt()
      .withMessage("StatusId must be an integer"),
    body("fromDate")
      .optional()
      .isISO8601()
      .withMessage("FromDate must be a valid date"),
    body("toDate")
      .optional()
      .isISO8601()
      .withMessage("ToDate must be a valid date"),
  ],
  handleValidationErrors,
  authenticateToken,
  GatepassController.listGatepassesAdvanced
);

// PUT /api/gatepass/:visitorId/approve - Approve gatepass (NO auto check-in)
router.put(
  "/:visitorId/approve",
  [
    param("visitorId")
      .notEmpty()
      .withMessage("Visitor ID is required")
      .isNumeric()
      .withMessage("Visitor ID must be numeric"),
  ],
  handleValidationErrors,
  authenticateToken,
  GatepassController.approveGatepass
);

// POST /api/gatepass/:visitorId/checkin - Check-in gatepass (sets INTime)
router.post(
  "/:visitorId/checkin",
  [
    param("visitorId")
      .notEmpty()
      .withMessage("Visitor ID is required")
      .isNumeric()
      .withMessage("Visitor ID must be numeric"),
  ],
  handleValidationErrors,
  authenticateToken,
  GatepassController.checkinGatepass
);

// POST /api/gatepass/:visitorId/checkout - Check-out gatepass (sets OutTime)
router.post(
  "/:visitorId/checkout",
  [
    param("visitorId")
      .notEmpty()
      .withMessage("Visitor ID is required")
      .isNumeric()
      .withMessage("Visitor ID must be numeric"),
  ],
  handleValidationErrors,
  authenticateToken,
  GatepassController.checkoutGatepass
);

// GET /api/gatepass/:visitorId/status - Get gatepass current status
router.get(
  "/:visitorId/status",
  [
    param("visitorId")
      .notEmpty()
      .withMessage("Visitor ID is required")
      .isNumeric()
      .withMessage("Visitor ID must be numeric"),
  ],
  handleValidationErrors,
  authenticateToken,
  GatepassController.getGatepassStatus
);

// GET /api/gatepass/pending-checkin - Get gatepasses ready for check-in
router.get(
  "/pending-checkin",
  [],
  handleValidationErrors,
  authenticateToken,
  GatepassController.getPendingCheckin
);

// GET /api/gatepass/pending-checkout - Get gatepasses that need check-out
router.get(
  "/pending-checkout",
  [],
  handleValidationErrors,
  authenticateToken,
  GatepassController.getPendingCheckout
);

// GET /api/gatepass/purposes - Get available purposes via user tenant
router.get(
  "/purposes",
  [],
  authenticateToken,
  handleValidationErrors,
  GatepassController.getGatepassPurposes
);

// GET /api/gatepass/purposes/:tenantId - Get available purposes via query tenant
router.get(
  "/purposes/:tenantId",
  [],
  GatepassController.getGatepassPurposes
);

// GET /api/gatepass/tenants - Get all tenants with statusId
router.get(
  "/tenants",
  [],
  handleValidationErrors,
  GatepassController.getTenants
);

// ===== PURPOSE MANAGEMENT ROUTES (WITH AUTHENTICATION) =====

// POST /api/gatepass/purposes - Add new purpose
router.post('/purposes', uploadPurposeImage, handleUploadError, [
  body('purposeName')
    .notEmpty()
    .withMessage('Purpose name is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage('Purpose name must be between 1 and 250 characters'),
], handleValidationErrors, GatepassController.addGatePassPurpose);

// PUT /api/gatepass/purposes/:purposeId - Update purpose
router.put(
  "/purposes/:purposeId",
  [
    param("purposeId")
      .notEmpty()
      .withMessage("Purpose ID is required")
      .isNumeric()
      .withMessage("Purpose ID must be numeric"),
    body("purposeName")
      .notEmpty()
      .withMessage("Purpose name is required")
      .isString()
      .trim()
      .isLength({ min: 1, max: 250 })
      .withMessage("Purpose name must be between 1 and 250 characters"),
  ],
  handleValidationErrors,
  
  GatepassController.updateGatePassPurpose
);

// DELETE /api/gatepass/purposes/:purposeId - Delete purpose
router.delete(
  "/purposes/:purposeId",
  [
    param("purposeId")
      .notEmpty()
      .withMessage("Purpose ID is required")
      .isNumeric()
      .withMessage("Purpose ID must be numeric"),
  ],
  handleValidationErrors,
  GatepassController.deleteGatePassPurpose
);

// GET /api/gatepass/export - Export gatepasses to CSV
router.get(
  "/export",
  [
    query("purposeId")
      .optional()
      .isInt()
      .withMessage("PurposeId must be an integer"),
    query("statusId")
      .optional()
      .isInt()
      .withMessage("StatusId must be an integer"),
    query("fromDate")
      .optional()
      .isISO8601()
      .withMessage("FromDate must be a valid date"),
    query("toDate")
      .optional()
      .isISO8601()
      .withMessage("ToDate must be a valid date"),
    query("format").optional().isIn(["csv"]).withMessage("Invalid format"),
  ],
  handleValidationErrors,
  authenticateToken,
  GatepassController.exportGatepasses
);

// GET /api/gatepass/template - Download CSV template
router.get(
  "/template",
  handleValidationErrors,
  authenticateToken,
  GatepassController.downloadTemplate
);

module.exports = router;
