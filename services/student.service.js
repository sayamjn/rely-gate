const StudentModel = require('../models/student.model');
const responseUtils = require("../utils/constants");

class StudentService {

  // Get students with pagination and search
  static async getStudents(tenantId, page = 1, pageSize = 20, search = '') {
    try {
      const offset = (page - 1) * pageSize;
      const students = await StudentModel.getStudents(tenantId, pageSize, offset, search);
      
      const totalCount = students.length > 0 ? parseInt(students[0].total_count) : 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: students.map(student => {
          const { total_count, ...studentData } = student;
          return studentData;
        }),
        pagination: {
          currentPage: page,
          pageSize,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching students:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get student's current status (can check-in or check-out)
  static async getStudentStatus(studentId, tenantId) {
    try {
      // First verify student exists
      const student = await StudentModel.getStudentById(studentId, tenantId);
      
      if (!student) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student not found'
        };
      }

      // Check current visit status
      const activeVisit = await StudentModel.getActiveVisit(studentId, tenantId);
      
      let status = {
        studentId: student.visitorregid,
        studentName: student.vistorname,
        studentCode: student.visitorregno,
        mobile: student.mobile,
        course: student.course || 'N/A',
        hostel: student.hostel || 'N/A',
        canCheckOut: false,
        canCheckIn: false,
        lastActivity: null,
        isFirstVisit: false
      };

      if (!activeVisit) {
        // No visit history - first time visit, can check out
        status.canCheckOut = true;
        status.isFirstVisit = true;
        status.action = 'CHECKOUT';
        status.message = 'Student can check out (first visit)';
      } else if (!activeVisit.outtime || !activeVisit.outtimetxt) {
        // Already checked out, can check in
        status.canCheckIn = true;
        status.action = 'CHECKIN';
        status.message = 'Student can check in';
        status.lastActivity = {
          checkOutTime: activeVisit.intimeTxt,
          checkOutDate: activeVisit.intime
        };
      } else {
        // Last visit was completed, can check out again
        status.canCheckOut = true;
        status.action = 'CHECKOUT';
        status.message = 'Student can check out';
        status.lastActivity = {
          checkInTime: activeVisit.outtimetxt,
          checkInDate: activeVisit.outtime,
          checkOutTime: activeVisit.intimeTxt,
          checkOutDate: activeVisit.intime
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: status
      };
    } catch (error) {
      console.error('Error getting student status:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Checkout student (first visit or subsequent visit)
  static async checkoutStudent(studentId, tenantId, createdBy) {
    try {
      // Get student details
      const student = await StudentModel.getStudentById(studentId, tenantId);
      
      if (!student) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student not found'
        };
      }

      // Check if already checked out
      const activeVisit = await StudentModel.getActiveVisit(studentId, tenantId);
      
      if (activeVisit && (!activeVisit.outtime || !activeVisit.outtimetxt)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student is already checked out',
          data: {
            historyId: activeVisit.regvisitorhistoryid,
            checkOutTime: activeVisit.intimeTxt
          }
        };
      }

      // Create new visit history record for checkout
      const visitHistory = await StudentModel.createVisitHistory({
        tenantId,
        visitorRegId: student.visitorregid,
        visitorRegNo: student.visitorregno,
        securityCode: student.securitycode,
        vistorName: student.vistorname,
        mobile: student.mobile,
        vehicleNo: student.vehicleno || '',
        visitorCatId: 3, // Students category
        visitorCatName: 'Student',
        visitorSubCatId: student.visitorsubcatid,
        visitorSubCatName: student.visitorsubcatname,
        associatedFlat: student.associatedflat || '',
        associatedBlock: student.associatedblock || '',
        createdBy
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Student checked out successfully',
        data: {
          historyId: visitHistory.regvisitorhistoryid,
          studentName: student.vistorname,
          checkOutTime: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          }),
          isFirstVisit: !activeVisit
        }
      };
    } catch (error) {
      console.error('Error checking out student:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Check-in student (update existing visit record)
  static async checkinStudent(studentId, tenantId, updatedBy) {
    try {
      // Find active visit (checked out but not checked in)
      const activeVisit = await StudentModel.getActiveVisit(studentId, tenantId);
      
      if (!activeVisit) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'No active visit found for student'
        };
      }

      if (activeVisit.outtime && activeVisit.outtimetxt) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student is already checked in'
        };
      }

      // Update visit history with check-in time
      const result = await StudentModel.updateVisitHistoryCheckin(
        activeVisit.regvisitorhistoryid,
        tenantId,
        updatedBy
      );
      
      if (result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: 'Student checked in successfully',
          data: {
            historyId: result.regvisitorhistoryid,
            checkInTime: new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: true 
            })
          }
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visit history not found or already checked in'
        };
      }
    } catch (error) {
      console.error('Error checking in student:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get student's visit history
  static async getStudentHistory(studentId, tenantId, limit = 10) {
    try {
      const history = await StudentModel.getStudentHistory(studentId, tenantId, limit);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: history,
        count: history.length
      };
    } catch (error) {
      console.error('Error fetching student history:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get students pending check-in (currently checked out)
  static async getStudentsPendingCheckin(tenantId) {
    try {
      const students = await StudentModel.getStudentsPendingCheckin(tenantId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: students,
        count: students.length
      };
    } catch (error) {
      console.error('Error fetching pending check-in students:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Search students by multiple criteria
  static async searchStudents(tenantId, searchParams = {}) {
    try {
      const students = await StudentModel.searchStudents(tenantId, searchParams);
      
      const totalCount = students.length > 0 ? parseInt(students[0].total_count) : 0;
      const currentPage = parseInt(searchParams.page) || 1;
      const pageSize = parseInt(searchParams.pageSize) || 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: students.map(student => {
          const { total_count, ...studentData } = student;
          return studentData;
        }),
        pagination: {
          currentPage,
          pageSize,
          totalCount,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        }
      };
    } catch (error) {
      console.error('Error searching students:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }
}

module.exports = StudentService;