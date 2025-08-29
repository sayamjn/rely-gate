const StudentDayBoardingModel = require("../models/studentDayBoarding.model");
const OTPModel = require("../models/otp.model");
const QRService = require("./qr.service");
const responseUtils = require("../utils/constants");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const SMSUtil = require("../utils/sms");

class StudentDayBoardingService {
  // ================================================================================
  // BULK UPLOAD METHODS
  // ================================================================================

  // Process CSV bulk upload
  static async processBulkUpload(tenantId, filePath, createdBy) {
    try {
      const csvData = await this._parseCSV(filePath);

      // Validate CSV structure
      const validation = this._validateCSVData(csvData);
      if (!validation.valid) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: validation.message,
          data: validation.errors,
        };
      }

      // Process students data
      const studentsData = csvData.map((row) => ({
        studentId: row.StudentID || row.studentid || row.student_id,
        studentName: row.StudentName || row.studentname || row.student_name,
        course: row.Course || row.course,
        section: row.Section || row.section,
        year: row.Year || row.year,
        primaryGuardianName:
          row.PrimaryGuardianName ||
          row.primaryguardianname ||
          row.guardian_name,
        primaryGuardianPhone:
          row.PrimaryGuardianPhone ||
          row.primaryguardianphone ||
          row.guardian_phone,
        guardianRelation:
          row.GuardianRelation ||
          row.guardianrelation ||
          row.relation ||
          "Guardian",
      }));

      // Bulk insert students
      const results = await StudentDayBoardingModel.bulkInsertStudents(
        studentsData,
        tenantId,
        createdBy
      );

