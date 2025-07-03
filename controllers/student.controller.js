const StudentService = require('../services/student.service');
const MealService = require('../services/meal.service');
const responseUtils = require("../utils/constants");

class StudentController {
  // POST /api/students/list - List students with filters 
  static async listStudents(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        purposeId = null,
        studentId = '',
        firstName = '',
        course = '',
        hostel = '',
        fromDate = null,
        toDate = null,
        tenantId
      } = req.body;
      
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        purposeId: purposeId ? parseInt(purposeId) : null,
        studentId,
        firstName,
        course,
        hostel,
        fromDate,
        toDate
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

  // GET /api/students - List students with pagination and search 
  static async getStudents(req, res) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        search = '', 
        tenantId 
      } = req.query;
      
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await StudentService.getStudents(
        userTenantId,
        parseInt(page),
        parseInt(pageSize),
        search
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getStudents:', error);
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
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId, purposeId, purposeName } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId } = req.body;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const template = 'Student_ID,Name,Mobile,Email,Course,Hostel,Vehicle_Number,Year,Semester';
      
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
    const { tenantId } = req.query;
    const userTenantId = req.user.tenantId;

    if (tenantId && parseInt(tenantId) !== userTenantId) {
      return res.status(403).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Access denied for this tenant'
      });
    }

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
      const { student_id, tenant_id, confirmed = false } = req.body;
      const userTenantId = req.user.tenantId;

      // Validate tenant access
      if (tenant_id && parseInt(tenant_id) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
}

module.exports = StudentController;