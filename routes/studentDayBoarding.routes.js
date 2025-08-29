const express = require("express");
const { query, param, body } = require("express-validator");
const StudentDayBoardingController = require("../controllers/studentDayBoarding.controller");
const { authenticateToken } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  uploadApproverPhoto,
  handleUploadError,
} = require("../middleware/upload");
const { otpLimit } = require("../middleware/rateLimit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authenticateToken);

// ================================================================================
// MULTER CONFIGURATION FOR CSV UPLOADS
// ================================================================================

const csvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), "uploads", "temp");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = path.extname(file.originalname) || ".csv";
    const filename = `student_day_boarding_${timestamp}_${random}${extension}`;
    cb(null, filename);
  },
});

const csvFileFilter = (req, file, cb) => {
  if (
    file.mimetype === "text/csv" ||
    file.mimetype === "application/csv" ||
    file.originalname.endsWith(".csv")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed"), false);
  }
};

const uploadCSV = multer({
  storage: csvStorage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// ================================================================================
// BULK UPLOAD ROUTES
// ================================================================================

// POST /api/student-day-boarding/bulk-upload - Bulk upload students via CSV
router.post(
  "/bulk-upload",
  uploadCSV.single("file"),
  StudentDayBoardingController.getBulkUploadValidation(),
  handleValidationErrors,
  authenticateToken,
  StudentDayBoardingController.bulkUploadStudents
);

// GET /api/student-day-boarding/template - Download CSV template
router.get("/template", StudentDayBoardingController.downloadTemplate);

// ================================================================================
// STUDENT MANAGEMENT ROUTES
// ================================================================================

// GET /api/student-day-boarding/students/:tenantId - List students with filters
router.get(
  "/students",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("pageSize")
      .optional()
      .isInt({ min: 1, max: 100000 })
      .withMessage("PageSize must be between 1 and 100000"),
    query("search")
      .optional()
      .isString()
      .trim()
      .withMessage("Search must be a string"),
    query("course")
      .optional()
      .isString()
      .trim()
      .withMessage("Course must be a string"),
    query("section")
      .optional()
      .isString()
      .trim()
      .withMessage("Section must be a string"),
    query("year")
      .optional()
      .isString()
      .trim()
      .withMessage("Year must be a string"),
  ],
  handleValidationErrors,
  authenticateToken,
  StudentDayBoardingController.getStudents
);

// GET /api/student-day-boarding/students-detailed/:tenantId - List students with detailed approver information
router.get(
  "/students-detailed/:tenantId",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
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
    query("course")
      .optional()
      .isString()
      .trim()
      .withMessage("Course must be a string"),
    query("section")
      .optional()
      .isString()
      .trim()
      .withMessage("Section must be a string"),
    query("year")
      .optional()
      .isString()
      .trim()
      .withMessage("Year must be a string"),
    query("approverStatus")
      .optional()
      .isIn(["ACTIVE", "INACTIVE"])
      .withMessage("ApproverStatus must be ACTIVE or INACTIVE"),
  ],
  handleValidationErrors,
  StudentDayBoardingController.getStudentsWithApproverDetails
);

// POST /api/student-day-boarding/students/:id/generate-qr - Generate QR code for student
router.post(
  "/students/:id/generate-qr",
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("Student ID must be a positive integer"),
  ],
  handleValidationErrors,
  authenticateToken,
  StudentDayBoardingController.generateQR
);

// ================================================================================
// PICKUP PASS GENERATION ROUTES
// ================================================================================

// POST /api/student-day-boarding/verify-phone - Verify guardian phone and send OTP
router.post(
  "/verify-phone",
  otpLimit, // Apply OTP rate limiting
  StudentDayBoardingController.getPhoneVerificationValidation(),
  handleValidationErrors,
  StudentDayBoardingController.verifyGuardianPhone
);

// POST /api/student-day-boarding/verify-otp - Verify OTP
router.post(
  "/verify-otp",
  StudentDayBoardingController.getOTPVerificationValidation(),
  handleValidationErrors,
  StudentDayBoardingController.verifyOTP
);

// GET /api/student-day-boarding/guardian/:tenantId/students - Get all students for tenant
router.get(
  "/guardian/:tenantId/students",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
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
  ],
  handleValidationErrors,
  StudentDayBoardingController.getStudents
);

// GET /api/student-day-boarding/guardian/:tenantId/:authMasterId/students - Get students linked to guardian
router.get(
  "/guardian/:tenantId/:authMasterId/students",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
    param("authMasterId")
      .isInt({ min: 1 })
      .withMessage("Auth Master ID must be a positive integer"),
  ],
  handleValidationErrors,
  StudentDayBoardingController.getGuardianStudents
);

// POST /api/student-day-boarding/guardian/add - Add guardian to auth master
router.post(
  "/guardian/add",
  StudentDayBoardingController.getAddGuardianValidation(),
  handleValidationErrors,
  StudentDayBoardingController.addGuardian
);

