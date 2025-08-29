const StudentDayBoardingService = require("../services/studentDayBoarding.service");
const responseUtils = require("../utils/constants");
const fs = require("fs");
const { validationResult } = require("express-validator");

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
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "No CSV file uploaded",
        });
      }

      const tenantId = req.user.tenantId;
      const result = await StudentDayBoardingService.processBulkUpload(
        tenantId,
        req.file.path
        // req.user.username
      );

      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json(result);
    } catch (error) {
      console.error("Error in bulk upload:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/student-day-boarding/template - Download CSV template
  static async downloadTemplate(req, res) {
    try {
      const template = `StudentID,StudentName,Course,Section,Year,PrimaryGuardianName,PrimaryGuardianPhone,GuardianRelation
stu001,John Doe,Computer Science,A,2024,Jane Doe,9876543210,Mother
stu002,Alice Smith,Mathematics,B,2024,Bob Smith,9876543211,Father`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="student_day_boarding_template.csv"'
      );
      res.send(template);
    } catch (error) {
      console.error("Error downloading template:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to download template",
      });
    }
  }

  // POST /api/student-day-boarding/student/add - Add single student
  static async addSingleStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { tenantId, ...studentData } = req.body;

      // Handle uploaded photo
      if (req.file) {
        studentData.studentPhotoFlag = "Y";
        studentData.studentPhotoPath = `uploads/students/${req.file.filename}`;
        studentData.studentPhotoName = req.file.filename;
      }

      const result = await StudentDayBoardingService.addSingleStudent(
        tenantId,
        studentData,
        "system" // req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error adding student:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ================================================================================
  // STUDENT LIST AND MANAGEMENT ENDPOINTS
  // ================================================================================

  // GET /api/student-day-boarding/students/:tenantId - List students with filters
  static async getStudents(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = "",
        course = null,
        section = null,
        year = null,
      } = req.query;

      const userTenantId = req.user.tenantId;
      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        course,
        section,
        year,
      };

      const result = await StudentDayBoardingService.getStudents(
        userTenantId,
        filters
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/student-day-boarding/students-detailed/:tenantId - List students with detailed approver information
  static async getStudentsWithApproverDetails(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = "",
        course = null,
        section = null,
        year = null,
        approverStatus = null,
      } = req.query;

      const userTenantId = req.params.tenantId;
      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        course,
        section,
        year,
        approverStatus,
      };

      const result =
        await StudentDayBoardingService.getStudentsWithApproverDetails(
          userTenantId,
          filters
        );
      res.json(result);
    } catch (error) {
      console.error("Error fetching students with approver details:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const  tenantId  = req.user.tenantId;
      const result = await StudentDayBoardingService.generateStudentQR(
        tenantId,
        parseInt(id)
        // req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { phoneNumber, tenantId } = req.body;

      const result = await StudentDayBoardingService.verifyGuardianPhone(
        tenantId,
        phoneNumber
        // req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error verifying guardian phone:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { otpRef, otpNumber, phoneNumber, tenantId } = req.body;

      const result = await StudentDayBoardingService.verifyOTP(
        otpRef,
        otpNumber,
        phoneNumber,
        tenantId
      );
      res.json(result);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/student-day-boarding/guardian/:authMasterId/students - Get students linked to guardian
  static async getGuardianStudents(req, res) {
    try {
      const { tenantId, authMasterId } = req.params;

      const result = await StudentDayBoardingService.getGuardianStudents(
        tenantId,
        parseInt(authMasterId)
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching guardian students:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const guardianData = req.body;
      const { tenantId } = req.body;

      const result = await StudentDayBoardingService.addGuardian(
        tenantId,
        guardianData
        // req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error adding guardian:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const linkData = req.body;
      const { tenantId } = req.body;

      const result = await StudentDayBoardingService.linkStudentToGuardian(
        tenantId,
        linkData
        // req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error linking student to guardian:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/student-day-boarding/link/:linkId/inactivate - Inactivate student-guardian link
  static async inactivateLink(req, res) {
    try {
      const { linkId } = req.params;
      const { tenantId } = req.body;

      const result = await StudentDayBoardingService.inactivateLink(
        tenantId,
        parseInt(linkId)
        // req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error inactivating link:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { dayboardingId, approverId, remarks, tenantId } = req.body;

      const result = await StudentDayBoardingService.processCheckout(
        tenantId,
        dayboardingId,
        approverId,
        remarks
        // req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error processing QR checkout:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { historyId, otpRef, otpNumber, primaryGuardianPhone, tenantId } =
        req.body;

      const result = await StudentDayBoardingService.completeCheckout(
        tenantId,
        parseInt(historyId),
        otpRef,
        otpNumber,
        primaryGuardianPhone
        // req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error completing checkout:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/student-day-boarding/checkout/history - Get checkout history
  static async getCheckoutHistory(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = "",
        studentId = "",
        course = "",
        fromDate = null,
        toDate = null,
        status = null,
      } = req.query;

      const  tenantId  = req.user.tenantId;
      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        studentId,
        course,
        fromDate,
        toDate,
        status,
      };

      const result = await StudentDayBoardingService.getCheckoutHistory(
        tenantId,
        filters
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching checkout history:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ================================================================================
  // UTILITY ENDPOINTS
  // ================================================================================

  // GET /api/student-day-boarding/filter-data - Get filter dropdown data
  static async getFilterData(req, res) {
    try {
      const { tenantId } = req.params;
      const result = await StudentDayBoardingService.getFilterData(tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching filter data:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/student-day-boarding/courses/:tenantId - Get student courses
  static async getStudentCourses(req, res) {
    try {
       const tenantId = req.user.tenantId;
      const result = await StudentDayBoardingService.getStudentCourses(tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching student courses:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/student-day-boarding/checkout - Direct student checkout
  static async directStudentCheckout(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { dayboardingId, approverId, remarks } = req.body;
      const tenantId = req.user.tenantId;

      const result = await StudentDayBoardingService.directStudentCheckout(
        tenantId,
        dayboardingId,
        approverId,
        remarks,
        req.user.username || "system"
      );

      res.json(result);
    } catch (error) {
      console.error("Error in direct student checkout:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ================================================================================
  // NEW ENHANCED API ENDPOINTS
  // ================================================================================

  // 1. GET /api/tenants - Get all tenant lists
  static async getAllTenants(req, res) {
    try {
      const result = await StudentDayBoardingService.getAllTenants();
      res.json(result);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 2. POST /api/student-day-boarding/check-guardian-eligibility - Check guardian eligibility and send OTP
  static async checkGuardianEligibility(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { tenantId, guardianPhone } = req.body;

      const result = await StudentDayBoardingService.checkGuardianEligibility(
        tenantId,
        guardianPhone,
        req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error checking guardian eligibility:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 3. POST /api/student-day-boarding/verify-otp-new - Verify OTP (enhanced version)
  static async verifyOTPNew(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { tenantId, guardianPhone, otp } = req.body;

      const result = await StudentDayBoardingService.verifyOTPNew(
        tenantId,
        guardianPhone,
        otp
      );
      res.json(result);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 4. GET /api/student-day-boarding/students/:tenantId/:guardianPhone - Get students by guardian phone
  static async getStudentsByGuardianPhone(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { tenantId, guardianPhone } = req.params;

      const result = await StudentDayBoardingService.getStudentsByGuardianPhone(
        parseInt(tenantId),
        guardianPhone
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching students by guardian phone:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 5. GET /api/student-day-boarding/authorized/:tenantId/:guardianPhone - Get authorized list
  static async getAuthorizedList(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { tenantId, guardianPhone } = req.params;

      const result = await StudentDayBoardingService.getAuthorizedList(
        parseInt(tenantId),
        guardianPhone
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching authorized list:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 6. GET /api/student-day-boarding/approvers/:tenantId/:studentId - Get active approvers
  static async getActiveApprovers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { tenantId, studentId } = req.params;

      const result = await StudentDayBoardingService.getActiveApprovers(
        parseInt(tenantId),
        studentId
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching active approvers:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/student-day-boarding/approver-list/:tenantId/:studentDayBoardingId - Get approver list by dayboarding ID
  static async getApproverList(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { tenantId, studentDayBoardingId } = req.params;

      const result = await StudentDayBoardingService.getApproverListByDayboardingId(
        parseInt(tenantId),
        parseInt(studentDayBoardingId)
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching approver list:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 7. POST /api/student-day-boarding/link-students - Bulk link students to guardian
  static async linkStudentsToGuardian(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const linkData = req.body;

      // Handle uploaded file
      if (req.file) {
        linkData.photo = `uploads/approvers/${req.file.filename}`;
        linkData.photoName = req.file.filename;
      }

      const result = await StudentDayBoardingService.linkStudentsToGuardian(
        linkData
      );

      res.json(result);
    } catch (error) {
      console.error("Error linking students to guardian:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 8. PUT /api/student-day-boarding/deactivate-approver - Deactivate approver
  static async deactivateApprover(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { tenantId, guardianPhone, approverId } = req.body;

      const result = await StudentDayBoardingService.deactivateApprover(
        tenantId,
        guardianPhone,
        approverId,
        "system" // req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error deactivating approver:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 9. PUT /api/student-day-boarding/activate-approver - Activate approver
  static async activateApprover(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { tenantId, guardianPhone, approverId } = req.body;

      const result = await StudentDayBoardingService.activateApprover(
        tenantId,
        guardianPhone,
        approverId,
        "system" // req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error activating approver:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 10. PUT /api/student-day-boarding/approver/:approverId - Update approver details
  static async updateApprover(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Validation errors",
          errors: errors.array(),
        });
      }

      const { approverId } = req.params;
      const { tenantId, name, relation, phoneNumber } = req.body;

      // Handle uploaded file
      let photoData = {
        photoFlag: "N",
        photoPath: null,
        photoName: null,
      };

      if (req.file) {
        photoData = {
          photoFlag: "Y",
          photoPath: `uploads/approvers/${req.file.filename}`,
          photoName: req.file.filename,
        };
      }

      const result = await StudentDayBoardingService.updateApprover(
        tenantId,
        parseInt(approverId),
        {
          name,
          relation,
          phoneNumber,
          ...photoData,
        },
        req.user.username
      );

      res.json(result);
    } catch (error) {
      console.error("Error updating approver:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ================================================================================
  // GUARDIAN MANAGEMENT ENDPOINTS
  // ================================================================================

  // GET /api/student-day-boarding/guardians/:tenantId - Get all guardians with filters
  static async getAllGuardians(req, res) {
    try {
      const { page = 1, pageSize = 20, search = "" } = req.query;

      const { tenantId } = req.params;
      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
      };

      const result = await StudentDayBoardingService.getAllGuardians(
        parseInt(tenantId),
        filters
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching guardians:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/student-day-boarding/guardian/:tenantId/:authMasterId - Get guardian details by ID
  static async getGuardianById(req, res) {
    try {
      const { tenantId, authMasterId } = req.params;

      const result = await StudentDayBoardingService.getGuardianById(
        parseInt(tenantId),
        parseInt(authMasterId)
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching guardian details:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/student-day-boarding/authorized-guardians/:tenantId/:primaryGuardianPhone - Get authorized guardians by primary guardian phone
  static async getAuthorizedGuardiansByPrimaryPhone(req, res) {
    try {
      const { page = 1, pageSize = 20, search = "" } = req.query;

      const { tenantId, primaryGuardianPhone } = req.params;
      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
      };

      const result =
        await StudentDayBoardingService.getAuthorizedGuardiansByPrimaryPhone(
          parseInt(tenantId),
          primaryGuardianPhone,
          filters
        );
      res.json(result);
    } catch (error) {
      console.error("Error fetching authorized guardians:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/student-day-boarding/guardian-dashboard/:tenantId/:guardianPhone - Guardian Authentication Dashboard
  static async getGuardianDashboard(req, res) {
    try {
      const { tenantId, guardianPhone } = req.params;

      const result = await StudentDayBoardingService.getGuardianDashboard(
        parseInt(tenantId),
        guardianPhone
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching guardian dashboard:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
    const { body } = require("express-validator");
    return [
      body("phoneNumber")
        .notEmpty()
        .withMessage("Phone number is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number format"),
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
    ];
  }

  // Get validation rules for OTP verification
  static getOTPVerificationValidation() {
    const { body } = require("express-validator");
    return [
      body("otpRef")
        .notEmpty()
        .withMessage("OTP reference is required")
        .isNumeric()
        .withMessage("Invalid OTP reference"),
      body("otpNumber")
        .notEmpty()
        .withMessage("OTP is required")
        .isLength({ min: 6, max: 6 })
        .withMessage("OTP must be 6 digits")
        .isNumeric()
        .withMessage("OTP must be numeric"),
      body("phoneNumber")
        .notEmpty()
        .withMessage("Phone number is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number format"),
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
    ];
  }

  // Get validation rules for guardian addition
  static getAddGuardianValidation() {
    const { body } = require("express-validator");
    return [
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
      body("studentDayBoardingId")
        .notEmpty()
        .withMessage("Student Day Boarding ID is required")
        .isInt({ min: 1 })
        .withMessage("Student Day Boarding ID must be a positive integer"),
      body("name")
        .notEmpty()
        .withMessage("Guardian name is required")
        .trim()
        .isLength({ min: 2, max: 250 })
        .withMessage("Name must be between 2 and 250 characters"),
      body("phoneNumber")
        .notEmpty()
        .withMessage("Phone number is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number format"),
      body("relation")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Relation must not exceed 100 characters"),
    ];
  }

  // Get validation rules for student-guardian linking
  static getLinkStudentValidation() {
    const { body } = require("express-validator");
    return [
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
      body("studentDayBoardingId")
        .notEmpty()
        .withMessage("Student Day Boarding ID is required")
        .isNumeric()
        .withMessage("Invalid Student Day Boarding ID"),
      body("authMasterId")
        .notEmpty()
        .withMessage("Auth Master ID is required")
        .isNumeric()
        .withMessage("Invalid Auth Master ID"),
      body("studentId").notEmpty().withMessage("Student ID is required").trim(),
      body("phoneNumber")
        .notEmpty()
        .withMessage("Phone number is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number format"),
      body("relation")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Relation must not exceed 100 characters"),
    ];
  }

  // Get validation rules for QR checkout
  static getQRCheckoutValidation() {
    const { body } = require("express-validator");
    return [
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
      body("dayboardingId")
        .notEmpty()
        .withMessage("Dayboarding ID is required")
        .isNumeric()
        .withMessage("Dayboarding ID must be numeric"),
      body("approverId")
        .notEmpty()
        .withMessage("Approver ID is required")
        .isNumeric()
        .withMessage("Approver ID must be numeric"),
      body("remarks")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Remarks must not exceed 500 characters"),
    ];
  }

  // Get validation rules for checkout completion
  static getCompleteCheckoutValidation() {
    const { body } = require("express-validator");
    return [
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
      body("historyId")
        .notEmpty()
        .withMessage("History ID is required")
        .isNumeric()
        .withMessage("Invalid History ID"),
      body("otpRef")
        .notEmpty()
        .withMessage("OTP reference is required")
        .isNumeric()
        .withMessage("Invalid OTP reference"),
      body("otpNumber")
        .notEmpty()
        .withMessage("OTP is required")
        .isLength({ min: 6, max: 6 })
        .withMessage("OTP must be 6 digits")
        .isNumeric()
        .withMessage("OTP must be numeric"),
      body("primaryGuardianPhone")
        .notEmpty()
        .withMessage("Primary guardian phone is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number format"),
    ];
  }

  // ================================================================================
  // NEW VALIDATION METHODS FOR ENHANCED ENDPOINTS
  // ================================================================================

  // Get validation rules for guardian eligibility check
  static getGuardianEligibilityValidation() {
    const { body } = require("express-validator");
    return [
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
      body("guardianPhone")
        .notEmpty()
        .withMessage("Guardian phone is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid guardian phone format"),
    ];
  }

  // Get validation rules for new OTP verification
  static getNewOTPVerificationValidation() {
    const { body } = require("express-validator");
    return [
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
      body("guardianPhone")
        .notEmpty()
        .withMessage("Guardian phone is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid guardian phone format"),
      body("otp")
        .notEmpty()
        .withMessage("OTP is required")
        .isLength({ min: 6, max: 6 })
        .withMessage("OTP must be 6 digits")
        .isNumeric()
        .withMessage("OTP must be numeric"),
    ];
  }

  // Get validation rules for linking multiple students
  static getLinkStudentsValidation() {
    const { body } = require("express-validator");
    return [
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
      body("primaryGuardianPhone")
        .notEmpty()
        .withMessage("Primary guardian phone is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid primary guardian phone format"),
      body("studentIds")
        .notEmpty()
        .withMessage("Student IDs array is required")
        .isArray({ min: 1 })
        .withMessage("Student IDs must be a non-empty array"),
      body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 250 })
        .withMessage("Name must be between 2 and 250 characters"),
      body("phoneNumber")
        .optional()
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number format"),
      body("relation")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Relation must not exceed 100 characters"),
    ];
  }

  // Get validation rules for deactivating approver
  static getDeactivateApproverValidation() {
    const { body } = require("express-validator");
    return [
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
      body("guardianPhone")
        .notEmpty()
        .withMessage("Guardian phone is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid guardian phone format"),
      body("approverId")
        .notEmpty()
        .withMessage("Approver ID is required")
        .isNumeric()
        .withMessage("Approver ID must be numeric"),
    ];
  }

  // Get validation rules for activating approver
  static getActivateApproverValidation() {
    const { body } = require("express-validator");
    return [
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
      body("guardianPhone")
        .notEmpty()
        .withMessage("Guardian phone is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid guardian phone format"),
      body("approverId")
        .notEmpty()
        .withMessage("Approver ID is required")
        .isNumeric()
        .withMessage("Approver ID must be numeric"),
    ];
  }

  // Get validation rules for updating approver
  static getUpdateApproverValidation() {
    const { body } = require("express-validator");
    return [
      body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isNumeric()
        .withMessage("Tenant ID must be numeric"),
      body("name")
        .notEmpty()
        .withMessage("Name is required")
        .trim()
        .isLength({ min: 2, max: 250 })
        .withMessage("Name must be between 2 and 250 characters"),
      body("relation")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Relation must not exceed 100 characters"),
      body("phoneNumber")
        .optional()
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number format"),
      // Note: photo is now handled as file upload via multer middleware
    ];
  }

  // Get validation rules for direct student checkout
  static getDirectCheckoutValidation() {
    const { body } = require("express-validator");
    return [
      body("dayboardingId")
        .notEmpty()
        .withMessage("Dayboarding ID is required")
        .isNumeric()
        .withMessage("Dayboarding ID must be numeric"),
      body("approverId")
        .notEmpty()
        .withMessage("Approver ID is required")
        .isNumeric()
        .withMessage("Approver ID must be numeric"),
      body("remarks")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Remarks must not exceed 500 characters"),
    ];
  }
}

module.exports = StudentDayBoardingController;
