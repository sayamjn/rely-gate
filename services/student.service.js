const { query } = require("../config/database");
const StudentModel = require("../models/student.model");
const responseUtils = require("../utils/constants");

class StudentService {
  // Get student (legacy/backward compatible)
  static async getStudents(tenantId, page = 1, pageSize = 20, search = '', visitorSubCatId = null) {
    try {
      const result = await StudentModel.getStudentsWithPagination(tenantId, page, pageSize, search, visitorSubCatId);
      return {
        count: result.students.length,
        data: result.students,
        responseMessage: 'Record(s) saved successfully',
        responseCode: 'S',
        pagination: {
          currentPage: result.currentPage,
          pageSize: result.pageSize,
          totalRecords: result.totalCount,
          totalPages: result.totalPages,
          hasNext: result.currentPage < result.totalPages,
          hasPrevious: result.currentPage > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching students (legacy):", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get students with filters
  static async getStudentsWithFilters(tenantId, filters = {}) {
    try {
      const students = await StudentModel.getStudentsWithFilters(tenantId, filters);
      
      // Get total count from the first row (if any)
      const totalCount = students.length > 0 ? parseInt(students[0].total_count) : 0;
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // Map to required response format
      const mapped = students.map((s) => ({
        VisitorRegID: s.visitorregid || s.VisitorRegID,
        VistorName: s.vistorname || s.VistorName,
        CreatedDateTxt: s.createddate ? new Date(s.createddate).toLocaleDateString('en-GB') : 
                       s.CreatedDate ? new Date(s.CreatedDate).toLocaleDateString('en-GB') : '',
        InTimeTxt: s.lastcheckintime || s.LastCheckInTime || '',
        InTime: s.lastcheckindatetime || s.LastCheckInDateTime || '',
        OutTime: s.lastcheckoutdatetime || s.LastCheckOutDateTime || '',
        OutTimeTxt: s.lastcheckouttime || s.LastCheckOutTime || '',
        CreatedBy: s.createdby || s.CreatedBy || '',
        Course: s.course || s.Course || '',
        VisitorSubCatName: s.visitorsubcatname || s.VisitorSubCatName || '',
        VisitorRegNo: s.visitorregno || s.VisitorRegNo || '',
        SecurityCode: s.securitycode || s.SecurityCode || '',
        Mobile: s.mobile || s.Mobile || '',
        PhotoName: s.photoname || s.PhotoName || '',
        VehiclelNo: s.vehiclelno || s.VehiclelNo || '',
        VehiclePhotoFlag: s.vehiclephotoflag || s.VehiclePhotoFlag || 'N',
        VehiclePhotoName: s.vehiclephotoname || s.VehiclePhotoName || null,
        AssociatedFlat: s.associatedflat || s.AssociatedFlat || '',
        Remark: s.remark || s.Remark || null,
        RegVisitorHistoryID: s.lasthistoryid || s.LastHistoryID || null,
        CurrentStatus: s.CurrentStatus || 'UNKNOWN',
        visitPurpose: s.visitpurpose || '',
        visitPurposeID: s.visitpurposeid || null
      }));
      
      return {
        count: mapped.length,
        data: mapped,
        responseMessage: 'Record(s) saved successfully',
        responseCode: 'S',
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalRecords: totalCount,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      };
    } catch (error) {
      console.error("Error fetching students with filters:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get all unique student subcategories for a tenant
  static async getStudentSubCategories(tenantId) {
    try {
      const subCategories = await StudentModel.getStudentSubCategories(tenantId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: subCategories,
        count: subCategories.length,
      };
    } catch (error) {
      console.error("Error fetching student subcategories:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
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
          checkOutTime: Math.floor(Date.now() / 1000),
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
            checkInTime: Math.floor(Date.now() / 1000),
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
      let whereConditions = [
        "vr.TenantID = $1",
        "vr.IsActive = 'Y'",
        "vr.VisitorCatName = 'Student'",
      ];
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

      // Fix: Use correct table name "VisitorRegVisitHistory"
      if (filters.status) {
        if (filters.status === "CHECKED_OUT") {
          whereConditions.push(
            "EXISTS (SELECT 1 FROM VisitorRegVisitHistory rvh WHERE rvh.VisitorRegID = vr.VisitorRegID AND rvh.TenantID = vr.TenantID AND (rvh.OutTime IS NULL OR rvh.OutTimeTxt IS NULL OR rvh.OutTimeTxt = ''))"
          );
        } else if (filters.status === "AVAILABLE") {
          whereConditions.push(
            "NOT EXISTS (SELECT 1 FROM VisitorRegVisitHistory rvh WHERE rvh.VisitorRegID = vr.VisitorRegID AND rvh.TenantID = vr.TenantID AND (rvh.OutTime IS NULL OR rvh.OutTimeTxt IS NULL OR rvh.OutTimeTxt = ''))"
          );
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

      const whereClause = whereConditions.join(" AND ");

      // Enhanced SQL with visit history data
      const sql = `
      SELECT 
        COALESCE(bvu.StudentID, vr.VisitorRegNo) as "Student ID",
        vr.VistorName as "Student Name",
        vr.Mobile as "Mobile",
        COALESCE(vr.Email, '') as "Email",
        COALESCE(bvu.Course, vr.AssociatedBlock) as "Course",
        COALESCE(bvu.Hostel, vr.AssociatedFlat) as "Hostel",
        COALESCE(vr.VehiclelNo, '') as "Vehicle Number",
        vr.VisitorSubCatName as "Category",
        vr.StatusName as "Status",
        TO_CHAR(vr.CreatedDate, 'YYYY-MM-DD') as "Registration Date",
        COALESCE(visit_stats.total_visits, 0) as "Total Visits",
        COALESCE(visit_stats.last_visit, '') as "Last Visit",
        CASE 
          WHEN visit_stats.is_checked_out > 0 THEN 'CHECKED_OUT'
          ELSE 'AVAILABLE'
        END as "Current Status"
      FROM VisitorRegistration vr
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'student'
      LEFT JOIN (
        SELECT 
          vh.VisitorRegID,
          vh.TenantID,
          COUNT(vh.RegVisitorHistoryID) as total_visits,
          MAX(TO_CHAR(vh.INTime, 'YYYY-MM-DD HH24:MI')) as last_visit,
          COUNT(CASE WHEN vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '' THEN 1 END) as is_checked_out
        FROM VisitorRegVisitHistory vh
        WHERE vh.IsActive = 'Y'
        GROUP BY vh.VisitorRegID, vh.TenantID
      ) visit_stats ON vr.VisitorRegID = visit_stats.VisitorRegID AND vr.TenantID = visit_stats.TenantID
      WHERE ${whereClause}
      ORDER BY vr.CreatedDate DESC
    `;

      const { query } = require("../config/database");
      const result = await query(sql, params);

      if (result.rows.length === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "No student data found for export",
        };
      }

      // Convert to CSV
      const headers = Object.keys(result.rows[0]);
      const csvRows = [headers.join(",")];

      result.rows.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header] || "";
          const stringValue = value.toString();
          if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvRows.push(values.join(","));
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        csvData: csvRows.join("\n"),
        count: result.rows.length,
      };
    } catch (error) {
      console.error("Error exporting students:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Add new purpose
  static async addStudentPurpose(purposeData) {
    try {
      const { tenantId, purposeName, createdBy, imageFile } = purposeData;

      if (!purposeName || purposeName.trim() === "") {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose name is required"
        };
      }

      if (purposeName.length > 250) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose name too long (max 250 characters)"
        };
      }

      const exists = await StudentModel.checkPurposeExists(
        tenantId,
        purposeName.trim()
      );
      if (exists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose already exists for this tenant"
        };
      }

      // Handle image upload if provided
      let imageData = null;
      if (imageFile) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        imageData = {
          flag: 'Y',
          path: `purposes/${imageFile.filename}`,
          name: imageFile.filename,
          url: `/uploads/purposes/${imageFile.filename}`
        };
      }

      const newPurpose = await StudentModel.addStudentPurpose({
        tenantId,
        purposeName: purposeName.trim(),
        createdBy,
        imageData
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Purpose added successfully",
        data: newPurpose
      };
    } catch (error) {
      console.error("Error in addStudentPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Update purpose
  static async updateStudentPurpose(
    purposeId,
    tenantId,
    purposeName,
    updatedBy
  ) {
    try {
      if (!purposeName || purposeName.trim() === "") {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose name is required"
        };
      }

      if (purposeName.length > 250) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose name too long (max 250 characters)"
        };
      }

      const exists = await StudentModel.checkPurposeExists(
        tenantId,
        purposeName.trim()
      );
      if (exists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose name already exists"
        };
      }

      const updatedPurpose = await StudentModel.updateStudentPurpose(
        purposeId,
        tenantId,
        purposeName.trim(),
        updatedBy
      );

      if (!updatedPurpose) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose not found or access denied"
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Purpose updated successfully",
        data: updatedPurpose
      };
    } catch (error) {
      console.error("Error in updateStudentPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Delete purpose
  static async deleteStudentPurpose(purposeId, tenantId, updatedBy) {
    try {
      const purpose = await StudentModel.checkPurposeStatus(purposeId, tenantId);

      if (!purpose) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose not found or access denied"
        };
      }

      if (purpose.isactive === "N" || purpose.IsActive === "N") {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose is already deleted"
        };
      }

      const deletedPurpose = await StudentModel.deleteStudentPurpose(
        purposeId,
        tenantId,
        updatedBy
      );

      if (!deletedPurpose) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Failed to delete purpose"
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Purpose deleted successfully",
        data: { purposeId: deletedPurpose.purposeId }
      };
    } catch (error) {
      console.error("Error in deleteStudentPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // 1. GET STUDENTS PENDING CHECKOUT (Students currently checked in)
  static async getPendingCheckout(tenantId) {
    try {
    const sql = `
      SELECT DISTINCT
        vr.VisitorRegID as studentId,
        vr.VisitorRegNo as studentRegNo,
        vr.VistorName as studentName,
        vr.Mobile as mobile,
        COALESCE(bvu.Course, vr.AssociatedBlock) as course,
        COALESCE(bvu.Hostel, vr.AssociatedFlat) as hostel,
        COALESCE(bvu.StudentID, vr.VisitorRegNo) as studentNumber,
        vh.RegVisitorHistoryID as historyId,
        vh.INTime as checkInTime,
        vh.INTimeTxt as checkInTimeText,
        vh.VisitPurposeID as visitPurposeId,
        vh.VisitPurpose as visitPurpose,
        EXTRACT(EPOCH FROM (NOW() - vh.INTime))/3600 as hoursCheckedIn
      FROM VisitorRegistration vr
      INNER JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID
      LEFT JOIN BulkVisitorUpload bvu ON vr.Mobile = bvu.Mobile AND bvu.Type = 'student'
      WHERE vr.TenantID = $1 
        AND vr.IsActive = 'Y'
        AND vr.VisitorCatName = 'Student'
        AND vh.TenantID = $1
        AND vh.IsActive = 'Y'
        AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '')
      ORDER BY vh.INTime DESC
    `;

    const result = await query(sql, [tenantId]);

    const students = result.rows.map(row => {
      const hoursCheckedIn = parseFloat(row.hourscheckedin) || 0;
      const hours = Math.floor(hoursCheckedIn);
      const minutes = Math.round((hoursCheckedIn % 1) * 60);

      return {
        studentId: row.studentid,
        studentRegNo: row.studentregno,
        studentName: row.studentname,
        mobile: row.mobile,
        course: row.course || '',
        hostel: row.hostel || '',
        studentNumber: row.studentnumber,
        historyId: row.historyid,
        checkInTime: row.checkintime,
        checkInTimeText: row.checkintimetext,
        visitPurpose: {
          purposeId: row.visitpurposeid,
          purposeName: row.visitpurpose
        },
        timeElapsed: {
          hours,
          minutes,
          totalHours: hoursCheckedIn,
          formatted: `${hours}h ${minutes}m`,
          display: `Checked in ${hours}h ${minutes}m ago`
        }
      };
    });

    return {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
      data: {
        pendingCheckout: students,
        count: students.length
      }
    };
  } catch (error) {
    console.error('Error fetching pending checkout students:', error);
    return {
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}

  // Delete student
  static async deleteStudent(studentId, tenantId, deletedBy) {
    try {
      const fs = require('fs');
      const path = require('path');

      const result = await StudentModel.deleteStudent(studentId, tenantId);

      if (!result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Student not found",
        };
      }

      // Clean up files if they exist
      if (result.photoPath && result.photoName) {
        const filePath = path.join(process.cwd(), 'uploads', result.photoPath, result.photoName);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
        }
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Student deleted successfully",
        data: {
          deletedStudentId: result.deletedStudent.visitorregid,
          deletedStudentNo: result.deletedStudent.visitorregno,
        },
      };
    } catch (error) {
      console.error("Error deleting student:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Error deleting student",
        error: error.message,
      };
    }
  }
}
module.exports = StudentService;