// ================================================================================
// STUDENT-GUARDIAN LINKING ROUTES
// ================================================================================

// POST /api/student-day-boarding/link-student - Link student to guardian
router.post(
  "/link-student",
  StudentDayBoardingController.getLinkStudentValidation(),
  handleValidationErrors,
  StudentDayBoardingController.linkStudentToGuardian
);

// PUT /api/student-day-boarding/link/:linkId/inactivate - Inactivate student-guardian link
router.put(
  "/link/:linkId/inactivate",
  [
    param("linkId")
      .isInt({ min: 1 })
      .withMessage("Link ID must be a positive integer"),
    body("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
  ],
  handleValidationErrors,
  StudentDayBoardingController.inactivateLink
);

// ================================================================================
// CHECKOUT ROUTES
// ================================================================================

// POST /api/student-day-boarding/checkout/scan-qr - Process QR scan for checkout
router.post(
  "/checkout/scan-qr",
  otpLimit, // Apply OTP rate limiting (triggers OTP via processCheckout)
  StudentDayBoardingController.getQRCheckoutValidation(),
  handleValidationErrors,
  StudentDayBoardingController.scanQRForCheckout
);

// POST /api/student-day-boarding/checkout/complete - Complete checkout after OTP verification
router.post(
  "/checkout/complete",
  StudentDayBoardingController.getCompleteCheckoutValidation(),
  handleValidationErrors,
  StudentDayBoardingController.completeCheckout
);

// POST /api/student-day-boarding/checkout - Direct student checkout
router.post(
  "/checkout",
  StudentDayBoardingController.getDirectCheckoutValidation(),
  handleValidationErrors,
  authenticateToken,
  StudentDayBoardingController.directStudentCheckout
);

// GET /api/student-day-boarding/checkout/history/:tenantId - Get checkout history
router.get(
  "/checkout/history",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("pageSize")
      .optional()
      .isInt({ min: 1, max: 10000000 })
      .withMessage("PageSize must be between 1 and 10000000"),
    query("search")
      .optional()
      .isString()
      .trim()
      .withMessage("Search must be a string"),
    query("studentId")
      .optional()
      .isString()
      .trim()
      .withMessage("StudentId must be a string"),
    query("course")
      .optional()
      .isString()
      .trim()
      .withMessage("Course must be a string"),
    query("fromDate")
      .optional()
      .isInt()
      .withMessage("FromDate must be valid epoch timestamp"),
    query("toDate")
      .optional()
      .isInt()
      .withMessage("ToDate must be valid epoch timestamp"),
    query("status")
      .optional()
      .isIn(["PENDING_OTP", "CHECKED_OUT", "COMPLETED"])
      .withMessage("Status must be PENDING_OTP, CHECKED_OUT, or COMPLETED"),
  ],
  handleValidationErrors,
  authenticateToken,
  StudentDayBoardingController.getCheckoutHistory
);

// ================================================================================
// UTILITY ROUTES
// ================================================================================

// GET /api/student-day-boarding/filter-data/:tenantId - Get filter dropdown data
router.get(
  "/filter-data/:tenantId",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
  ],
  handleValidationErrors,
  StudentDayBoardingController.getFilterData
);

// GET /api/student-day-boarding/courses/:tenantId - Get student courses
router.get(
  "/courses/",
  handleValidationErrors,
  authenticateToken,
  StudentDayBoardingController.getStudentCourses
);

// ================================================================================
// GUARDIAN MANAGEMENT ROUTES
// ================================================================================

// GET /api/student-day-boarding/guardians/:tenantId - Get all guardians with filters
router.get(
  "/guardians/:tenantId",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
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
  ],
  handleValidationErrors,
  StudentDayBoardingController.getAllGuardians
);

// GET /api/student-day-boarding/guardian/:tenantId/:authMasterId - Get guardian details by ID
router.get(
  "/guardian/:tenantId/:authMasterId",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
    param("authMasterId")
      .notEmpty()
      .withMessage("Auth Master ID is required")
      .isNumeric()
      .withMessage("Auth Master ID must be numeric"),
  ],
  handleValidationErrors,
  StudentDayBoardingController.getGuardianById
);

// GET /api/student-day-boarding/authorized-guardians/:tenantId/:primaryGuardianPhone - Get authorized guardians by primary guardian phone
router.get(
  "/authorized-guardians/:tenantId/:primaryGuardianPhone",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
    param("primaryGuardianPhone")
      .notEmpty()
      .withMessage("Primary guardian phone is required")
      .isMobilePhone("en-IN")
      .withMessage("Invalid primary guardian phone format"),
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
  ],
  handleValidationErrors,
  StudentDayBoardingController.getAuthorizedGuardiansByPrimaryPhone
);

// GET /api/student-day-boarding/guardian-dashboard/:tenantId/:guardianPhone - Guardian Authentication Dashboard
router.get(
  "/guardian-dashboard/:tenantId/:guardianPhone",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
    param("guardianPhone")
      .notEmpty()
      .withMessage("Guardian phone is required")
      .isMobilePhone("en-IN")
      .withMessage("Invalid guardian phone format"),
  ],
  handleValidationErrors,
  StudentDayBoardingController.getGuardianDashboard
);

