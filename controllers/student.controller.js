const StudentService = require('../services/student.service');
const StudentModel = require('../models/student.model');
const MealService = require('../services/meal.service');
const QRService = require('../services/qr.service');
const FileService = require('../services/file.service');
const responseUtils = require("../utils/constants");

class StudentController {
  // GET /api/students/list - List students with filters (GET, query params)
  static async listStudents(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        purposeId = null,
        studentId = '',
        VisitorSubCatID = null,
        firstName = '',
        course = '',
        hostel = '',
        fromDate = null,
        toDate = null
      } = req.query;

      const userTenantId = req.user.tenantId;

      // Convert DD/MM/YYYY or YYYY-MM-DD to full datetime range for SQL
      function convertDate(dateStr, isEnd = false) {
        if (!dateStr) return null;
        // DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          const [d, m, y] = dateStr.split('/');
          return isEnd ? `${y}-${m}-${d} 23:59:59` : `${y}-${m}-${d} 00:00:00`;
        }
        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return isEnd ? `${dateStr} 23:59:59` : `${dateStr} 00:00:00`;
        }
        // If already has time, return as is
        return dateStr;
      }

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
        fromDate: convertDate(fromDate, false),
        toDate: convertDate(toDate, true)
      };

      const result = await StudentService.getStudentsWithFilters(userTenantId, filters);
      res.json(result);
    } catch (error) {
      console.error('Error in listStudents:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/students - List students with pagination and search (kept for backward compatibility)
  static async getStudents(req, res) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        search = '', 
        visitorSubCatId = null
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
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getStudents:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      console.error('Error in getStudentSubCategories:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
          responseMessage: 'Student ID is required'
        });
      }

      const result = await StudentService.getStudentStatus(
        parseInt(studentId),
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getStudentStatus:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
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
          responseMessage: 'Student ID is required'
        });
      }

      if (purposeId === -1 && (!purposeName || purposeName.trim() === '')) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Purpose name is required when using custom purpose'
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
      console.error('Error in checkoutStudent:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
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
          responseMessage: 'Student ID is required'
        });
      }

      const result = await StudentService.checkinStudent(
        parseInt(studentId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error('Error in checkinStudent:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
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
      console.error('Error in getStudentHistory:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/students/pending-checkin - Get students currently checked out (pending check-in)
  static async getPendingCheckin(req, res) {
    try {
      
      const userTenantId = req.user.tenantId;


      const result = await StudentService.getStudentsPendingCheckin(userTenantId);

      res.json(result);
    } catch (error) {
      console.error('Error in getPendingCheckin:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
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
        format = 'csv',
        tenantId
      } = req.query;
      
      const userTenantId = req.user.tenantId;


      const filters = {
        course,
        hostel,
        status,
        fromDate,
        toDate
      };

      const result = await StudentService.exportStudents(userTenantId, filters);
      
      if (result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="students_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(result.csvData);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in exportStudents:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

    // GET /api/students/template - Download CSV template for bulk upload
  static async downloadTemplate(req, res) {
    try {
      const template = 'Student_ID,Name,Mobile,Course,Hostel\n';
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="student_template.csv"');
      res.send(template);
    } catch (error) {
      console.error('Error in downloadTemplate:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
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
    console.error('Error in getPendingCheckout:', error);
    res.status(500).json({
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: 'Internal server error'
    });
  }
}

  // POST /api/students/meal-checkin - Meal check-in for students via QR code
  static async mealCheckIn(req, res) {
    try {
      const { student_id, confirmed = false } = req.body;
      const userTenantId = req.user.tenantId;


      // Validate required fields
      if (!student_id) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student ID is required'
        });
      }

      // Validate QR data structure
      const qrValidation = MealService.validateQRData({ student_id, tenant_id });
      if (!qrValidation.valid) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: qrValidation.message
        });
      }

      // Process meal check-in
      const result = await MealService.processMealCheckIn(
        parseInt(student_id),
        userTenantId,
        confirmed
      );

      // Set appropriate HTTP status code
      const statusCode = result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS ? 200 : 400;
      
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Error in mealCheckIn:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
          responseMessage: 'Student ID is required'
        });
      }

      const result = await MealService.getStudentMealHistory(
        parseInt(studentId),
        userTenantId,
        parseInt(limit)
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getStudentMealHistory:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/students/meal-queue - Get current meal queue
  static async getCurrentMealQueue(req, res) {
    try {
      const { tenantId, mealType } = req.query;
      const userTenantId = req.user.tenantId;


      const result = await MealService.getCurrentMealQueue(userTenantId, mealType);
      res.json(result);
    } catch (error) {
      console.error('Error in getCurrentMealQueue:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };

      // Default to last 7 days if no dates provided
      let startDate, endDate;
      
      if (fromDate) {
        startDate = convertDateFormat(fromDate);
      } else {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      if (toDate) {
        endDate = convertDateFormat(toDate);
      } else {
        endDate = new Date().toISOString().split('T')[0];
      }

      // Validate converted dates
      if ((fromDate && !startDate) || (toDate && !endDate)) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid date format. Please use DD/MM/YYYY format'
        });
      }

      const result = await MealService.getMealStatistics(userTenantId, startDate, endDate);
      res.json(result);
    } catch (error) {
      console.error('Error in getMealStatistics:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

    // GET /api/students/purposes - Get available purposes for students
  static async getStudentPurposes(req, res) {
    try {
      const { tenantId, purposeCatId = 3 } = req.query;
      const userTenantId = req.user.tenantId;


      const result = await StudentService.getStudentPurposes(
        userTenantId, 
        parseInt(purposeCatId)
      );
      res.json(result);
    } catch (error) {
      console.error('Error in getStudentPurposes:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
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
      console.error('Error in getPurposeCategories:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
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
        imageFile: req.file || null
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
      const createdBy = req.user.username || 'System';

      if (!studentId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student ID is required'
        });
      }

      // Get student details to generate QR
      const student = await StudentService.getStudentStatus(parseInt(studentId), userTenantId);
      
      if (student.responseCode !== responseUtils.RESPONSE_CODES.SUCCESS) {
        return res.status(404).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student not found'
        });
      }

      // Generate QR data with student information
      const qrData = QRService.generateQRData({
        tenantId: userTenantId,
        visitorRegNo: student.data.studentCode, // Use VisitorRegNo as mainid
        visitorCatId: 3, // Student category
        SecurityCode: student.data.studentCode
      }, 'checkin-checkout');

      // Generate QR code image
      const qrResult = await QRService.generateQRCode(qrData);

      if (!qrResult.success) {
        return res.status(500).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Failed to generate QR code'
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
        responseMessage: 'QR code generated successfully',
        data: {
          studentId: parseInt(studentId),
          qrData: qrResult.qrData,
          qrImage: qrResult.qrImage,
          qrFilePath: filePath,
          student: {
            name: student.data.studentName,
            regNo: student.data.studentCode,
            mobile: student.data.mobile
          }
        }
      });
    } catch (error) {
      console.error('Error in generateStudentQR:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
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
      if (typeof qrData === 'string') {
        qrString = qrData;
      } else if (typeof qrData === 'object') {
        qrString = JSON.stringify(qrData);
      } else {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid QR data format'
        });
      }

      // Parse QR data
      const qrParseResult = QRService.parseQRData(qrString);
      
      if (!qrParseResult.success) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid QR code format'
        });
      }

      const { tenantid, mainid, type } = qrParseResult.data;

      // Validate tenant access
      if (parseInt(tenantid) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      // Validate student type
      if (type !== 'stu') {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'QR code is not for a student'
        });
      }

      // Get student ID from VisitorRegNo, then get status
      const student = await StudentModel.getStudentByRegNo(mainid, userTenantId);
      
      if (!student) {
        return res.status(404).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student not found'
        });
      }

      const statusResult = await StudentService.getStudentStatus(student.visitorregid, userTenantId);
      
      if (statusResult.responseCode !== responseUtils.RESPONSE_CODES.SUCCESS) {
        return res.status(404).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student not found'
        });
      }

      // Use the action from getStudentStatus which is already correct
      const nextAction = statusResult.data.action === 'CHECKIN' ? 'checkin' : 'checkout';
      
      // Determine current status for display
      let currentStatus;
      if (statusResult.data.action === 'CHECKIN') {
        currentStatus = 'CHECKED_OUT'; // Student is checked out, can check in
      } else {
        currentStatus = 'AVAILABLE'; // Student is available, can check out
      }

      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'QR scan processed successfully',
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
            course: statusResult.data.course || 'N/A',
            hostel: statusResult.data.hostel || 'N/A'
          },
          actionPrompt: nextAction === 'checkin' 
            ? 'Student is currently checked out. Do you want to check in?' 
            : 'Student is currently available. Do you want to check out?',
          // Include the status message from getStudentStatus for debugging
          statusMessage: statusResult.data.message
        }
      });
    } catch (error) {
      console.error('Error in processStudentQRScan:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/students/qr-checkin - QR-based check-in for students
  static async qrCheckinStudent(req, res) {
    try {
      const { studentId, tenantId } = req.body;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username || 'System';

      // Validate tenant access
      if (parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await StudentService.checkinStudent(
        parseInt(studentId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error('Error in qrCheckinStudent:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/students/qr-checkout - QR-based check-out for students
  static async qrCheckoutStudent(req, res) {
    try {
      const { studentId, tenantId, purposeId, purposeName } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username || 'System';

      // Validate tenant access
      if (parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
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
      console.error('Error in qrCheckoutStudent:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
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
          responseMessage: 'Student ID is required'
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
      console.error('Error in deleteStudent:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }
}

module.exports = StudentController;