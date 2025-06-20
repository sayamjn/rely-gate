const StudentService = require('../services/student.service');
const responseUtils = require("../utils/constants");

class StudentController {
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

  // POST /api/students/:studentId/checkout - Checkout student (first visit or subsequent)
  static async checkoutStudent(req, res) {
    try {
      const { studentId } = req.params;
      const { tenantId } = req.body;
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

      const result = await StudentService.checkoutStudent(
        parseInt(studentId),
        userTenantId,
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

  // // GET /api/students/search - Advanced search with filters
  // static async searchStudents(req, res) {
  //   try {
  //     const { tenantId, ...searchParams } = req.query;
  //     const userTenantId = req.user.tenantId;

  //     if (tenantId && parseInt(tenantId) !== userTenantId) {
  //       return res.status(403).json({
  //         responseCode: responseUtils.RESPONSE_CODES.ERROR,
  //         responseMessage: 'Access denied for this tenant'
  //       });
  //     }

  //     const result = await StudentService.searchStudents(userTenantId, searchParams);

  //     res.json(result);
  //   } catch (error) {
  //     console.error('Error in searchStudents:', error);
  //     res.status(500).json({
  //       responseCode: responseUtils.RESPONSE_CODES.ERROR,
  //       responseMessage: 'Internal server error'
  //     });
  //   }
  // }
}

module.exports = StudentController;