// ================================================================================
// NEW ENHANCED API ENDPOINTS
// ================================================================================

// 1. GET /api/tenants - Get all tenant lists
router.get("/tenants", StudentDayBoardingController.getAllTenants);

// 2. POST /api/student-day-boarding/check-guardian-eligibility - Check guardian eligibility and send OTP
router.post(
  "/check-guardian-eligibility",
  otpLimit, // Apply OTP rate limiting
  StudentDayBoardingController.getGuardianEligibilityValidation(),
  handleValidationErrors,
  StudentDayBoardingController.checkGuardianEligibility
);

// 3. POST /api/student-day-boarding/verify-otp-new - Verify OTP (enhanced version)
router.post(
  "/verify-otp-new",
  StudentDayBoardingController.getNewOTPVerificationValidation(),
  handleValidationErrors,
  StudentDayBoardingController.verifyOTPNew
);

// 4. GET /api/student-day-boarding/students/:tenantId/:guardianPhone - Get students by guardian phone
router.get(
  "/students/:tenantId/:guardianPhone",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
    param("guardianPhone")
      .notEmpty()
      .withMessage("Guardian phone is required")
      .isMobilePhone("en-IN")
      .withMessage("Invalid guardian phone format"),
  ],
  handleValidationErrors,
  StudentDayBoardingController.getStudentsByGuardianPhone
);

// 5. GET /api/student-day-boarding/authorized/:tenantId/:guardianPhone - Get authorized list
router.get(
  "/authorized/:tenantId/:guardianPhone",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
    param("guardianPhone")
      .notEmpty()
      .withMessage("Guardian phone is required")
      .isMobilePhone("en-IN")
      .withMessage("Invalid guardian phone format"),
  ],
  handleValidationErrors,
  StudentDayBoardingController.getAuthorizedList
);

// 6. GET /api/student-day-boarding/approvers/:tenantId/:studentId - Get active approvers
router.get(
  "/approvers/:tenantId/:studentId",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
    param("studentId").notEmpty().withMessage("Student ID is required").trim(),
  ],
  handleValidationErrors,
  StudentDayBoardingController.getActiveApprovers
);

// GET /api/student-day-boarding/approver-list/:tenantId/:studentDayBoardingId - Get approver list by dayboarding ID
router.get(
  "/approver-list/:tenantId/:studentDayBoardingId",
  [
    param("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
    param("studentDayBoardingId")
      .notEmpty()
      .withMessage("Student Day Boarding ID is required")
      .isNumeric()
      .withMessage("Student Day Boarding ID must be numeric"),
  ],
  handleValidationErrors,
  StudentDayBoardingController.getApproverList
);

// 7. POST /api/student-day-boarding/link-students - Bulk link students to guardian
router.post(
  "/link-students",
  uploadApproverPhoto,
  StudentDayBoardingController.getLinkStudentsValidation(),
  handleValidationErrors,
  // authenticateToken,
  StudentDayBoardingController.linkStudentsToGuardian,
  handleUploadError
);

// 8. PUT /api/student-day-boarding/deactivate-approver - Deactivate approver
router.put(
  "/deactivate-approver",
  // StudentDayBoardingController.getDeactivateApproverValidation(),
  handleValidationErrors,
  // authenticateToken,
  StudentDayBoardingController.deactivateApprover
);

// 9. PUT /api/student-day-boarding/activate-approver - Activate approver
router.put(
  "/activate-approver",
  StudentDayBoardingController.getActivateApproverValidation(),
  handleValidationErrors,
  // authenticateToken,
  StudentDayBoardingController.activateApprover
);

// 10. PUT /api/student-day-boarding/approver/:approverId - Update approver details
router.put(
  "/approver/:approverId",
  uploadApproverPhoto,
  [
    param("approverId")
      .notEmpty()
      .withMessage("Approver ID is required")
      .isNumeric()
      .withMessage("Approver ID must be numeric"),
    body("tenantId")
      .notEmpty()
      .withMessage("Tenant ID is required")
      .isNumeric()
      .withMessage("Tenant ID must be numeric"),
  ],
  StudentDayBoardingController.getUpdateApproverValidation(),
  handleValidationErrors,
  // authenticateToken,
  StudentDayBoardingController.updateApprover,
  handleUploadError
);

// ================================================================================
// ERROR HANDLING MIDDLEWARE
// ================================================================================

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        responseCode: "E",
        responseMessage: "File size too large. Maximum size is 5MB.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        responseCode: "E",
        responseMessage: "Unexpected file field. Expected field name: file",
      });
    }
  }

  if (error.message === "Only CSV files are allowed") {
    return res.status(400).json({
      responseCode: "E",
      responseMessage: "Only CSV files are allowed",
    });
  }

  next(error);
});

module.exports = router;
