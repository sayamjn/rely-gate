const StudentModel = require("../models/student.model");
const responseUtils = require("../utils/constants");

class StudentService {
  // Get students with filters
static async getStudentsWithFilters(tenantId, filters = {}) {
  try {
    const students = await StudentModel.getStudentsWithFilters(tenantId, filters);
    
    const totalCount = students.length > 0 ? parseInt(students[0].total_count) : 0;
    const currentPage = parseInt(filters.page) || 1;
    const pageSize = parseInt(filters.pageSize) || 20;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      data: students.map(student => {
        const { total_count, ...studentData } = student;
        
        // Calculate formatted duration
        const formatDuration = (hours) => {
          if (!hours || hours <= 0) return null;
          const h = Math.floor(hours);
          const m = Math.round((hours % 1) * 60);
          return {
            hours: h,
            minutes: m,
            formatted: `${h}h ${m}m`,
            totalMinutes: Math.round(hours * 60)
          };
        };

        // Format dates
        const formatDateTime = (dateTime) => {
          if (!dateTime) return null;
          const date = new Date(dateTime);
          return {
            date: date.toISOString().split('T')[0], // YYYY-MM-DD
            time: date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: true 
            }),
            dateTime: date.toISOString(),
            timestamp: date.getTime()
          };
        };

        return {
          ...studentData,
          lastPurpose: {
            purposeId: studentData.lastvisitpurposeid,
            purposeName: studentData.lastvisitpurpose,
            purposeCatId: studentData.lastpurposecatid,
            purposeCatName: studentData.lastpurposecatname
          },
          lastActivity: {
            // Checkout information
            checkOut: {
              dateTime: formatDateTime(studentData.lastcheckoutdatetime),
              timeText: studentData.lastcheckouttime
            },
            // Checkin information  
            checkIn: {
              dateTime: formatDateTime(studentData.lastcheckindatetime),
              timeText: studentData.lastcheckintime
            },
            // Visit date
            visitDate: formatDateTime(studentData.lastvisitdate),
            historyId: studentData.lasthistoryid
          },
          duration: {
            // Completed visit duration (if student has checked back in)
            lastVisit: studentData.lastvisitdurationhours ? 
              formatDuration(studentData.lastvisitdurationhours) : null,
            // Current checkout duration (if student is still checked out)
            currentCheckout: studentData.currentcheckoutdurationhours ? 
              formatDuration(studentData.currentcheckoutdurationhours) : null
          },
          // Status information
          status: {
            current: studentData.currentstatus,
            isCheckedOut: studentData.currentstatus === 'CHECKED_OUT',
            isCheckedIn: studentData.currentstatus === 'CHECKED_IN'
          }
        };
      }),
      pagination: {
        currentPage,
        pageSize,
        totalCount,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      },
      filters: filters
    };
  } catch (error) {
    console.error('Error fetching students with filters:', error);
    return {
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}

  // Get student
  static async getStudents(tenantId, page = 1, pageSize = 20, search = "") {
    return this.getStudentsWithFilters(tenantId, { page, pageSize, search });
  }

  // Get student purposes
  static async getStudentPurposes(tenantId, purposeCatId = 3) {
    try {
      const purposes = await StudentModel.getStudentPurposes(
        tenantId,
        purposeCatId
      );
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: purposes,
        count: purposes.length,
      };
    } catch (error) {
      console.error("Error fetching student purposes:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get purpose categories
  static async getPurposeCategories(tenantId) {
    try {
      const categories = await StudentModel.getPurposeCategories(tenantId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: categories,
        count: categories.length,
      };
    } catch (error) {
      console.error("Error fetching purpose categories:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get student's current status with latest purpose
  static async getStudentStatus(studentId, tenantId) {
    try {
      const student = await StudentModel.getStudentById(studentId, tenantId);

      if (!student) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        };
      }

      const activeVisit = await StudentModel.getActiveVisit(
        studentId,
        tenantId
      );

      let status = {
        studentId: student.visitorregid,
        studentName: student.vistorname,
        studentCode: student.visitorregno,
        studentRegId: student.studentid || "",
        mobile: student.mobile,
        course: student.course || "N/A",
        hostel: student.hostel || "N/A",
        canCheckOut: false,
        canCheckIn: false,
        lastActivity: null,
        lastPurpose: null,
        isFirstVisit: false,
      };

      if (!activeVisit) {
        // No visit history - first time visit, can check out
        status.canCheckOut = true;
        status.isFirstVisit = true;
        status.action = "CHECKOUT";
        status.message = "Student can check out (first visit)";
      } else if (!activeVisit.outtime || !activeVisit.outtimetxt) {
        // Already checked out, can check in
        status.canCheckIn = true;
        status.action = "CHECKIN";
        status.message = "Student can check in";
        status.lastActivity = {
          checkOutTime: activeVisit.intimeTxt,
          checkOutDate: activeVisit.intime,
          historyId: activeVisit.regvisitorhistoryid,
        };
        status.lastPurpose = {
          purposeId: activeVisit.visitpurposeid,
          purposeName: activeVisit.visitpurpose,
          purposeCatId: activeVisit.purposecatid,
          purposeCategory: activeVisit.purposecatname,
        };
      } else {
        // Last visit was completed, can check out again
        status.canCheckOut = true;
        status.action = "CHECKOUT";
        status.message = "Student can check out";
        status.lastActivity = {
          checkInTime: activeVisit.outtimetxt,
          checkInDate: activeVisit.outtime,
          checkOutTime: activeVisit.intimeTxt,
          checkOutDate: activeVisit.intime,
          historyId: activeVisit.regvisitorhistoryid,
        };
        status.lastPurpose = {
          purposeId: activeVisit.visitpurposeid,
          purposeName: activeVisit.visitpurpose,
          purposeCatId: activeVisit.purposecatid,
          purposeCategory: activeVisit.purposecatname,
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: status,
      };
    } catch (error) {
      console.error("Error getting student status:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Checkout student with purpose

  static async checkoutStudent(
    studentId,
    tenantId,
    purposeId,
    purposeName,
    createdBy
  ) {
    try {
      const student = await StudentModel.getStudentById(studentId, tenantId);

      if (!student) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        };
      }

      const activeVisit = await StudentModel.getActiveVisit(
        studentId,
        tenantId
      );

      if (activeVisit && (!activeVisit.outtime || !activeVisit.outtimetxt)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student is already checked out",
          data: {
            historyId: activeVisit.regvisitorhistoryid,
            checkOutTime: activeVisit.intimeTxt,
            currentPurpose: {
              purposeId: activeVisit.visitpurposeid,
              purposeName: activeVisit.visitpurpose,
            },
          },
        };
      }

      let finalPurposeId = null;
      let finalPurposeName = "";
      let purposeCatId = 3; // Student category
      let purposeCatName = "Student";

      if (purposeId === -1) {
        // Custom purpose
        finalPurposeId = -1; 
        finalPurposeName = purposeName || "Other";
      } else if (purposeId && purposeId > 0) {
        const purpose = await StudentModel.getPurposeById(purposeId, tenantId);
        if (purpose) {
          finalPurposeId = purpose.visitpurposeid;
          finalPurposeName = purpose.visitpurpose;
          purposeCatId = purpose.purposecatid;
          purposeCatName = purpose.purposecatname;
        } else {
          return {
            responseCode: responseUtils.RESPONSE_CODES.ERROR,
            responseMessage: "Invalid purpose ID provided",
          };
        }
      } else {
        finalPurposeId = 17;
        finalPurposeName = "Class/Study";
      }

      const visitHistory = await StudentModel.createVisitHistory({
        tenantId,
        visitorRegId: student.visitorregid,
        visitorRegNo: student.visitorregno,
        securityCode: student.securitycode,
        vistorName: student.vistorname,
        mobile: student.mobile,
        vehicleNo: student.vehicleno || "",
        visitorCatId: 3, // Students category
        visitorCatName: "Student",
        visitorSubCatId: student.visitorsubcatid,
        visitorSubCatName: student.visitorsubcatname,
        associatedFlat: student.associatedflat || "",
        associatedBlock: student.associatedblock || "",
        visitPurposeId: finalPurposeId,
        visitPurpose: finalPurposeName,
        purposeCatId,
        purposeCatName,
        createdBy,
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Student checked out successfully",
        data: {
          historyId: visitHistory.regvisitorhistoryid,
          studentName: student.vistorname,
          studentCode: student.visitorregno,
          checkOutTime: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          purpose: {
            purposeId: finalPurposeId,
            purposeName: finalPurposeName,
            purposeCatId: purposeCatId,
            purposeCatName: purposeCatName,
            isCustom: purposeId === -1,
          },
          isFirstVisit: !activeVisit,
        },
      };
    } catch (error) {
      console.error("Error checking out student:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Check-in student (update existing visit record)
  static async checkinStudent(studentId, tenantId, updatedBy) {
    try {
      // Find active visit (checked out but not checked in)
      const activeVisit = await StudentModel.getActiveVisit(
        studentId,
        tenantId
      );

      if (!activeVisit) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "No active visit found for student",
        };
      }

      if (activeVisit.outtime && activeVisit.outtimetxt) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student is already checked in",
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
          responseMessage: "Student checked in successfully",
          data: {
            historyId: result.regvisitorhistoryid,
            checkInTime: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            purpose: {
              purposeId: activeVisit.visitpurposeid,
              purposeName: activeVisit.visitpurpose,
              purposeCatId: activeVisit.purposecatid,
              purposeCatName: activeVisit.purposecatname,
            },
          },
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visit history not found or already checked in",
        };
      }
    } catch (error) {
      console.error("Error checking in student:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get student's visit history with purposes
  static async getStudentHistory(studentId, tenantId, limit = 10) {
    try {
      const history = await StudentModel.getStudentHistory(
        studentId,
        tenantId,
        limit
      );

      const enhancedHistory = history.map((visit) => ({
        ...visit,
        status:
          !visit.outtime || !visit.outtimetxt ? "CHECKED_OUT" : "COMPLETED",
        purpose: {
          purposeId: visit.visitpurposeid,
          purposeName: visit.visitpurpose,
          purposeCatId: visit.purposecatid,
          purposeCatName: visit.purposecatname,
        },
        duration: visit.durationhours
          ? {
              hours: Math.floor(visit.durationhours),
              minutes: Math.round((visit.durationhours % 1) * 60),
              formatted: `${Math.floor(visit.durationhours)}h ${Math.round(
                (visit.durationhours % 1) * 60
              )}m`,
            }
          : null,
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: enhancedHistory,
        count: enhancedHistory.length,
      };
    } catch (error) {
      console.error("Error fetching student history:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get students pending check-in (currently checked out)
  static async getStudentsPendingCheckin(tenantId) {
    try {
      const students = await StudentModel.getStudentsPendingCheckin(tenantId);

      const enhancedStudents = students.map((student) => {
        const checkoutTime = new Date(student.intime);
        const now = new Date();
        const timeDiff = now - checkoutTime;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        return {
          ...student,
          purpose: {
            purposeId: student.visitpurposeid,
            purposeName: student.visitpurpose,
            purposeCatId: student.purposecatid,
            purposeCatName: student.purposecatname,
          },
          timeElapsed: {
            hours,
            minutes,
            formatted: `${hours}h ${minutes}m ago`,
          },
        };
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: enhancedStudents,
        count: enhancedStudents.length,
      };
    } catch (error) {
      console.error("Error fetching pending check-in students:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }


   static async exportStudents(tenantId, filters = {}) {
    try {
      let whereConditions = ['vr.TenantID = $1', "vr.IsActive = 'Y'", "vr.VisitorCatName = 'Student'"];
      let params = [tenantId];
      let paramIndex = 2;

      // Apply filters
      if (filters.course && filters.course.trim()) {
        whereConditions.push(`bvu.Course ILIKE $${paramIndex}`);
        params.push(`%${filters.course.trim()}%`);
        paramIndex++;
      }

      if (filters.hostel && filters.hostel.trim()) {
        whereConditions.push(`bvu.Hostel ILIKE $${paramIndex}`);
        params.push(`%${filters.hostel.trim()}%`);
        paramIndex++;
      }

      if (filters.status) {
        if (filters.status === 'CHECKED_OUT') {
          whereConditions.push('EXISTS (SELECT 1 FROM RegVisitorHistory rvh WHERE rvh.VisitorRegID = vr.VisitorRegID AND rvh.TenantID = vr.TenantID AND (rvh.OutTime IS NULL OR rvh.OutTimeTxt IS NULL OR rvh.OutTimeTxt = \'\'))');
        } else if (filters.status === 'AVAILABLE') {
          whereConditions.push('NOT EXISTS (SELECT 1 FROM RegVisitorHistory rvh WHERE rvh.VisitorRegID = vr.VisitorRegID AND rvh.TenantID = vr.TenantID AND (rvh.OutTime IS NULL OR rvh.OutTimeTxt IS NULL OR rvh.OutTimeTxt = \'\'))');
        }
      }

      if (filters.fromDate) {
        whereConditions.push(`vr.CreatedDate >= $${paramIndex}`);
        params.push(filters.fromDate);
        paramIndex++;
      }

      if (filters.toDate) {
        whereConditions.push(`vr.CreatedDate <= $${paramIndex}`);
        params.push(filters.toDate);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const sql = `
        SELECT 
          COALESCE(bvu.StudentID, vr.VisitorRegNo) as "Student ID",
          vr.VistorName as "Student Name",
          vr.Mobile as "Mobile",
          vr.Email as "Email",
          COALESCE(bvu.Course, vr.AssociatedBlock) as "Course",
          COALESCE(bvu.Hostel, vr.AssociatedFlat) as "Hostel",
          vr.VehicleNo as "Vehicle Number",
          vr.VisitorSubCatName as "Category",
          vr.StatusName as "Status",
          TO_CHAR(vr.CreatedDate, 'YYYY-MM-DD') as "Registration Date",
          COUNT(vh.RegVisitorHistoryID) as "Total Visits",
          MAX(TO_CHAR(vh.InTime, 'YYYY-MM-DD HH24:MI')) as "Last Visit",
          CASE 
            WHEN COUNT(CASE WHEN vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '' THEN 1 END) > 0 
            THEN 'CHECKED_OUT'
            ELSE 'AVAILABLE'
          END as "Current Status"
        FROM VisitorRegistration vr
        LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'student'
        LEFT JOIN RegVisitorHistory vh ON vr.VisitorRegID = vh.VisitorRegID AND vh.TenantID = vr.TenantID
        WHERE ${whereClause}
        GROUP BY vr.VisitorRegID, vr.VistorName, vr.Mobile, vr.Email, 
                 bvu.Course, bvu.Hostel, vr.VehicleNo, vr.VisitorSubCatName, 
                 vr.StatusName, vr.CreatedDate, bvu.StudentID, vr.VisitorRegNo,
                 vr.AssociatedBlock, vr.AssociatedFlat
        ORDER BY vr.CreatedDate DESC
      `;

      const result = await query(sql, params);

      if (result.rows.length === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'No student data found for export'
        };
      }

      // Convert to CSV
      const headers = Object.keys(result.rows[0]);
      const csvRows = [headers.join(',')];
      
      result.rows.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || '';
          const stringValue = value.toString();
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvRows.push(values.join(','));
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        csvData: csvRows.join('\n'),
        count: result.rows.length
      };
    } catch (error) {
      console.error('Error exporting students:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }
}

module.exports = StudentService;
