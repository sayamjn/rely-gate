const { query } = require("../config/database");
const StaffModel = require("../models/staff.model");
const responseUtils = require("../utils/constants");
const MessagingService = require("./messaging.service");

class StaffService {
  // Get all staff with pagination and search
  static async getStaff(tenantId, page = 1, pageSize = 10, search = "") {
    try {
      const staff = await StaffModel.getStaff(tenantId, page, pageSize, search);
      const totalCount = await StaffModel.getStaffCount(tenantId, search);

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: staff.rows,
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
      console.error("Error fetching staff:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Check-in staff member (First action - arrival for work, creates INTime)
  static async checkinStaff(staffId, tenantId, createdBy) {
    try {
      const staff = await StaffModel.getStaffById(staffId, tenantId);

      if (!staff) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Staff not found",
        };
      }

      const activeVisit = await StaffModel.getActiveVisit(staffId, tenantId);

      if (activeVisit && (!activeVisit.outtime || !activeVisit.outtimetxt)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Staff is already checked in",
          data: {
            historyId: activeVisit.regvisitorhistoryid,
            checkinTime: activeVisit.intimetxt,
            staffName: activeVisit.vistorname,
          },
        };
      }

      const visitHistory = await StaffModel.createVisitHistory({
        tenantId,
        visitorRegId: staff.visitorregid,
        visitorRegNo: staff.visitorregno,
        securityCode: staff.securitycode,
        vistorName: staff.vistorname,
        mobile: staff.mobile,
        vehicleNo: staff.vehicleno || "",
        visitorCatId: 1, // Staff category
        visitorCatName: "Staff",
        visitorSubCatId: staff.visitorsubcatid,
        visitorSubCatName: staff.visitorsubcatname,
        associatedFlat: staff.associatedflat || "",
        associatedBlock: staff.associatedblock || "",
        createdBy,
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Staff checked in successfully",
        data: {
          historyId: visitHistory.regvisitorhistoryid,
          staffId: staffId,
          staffName: staff.vistorname,
          checkinTime: visitHistory.intimetxt,
          staffType: staff.visitorsubcatname,
          action: "CHECKED_IN",
        },
      };
    } catch (error) {
      console.error("Error checking in staff:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Check-out staff member (Second action - leaving work, adds OutTime)
  static async checkoutStaff(staffId, tenantId, updatedBy) {
    try {
      const staff = await StaffModel.getStaffById(staffId, tenantId);

      if (!staff) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Staff not found",
        };
      }

      const activeVisit = await StaffModel.getActiveVisit(staffId, tenantId);

      if (!activeVisit) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Staff is not currently checked in",
        };
      }

      const updatedVisit = await StaffModel.updateVisitHistory(
        activeVisit.regvisitorhistoryid,
        tenantId,
        updatedBy
      );

      if (!updatedVisit) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Failed to check out staff",
        };
      }

