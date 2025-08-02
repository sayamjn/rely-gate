const StudentDayBoardingService = require('../services/studentDayBoarding.service');
const responseUtils = require('../utils/constants');
const fs = require('fs');
const { validationResult } = require('express-validator');

class StudentDayBoardingController {

  // ================================================================================
  // BULK UPLOAD ENDPOINTS
  // ================================================================================

  // POST /api/student-day-boarding/bulk-upload - Bulk upload students via CSV
  static async bulkUploadStudents(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Validation errors',
          errors: errors.array()
        });
      }

      if (!req.file) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'No CSV file uploaded'
        });
      }

      const userTenantId = req.user.tenantId;
      const result = await StudentDayBoardingService.processBulkUpload(
        userTenantId,
        req.file.path,
        req.user.username
      );

      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in bulk upload:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/student-day-boarding/template - Download CSV template
  static async downloadTemplate(req, res) {
    try {
      const template = `StudentID,StudentName,Course,Section,Year,PrimaryGuardianName,PrimaryGuardianPhone,GuardianRelation
stu001,John Doe,Computer Science,A,2024,Jane Doe,9876543210,Mother
stu002,Alice Smith,Mathematics,B,2024,Bob Smith,9876543211,Father`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="student_day_boarding_template.csv"');
      res.send(template);
    } catch (error) {
      console.error('Error downloading template:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to download template'
      });
    }
  }

  // ================================================================================
  // STUDENT LIST AND MANAGEMENT ENDPOINTS
  // ================================================================================

  // GET /api/student-day-boarding/students - List students with filters
  static async getStudents(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        course = null,
        section = null,
        year = null
      } = req.query;

      const userTenantId = req.user.tenantId;
      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        course,
        section,
        year
      };

      const result = await StudentDayBoardingService.getStudents(userTenantId, filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/student-day-boarding/students/:id/generate-qr - Generate QR code for student
  static async generateQR(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userTenantId = req.user.tenantId;

      const result = await StudentDayBoardingService.generateStudentQR(
        userTenantId,
        parseInt(id),
        req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ================================================================================
  // PICKUP PASS GENERATION ENDPOINTS
  // ================================================================================

  // POST /api/student-day-boarding/verify-phone - Verify guardian phone and send OTP
  static async verifyGuardianPhone(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Validation errors',
          errors: errors.array()
        });
      }

      const { phoneNumber } = req.body;
      const userTenantId = req.user.tenantId;

      const result = await StudentDayBoardingService.verifyGuardianPhone(
        userTenantId,
        phoneNumber,
        req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error('Error verifying guardian phone:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/student-day-boarding/verify-otp - Verify OTP
  static async verifyOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Validation errors',
          errors: errors.array()
        });
      }

      const { otpRef, otpNumber, phoneNumber } = req.body;

      const result = await StudentDayBoardingService.verifyOTP(otpRef, otpNumber, phoneNumber);
      res.json(result);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/student-day-boarding/guardian/:authMasterId/students - Get students linked to guardian
  static async getGuardianStudents(req, res) {
    try {
      const { authMasterId } = req.params;
      const userTenantId = req.user.tenantId;

      const result = await StudentDayBoardingService.getGuardianStudents(
        userTenantId,
        parseInt(authMasterId)
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching guardian students:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/student-day-boarding/guardian/add - Add guardian to auth master
  static async addGuardian(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Validation errors',
          errors: errors.array()
        });
      }

      const guardianData = req.body;
      const userTenantId = req.user.tenantId;

      const result = await StudentDayBoardingService.addGuardian(
        userTenantId,
        guardianData,
        req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error('Error adding guardian:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ================================================================================
  // STUDENT-GUARDIAN LINKING ENDPOINTS
  // ================================================================================

  // POST /api/student-day-boarding/link-student - Link student to guardian
  static async linkStudentToGuardian(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Validation errors',
          errors: errors.array()
        });
      }

      const linkData = req.body;
      const userTenantId = req.user.tenantId;

      const result = await StudentDayBoardingService.linkStudentToGuardian(
        userTenantId,
        linkData,
        req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error('Error linking student to guardian:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PUT /api/student-day-boarding/link/:linkId/inactivate - Inactivate student-guardian link
  static async inactivateLink(req, res) {
    try {
      const { linkId } = req.params;
      const userTenantId = req.user.tenantId;

      const result = await StudentDayBoardingService.inactivateLink(
        userTenantId,
        parseInt(linkId),
        req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error('Error inactivating link:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ================================================================================
  // CHECKOUT ENDPOINTS
  // ================================================================================

  // POST /api/student-day-boarding/checkout/scan-qr - Process QR scan for checkout
  static async scanQRForCheckout(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Validation errors',
          errors: errors.array()
        });
      }

      const { qrData, guardianData } = req.body;
      const userTenantId = req.user.tenantId;

      const result = await StudentDayBoardingService.processCheckout(
        userTenantId,
        qrData,
        guardianData,
        req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error('Error processing QR checkout:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/student-day-boarding/checkout/complete - Complete checkout after OTP verification
  static async completeCheckout(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Validation errors',
          errors: errors.array()
        });
      }

      const { historyId, otpRef, otpNumber, primaryGuardianPhone } = req.body;
      const userTenantId = req.user.tenantId;

      const result = await StudentDayBoardingService.completeCheckout(
        userTenantId,
        parseInt(historyId),
        otpRef,
        otpNumber,
        primaryGuardianPhone,
        req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error('Error completing checkout:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/student-day-boarding/checkout/history - Get checkout history
  static async getCheckoutHistory(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        fromDate = null,
        toDate = null,
        status = null
      } = req.query;

      const userTenantId = req.user.tenantId;
      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        fromDate,
        toDate,
        status
      };

      const result = await StudentDayBoardingService.getCheckoutHistory(userTenantId, filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching checkout history:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ================================================================================
  // UTILITY ENDPOINTS
  // ================================================================================

  // GET /api/student-day-boarding/filter-data - Get filter dropdown data
  static async getFilterData(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const result = await StudentDayBoardingService.getFilterData(userTenantId);
      res.json(result);
    } catch (error) {
      console.error('Error fetching filter data:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ================================================================================
  // VALIDATION HELPER METHODS
  // ================================================================================

  // Get validation rules for bulk upload
  static getBulkUploadValidation() {
    return [
      // File validation is handled by multer middleware
    ];
  }

  // Get validation rules for phone verification
  static getPhoneVerificationValidation() {
    const { body } = require('express-validator');
    return [
      body('phoneNumber')
        .notEmpty()
        .withMessage('Phone number is required')
        .isMobilePhone('en-IN')
        .withMessage('Invalid phone number format')
    ];
  }

  // Get validation rules for OTP verification
  static getOTPVerificationValidation() {
    const { body } = require('express-validator');
    return [
      body('otpRef')
        .notEmpty()
        .withMessage('OTP reference is required')
        .isNumeric()
        .withMessage('Invalid OTP reference'),
      body('otpNumber')
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must be numeric'),
      body('phoneNumber')
        .notEmpty()
        .withMessage('Phone number is required')
        .isMobilePhone('en-IN')
        .withMessage('Invalid phone number format')
    ];
  }

  // Get validation rules for guardian addition
  static getAddGuardianValidation() {
    const { body } = require('express-validator');
    return [
      body('studentDayBoardingId')
        .notEmpty()
        .withMessage('Student Day Boarding ID is required')
        .isInt({ min: 1 })
        .withMessage('Student Day Boarding ID must be a positive integer'),
      body('name')
        .notEmpty()
        .withMessage('Guardian name is required')
        .trim()
        .isLength({ min: 2, max: 250 })
        .withMessage('Name must be between 2 and 250 characters'),
      body('phoneNumber')
        .notEmpty()
        .withMessage('Phone number is required')
        .isMobilePhone('en-IN')
        .withMessage('Invalid phone number format'),
      body('relation')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Relation must not exceed 100 characters')
    ];
  }

  // Get validation rules for student-guardian linking
  static getLinkStudentValidation() {
    const { body } = require('express-validator');
    return [
      body('studentDayBoardingId')
        .notEmpty()
        .withMessage('Student Day Boarding ID is required')
        .isNumeric()
        .withMessage('Invalid Student Day Boarding ID'),
      body('authMasterId')
        .notEmpty()
        .withMessage('Auth Master ID is required')
        .isNumeric()
        .withMessage('Invalid Auth Master ID'),
      body('studentId')
        .notEmpty()
        .withMessage('Student ID is required')
        .trim(),
      body('phoneNumber')
        .notEmpty()
        .withMessage('Phone number is required')
        .isMobilePhone('en-IN')
        .withMessage('Invalid phone number format'),
      body('relation')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Relation must not exceed 100 characters')
    ];
  }

  // Get validation rules for QR checkout
  static getQRCheckoutValidation() {
    const { body } = require('express-validator');
    return [
      body('qrData.studentId')
        .notEmpty()
        .withMessage('Student ID from QR is required'),
      body('guardianData.guardianPhone')
        .notEmpty()
        .withMessage('Guardian phone is required')
        .isMobilePhone('en-IN')
        .withMessage('Invalid guardian phone format'),
      body('guardianData.remarks')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Remarks must not exceed 500 characters')
    ];
  }

  // Get validation rules for checkout completion
  static getCompleteCheckoutValidation() {
    const { body } = require('express-validator');
    return [
      body('historyId')
        .notEmpty()
        .withMessage('History ID is required')
        .isNumeric()
        .withMessage('Invalid History ID'),
      body('otpRef')
        .notEmpty()
        .withMessage('OTP reference is required')
        .isNumeric()
        .withMessage('Invalid OTP reference'),
      body('otpNumber')
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must be numeric'),
      body('primaryGuardianPhone')
        .notEmpty()
        .withMessage('Primary guardian phone is required')
        .isMobilePhone('en-IN')
        .withMessage('Invalid phone number format')
    ];
  }
}

module.exports = StudentDayBoardingController;