      // Generate summary
      const summary = this._generateUploadSummary(results);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Bulk upload completed successfully",
        data: {
          summary,
          details: results,
        },
      };
    } catch (error) {
      console.error("Error in bulk upload:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to process bulk upload",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Add single student
  static async addSingleStudent(tenantId, studentData, createdBy) {
    try {
      // Validate required fields
      const requiredFields = [
        "studentId",
        "studentName",
        "primaryGuardianName",
        "primaryGuardianPhone",
      ];
      const missingFields = requiredFields.filter(
        (field) => !studentData[field] || studentData[field].trim() === ""
      );

      if (missingFields.length > 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: `Missing required fields: ${missingFields.join(
            ", "
          )}`,
        };
      }

      // Validate phone number format
      const phoneRegex = /^\d{10}$/;
      if (
        !phoneRegex.test(studentData.primaryGuardianPhone.replace(/\D/g, ""))
      ) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage:
            "Invalid phone number format. Please provide a 10-digit phone number.",
        };
      }

      const result = await StudentDayBoardingModel.insertSingleStudent(
        studentData,
        tenantId,
        createdBy
      );

      if (!result.success) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: result.message,
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Student added successfully",
        data: result.data,
      };
    } catch (error) {
      console.error("Error adding student:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to add student",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get students with filters and pagination
  static async getStudents(tenantId, filters = {}) {
    try {
      const students = await StudentDayBoardingModel.getStudentsWithFilters(
        tenantId,
        filters
      );

      // Get total count and pagination info
      const totalCount =
        students.length > 0 ? parseInt(students[0].total_count) : 0;
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Map to response format
      const mapped = students.map((s) => ({
        StudentDayBoardingID: s.studentdayboardingid,
        StudentID: s.studentid,
        StudentName: s.studentname,
        Course: s.course,
        Section: s.section,
        Year: s.year,
        PrimaryGuardianName: s.primaryguardianname,
        PrimaryGuardianPhone: s.primaryguardianphone,
        GuardianRelation: s.guardianrelation,
        VisitorCatID: s.visitorcatid || 7,
        VisitorCatName: s.visitorcatname || "Day Boarding Student",
        StudentPhotoFlag: s.studentphotoflag === "Y",
        StudentPhotoPath: s.studentphotopath,
        StudentPhotoName: s.studentphotoname,
        HasPhoto: s.studentphotoflag === "Y" && s.studentphotopath,
        // New approver status fields
        HasActiveApprovers: s.hasactiveapprovers === "Y",
        ActiveApproversCount: parseInt(s.activeapproverscount) || 0,
        TotalApproversCount: parseInt(s.totalapproverscount) || 0,
        ApproverStatus: s.hasactiveapprovers === "Y" ? "ACTIVE" : "INACTIVE",
        CanCheckout: s.hasactiveapprovers === "Y", // Student can only checkout if has active approvers
        QREnabled: s.hasactiveapprovers === "Y", // QR generation only available if has active approvers
        CheckOutTime: s.todaycheckouttime || null,
        CreatedDate: s.createddate,
        CreatedBy: s.createdby,
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Students retrieved successfully",
        data: mapped,
        count: mapped.length,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalRecords: totalCount,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching students:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch students",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Generate QR code for student
  static async generateStudentQR(tenantId, studentDayBoardingId, updatedBy) {
    try {
      const student = await StudentDayBoardingModel.getStudentById(
        studentDayBoardingId,
        tenantId
      );

      if (!student) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        };
      }

      // Generate QR data with only dayboardingId and studentId
      const qrData = {
        dayboardingId: studentDayBoardingId,
        studentId: student.studentid,
      };

      // Generate QR code
      const qrResult = await QRService.generateQRCode(qrData);

      if (!qrResult.success) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Failed to generate QR code",
          error: qrResult.error,
        };
      }

      // Save QR code file
      const qrFileName = `student_dayboard_qr_${studentDayBoardingId}_${Date.now()}.png`;
      const qrPath = path.join("uploads", "qr_codes", qrFileName);
      const fullPath = path.join(process.cwd(), qrPath);

      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Convert base64 to file
      const qrBuffer = Buffer.from(qrResult.qrBase64, "base64");
      fs.writeFileSync(fullPath, qrBuffer);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "QR code generated successfully",
        data: {
          qrPath,
          qrFileName,
          qrData,
          qrBase64: qrResult.qrBase64,
        },
      };
    } catch (error) {
      console.error("Error generating QR code:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to generate QR code",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // ================================================================================
  // GUARDIAN AUTH MASTER METHODS
  // ================================================================================

  // Verify guardian phone and send OTP
  static async verifyGuardianPhone(tenantId, phoneNumber, createdBy) {
    try {
      // First check if phone exists in AuthMaster table
      let guardian = await StudentDayBoardingModel.getGuardianByPhone(
        tenantId,
        phoneNumber
      );

      // If not found in AuthMaster, check if it's a primary guardian phone
      if (!guardian) {
        const primaryGuardian =
          await StudentDayBoardingModel.getPrimaryGuardianByPhone(
            tenantId,
            phoneNumber
          );

        if (primaryGuardian) {
          // Create a virtual guardian object for primary guardian
          guardian = {
            authmasterid: null, // No AuthMasterID for primary guardian
            name: primaryGuardian.primaryguardianname,
            relation: primaryGuardian.guardianrelation,
            phonenumber: primaryGuardian.primaryguardianphone,
            isPrimaryGuardian: true,
          };
        }
      }

      if (!guardian) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "This phone number is not registered.",
        };
      }

      // Generate OTP
      const otpResult = await OTPModel.generateOTP(
        tenantId,
        phoneNumber,
        createdBy
      );

      // Send actual SMS with OTP
      const smsResult = await SMSUtil.sendOTPSMS(
        phoneNumber,
        otpResult.otpNumber
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "OTP sent successfully",
        data: {
          authMasterId: guardian.authmasterid,
          name: guardian.name,
          relation: guardian.relation,
          isPrimaryGuardian: guardian.isPrimaryGuardian || false,
          otpRef: otpResult.refId,
          smsSent: smsResult.success,
          smsMessage: smsResult.message,
          // Don't send OTP in production
          // ...(process.env.NODE_ENV === 'development' && { otp: otpResult.otpNumber })
        },
      };
    } catch (error) {
      console.error("Error verifying guardian phone:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to verify phone number",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Verify OTP
  static async verifyOTP(otpRef, otpNumber, phoneNumber, tenantId) {
    try {
      // Use the new verification method that matches the generation method
      const verification = await OTPModel.verifyOTPByPhoneAndCode(
        tenantId,
        phoneNumber,
        otpNumber
      );

      if (!verification.verified) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid or expired OTP",
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "OTP verified successfully",
        data: {
          verified: true,
          tenantId: verification.tenantId,
        },
      };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to verify OTP",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get students linked to guardian
  static async getGuardianStudents(tenantId, authMasterId) {
    try {
      const students = await StudentDayBoardingModel.getStudentsByGuardian(
        tenantId,
        authMasterId
      );

      const mapped = students.map((s) => ({
        StudentDayBoardingID: s.studentdayboardingid,
        StudentID: s.studentid,
        StudentName: s.studentname,
        Course: s.course,
        Section: s.section,
        Year: s.year,
        Relation: s.relation,
        PhotoFlag: s.photoflag === "Y",
        PhotoPath: s.photopath,
        PhotoName: s.photoname,
        LinkActive: s.linkactive === "Y",
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Students retrieved successfully",
        data: mapped,
        count: mapped.length,
      };
    } catch (error) {
      console.error("Error fetching guardian students:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch students",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Add guardian to auth master
  static async addGuardian(tenantId, guardianData, createdBy) {
    try {
      // Validate that studentDayBoardingId is provided
      if (!guardianData.studentDayBoardingId) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student Day Boarding ID is required",
        };
      }

      // Verify that the student exists
      const student = await StudentDayBoardingModel.getStudentById(
        guardianData.studentDayBoardingId,
        tenantId
      );
      if (!student) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        };
      }

      const result = await StudentDayBoardingModel.addGuardianAuth(
        tenantId,
        guardianData,
        createdBy
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Guardian added successfully",
        data: result,
      };
    } catch (error) {
      console.error("Error adding guardian:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to add guardian",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // ================================================================================
  // STUDENT-GUARDIAN LINKING METHODS
  // ================================================================================

  // Link student to guardian
  static async linkStudentToGuardian(tenantId, linkData, createdBy) {
    try {
      // Check if link already exists
      const linkExists = await StudentDayBoardingModel.checkStudentGuardianLink(
        tenantId,
        linkData.studentDayBoardingId,
        linkData.authMasterId
      );

      if (linkExists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student is already linked to this guardian",
        };
      }

      const result = await StudentDayBoardingModel.linkStudentToGuardian(
        tenantId,
        linkData,
        createdBy
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Student linked to guardian successfully",
        data: result,
      };
    } catch (error) {
      console.error("Error linking student to guardian:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to link student to guardian",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Inactivate student-guardian link
  static async inactivateLink(tenantId, linkId, updatedBy) {
    try {
      const result =
        await StudentDayBoardingModel.inactivateStudentGuardianLink(
          linkId,
          tenantId,
          updatedBy
        );

      if (!result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Link not found",
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Link inactivated successfully",
      };
    } catch (error) {
      console.error("Error inactivating link:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to inactivate link",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // ================================================================================
  // CHECKOUT METHODS
  // ================================================================================

  // Process student checkout via QR scan
  static async processCheckout(
    tenantId,
    dayboardingId,
    approverId,
    remarks,
    createdBy
  ) {
    try {
      // Get student by dayboarding ID
      const student = await StudentDayBoardingModel.getStudentById(
        dayboardingId,
        tenantId
      );

      if (!student) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        };
      }

      // Get approver info by approver ID
      const approver = await StudentDayBoardingModel.getApproverById(
        tenantId,
        approverId
      );

      if (!approver) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Approver not found",
        };
      }

      // Check if approver is linked to this student
      const linkExists = await StudentDayBoardingModel.checkStudentGuardianLink(
        tenantId,
        dayboardingId,
        approverId
      );

      if (!linkExists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Approver is not authorized to pick up this student",
        };
      }

      // Create checkout record
      const checkoutData = {
        studentDayBoardingId: dayboardingId,
        authMasterId: approverId,
        studentId: student.studentid,
        studentName: student.studentname,
        guardianName: approver.name,
        guardianPhone: approver.phonenumber,
        relation: approver.relation,
        status: "PENDING_OTP",
        remarks: remarks || null,
      };

      const checkoutResult = await StudentDayBoardingModel.createCheckoutRecord(
        tenantId,
        checkoutData,
        createdBy
      );

      // Generate and send OTP to primary guardian
      const otpResult = await OTPModel.generateOTP(
        tenantId,
        student.primaryguardianphone,
        createdBy
      );

      // Update checkout record with OTP info
      await StudentDayBoardingModel.updateCheckoutOTP(
        checkoutResult.historyid,
        tenantId,
        {
          sent: "Y",
          number: otpResult.otpNumber,
          sentTime: new Date(),
          verified: "N",
        },
        createdBy
      );

      // Send actual SMS with OTP
      const smsResult = await SMSUtil.sendOTPSMS(
        student.primaryguardianphone,
        otpResult.otpNumber
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "OTP sent to primary guardian phone",
        data: {
          historyId: checkoutResult.historyid,
          studentName: student.studentname,
          guardianName: approver.name,
          primaryGuardianPhone: student.primaryguardianphone,
          otpRef: otpResult.refId,
          smsSent: smsResult.success,
          smsMessage: smsResult.message,
          // Don't send OTP in production
          ...(process.env.NODE_ENV === "development" && {
            otp: otpResult.otpNumber,
          }),
        },
      };
    } catch (error) {
      console.error("Error processing checkout:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to process checkout",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Complete checkout after OTP verification
  static async completeCheckout(
    tenantId,
    historyId,
    otpRef,
    otpNumber,
    primaryGuardianPhone,
    updatedBy
  ) {
    try {
      // Verify OTP
      const verification = await OTPModel.verifyOTP(
        otpRef,
        otpNumber,
        primaryGuardianPhone
      );

      if (!verification.verified) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid or expired OTP",
        };
      }

      // Update checkout record
      await StudentDayBoardingModel.updateCheckoutOTP(
        historyId,
        tenantId,
        {
          verified: "Y",
          verifiedTime: new Date(),
        },
        updatedBy
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Student checkout completed successfully",
      };
    } catch (error) {
      console.error("Error completing checkout:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to complete checkout",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get checkout history
  static async getCheckoutHistory(tenantId, filters = {}) {
    try {
      const history = await StudentDayBoardingModel.getCheckoutHistory(
        tenantId,
        filters
      );

      // Get pagination info
      const totalCount =
        history.length > 0 ? parseInt(history[0].total_count) : 0;
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Map to response format
      const mapped = history.map((h) => ({
        HistoryID: h.historyid,
        StudentID: h.studentid,
        StudentName: h.studentname,
        Course: h.course,
        Section: h.section,
        Year: h.year,
        GuardianName: h.guardianname,
        GuardianPhone: h.guardianphone,
        Relation: h.relation,
        GuardianPhotoFlag: h.guardianphotoflag || "N",
        GuardianPhotoPath: h.guardianphotopath || null,
        GuardianPhotoName: h.guardianphotoname || null,
        CheckoutByUserName: h.checkoutbyusername || null,
        CheckoutByUserID: h.createdby || null,
        VisitorCatID: h.visitorcatid || 7,
        VisitorCatName: h.visitorcatname || "Day Boarding Student",
        CheckInTime: h.checkintime,
        CheckInTimeTxt: h.checkintimetxt,
        CheckOutTime: h.checkouttime,
        CheckOutTimeTxt: h.checkouttimetxt,
        OTPSent: h.otpsent === "Y",
        OTPVerified: h.otpverified === "Y",
        Status: h.status,
        Remarks: h.remarks,
        CreatedDate: h.createddate,
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Checkout history retrieved successfully",
        data: mapped,
        count: mapped.length,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalRecords: totalCount,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching checkout history:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch checkout history",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // ================================================================================
  // UTILITY METHODS
  // ================================================================================

  // Get filter dropdown data
  static async getFilterData(tenantId) {
    try {
      const [courses, sections, years] = await Promise.all([
        StudentDayBoardingModel.getCourses(tenantId),
        StudentDayBoardingModel.getSections(tenantId),
        StudentDayBoardingModel.getYears(tenantId),
      ]);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Filter data retrieved successfully",
        data: {
          courses: courses.map((c) => c.course),
          sections: sections.map((s) => s.section),
          years: years.map((y) => y.year),
        },
      };
    } catch (error) {
      console.error("Error fetching filter data:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch filter data",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get student courses
  static async getStudentCourses(tenantId) {
    try {
      const courses = await StudentDayBoardingModel.getCourses(tenantId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Student courses retrieved successfully",
        data: courses.map((c) => c.course),
        count: courses.length,
      };
    } catch (error) {
      console.error("Error fetching student courses:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch student courses",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Direct student checkout (no OTP required)
  static async directStudentCheckout(
    tenantId,
    dayboardingId,
    approverId,
    remarks = null,
    createdBy = "system"
  ) {
    try {
      // Get student by dayboarding ID
      const student = await StudentDayBoardingModel.getStudentById(
        dayboardingId,
        tenantId
      );
      if (!student) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        };
      }

      // Get approver info by approver ID
      const approver = await StudentDayBoardingModel.getApproverById(
        tenantId,
        approverId
      );
      if (!approver) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Approver not found",
        };
      }

      // Check if approver is linked to this student
      const linkExists = await StudentDayBoardingModel.checkStudentGuardianLink(
        tenantId,
        dayboardingId,
        approverId
      );
      if (!linkExists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Approver is not authorized to pick up this student",
        };
      }

      // Create checkout record with COMPLETED status
      const checkoutData = {
        studentDayBoardingId: dayboardingId,
        authMasterId: approverId,
        studentId: student.studentid,
        studentName: student.studentname,
        guardianName: approver.name,
        guardianPhone: approver.phonenumber,
        relation: approver.relation,
        status: "CHECKED_OUT",
        remarks: remarks || null,
      };

      const checkoutResult = await StudentDayBoardingModel.createCheckoutRecord(
        tenantId,
        checkoutData,
        createdBy
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Student checked out successfully",
        data: {
          historyId: checkoutResult.historyid,
          studentId: student.studentid,
          studentName: student.studentname,
          approverId: approver.authmasterid,
          approverName: approver.name,
          approverPhone: approver.phonenumber,
          relation: approver.relation,
          checkoutTime: checkoutResult.checkouttime,
          checkoutTimeTxt: checkoutResult.checkouttimetxt,
          status: "CHECKED_OUT",
          remarks: remarks,
        },
      };
    } catch (error) {
      console.error("Error in direct student checkout:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to checkout student",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // ================================================================================
  // NEW ENHANCED API METHODS
  // ================================================================================

  // 1. Get all tenant lists
  static async getAllTenants() {
    try {
      const tenants = await StudentDayBoardingModel.getAllTenants();

      const mapped = tenants.map((t) => ({
        tenantId: t.tenantid,
        tenantName: t.tenantname,
        tenantCode: t.tenantcode,
        isActive: t.isactive,
        countryCode: t.countrycode,
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Tenants retrieved successfully",
        data: {
          tenants: mapped,
        },
      };
    } catch (error) {
      console.error("Error fetching tenants:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch tenants",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // 2. Check guardian eligibility and send OTP
  static async checkGuardianEligibility(tenantId, guardianPhone, createdBy) {
    try {
      // Check if guardian has students in the tenant
      const students =
        await StudentDayBoardingModel.getStudentsByPrimaryGuardianPhone(
          tenantId,
          guardianPhone
        );

      if (!students || students.length === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "No students found for this guardian",
        };
      }

      // Generate OTP since guardian is eligible
      const otpResult = await OTPModel.generateOTP(
        tenantId,
        guardianPhone,
        createdBy
      );

      // Send actual SMS with OTP
      const smsResult = await SMSUtil.sendOTPSMS(
        guardianPhone,
        otpResult.otpNumber
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "OTP sent successfully",
        data: {
          eligible: true,
          otpSent: true,
          otpRef: otpResult.refId,
          smsSent: smsResult.success,
          smsMessage: smsResult.message,
          // Don't send OTP in production
          ...(process.env.NODE_ENV === "development" && {
            otp: otpResult.otpNumber,
          }),
        },
      };
    } catch (error) {
      console.error("Error checking guardian eligibility:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to check guardian eligibility",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // 3. Verify OTP (enhanced version)
  static async verifyOTPNew(tenantId, guardianPhone, otp) {
    try {
      const verification = await OTPModel.verifyOTPByPhoneAndCode(
        tenantId,
        guardianPhone,
        otp
      );

      if (!verification.verified) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid or expired OTP",
        };
      }

      // Get guardian auth master info if available
      const guardian = await StudentDayBoardingModel.getGuardianByPhone(
        tenantId,
        guardianPhone
      );

      // If no guardian found in auth master, check if it's a primary guardian
      let guardianName = null;
      let guardianRelation = null;

      if (guardian) {
        guardianName = guardian.name;
        guardianRelation = guardian.relation;
      } else {
        // Check if this is a primary guardian
        const primaryGuardian =
          await StudentDayBoardingModel.getPrimaryGuardianByPhone(
            tenantId,
            guardianPhone
          );
        if (primaryGuardian) {
          guardianName = primaryGuardian.primaryguardianname;
          guardianRelation = primaryGuardian.guardianrelation;
        }
      }

      // Get student count for this guardian
      const students =
        await StudentDayBoardingModel.getStudentsByPrimaryGuardianPhone(
          tenantId,
          guardianPhone
        );
      const studentCount = students ? students.length : 0;

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "OTP verified successfully",
        data: {
          verified: true,
          sessionToken: "abc123", // You can implement proper session token generation
          authMasterId: guardian ? guardian.authmasterid : null,
          name: guardianName,
          relation: guardianRelation,
          phoneNumber: guardian ? guardian.phonenumber : guardianPhone,
          tenantId: verification.tenantId,
          studentCount: studentCount,
          // dashboardUrl: `/guardian-dashboard/${tenantId}/${guardianPhone}`,
        },
      };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to verify OTP",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // 4. Get students by guardian phone
  static async getStudentsByGuardianPhone(tenantId, guardianPhone) {
    try {
      const students =
        await StudentDayBoardingModel.getStudentsByPrimaryGuardianPhone(
          tenantId,
          guardianPhone
        );

      const mapped = students.map((s) => ({
        StudentDayBoardingID: s.studentdayboardingid,
        StudentID: s.studentid,
        StudentName: s.studentname,
        Course: s.course,
        Section: s.section,
        Year: s.year,
        PrimaryGuardianName: s.primaryguardianname,
        PrimaryGuardianPhone: s.primaryguardianphone,
        GuardianRelation: s.guardianrelation,
        StudentPhotoFlag: s.studentphotoflag === "Y",
        StudentPhotoPath: s.studentphotopath,
        StudentPhotoName: s.studentphotoname,
        HasPhoto: s.studentphotoflag === "Y" && s.studentphotopath,
        // New approver status fields
        HasActiveApprovers: s.hasactiveapprovers === "Y",
        ActiveApproversCount: parseInt(s.activeapproverscount) || 0,
        TotalApproversCount: parseInt(s.totalapproverscount) || 0,
        ApproverStatus: s.hasactiveapprovers === "Y" ? "ACTIVE" : "INACTIVE",
        CanCheckout: s.hasactiveapprovers === "Y",
        QREnabled: s.hasactiveapprovers === "Y",
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Students retrieved successfully",
        data: mapped,
        count: mapped.length,
      };
    } catch (error) {
      console.error("Error fetching students by guardian phone:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch students",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // 5. Get authorized list by guardian phone
  static async getAuthorizedList(tenantId, guardianPhone) {
    try {
      const authorizedList =
        await StudentDayBoardingModel.getAuthorizedListByGuardianPhone(
          tenantId,
          guardianPhone
        );

      const mapped = authorizedList.map((a) => ({
        LinkID: a.linkid,
        StudentDayBoardingID: a.studentdayboardingid,
        StudentID: a.studentid,
        Relation: a.relation,
        IsActive: a.isactive === "Y",
        AuthMasterID: a.authmasterid,
        Name: a.guardianname,
        PhoneNumber: a.guardianphone,
        PhotoFlag: a.guardianphotoflag === "Y",
        PhotoPath: a.guardianphotopath,
        PhotoName: a.guardianphotoname,
        HasPhoto: a.guardianphotoflag === "Y" && a.guardianphotopath,
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Authorized list retrieved successfully",
        data: mapped,
        count: mapped.length,
      };
    } catch (error) {
      console.error("Error fetching authorized list:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch authorized list",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // 6. Get active approvers by student ID
  static async getActiveApprovers(tenantId, studentId) {
    try {
      const approvers =
        await StudentDayBoardingModel.getAllApproversByStudentId(
          tenantId,
          studentId
        );

      const mapped = approvers.map((a) => ({
        LinkID: a.linkid,
        AuthMasterID: a.authmasterid,
        StudentDayBoardingID: a.studentdayboardingid,
        Name: a.name,
        PhoneNumber: a.phonenumber,
        Relation: a.relation,
        PhotoFlag: a.photoflag === "Y",
        PhotoPath: a.photopath,
        PhotoName: a.photoname,
        IsActive: a.isactive === "Y",
        CanActivate: a.isactive === "N", // UI flag for activate button
        CanDeactivate: a.isactive === "Y", // UI flag for deactivate button
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Approvers retrieved successfully",
        data: mapped,
        count: mapped.length,
      };
    } catch (error) {
      console.error("Error fetching approvers:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch approvers",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get approver list by studentdayboardingId
  static async getApproverListByDayboardingId(tenantId, studentDayBoardingId) {
    try {
      const [approvers, studentDetail] = await Promise.all([
        StudentDayBoardingModel.getApproversByDayboardingId(
          tenantId,
          studentDayBoardingId
        ),
        StudentDayBoardingModel.getStudentByDayBoardingId(
          tenantId,
          studentDayBoardingId
        ),
      ]);

      if (!studentDetail) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        };
      }

      const approverList = approvers.map((approver) => ({
        id: approver.authmasterid,
        name: approver.name,
        photo: approver.photopath,
        relation: approver.relation,
      }));

      const studentInfo = {
        StudentDayBoardingID: studentDetail.studentdayboardingid,
        StudentID: studentDetail.studentid,
        StudentName: studentDetail.studentname,
        Course: studentDetail.course,
        Section: studentDetail.section,
        Year: studentDetail.year,
        PrimaryGuardianName: studentDetail.primaryguardianname,
        PrimaryGuardianPhone: studentDetail.primaryguardianphone,
        GuardianRelation: studentDetail.guardianrelation,
        VisitorCatID: studentDetail.visitorcatid,
        VisitorCatName: studentDetail.visitorcatname,
        CreatedDate: studentDetail.createddate,
        CreatedBy: studentDetail.createdby,
      };

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Approver list retrieved successfully",
        data: {
          studentDetail: studentInfo,
          approvers: approverList,
        },
      };
    } catch (error) {
      console.error("Error fetching approver list:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch approver list",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // 7. Link multiple students to guardian
  static async linkStudentsToGuardian(linkData, createdBy) {
    try {
      const {
        tenantId,
        primaryGuardianPhone,
        studentIds,
        name,
        phoneNumber,
        relation,
        photo,
        photoName,
      } = linkData;

      // Validate required fields
      if (
        !tenantId ||
        !primaryGuardianPhone ||
        !studentIds ||
        studentIds.length === 0
      ) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage:
            "Missing required fields: tenantId, primaryGuardianPhone, or studentIds",
        };
      }

      const results = await StudentDayBoardingModel.bulkLinkStudentsToGuardian(
        {
          tenantId,
          primaryGuardianPhone,
          studentIds,
          name: name || "Guardian",
          phoneNumber: phoneNumber || primaryGuardianPhone,
          relation: relation || "Guardian",
          photoFlag: photo ? "Y" : "N",
          photoPath: photo || null,
          photoName: photoName || null,
        },
        createdBy
      );

      const summary = {
        total: studentIds.length,
        successful: results.filter((r) => r.status === "SUCCESS").length,
        errors: results.filter((r) => r.status === "ERROR").length,
        duplicates: results.filter((r) => r.status === "DUPLICATE").length,
      };

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Students linked successfully",
        data: {
          success: true,
          authMasterId:
            results.length > 0
              ? results.find((r) => r.status === "SUCCESS")?.authMasterId
              : null,
          insertedCount: summary.successful,
          summary,
          details: results,
        },
      };
    } catch (error) {
      console.error("Error linking students to guardian:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to link students to guardian",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // 8. Deactivate approver for all students
  static async deactivateApprover(
    tenantId,
    guardianPhone,
    approverId,
    updatedBy
  ) {
    try {
      const result = await StudentDayBoardingModel.deactivateApprover(
        tenantId,
        guardianPhone,
        approverId,
        updatedBy
      );

      if (!result || result.length === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Approver not found or already inactive",
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: `Approver deactivated successfully for ${result.length} student(s)`,
        data: {
          success: true,
          affectedStudents: result.length,
          studentIds: result.map((r) => r.studentid),
        },
      };
    } catch (error) {
      console.error("Error deactivating approver:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to deactivate approver",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // 9. Activate approver for all students
  static async activateApprover(
    tenantId,
    guardianPhone,
    approverId,
    updatedBy
  ) {
    try {
      const result = await StudentDayBoardingModel.activateApprover(
        tenantId,
        guardianPhone,
        approverId,
        updatedBy
      );

      if (!result || result.length === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Approver not found or already active",
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: `Approver activated successfully for ${result.length} student(s)`,
        data: {
          success: true,
          affectedStudents: result.length,
          studentIds: result.map((r) => r.studentid),
        },
      };
    } catch (error) {
      console.error("Error activating approver:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to activate approver",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // 10. Update approver details
  static async updateApprover(tenantId, approverId, approverData, updatedBy) {
    try {
      const result = await StudentDayBoardingModel.updateApprover(
        tenantId,
        approverId,
        approverData,
        updatedBy
      );

      if (!result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Approver not found",
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Approver updated successfully",
        data: {
          success: true,
          approver: {
            AuthMasterID: result.authmasterid,
            Name: result.name,
            PhoneNumber: result.phonenumber,
            Relation: result.relation,
            PhotoFlag: result.photoflag === "Y",
            PhotoPath: result.photopath,
            PhotoName: result.photoname,
          },
        },
      };
    } catch (error) {
      console.error("Error updating approver:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to update approver",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // ================================================================================
  // GUARDIAN MANAGEMENT METHODS
  // ================================================================================

  // Get all guardians with pagination and filters
  static async getAllGuardians(tenantId, filters = {}) {
    try {
      const guardians = await StudentDayBoardingModel.getAllGuardians(
        tenantId,
        filters
      );

      // Get pagination info
      const totalCount =
        guardians.length > 0 ? parseInt(guardians[0].total_count) : 0;
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Map to response format
      const mapped = guardians.map((g) => ({
        AuthMasterID: g.authmasterid,
        Name: g.name,
        PhoneNumber: g.phonenumber,
        Relation: g.relation,
        PhotoFlag: g.photoflag === "Y",
        PhotoPath: g.photopath,
        PhotoName: g.photoname,
        HasPhoto: g.photoflag === "Y" && g.photopath,
        IsActive: g.isactive === "Y",
        LinkedStudentsCount: parseInt(g.linkedstudentscount) || 0,
        StudentIDs: g.studentids || [],
        // StudentNames: g.studentnames || [],
        // Students: (g.studentids || []).map((studentId, index) => ({
        //   StudentID: studentId,
        //   StudentName: (g.studentnames || [])[index] || null,
        // })),
        CreatedDate: g.createddate,
        UpdatedDate: g.updateddate,
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Guardians retrieved successfully",
        data: mapped,
        count: mapped.length,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalRecords: totalCount,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching guardians:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch guardians",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get guardian details by ID
  static async getGuardianById(tenantId, authMasterId) {
    try {
      const guardian = await StudentDayBoardingModel.getGuardianById(
        tenantId,
        authMasterId
      );

      if (!guardian) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Guardian not found",
        };
      }

      // Get linked students
      const linkedStudents =
        await StudentDayBoardingModel.getStudentsByGuardian(
          tenantId,
          authMasterId
        );

      const mapped = {
        AuthMasterID: guardian.authmasterid,
        Name: guardian.name,
        PhoneNumber: guardian.phonenumber,
        Relation: guardian.relation,
        PhotoFlag: guardian.photoflag === "Y",
        PhotoPath: guardian.photopath,
        PhotoName: guardian.photoname,
        HasPhoto: guardian.photoflag === "Y" && guardian.photopath,
        IsActive: guardian.isactive === "Y",
        CreatedDate: guardian.createddate,
        UpdatedDate: guardian.updateddate,
        LinkedStudents: linkedStudents.map((s) => ({
          StudentDayBoardingID: s.studentdayboardingid,
          StudentID: s.studentid,
          StudentName: s.studentname,
          Course: s.course,
          Section: s.section,
          Year: s.year,
          Relation: s.relation,
          LinkActive: s.linkactive === "Y",
        })),
      };

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Guardian details retrieved successfully",
        data: mapped,
      };
    } catch (error) {
      console.error("Error fetching guardian details:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch guardian details",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get authorized guardians by primary guardian phone
  static async getAuthorizedGuardiansByPrimaryPhone(
    tenantId,
    primaryGuardianPhone,
    filters = {}
  ) {
    try {
      const guardians =
        await StudentDayBoardingModel.getAuthorizedGuardiansByPrimaryPhone(
          tenantId,
          primaryGuardianPhone,
          filters
        );

      // Get pagination info
      const totalCount =
        guardians.length > 0 ? parseInt(guardians[0].total_count) : 0;
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Map to response format
      const mapped = guardians.map((g) => ({
        AuthMasterID: g.authmasterid,
        Name: g.name,
        PhoneNumber: g.phonenumber,
        Relation: g.relation,
        PhotoFlag: g.photoflag === "Y",
        PhotoPath: g.photopath,
        PhotoName: g.photoname,
        HasPhoto: g.photoflag,
        IsActive: g.hasactivelinks === "Y", // Use HasActiveLinks instead of AuthMaster IsActive
        AuthMasterActive: g.isactive === "Y", // Keep original AuthMaster status for reference
        LinkedStudentsCount: parseInt(g.linkedstudentscount) || 0,
        StudentIDs: g.studentids || [],
        CreatedDate: g.createddate,
        UpdatedDate: g.updateddate,
        CanActivate: g.hasactivelinks === "N", // Can activate if no active links
        CanDeactivate: g.hasactivelinks === "Y", // Can deactivate if has active links
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Authorized guardians retrieved successfully",
        data: mapped,
        count: mapped.length,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalRecords: totalCount,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching authorized guardians:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch authorized guardians",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Guardian Authentication Dashboard - Complete flow
  static async getGuardianDashboard(tenantId, guardianPhone) {
    try {
      const dashboardData = await StudentDayBoardingModel.getGuardianDashboard(
        tenantId,
        guardianPhone
      );

      if (!dashboardData || dashboardData.length === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "No students found for this guardian",
        };
      }

      // Map to response format
      const mapped = dashboardData.map((s) => ({
        StudentDayBoardingID: s.studentdayboardingid,
        StudentID: s.studentid,
        StudentName: s.studentname,
        Course: s.course,
        Section: s.section,
        Year: s.year,
        PrimaryGuardianName: s.primaryguardianname,
        PrimaryGuardianPhone: s.primaryguardianphone,
        GuardianRelation: s.guardianrelation,
        StudentPhoto: {
          PhotoFlag: s.studentphotoflag === "Y",
          PhotoPath: s.studentphotopath,
          PhotoName: s.studentphotoname,
          HasPhoto: s.studentphotoflag === "Y" && s.studentphotopath,
        },
        Approvers: s.approvers || [],
        ApproversCount: (s.approvers || []).length,
        ActiveApproversCount: (s.approvers || []).filter(
          (a) => a.IsActive === "Y"
        ).length,
      }));

      // Get guardian summary
      const totalStudents = mapped.length;
      const totalApprovers = mapped.reduce(
        (sum, student) => sum + student.ApproversCount,
        0
      );
      const totalActiveApprovers = mapped.reduce(
        (sum, student) => sum + student.ActiveApproversCount,
        0
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Guardian dashboard retrieved successfully",
        data: {
          guardian: {
            name: mapped[0]?.PrimaryGuardianName,
            phone: guardianPhone,
            tenantId: tenantId,
          },
          summary: {
            totalStudents,
            totalApprovers,
            totalActiveApprovers,
          },
          students: mapped,
        },
      };
    } catch (error) {
      console.error("Error fetching guardian dashboard:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch guardian dashboard",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get students with detailed approver information
  static async getStudentsWithApproverDetails(tenantId, filters = {}) {
    try {
      const students =
        await StudentDayBoardingModel.getStudentsWithApproverDetails(
          tenantId,
          filters
        );

      // Get total count and pagination info
      const totalCount =
        students.length > 0 ? parseInt(students[0].total_count) : 0;
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Map to response format
      const mapped = students.map((s) => ({
        StudentDayBoardingID: s.studentdayboardingid,
        StudentID: s.studentid,
        StudentName: s.studentname,
        Course: s.course,
        Section: s.section,
        Year: s.year,
        PrimaryGuardianName: s.primaryguardianname,
        PrimaryGuardianPhone: s.primaryguardianphone,
        GuardianRelation: s.guardianrelation,
        VisitorCatID: s.visitorcatid || 7,
        VisitorCatName: s.visitorcatname || "Day Boarding Student",
        StudentPhotoFlag: s.studentphotoflag === "Y",
        StudentPhotoPath: s.studentphotopath,
        StudentPhotoName: s.studentphotoname,
        HasPhoto: s.studentphotoflag === "Y" && s.studentphotopath,
        // Approver status fields
        HasActiveApprovers: s.hasactiveapprovers === "Y",
        ActiveApproversCount: parseInt(s.activeapproverscount) || 0,
        TotalApproversCount: parseInt(s.totalapproverscount) || 0,
        ApproverStatus: s.hasactiveapprovers === "Y" ? "ACTIVE" : "INACTIVE",
        CanCheckout: s.hasactiveapprovers === "Y",
        QREnabled: s.hasactiveapprovers === "Y",
        // Detailed approver list
        Approvers: s.approvers || [],
        CreatedDate: s.createddate,
        CreatedBy: s.createdby,
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage:
          "Students with approver details retrieved successfully",
        data: mapped,
        count: mapped.length,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalRecords: totalCount,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching students with approver details:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Failed to fetch students with approver details",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // ================================================================================
  // PRIVATE HELPER METHODS
  // ================================================================================

  // Parse CSV file
  static async _parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", reject);
    });
  }

  // Validate CSV data structure
  static _validateCSVData(csvData) {
    if (!csvData || csvData.length === 0) {
      return {
        valid: false,
        message: "CSV file is empty",
        errors: [],
      };
    }

    const requiredFields = [
      "StudentID",
      "StudentName",
      "PrimaryGuardianName",
      "PrimaryGuardianPhone",
    ];
    const errors = [];

    // Check for required columns
    const headers = Object.keys(csvData[0]);
    const missingHeaders = requiredFields.filter(
      (field) =>
        !headers.some(
          (header) =>
            header.toLowerCase().replace(/[^a-z]/g, "") ===
            field.toLowerCase().replace(/[^a-z]/g, "")
        )
    );

    if (missingHeaders.length > 0) {
      return {
        valid: false,
        message: `Missing required columns: ${missingHeaders.join(", ")}`,
        errors: [],
      };
    }

    // Validate each row
    csvData.forEach((row, index) => {
      const rowNumber = index + 1;

      // Check required fields
      requiredFields.forEach((field) => {
        const value = this._getFieldValue(row, field);
        if (!value || value.trim() === "") {
          errors.push(`Row ${rowNumber}: ${field} is required`);
        }
      });

      // Validate phone number
      const phone = this._getFieldValue(row, "PrimaryGuardianPhone");
      if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
        errors.push(`Row ${rowNumber}: Invalid phone number format`);
      }
    });

    return {
      valid: errors.length === 0,
      message:
        errors.length > 0 ? "Validation errors found" : "Validation passed",
      errors,
    };
  }

  // Get field value from CSV row (case insensitive)
  static _getFieldValue(row, fieldName) {
    const keys = Object.keys(row);
    const key = keys.find(
      (k) =>
        k.toLowerCase().replace(/[^a-z]/g, "") ===
        fieldName.toLowerCase().replace(/[^a-z]/g, "")
    );
    return key ? row[key] : null;
  }

  // Generate upload summary
  static _generateUploadSummary(results) {
    const total = results.length;
    const successful = results.filter((r) => r.status === "SUCCESS").length;
    const duplicates = results.filter((r) => r.status === "DUPLICATE").length;
    const errors = results.filter((r) => r.status === "ERROR").length;

    return {
      total,
      successful,
      duplicates,
      errors,
      successRate:
        total > 0 ? ((successful / total) * 100).toFixed(2) + "%" : "0%",
    };
  }
}

module.exports = StudentDayBoardingService;
