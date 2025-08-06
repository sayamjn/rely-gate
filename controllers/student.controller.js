const StudentService = require("../services/student.service");
const StudentModel = require("../models/student.model");
const MealService = require("../services/meal.service");
const MealRegistrationService = require("../services/mealRegistration.service");
const MealConsumptionService = require("../services/mealConsumption.service");
const QRService = require("../services/qr.service");
const FileService = require("../services/file.service");
const responseUtils = require("../utils/constants");

class StudentController {
  // GET /api/students/list - List students with filters (GET, query params)
  static async listStudents(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = "",
        purposeId = null,
        studentId = "",
        VisitorSubCatID = null,
        firstName = "",
        course = "",
        hostel = "",
        fromDate = null,
        toDate = null,
      } = req.query;

      const userTenantId = req.user.tenantId;


      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        purposeId: purposeId ? parseInt(purposeId) : null,
        studentId,
        VisitorSubCatID: VisitorSubCatID ? parseInt(VisitorSubCatID) : null,
        firstName,
        course,
        hostel,
        fromDate,
        toDate: toDate
      };

      const result = await StudentService.getStudentsWithFilters(
        userTenantId,
        filters
      );
      res.json(result);
    } catch (error) {
      console.error("Error in listStudents:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students - List students with pagination and search (kept for backward compatibility)
  static async getStudents(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = "",
        visitorSubCatId = null,
      } = req.query;

      const userTenantId = req.user.tenantId;

      const result = await StudentService.getStudents(
        userTenantId,
        parseInt(page),
        parseInt(pageSize),
        search,
        visitorSubCatId ? parseInt(visitorSubCatId) : null
      );

      // Add pagination info to response (like staff get list)
      res.json({
        responseCode: result.responseCode,
        responseMessage: result.responseMessage,
        count: result.count,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error in getStudents:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/sub-categories - List of student's sub categories
  static async getStudentSubCategories(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const result = await StudentService.getStudentSubCategories(userTenantId);
      res.json(result);
    } catch (error) {
      console.error("Error in getStudentSubCategories:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/:studentId/status - Check student's current check-in/out status
  static async getStudentStatus(req, res) {
    try {
      const { studentId } = req.params;

      const userTenantId = req.user.tenantId;

      if (!studentId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student ID is required",
        });
      }

      const result = await StudentService.getStudentStatus(
        parseInt(studentId),
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getStudentStatus:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/students/:studentId/checkout - Checkout student with purpose support
  static async checkoutStudent(req, res) {
    try {
      const { studentId } = req.params;
      const { purposeId, purposeName } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;

      if (!studentId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student ID is required",
        });
      }

      if (purposeId === -1 && (!purposeName || purposeName.trim() === "")) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose name is required when using custom purpose",
        });
      }

      const result = await StudentService.checkoutStudent(
        parseInt(studentId),
        userTenantId,
        purposeId ? parseInt(purposeId) : null,
        purposeName,
        createdBy
      );

      res.json(result);
    } catch (error) {
      console.error("Error in checkoutStudent:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/students/:studentId/checkin - Checkin student
  static async checkinStudent(req, res) {
    try {
      const { studentId } = req.params;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username;

      if (!studentId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student ID is required",
        });
      }

      const result = await StudentService.checkinStudent(
        parseInt(studentId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error("Error in checkinStudent:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/students/:studentId/history - Get student's visit history
  static async getStudentHistory(req, res) {
    try {
      const { studentId } = req.params;
      const { tenantId, limit = 10 } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await StudentService.getStudentHistory(
        parseInt(studentId),
        userTenantId,
        parseInt(limit)
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getStudentHistory:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/students/pending-checkin - Get students currently checked out (pending check-in)
  static async getPendingCheckin(req, res) {
    try {
      const userTenantId = req.user.tenantId;

      const result = await StudentService.getStudentsPendingCheckin(
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getPendingCheckin:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }
  // GET /api/students/export - Export students data
  static async exportStudents(req, res) {
    try {
      const {
        course,
        hostel,
        status,
        fromDate,
        toDate,
        format = "csv",
        tenantId,
      } = req.query;

      const userTenantId = req.user.tenantId;

      const filters = {
        course,
        hostel,
        status,
        fromDate,
        toDate,
      };

      const result = await StudentService.exportStudents(userTenantId, filters);

      if (result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS) {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="students_${
            new Date().toISOString().split("T")[0]
          }.csv"`
        );
        res.send(result.csvData);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in exportStudents:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/students/template - Download CSV template for bulk upload
  static async downloadTemplate(req, res) {
    try {
      const template = "Student_ID,Name,Mobile,Course,Hostel\n";

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="student_template.csv"'
      );
      res.send(template);
    } catch (error) {
      console.error("Error in downloadTemplate:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/students/pending-checkout - Get students currently checked in
  static async getPendingCheckout(req, res) {
    try {
      const userTenantId = req.user.tenantId;

      const result = await StudentService.getPendingCheckout(userTenantId);
      res.json(result);
    } catch (error) {
      console.error("Error in getPendingCheckout:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/students/meal-checkin - Meal check-in for students via QR code
  static async mealCheckIn(req, res) {
    try {
      const { student_id, confirmed = false } = req.body;
      const userTenantId = req.user.tenantId;
      const tenant_id = userTenantId
      // Validate required fields
      if (!student_id) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student ID is required",
        });
      }

      // Validate QR data structure
      const qrValidation = MealService.validateQRData({
        student_id,
        tenant_id,
      });
      if (!qrValidation.valid) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: qrValidation.message,
        });
      }

      // Process meal check-in
      const result = await MealService.processMealCheckIn(
        parseInt(student_id),
        tenant_id,
        confirmed
      );

      // Set appropriate HTTP status code
      const statusCode =
        result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS
          ? 200
          : 400;

      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in mealCheckIn:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/:studentId/meal-history - Get student's meal history
  static async getStudentMealHistory(req, res) {
    try {
      const { studentId } = req.params;
      const { tenantId, limit = 10 } = req.query;
      const userTenantId = req.user.tenantId;

      if (!studentId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student ID is required",
        });
      }

      const result = await MealService.getStudentMealHistory(
        parseInt(studentId),
        userTenantId,
        parseInt(limit)
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getStudentMealHistory:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-queue - Get current meal queue
  static async getCurrentMealQueue(req, res) {
    try {
      const { tenantId, mealType } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await MealService.getCurrentMealQueue(
        userTenantId,
        mealType
      );
      res.json(result);
    } catch (error) {
      console.error("Error in getCurrentMealQueue:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-statistics - Get meal statistics for date range
  static async getMealStatistics(req, res) {
    try {
      const { tenantId, fromDate, toDate } = req.query;
      const userTenantId = req.user.tenantId;

      // Helper function to convert DD/MM/YYYY to YYYY-MM-DD
      const convertDateFormat = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      };

      // Default to last 7 days if no dates provided
      let startDate, endDate;

      if (fromDate) {
        startDate = convertDateFormat(fromDate);
      } else {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      }

      if (toDate) {
        endDate = convertDateFormat(toDate);
      } else {
        endDate = new Date().toISOString().split("T")[0];
      }

      // Validate converted dates
      if ((fromDate && !startDate) || (toDate && !endDate)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid date format. Please use DD/MM/YYYY format",
        });
      }

      const result = await MealService.getMealStatistics(
        userTenantId,
        startDate,
        endDate
      );
      res.json(result);
    } catch (error) {
      console.error("Error in getMealStatistics:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/purposes - Get available purposes for students
  static async getStudentPurposes(req, res) {
    try {
      const { tenantId, purposeCatId = 2 } = req.query;
      const userTenantId = req.user.tenantId;

      const result = await StudentService.getStudentPurposes(
        userTenantId,
        parseInt(purposeCatId)
      );
      res.json(result);
    } catch (error) {
      console.error("Error in getStudentPurposes:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/students/purpose-categories - Get purpose categories
  static async getPurposeCategories(req, res) {
    try {
      const userTenantId = req.user.tenantId;

      const result = await StudentService.getPurposeCategories(userTenantId);
      res.json(result);
    } catch (error) {
      console.error("Error in getPurposeCategories:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/students/purposes - Add new purpose
  static async addStudentPurpose(req, res) {
    try {
      const { purposeName, tenantId } = req.body;
      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);
      const createdBy = (req.user ? req.user.username : null) || "System";

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

      const purposeData = {
        tenantId: userTenantId,
        purposeName: purposeName.trim(),
        createdBy,
        imageFile: req.file || null,
      };

      const result = await StudentService.addStudentPurpose(purposeData);

      const statusCode = result.responseCode === "S" ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in addStudentPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // PUT /api/students/purposes/:purposeId - Update purpose
  static async updateStudentPurpose(req, res) {
    try {
      const { purposeId } = req.params;
      const { purposeName, tenantId } = req.body;
      const userTenantId = tenantId || (req.user ? req.user.tenantId : null);
      const updatedBy = (req.user ? req.user.username : null) || "System";

      if (!userTenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

      const result = await StudentService.updateStudentPurpose(
        parseInt(purposeId),
        userTenantId,
        purposeName.trim(),
        updatedBy
      );

      const statusCode = result.responseCode === "S" ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in updateStudentPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // DELETE /api/students/purposes/:purposeId - Delete purpose
  static async deleteStudentPurpose(req, res) {
    try {
      const { purposeId } = req.params;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username || "System";

      if (!purposeId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose ID is required",
        });
      }

      const result = await StudentService.deleteStudentPurpose(
        parseInt(purposeId),
        userTenantId,
        updatedBy
      );

      const statusCode = result.responseCode === "S" ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in deleteStudentPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // ===== QR CODE METHODS FOR CHECK-IN/CHECK-OUT =====

  // POST /api/students/:studentId/generate-qr - Generate QR code for student
  static async generateStudentQR(req, res) {
    try {
      const { studentId } = req.params;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username || "System";

      if (!studentId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student ID is required",
        });
      }

      // Get student details to generate QR
      const student = await StudentService.getStudentStatus(
        parseInt(studentId),
        userTenantId
      );

      if (student.responseCode !== responseUtils.RESPONSE_CODES.SUCCESS) {
        return res.status(404).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        });
      }

      // Generate QR data with student information
      const qrData = QRService.generateQRData(
        {
          tenantId: userTenantId,
          visitorRegNo: student.data.studentCode, // Use VisitorRegNo as mainid
          visitorCatId: 2, // Student category
          SecurityCode: student.data.studentCode,
        },
        "checkin-checkout"
      );

      // Generate QR code image
      const qrResult = await QRService.generateQRCode(qrData);

      if (!qrResult.success) {
        return res.status(500).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Failed to generate QR code",
        });
      }

      // Save QR code to uploads folder
      const fileName = `student_qr_${studentId}_${Date.now()}.png`;
      const filePath = await FileService.saveBase64Image(
        qrResult.qrBase64,
        FileService.categories.QR_CODES,
        fileName
      );

      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "QR code generated successfully",
        data: {
          studentId: parseInt(studentId),
          qrData: qrResult.qrData,
          qrImage: qrResult.qrImage,
          qrFilePath: filePath,
          student: {
            name: student.data.studentName,
            regNo: student.data.studentCode,
            mobile: student.data.mobile,
          },
        },
      });
    } catch (error) {
      console.error("Error in generateStudentQR:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/students/scan-qr - Process QR code scan and return check-in/check-out status
  static async processStudentQRScan(req, res) {
    try {
      const { qrData } = req.body;
      const userTenantId = req.user.tenantId;

      // Handle both JSON string and JSON object formats
      let qrString;
      if (typeof qrData === "string") {
        qrString = qrData;
      } else if (typeof qrData === "object") {
        qrString = JSON.stringify(qrData);
      } else {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid QR data format",
        });
      }

      // Parse QR data
      const qrParseResult = QRService.parseQRData(qrString);

      if (!qrParseResult.success) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid QR code format",
        });
      }

      const { tenantid, mainid, type } = qrParseResult.data;

      // Validate tenant access
      if (parseInt(tenantid) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Access denied for this tenant",
        });
      }

      // Validate student type
      if (type !== "stu") {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "QR code is not for a student",
        });
      }

      // Get student ID from VisitorRegNo, then get status
      const student = await StudentModel.getStudentByRegNo(
        mainid,
        userTenantId
      );

      if (!student) {
        return res.status(404).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        });
      }

      const statusResult = await StudentService.getStudentStatus(
        student.visitorregid,
        userTenantId
      );

      if (statusResult.responseCode !== responseUtils.RESPONSE_CODES.SUCCESS) {
        return res.status(404).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        });
      }

      // Use the action from getStudentStatus which is already correct
      const nextAction =
        statusResult.data.action === "CHECKIN" ? "checkin" : "checkout";

      // Determine current status for display
      let currentStatus;
      if (statusResult.data.action === "CHECKIN") {
        currentStatus = "CHECKED_OUT"; // Student is checked out, can check in
      } else {
        currentStatus = "AVAILABLE"; // Student is available, can check out
      }

      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "QR scan processed successfully",
        data: {
          studentId: statusResult.data.studentId, // Use actual VisitorRegID
          tenantId: parseInt(tenantid),
          nextAction: nextAction,
          currentStatus: currentStatus,
          visitorRegId: statusResult.data.studentId, // The actual VisitorRegID for API calls
          visitorRegNo: mainid, // The VisitorRegNo from QR
          student: {
            name: statusResult.data.studentName,
            regNo: statusResult.data.studentCode,
            mobile: statusResult.data.mobile,
            course: statusResult.data.course || "N/A",
            hostel: statusResult.data.hostel || "N/A",
          },
          actionPrompt:
            nextAction === "checkin"
              ? "Student is currently checked out. Do you want to check in?"
              : "Student is currently available. Do you want to check out?",
          // Include the status message from getStudentStatus for debugging
          statusMessage: statusResult.data.message,
        },
      });
    } catch (error) {
      console.error("Error in processStudentQRScan:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/students/qr-checkin - QR-based check-in for students
  static async qrCheckinStudent(req, res) {
    try {
      const { studentId, tenantId } = req.body;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username || "System";

      // Validate tenant access
      if (parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Access denied for this tenant",
        });
      }

      const result = await StudentService.checkinStudent(
        parseInt(studentId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error("Error in qrCheckinStudent:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/students/qr-checkout - QR-based check-out for students
  static async qrCheckoutStudent(req, res) {
    try {
      const { studentId, tenantId, purposeId, purposeName } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username || "System";

      // Validate tenant access
      if (parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Access denied for this tenant",
        });
      }

      const result = await StudentService.checkoutStudent(
        parseInt(studentId),
        userTenantId,
        purposeId ? parseInt(purposeId) : null,
        purposeName,
        createdBy
      );

      res.json(result);
    } catch (error) {
      console.error("Error in qrCheckoutStudent:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/students/visit-history - Get all student visit history
  static async getAllStudentVisitHistory(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = "",
        fromDate = null,
        toDate = null,
        visitorRegId = null,
        purposeId = null
      } = req.query;

      const userTenantId = req.user.tenantId;

      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        fromDate,
        toDate,
        visitorRegId: visitorRegId ? parseInt(visitorRegId) : null,
        purposeId: purposeId ? parseInt(purposeId) : null
      };

      const result = await StudentService.getAllStudentVisitHistory(
        userTenantId,
        filters
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getAllStudentVisitHistory:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // DELETE /api/students/:id - Delete student and all related data
  static async deleteStudent(req, res) {
    try {
      const { id } = req.params;
      const userTenantId = req.user.tenantId;
      const deletedBy = req.user.userId;

      if (!id) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student ID is required",
        });
      }

      const result = await StudentService.deleteStudent(
        parseInt(id),
        userTenantId,
        deletedBy
      );

      if (result.responseCode === responseUtils.RESPONSE_CODES.ERROR) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error in deleteStudent:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // ===== NEW MEAL REGISTRATION ENDPOINTS (Phase 1) =====

  // POST /api/students/:studentId/meal-register - Register student for meal (Phase 1)
  static async registerStudentForMeal(req, res) {
    try {
      const { studentId } = req.params;
      const { mealType, isSpecial = false, specialRemarks = "" } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username || "System";

      if (!studentId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student ID is required",
        });
      }

      if (!mealType || !['lunch', 'dinner'].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Valid meal type (lunch/dinner) is required",
        });
      }

      const result = await MealRegistrationService.registerStudentForMeal(
        parseInt(studentId),
        userTenantId,
        mealType,
        isSpecial,
        specialRemarks,
        createdBy
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in registerStudentForMeal:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/students/meal-register-qr - Register for meal via QR code (Phase 1)
  static async registerMealViaQR(req, res) {
    try {
      const { qrData, isSpecial = false, specialRemarks = "" } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username || "System";

      if (!qrData) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "QR data is required",
        });
      }

      // Parse QR data
      let parsedQRData;
      try {
        parsedQRData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      } catch (parseError) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid QR data format",
        });
      }

      const result = await MealRegistrationService.registerViaQR(
        parsedQRData,
        userTenantId,
        isSpecial,
        specialRemarks,
        createdBy
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in registerMealViaQR:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/:studentId/meal-registrations - Get student's meal registrations for today
  static async getStudentMealRegistrations(req, res) {
    try {
      const { studentId } = req.params;
      const userTenantId = req.user.tenantId;

      if (!studentId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student ID is required",
        });
      }

      const result = await MealRegistrationService.getStudentRegistrations(
        userTenantId,
        parseInt(studentId)
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getStudentMealRegistrations:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-registrations/:mealType - Get all registrations for a meal type
  static async getMealRegistrations(req, res) {
    try {
      const { mealType } = req.params;
      const { date } = req.query;
      const userTenantId = req.user.tenantId;

      if (!mealType || !['lunch', 'dinner'].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Valid meal type (lunch/dinner) is required",
        });
      }

      const result = await MealRegistrationService.getMealRegistrations(
        userTenantId,
        mealType,
        date
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getMealRegistrations:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-registration-status/:mealType - Get registration status for a meal type
  static async getMealRegistrationStatus(req, res) {
    try {
      const { mealType } = req.params;
      const userTenantId = req.user.tenantId;

      if (!mealType || !['lunch', 'dinner'].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Valid meal type (lunch/dinner) is required",
        });
      }

      const result = await MealRegistrationService.getRegistrationStatus(
        userTenantId,
        mealType
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getMealRegistrationStatus:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/students/meal-registration/:mealId - Update meal registration (special requests)
  static async updateMealRegistration(req, res) {
    try {
      const { mealId } = req.params;
      const { isSpecial, specialRemarks } = req.body;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username || "System";

      if (!mealId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Meal ID is required",
        });
      }

      const result = await MealRegistrationService.updateRegistration(
        userTenantId,
        parseInt(mealId),
        { isSpecial, specialRemarks },
        updatedBy
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in updateMealRegistration:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // DELETE /api/students/meal-registration/:mealId - Cancel meal registration
  static async cancelMealRegistration(req, res) {
    try {
      const { mealId } = req.params;
      const userTenantId = req.user.tenantId;
      const cancelledBy = req.user.username || "System";

      if (!mealId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Meal ID is required",
        });
      }

      const result = await MealRegistrationService.cancelRegistration(
        userTenantId,
        parseInt(mealId),
        cancelledBy
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in cancelMealRegistration:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ===== NEW MEAL CONSUMPTION ENDPOINTS (Phase 2) =====

  // POST /api/students/meal-consume/:mealId - Consume meal (Phase 2)
  static async consumeMeal(req, res) {
    try {
      const { mealId } = req.params;
      const userTenantId = req.user.tenantId;
      const consumedBy = req.user.username || "System";

      if (!mealId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Meal ID is required",
        });
      }

      const result = await MealConsumptionService.consumeMeal(
        parseInt(mealId),
        userTenantId,
        consumedBy
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in consumeMeal:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/students/meal-consume-qr - Consume meal via QR code (Phase 2)
  static async consumeMealViaQR(req, res) {
    try {
      const { qrData } = req.body;
      const userTenantId = req.user.tenantId;
      const consumedBy = req.user.username || "System";

      if (!qrData) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "QR data is required",
        });
      }

      // Parse QR data
      let parsedQRData;
      try {
        parsedQRData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      } catch (parseError) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid QR data format",
        });
      }

      const result = await MealConsumptionService.consumeViaQR(
        parsedQRData,
        userTenantId,
        consumedBy
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in consumeMealViaQR:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-serving-status/:mealType - Get serving status for a meal type
  static async getMealServingStatus(req, res) {
    try {
      const { mealType } = req.params;
      const userTenantId = req.user.tenantId;

      if (!mealType || !['lunch', 'dinner'].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Valid meal type (lunch/dinner) is required",
        });
      }

      const result = await MealConsumptionService.getServingStatus(
        userTenantId,
        mealType
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getMealServingStatus:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-queue/:mealType - Get meal queue with real-time status
  static async getMealQueue(req, res) {
    try {
      const { mealType } = req.params;
      const { date } = req.query;
      const userTenantId = req.user.tenantId;

      if (!mealType || !['lunch', 'dinner'].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Valid meal type (lunch/dinner) is required",
        });
      }

      const result = await MealConsumptionService.getMealQueue(
        userTenantId,
        mealType,
        date
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getMealQueue:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-pending/:mealType - Get pending meals for consumption
  static async getPendingMeals(req, res) {
    try {
      const { mealType } = req.params;
      const { date } = req.query;
      const userTenantId = req.user.tenantId;

      if (!mealType || !['lunch', 'dinner'].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Valid meal type (lunch/dinner) is required",
        });
      }

      const result = await MealConsumptionService.getPendingMeals(
        userTenantId,
        mealType,
        date
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getPendingMeals:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-consumed/:mealType - Get consumed meals
  static async getConsumedMeals(req, res) {
    try {
      const { mealType } = req.params;
      const { date } = req.query;
      const userTenantId = req.user.tenantId;

      if (!mealType || !['lunch', 'dinner'].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Valid meal type (lunch/dinner) is required",
        });
      }

      const result = await MealConsumptionService.getConsumedMeals(
        userTenantId,
        mealType,
        date
      );

      res.json(result);
    } catch (error) {
      console.error("Error in getConsumedMeals:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/students/meal-validate-consumption - Validate meal consumption before consuming
  static async validateMealConsumption(req, res) {
    try {
      const { studentId, mealType } = req.body;
      const userTenantId = req.user.tenantId;

      if (!studentId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student ID is required",
        });
      }

      if (!mealType || !['lunch', 'dinner'].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Valid meal type (lunch/dinner) is required",
        });
      }

      const result = await MealConsumptionService.validateMealConsumption(
        userTenantId,
        parseInt(studentId),
        mealType
      );

      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in validateMealConsumption:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ===== MEAL ANALYTICS AND HISTORY ENDPOINTS =====

  // GET /api/students/meal-analytics - Get comprehensive meal analytics
  static async getMealAnalytics(req, res) {
    try {
      const { fromDate, toDate } = req.query;
      const userTenantId = req.user.tenantId;

      // Helper function to convert DD/MM/YYYY to YYYY-MM-DD
      const convertDateFormat = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      };

      // Default to last 7 days if no dates provided
      let startDate, endDate;

      if (fromDate) {
        startDate = convertDateFormat(fromDate);
      } else {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      }

      if (toDate) {
        endDate = convertDateFormat(toDate);
      } else {
        endDate = new Date().toISOString().split("T")[0];
      }

      // Validate converted dates
      if ((fromDate && !startDate) || (toDate && !endDate)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid date format. Please use DD/MM/YYYY format",
        });
      }

      // Get meal analytics from the enhanced model
      const MealModel = require("../models/meal.model");
      const analytics = await MealModel.getMealRegistrationAnalytics(
        userTenantId,
        startDate,
        endDate
      );

      return res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Meal analytics retrieved successfully",
        data: {
          dateRange: {
            startDate,
            endDate
          },
          analytics: analytics.map(stat => ({
            date: stat.mealdate,
            mealType: stat.mealtype,
            totalRegistrations: parseInt(stat.totalregistrations),
            totalConsumed: parseInt(stat.totalconsumed),
            totalWasted: parseInt(stat.totalwasted),
            specialMeals: parseInt(stat.specialmeals),
            consumptionRate: parseFloat(stat.consumptionrate)
          }))
        }
      });

    } catch (error) {
      console.error("Error in getMealAnalytics:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-dashboard - Get today's meal dashboard data
  static async getMealDashboard(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const today = new Date().toISOString().split('T')[0];

      // Get registration status for both meals
      const lunchStatus = await MealRegistrationService.getRegistrationStatus(userTenantId, 'lunch');
      const dinnerStatus = await MealRegistrationService.getRegistrationStatus(userTenantId, 'dinner');

      // Get serving status for both meals  
      const lunchServing = await MealConsumptionService.getServingStatus(userTenantId, 'lunch');
      const dinnerServing = await MealConsumptionService.getServingStatus(userTenantId, 'dinner');

      return res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Meal dashboard data retrieved successfully",
        data: {
          date: today,
          lunch: {
            registration: lunchStatus.success ? lunchStatus.data : null,
            serving: lunchServing.success ? lunchServing.data : null
          },
          dinner: {
            registration: dinnerStatus.success ? dinnerStatus.data : null,
            serving: dinnerServing.success ? dinnerServing.data : null
          }
        }
      });

    } catch (error) {
      console.error("Error in getMealDashboard:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-history-detailed - Get detailed meal history with registration and consumption data
  static async getDetailedMealHistory(req, res) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        mealType, 
        fromDate, 
        toDate,
        status,
        isSpecial
      } = req.query;
      const userTenantId = req.user.tenantId;

      // Helper function to convert DD/MM/YYYY to YYYY-MM-DD
      const convertDateFormat = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      };

      // Build where conditions
      let whereConditions = [`TenantID = $1`, `IsActive = 'Y'`];
      let params = [userTenantId];
      let paramIndex = 2;

      if (mealType && ['lunch', 'dinner'].includes(mealType)) {
        whereConditions.push(`MealType = $${paramIndex}`);
        params.push(mealType);
        paramIndex++;
      }

      if (fromDate) {
        const startDate = convertDateFormat(fromDate);
        if (startDate) {
          whereConditions.push(`MealDate >= $${paramIndex}`);
          params.push(startDate);
          paramIndex++;
        }
      }

      if (toDate) {
        const endDate = convertDateFormat(toDate);
        if (endDate) {
          whereConditions.push(`MealDate <= $${paramIndex}`);
          params.push(endDate);
          paramIndex++;
        }
      }

      if (status && ['registered', 'consumed', 'cancelled'].includes(status)) {
        whereConditions.push(`Status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (isSpecial && ['Y', 'N'].includes(isSpecial)) {
        whereConditions.push(`IsSpecial = $${paramIndex}`);
        params.push(isSpecial);
        paramIndex++;
      }

      // Count total records
      const { query } = require('../config/database');
      const countSql = `
        SELECT COUNT(*) as total
        FROM MealMaster 
        WHERE ${whereConditions.join(' AND ')}
      `;
      
      const countResult = await query(countSql, params);
      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / parseInt(pageSize));

      // Get paginated data
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const dataSql = `
        SELECT 
          MealID,
          StudentID,
          StudentRegNo,
          StudentName,
          Mobile,
          Course,
          Hostel,
          MealType,
          MealDate,
          MealTime,
          TokenNumber,
          Status,
          IsSpecial,
          SpecialRemarks,
          IsConsumed,
          ConsumedTime,
          CreatedDate
        FROM MealMaster 
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY MealDate DESC, MealTime DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(parseInt(pageSize), offset);
      const dataResult = await query(dataSql, params);

      return res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Detailed meal history retrieved successfully",
        data: dataResult.rows.map(meal => ({
          mealId: meal.mealid,
          studentId: meal.studentid,
          studentRegNo: meal.studentregno,
          studentName: meal.studentname,
          mobile: meal.mobile,
          course: meal.course,
          hostel: meal.hostel,
          mealType: meal.mealtype,
          mealDate: meal.mealdate,
          mealTime: meal.mealtime,
          tokenNumber: meal.tokennumber,
          status: meal.status,
          isSpecial: meal.isspecial === 'Y',
          specialRemarks: meal.specialremarks,
          isConsumed: meal.isconsumed === 'Y',
          consumedTime: meal.consumedtime,
          registrationTime: meal.createddate
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages,
          totalItems
        }
      });

    } catch (error) {
      console.error("Error in getDetailedMealHistory:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-waste-report - Get meal waste report
  static async getMealWasteReport(req, res) {
    try {
      const { fromDate, toDate, mealType } = req.query;
      const userTenantId = req.user.tenantId;

      // Helper function to convert DD/MM/YYYY to YYYY-MM-DD
      const convertDateFormat = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      };

      // Default to last 30 days if no dates provided
      let startDate, endDate;

      if (fromDate) {
        startDate = convertDateFormat(fromDate);
      } else {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      }

      if (toDate) {
        endDate = convertDateFormat(toDate);
      } else {
        endDate = new Date().toISOString().split("T")[0];
      }

      // Build query with optional meal type filter
      const { query } = require('../config/database');
      let sql = `
        SELECT 
          MealDate,
          MealType,
          COUNT(*) as TotalRegistered,
          COUNT(CASE WHEN IsConsumed = 'Y' THEN 1 END) as TotalConsumed,
          COUNT(CASE WHEN IsConsumed = 'N' AND Status != 'cancelled' THEN 1 END) as TotalWasted,
          ROUND(
            (COUNT(CASE WHEN IsConsumed = 'N' AND Status != 'cancelled' THEN 1 END) * 100.0 / 
             NULLIF(COUNT(*), 0)), 2
          ) as WastePercentage
        FROM MealMaster
        WHERE TenantID = $1 
          AND MealDate BETWEEN $2 AND $3
          AND IsActive = 'Y'
          AND Status IN ('registered', 'consumed')
      `;
      
      let params = [userTenantId, startDate, endDate];
      
      if (mealType && ['lunch', 'dinner'].includes(mealType)) {
        sql += ` AND MealType = $4`;
        params.push(mealType);
      }

      sql += `
        GROUP BY MealDate, MealType
        ORDER BY MealDate DESC, 
                 CASE MealType 
                   WHEN 'lunch' THEN 1 
                   WHEN 'dinner' THEN 2 
                 END
      `;

      const result = await query(sql, params);

      return res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Meal waste report retrieved successfully",
        data: {
          dateRange: {
            startDate,
            endDate
          },
          mealTypeFilter: mealType || 'all',
          wasteReport: result.rows.map(row => ({
            date: row.mealdate,
            mealType: row.mealtype,
            totalRegistered: parseInt(row.totalregistered),
            totalConsumed: parseInt(row.totalconsumed),
            totalWasted: parseInt(row.totalwasted),
            wastePercentage: parseFloat(row.wastepercentage)
          }))
        }
      });

    } catch (error) {
      console.error("Error in getMealWasteReport:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ===== MEAL QR CODE GENERATION ENDPOINTS =====

  // POST /api/students/:studentId/generate-meal-qr - Generate meal QR code for student
  static async generateMealQR(req, res) {
    try {
      const { studentId } = req.params;
      const { mealType, qrType = 'unified', validHours = 24 } = req.body;
      const userTenantId = req.user.tenantId;

      if (!studentId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student ID is required",
        });
      }

      if (!mealType || !['lunch', 'dinner'].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Valid meal type (lunch/dinner) is required",
        });
      }

      // Get student details
      const student = await StudentModel.getStudentById(parseInt(studentId), userTenantId);
      if (!student) {
        return res.status(404).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        });
      }

      // Check meal window status
      const windowStatus = await QRService.getMealWindowStatus(userTenantId, mealType);
      if (!windowStatus.canGenerate) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: windowStatus.reason,
        });
      }

      let qrResult;
      const studentData = {
        studentId: student.visitorregid,
        name: student.name,
        visitorregno: student.visitorregno,
        mobile: student.mobile,
        course: student.course,
        hostel: student.hostel
      };

      // Generate appropriate QR code based on type
      if (qrType === 'registration') {
        qrResult = await QRService.generateMealRegistrationQRImage(studentData, mealType, userTenantId);
      } else if (qrType === 'consumption') {
        qrResult = await QRService.generateMealConsumptionQRImage(studentData, mealType, userTenantId);
      } else {
        qrResult = await QRService.generateMealQRImage(studentData, mealType, userTenantId, { validHours });
      }

      if (!qrResult.success) {
        return res.status(500).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Failed to generate meal QR code",
          error: qrResult.error
        });
      }

      // Save QR code to uploads folder
      const fileName = `meal_qr_${studentId}_${mealType}_${Date.now()}.png`;
      const filePath = await FileService.saveBase64Image(
        qrResult.qrBase64,
        FileService.categories.QR_CODES,
        fileName
      );

      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Meal QR code generated successfully",
        data: {
          studentId: parseInt(studentId),
          mealType,
          qrType,
          qrData: qrResult.qrData,
          qrImage: qrResult.qrImage,
          qrFilePath: filePath,
          phase: qrResult.phase,
          currentWindow: windowStatus.currentWindow,
          studentInfo: qrResult.studentInfo,
          validUntil: qrResult.validUntil
        }
      });

    } catch (error) {
      console.error("Error in generateMealQR:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/students/validate-meal-qr - Validate meal QR code
  static async validateMealQR(req, res) {
    try {
      const { qrData } = req.body;
      const userTenantId = req.user.tenantId;

      if (!qrData) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "QR data is required",
        });
      }

      // Parse QR data
      let parsedQRData;
      try {
        parsedQRData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      } catch (parseError) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid QR data format",
        });
      }

      // Validate QR code
      const validation = QRService.validateMealQR(parsedQRData);
      if (!validation.valid) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: validation.reason,
        });
      }

      // Check tenant access
      if (parseInt(parsedQRData.tenant_id) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Access denied for this tenant",
        });
      }

      // Get student details for validation
      const student = await StudentModel.getStudentById(parseInt(parsedQRData.student_id), userTenantId);
      if (!student) {
        return res.status(404).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        });
      }

      // Check meal window status
      const windowStatus = await QRService.getMealWindowStatus(userTenantId, parsedQRData.meal_type);

      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Meal QR code validated successfully",
        data: {
          valid: true,
          qrData: parsedQRData,
          student: {
            id: student.visitorregid,
            name: student.name,
            regNo: student.visitorregno,
            mobile: student.mobile,
            course: student.course,
            hostel: student.hostel
          },
          mealType: parsedQRData.meal_type,
          canGenerate: windowStatus.canGenerate,
          currentWindow: windowStatus.currentWindow,
          windowReason: windowStatus.reason
        }
      });

    } catch (error) {
      console.error("Error in validateMealQR:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/students/meal-window-status/:mealType - Get meal window status
  static async getMealWindowStatus(req, res) {
    try {
      const { mealType } = req.params;
      const userTenantId = req.user.tenantId;

      if (!mealType || !['lunch', 'dinner'].includes(mealType)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Valid meal type (lunch/dinner) is required",
        });
      }

      const windowStatus = await QRService.getMealWindowStatus(userTenantId, mealType);

      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Meal window status retrieved successfully",
        data: windowStatus
      });

    } catch (error) {
      console.error("Error in getMealWindowStatus:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = StudentController;