      // Calculate duration
      const checkinTime = new Date(activeVisit.intime);
      const checkoutTime = new Date(updatedVisit.outtime);
      const durationHours = (checkoutTime - checkinTime) / (1000 * 60 * 60);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Staff checked out successfully",
        data: {
          historyId: updatedVisit.regvisitorhistoryid,
          staffId: staffId,
          staffName: staff.vistorname,
          checkinTime: updatedVisit.intimetxt,
          checkoutTime: updatedVisit.outtimetxt,
          durationHours: Math.round(durationHours * 100) / 100,
          staffType: staff.visitorsubcatname,
          action: "CHECKED_OUT",
        },
      };
    } catch (error) {
      console.error("Error checking out staff:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get staff visit history
  static async getStaffHistory(staffId, tenantId, limit = 10) {
    try {
      const staff = await StaffModel.getStaffById(staffId, tenantId);

      if (!staff) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Staff not found",
        };
      }

      const history = await StaffModel.getStaffHistory(
        staffId,
        tenantId,
        limit
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: {
          staffInfo: {
            staffId: staff.visitorregid,
            staffName: staff.vistorname,
            staffRegNo: staff.visitorregno,
            staffType: staff.visitorsubcatname,
            mobile: staff.mobile,
          },
          visitHistory: history,
        },
      };
    } catch (error) {
      console.error("Error fetching staff history:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get staff currently checked in (pending checkout)
  static async getPendingCheckout(tenantId) {
    try {
      const pendingStaff = await StaffModel.getPendingCheckout(tenantId);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: pendingStaff,
        count: pendingStaff.length,
      };
    } catch (error) {
      console.error("Error fetching pending checkout staff:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get staff status (first visit check)
  static async getStaffStatus(staffId, tenantId) {
    try {
      const status = await StaffModel.getStaffStatus(staffId, tenantId);

      if (!status) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Staff not found",
        };
      }

      // Determine what action is available
      let availableAction = "";
      let actionDescription = "";

      if (status.isFirstVisit) {
        availableAction = "CHECKIN";
        actionDescription = "Staff can check in (first visit)";
      } else if (status.isCurrentlyCheckedIn) {
        availableAction = "CHECKOUT";
        actionDescription = "Staff can check out (currently checked in)";
      } else {
        availableAction = "CHECKIN";
        actionDescription = "Staff can check in (not currently checked in)";
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: {
          ...status,
          availableAction,
          actionDescription,
        },
      };
    } catch (error) {
      console.error("Error fetching staff status:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get staff with filters (similar to student/bus list)
  static async getStaffWithFilters(tenantId, filters) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = "",
        designation = "",
        staffId = "",
        name = "",
        department = "",
        fromDate = null,
        toDate = null,
      } = filters;

      const offset = (page - 1) * pageSize;

      // Build dynamic WHERE conditions
      let whereConditions = [
        "vr.TenantID = $1",
        "vr.IsActive = 'Y'",
        "vr.VisitorCatName = 'Staff'",
      ];
      let params = [tenantId];
      let paramIndex = 2;

      if (search && search.trim()) {
        whereConditions.push(`(
        vr.VistorName ILIKE $${paramIndex} OR 
        vr.Mobile ILIKE $${paramIndex} OR 
        vr.VisitorRegNo ILIKE $${paramIndex} OR
        vr.Email ILIKE $${paramIndex}
      )`);
        params.push(`%${search.trim()}%`);
        paramIndex++;
      }

      if (designation && designation.trim()) {
        whereConditions.push(`vr.VisitorSubCatName ILIKE $${paramIndex}`);
        params.push(`%${designation.trim()}%`);
        paramIndex++;
      }

      if (staffId && staffId.trim()) {
        whereConditions.push(`vr.VisitorRegNo ILIKE $${paramIndex}`);
        params.push(`%${staffId.trim()}%`);
        paramIndex++;
      }

      if (name && name.trim()) {
        whereConditions.push(`vr.VistorName ILIKE $${paramIndex}`);
        params.push(`%${name.trim()}%`);
        paramIndex++;
      }

      if (department && department.trim()) {
        whereConditions.push(`vr.AssociatedBlock ILIKE $${paramIndex}`);
        params.push(`%${department.trim()}%`);
        paramIndex++;
      }

      if (fromDate) {
        whereConditions.push(`DATE(vr.CreatedDate) >= $${paramIndex}`);
        params.push(fromDate);
        paramIndex++;
      }

      if (toDate) {
        whereConditions.push(`DATE(vr.CreatedDate) <= $${paramIndex}`);
        params.push(toDate);
        paramIndex++;
      }

      const whereClause = whereConditions.join(" AND ");

      // Count query first (simpler)
      const countQuery = `
      SELECT COUNT(*) as total
      FROM VisitorRegistration vr
      WHERE ${whereClause}
    `;

      // Main data query with simplified structure
      const dataQuery = `
      SELECT 
        vr.VisitorRegID as staffId,
        vr.VistorName as name,
        vr.Mobile as mobile,
        vr.VisitorRegNo as staffRegNo,
        vr.VisitorSubCatName as designation,
        vr.AssociatedFlat as workLocation,
        vr.AssociatedBlock as department,
        vr.Email as email,
        vr.StatusName as status,
        vr.CreatedDate as registrationDate,
        
        -- Get latest visit info using a simpler approach
        (
          SELECT vm1.INTime 
          FROM VisitorMaster vm1 
          WHERE vm1.Mobile = vr.Mobile 
            AND vm1.TenantID = vr.TenantID 
          ORDER BY vm1.VisitDate DESC, vm1.CreatedDate DESC 
          LIMIT 1
        ) as lastInTime,
        
        (
          SELECT vm2.OUTTime 
          FROM VisitorMaster vm2 
          WHERE vm2.Mobile = vr.Mobile 
            AND vm2.TenantID = vr.TenantID 
          ORDER BY vm2.VisitDate DESC, vm2.CreatedDate DESC 
          LIMIT 1
        ) as lastOutTime,
        
        (
          SELECT vm3.VisitDate 
          FROM VisitorMaster vm3 
          WHERE vm3.Mobile = vr.Mobile 
            AND vm3.TenantID = vr.TenantID 
          ORDER BY vm3.VisitDate DESC, vm3.CreatedDate DESC 
          LIMIT 1
        ) as lastVisitDate

      FROM VisitorRegistration vr
      WHERE ${whereClause}
      ORDER BY vr.VistorName
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

      // Add pagination parameters
      const dataParams = [...params, pageSize, offset];
      const countParams = [...params];

      // Execute both queries
      const [dataResult, countResult] = await Promise.all([
        query(dataQuery, dataParams),
        query(countQuery, countParams),
      ]);

      const totalCount = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalCount / pageSize);
      const currentPage = page;

      // Format duration helper
      const formatDuration = (startTime, endTime) => {
        if (!startTime) return "0 min";

        const end = endTime ? new Date(endTime) : new Date();
        const start = new Date(startTime);
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 1) {
          const minutes = Math.floor(diffMs / (1000 * 60));
          return `${minutes}m`;
        }

        const hours = Math.floor(diffHours);
        const minutes = Math.floor((diffHours - hours) * 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      };

      // Calculate current status
      const calculateStatus = (inTime, outTime) => {
        if (!inTime) return "NEVER_VISITED";
        if (inTime && !outTime) return "CHECKED_IN";
        if (inTime && outTime) return "CHECKED_OUT";
        return "NEVER_VISITED";
      };

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: dataResult.rows.map((staff) => {
          const currentStatus = calculateStatus(
            staff.lastintime,
            staff.lastouttime
          );

          return {
            staffId: staff.staffid,
            name: staff.name,
            mobile: staff.mobile,
            staffRegNo: staff.staffregno,
            designation: staff.designation,
            workLocation: staff.worklocation,
            department: staff.department,
            email: staff.email,
            status: staff.status,
            registrationDate: staff.registrationdate,
            visits: {
              lastInTime: staff.lastintime,
              lastOutTime: staff.lastouttime,
              lastVisitDate: staff.lastvisitdate,
              duration: formatDuration(staff.lastintime, staff.lastouttime),
            },
            currentStatus: currentStatus,
            isCheckedIn: currentStatus === "CHECKED_IN",
            isCheckedOut: currentStatus === "CHECKED_OUT",
          };
        }),
        pagination: {
          currentPage,
          pageSize,
          totalCount,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
        filters: filters,
      };
    } catch (error) {
      console.error("Error fetching staff with filters:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get available designations
  static async getDesignations(tenantId) {
    try {
      const sql = `
      SELECT DISTINCT
        VisitorSubCatID as designationId,
        VisitorSubCatName as designationName,
        COUNT(*) as staffCount
      FROM VisitorRegistration
      WHERE TenantID = $1 
        AND IsActive = 'Y' 
        AND VisitorCatName = 'Staff'
      GROUP BY VisitorSubCatID, VisitorSubCatName
      ORDER BY VisitorSubCatName
    `;

      const result = await query(sql, [tenantId]);

      const predefinedSql = `
      SELECT 
        VisitorSubCatID as designationId,
        VisitorSubCatName as designationName,
        0 as staffCount
      FROM VisitorSubCategory
      WHERE TenantID = $1 
        AND IsActive = 'Y'
        AND VisitorCatID = 1  -- Staff category
      ORDER BY VisitorSubCatName
    `;

      const predefinedResult = await query(predefinedSql, [tenantId]);

      // Combine and deduplicate
      const allDesignations = [...result.rows, ...predefinedResult.rows];
      const uniqueDesignations = allDesignations.reduce((acc, curr) => {
        const existing = acc.find(
          (d) => d.designationname === curr.designationname
        );
        if (!existing) {
          acc.push(curr);
        } else if (curr.staffcount > 0) {
          existing.staffcount = curr.staffcount;
        }
        return acc;
      }, []);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: uniqueDesignations.sort((a, b) =>
          a.designationname.localeCompare(b.designationname)
        ),
        count: uniqueDesignations.length,
      };
    } catch (error) {
      console.error("Error fetching designations:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Staff registration with OTP
  static async registerStaff(tenantId, mobile, designation) {
    try {
      // Check if staff already exists
      const checkSql = `
      SELECT COUNT(*) as count
      FROM VisitorRegistration
      WHERE TenantID = $1 AND Mobile = $2 AND VisitorCatName = 'Staff' AND IsActive = 'Y'
    `;
      const checkResult = await query(checkSql, [tenantId, mobile]);

      if (checkResult.rows[0].count > 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage:
            "Staff member with this mobile number already exists",
        };
      }

      // Generate OTP

      const otpResult = await MessagingService.generateAndSendOTP(
        tenantId,
        mobile,
        "System"
      );

      // In production, send actual SMS here
      console.log(
        `OTP for staff registration: ${otpResult.otpNumber} to ${mobile}`
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: `OTP sent to ${mobile.substring(
          0,
          5
        )}***${mobile.substring(8)}`,
        data: {
          refId: otpResult.refId,
          mobile: mobile,
          designation: designation,
          otpSent: true,
        },
      };
    } catch (error) {
      console.error("Error in staff registration:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  static async verifyRegistration(
    tenantId,
    mobile,
    otpNumber,
    refId,
    staffData,
    createdBy
  ) {
    try {
      const verification = await MessagingService.verifyOTP(
        refId,
        otpNumber,
        mobile
      );

      if (!verification.verified) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid or expired OTP",
        };
      }

      // Get designation details
      const designationSql = `
      SELECT VisitorSubCatID
      FROM VisitorSubCategory
      WHERE TenantID = $1 AND VisitorSubCatName = $2 AND VisitorCatID = 1 AND IsActive = 'Y'
      LIMIT 1
    `;
      const designationResult = await query(designationSql, [
        tenantId,
        staffData.designation,
      ]);

      let visitorSubCatId = 1; // Default
      if (designationResult.rows.length > 0) {
        visitorSubCatId = designationResult.rows[0].visitorsubcatid;
      }

      // Generate staff registration number
      const staffRegNo = `STA${tenantId}${Date.now().toString().slice(-6)}`;
      const securityCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // Insert staff registration
      const insertSql = `
      INSERT INTO VisitorRegistration (
        TenantID, VistorName, Mobile, VisitorCatID, VisitorCatName,
        VisitorSubCatID, VisitorSubCatName, VisitorRegNo, SecurityCode,
        StatusID, StatusName, IsActive, Email, AssociatedFlat, AssociatedBlock,
        CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES (
        $1, $2, $3, 1, 'Staff', $4, $5, $6, $7, 1, 'ACTIVE', 'Y',
        $8, $9, $10, NOW(), NOW(), $11, $11
      ) RETURNING VisitorRegID
    `;

      const values = [
        tenantId,
        staffData.name,
        mobile,
        visitorSubCatId,
        staffData.designation,
        staffRegNo,
        securityCode,
        staffData.email || "",
        staffData.address1 || "",
        staffData.address2 || "",
        createdBy,
      ];

      const result = await query(insertSql, values);

      // Deactivate OTP
      await query("UPDATE PortalOTP SET IsActive = 'N' WHERE PPOTPID = $1", [
        refId,
      ]);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Staff registration completed successfully",
        data: {
          staffId: result.rows[0].visitorregid,
          staffRegNo: staffRegNo,
          name: staffData.name,
          mobile: mobile,
          designation: staffData.designation,
          securityCode: securityCode,
        },
      };
    } catch (error) {
      console.error("Error in verify registration:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Add new designation (purpose)
  static async addStaffPurpose(purposeData) {
    try {
      const { tenantId, purposeName, createdBy, imageFile } = purposeData;

      if (!purposeName || purposeName.trim() === "") {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Designation name is required"
        };
      }

      if (purposeName.length > 250) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Designation name too long (max 250 characters)"
        };
      }

      const exists = await StaffModel.checkPurposeExists(
        tenantId,
        purposeName.trim()
      );
      if (exists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Designation already exists for this tenant"
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
          url: `${baseUrl}/uploads/purposes/${imageFile.filename}`
        };
      }

      const newPurpose = await StaffModel.addStaffPurpose({
        tenantId,
        purposeName: purposeName.trim(),
        createdBy,
        imageData
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Designation added successfully",
        data: newPurpose
      };
    } catch (error) {
      console.error("Error in addStaffPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Update designation (purpose)
  static async updateStaffPurpose(
    purposeId,
    tenantId,
    purposeName,
    updatedBy
  ) {
    try {
      if (!purposeName || purposeName.trim() === "") {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Designation name is required"
        };
      }

      if (purposeName.length > 250) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Designation name too long (max 250 characters)"
        };
      }

      const exists = await StaffModel.checkPurposeExists(
        tenantId,
        purposeName.trim()
      );
      if (exists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Designation name already exists"
        };
      }

      const updatedPurpose = await StaffModel.updateStaffPurpose(
        purposeId,
        tenantId,
        purposeName.trim(),
        updatedBy
      );

      if (!updatedPurpose) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Designation not found or access denied"
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Designation updated successfully",
        data: updatedPurpose
      };
    } catch (error) {
      console.error("Error in updateStaffPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Delete designation (purpose)
  static async deleteStaffPurpose(purposeId, tenantId, updatedBy) {
    try {
      const purpose = await StaffModel.checkPurposeStatus(purposeId, tenantId);

      if (!purpose) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Designation not found or access denied"
        };
      }

      if (purpose.isactive === "N" || purpose.IsActive === "N") {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Designation is already deleted"
        };
      }

      const deletedPurpose = await StaffModel.deleteStaffPurpose(
        purposeId,
        tenantId,
        updatedBy
      );

      if (!deletedPurpose) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Failed to delete designation"
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Designation deleted successfully",
        data: { purposeId: deletedPurpose.purposeId }
      };
    } catch (error) {
      console.error("Error in deleteStaffPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Export staff data to CSV
  static async exportStaff(tenantId, filters = {}) {
    try {
      let whereConditions = [
        "TenantID = $1",
        "IsActive = 'Y'",
        "VisitorCatName = 'Staff'",
      ];
      let params = [tenantId];
      let paramIndex = 2;

      if (filters.designation && filters.designation.trim()) {
        whereConditions.push(`VisitorSubCatName ILIKE $${paramIndex}`);
        params.push(`%${filters.designation.trim()}%`);
        paramIndex++;
      }

      if (filters.department && filters.department.trim()) {
        whereConditions.push(`AssociatedBlock ILIKE $${paramIndex}`);
        params.push(`%${filters.department.trim()}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.join(" AND ");

      const sql = `
      SELECT 
        VisitorRegNo as "Staff ID",
        VistorName as "Name",
        Mobile as "Mobile",
        VisitorSubCatName as "Designation",
        COALESCE(AssociatedBlock, '') as "Department",
        COALESCE(Email, '') as "Email",
        COALESCE(AssociatedFlat, '') as "Address",
        StatusName as "Status",
        TO_CHAR(CreatedDate, 'YYYY-MM-DD') as "Registration Date"
      FROM VisitorRegistration
      WHERE ${whereClause}
      ORDER BY VistorName
    `;

      const result = await query(sql, params);

      if (result.rows.length === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "No staff data found for export",
        };
      }

      // Convert to CSV
      const headers = Object.keys(result.rows[0]);
      const csvRows = [headers.join(",")];

      result.rows.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header] || "";
          // Escape quotes and wrap in quotes if contains comma or quotes
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
      console.error("Error exporting staff:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get staff purposes
  static async getStaffPurposes(tenantId) {
    try {
      const purposes = await StaffModel.getStaffPurposes(tenantId);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Staff purposes retrieved successfully",
        data: purposes,
        count: purposes.length
      };
    } catch (error) {
      console.error("Error in getStaffPurposes service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }
}

module.exports = StaffService;
