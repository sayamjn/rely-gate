const StaffService = require('../services/staff.service');
const QRService = require('../services/qr.service');
const FileService = require('../services/file.service');
const responseUtils = require('../utils/constants');

class StaffController {
  // GET /api/staff/visit-history - Get all staff visit history
  static async getAllStaffVisitHistory(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = "",
        fromDate = null,
        toDate = null,
        visitorRegId = null,
        designation = null,
        VisitorSubCatID = null
      } = req.query;
      const userTenantId = req.user.tenantId;
      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        fromDate,
        toDate,
        visitorRegId: visitorRegId ? parseInt(visitorRegId) : null,
        designation,
        VisitorSubCatID: VisitorSubCatID ? parseInt(VisitorSubCatID) : null
      };
      const result = await StaffService.getAllStaffVisitHistory(
        userTenantId,
        filters
      );
      res.json(result);
    } catch (error) {
      console.error("Error in getAllStaffVisitHistory:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  // POST /api/staff/list - List staff with filters
  static async listStaff(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        designation = '',
        staffId = '',
        name = '',
        fromDate = null,
        toDate = null,
        tenantId
      } = req.body;
      
      const userTenantId = req.user.tenantId;


      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
        designation,
        staffId,
        name,
        fromDate,
        toDate
      };

      const result = await StaffService.getStaffList(userTenantId, filters);
      res.json(result);
    } catch (error) {
      console.error('Error in listStaff:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }


  // GET /api/staff - List staff with pagination and search
  static async getStaff(req, res) {
    try {
      const { page = 1, pageSize = 10, search = '', designation = '', tenantId } = req.query;
      const userTenantId = req.user.tenantId;


      const result = await StaffService.getStaff(
        userTenantId,
        parseInt(page),
        parseInt(pageSize),
        search,
        designation
      );

      // Map response to only return required fields
      if (result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS && result.data) {
        const mappedData = result.data.map(staff => ({
          VisitorRegid: staff.visitorregid || staff.VisitorRegId,
          VisitorRegNo: staff.VisitorRegNo || staff.visitorregno,
          VisitorName: staff.VistorName || staff.vistorname,
          mobile: staff.Mobile || staff.mobile,
          VisitorSubCatName: staff.VisitorSubCatName || staff.visitorsubcatname,
          flatName: staff.FlatName || staff.flatname || ''
        }));
        console.log(mappedData)

        res.json({
          ...result,
          data: mappedData
        });
      } else {
        res.json(result);
      }
    } catch (error) {
      console.error('Error in getStaff:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/staff/:staffId/checkin - Check-in staff member (First action)
  static async checkinStaff(req, res) {
    try {
      const { staffId } = req.params;
      const { tenantId } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;


      if (!staffId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff ID is required'
        });
      }

      const result = await StaffService.checkinStaff(
        parseInt(staffId),
        userTenantId,
        createdBy
      );

      res.json(result);
    } catch (error) {
      console.error('Error in checkinStaff:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/staff/:staffId/checkout - Check-out staff member (Second action)
  static async checkoutStaff(req, res) {
    try {
      const { staffId } = req.params;
      const { tenantId } = req.body;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username;


      if (!staffId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff ID is required'
        });
      }

      const result = await StaffService.checkoutStaff(
        parseInt(staffId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error('Error in checkoutStaff:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/staff/:staffId/history - Get staff visit history
  static async getStaffHistory(req, res) {
    try {
      const { staffId } = req.params;
      const { tenantId, limit = 10 } = req.query;
      const userTenantId = req.user.tenantId;


      const result = await StaffService.getStaffHistory(
        parseInt(staffId),
        userTenantId,
        parseInt(limit)
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getStaffHistory:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/staff/pending-checkout - Get staff currently checked in
  static async getPendingCheckout(req, res) {
    try {
      
      const userTenantId = req.user.tenantId;


      const result = await StaffService.getPendingCheckout(userTenantId);

      res.json(result);
    } catch (error) {
      console.error('Error in getPendingCheckout:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/staff/:staffId/status - Get staff's current status
  static async getStaffStatus(req, res) {
    try {
      const { staffId } = req.params;
      
      const userTenantId = req.user.tenantId;


      if (!staffId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff ID is required'
        });
      }

      const result = await StaffService.getStaffStatus(parseInt(staffId), userTenantId);

      res.json(result);
    } catch (error) {
      console.error('Error in getStaffStatus:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

    // POST /api/staff/register - Staff registration (OTP-based)
  static async registerStaff(req, res) {
    try {
      const { mobile, designation, tenantId } = req.body;
      const userTenantId = req.user.tenantId;


      const result = await StaffService.registerStaff(
        userTenantId,
        mobile,
        designation
      );
      res.json(result);
    } catch (error) {
      console.error('Error in registerStaff:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }


   // POST /api/staff/verify-registration - Verify OTP and complete registration
  static async verifyRegistration(req, res) {
    try {
      const {
        mobile,
        otpNumber,
        name,
        designation,
        address1,
        address2,
        remarks,
        vehicleNumber,
        tenantId,
        refId
      } = req.body;
      
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;


      const result = await StaffService.verifyRegistration(
        userTenantId,
        mobile,
        otpNumber,
        refId,
        {
          name,
          designation,
          address1,
          address2,
          remarks,
          vehicleNumber
        },
        createdBy
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error in verifyRegistration:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  static async exportStaff(req, res) {
  try {
    const { tenantId, designation } = req.query;
    const userTenantId = req.user.tenantId;

    if (tenantId && parseInt(tenantId) !== userTenantId) {
      return res.status(403).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Access denied for this tenant'
      });
    }

    const result = await StaffService.exportStaff(userTenantId, { designation });
    
    if (result.responseCode === responseUtils.RESPONSE_CODES.SUCCESS) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=staff_export.csv');
      res.send(result.csvData);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in exportStaff:', error);
    res.status(500).json({
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: 'Internal server error'
    });
  }
}

// Download CSV template
static async downloadTemplate(req, res) {
  try {
    const csvTemplate = [
      'Staff ID,Name,Mobile,Designation,Address',
      'STA1001001,John Doe,9876543210,Security,123 Main Street'
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=staff_upload_template.csv');
    res.send(csvTemplate);
  } catch (error) {
    console.error('Error in downloadTemplate:', error);
    res.status(500).json({
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: 'Internal server error'
    });
  }
}

    // GET /api/staff/designations - Get available designations
  static async getDesignations(req, res) {
    try {
      
      const userTenantId = req.user.tenantId;


      const result = await StaffService.getDesignations(userTenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getDesignations:', error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/staff/purposes - Get available staff purposes
  static async getStaffPurposes(req, res) {
    try {
      

      if (!tenantId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "TenantId is required",
        });
      }

      const result = await StaffService.getStaffPurposes(tenantId);
      res.json(result);
    } catch (error) {
      console.error("Error in getStaffPurposes:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }
  
  // POST /api/staff/designations - Add new designation (purpose)
  static async addStaffPurpose(req, res) {
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

      const result = await StaffService.addStaffPurpose(purposeData);

      const statusCode = result.responseCode === "S" ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in addStaffPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // PUT /api/staff/designations/:purposeId - Update designation (purpose)
  static async updateStaffPurpose(req, res) {
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

      const result = await StaffService.updateStaffPurpose(
        parseInt(purposeId),
        userTenantId,
        purposeName.trim(),
        updatedBy
      );

      const statusCode = result.responseCode === "S" ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in updateStaffPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // DELETE /api/staff/designations/:purposeId - Delete designation (purpose)
  static async deleteStaffPurpose(req, res) {
    try {
      const { purposeId } = req.params;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username || "System";

      if (!purposeId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Designation ID is required",
        });
      }

      const result = await StaffService.deleteStaffPurpose(
        parseInt(purposeId),
        userTenantId,
        updatedBy
      );

      const statusCode = result.responseCode === "S" ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error("Error in deleteStaffPurpose:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // GET /api/staff/sub-categories - List of staff sub categories
  static async getStaffSubCategories(req, res) {
    try {
      const userTenantId = req.user.tenantId;
      const result = await StaffService.getStaffSubCategories(userTenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getStaffSubCategories:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/staff/list - List staff with filters (query params, like students/buses)
  static async getStaffList(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = '',
        designation = '',
        staffId = '',
        VisitorSubCatID = 0,
        name = '',
        department = '',
        fromDate = '',
        toDate = ''
      } = req.query;

      const userTenantId = req.user.tenantId;

      const filters = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search: search.trim(),
        designation: designation.trim(),
        staffId: staffId.trim(),
        VisitorSubCatID: parseInt(VisitorSubCatID),
        name: name.trim(),
        department: department.trim(),
        fromDate: fromDate.trim(),
        toDate: toDate.trim()
      };

      const result = await StaffService.getStaffList(userTenantId, filters);
      res.json(result);
    } catch (error) {
      console.error('Error in getStaffList:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/staff/:staffId/generate-qr - Generate QR code for staff
  static async generateStaffQR(req, res) {
    try {
      const { staffId } = req.params;
      const userTenantId = req.user.tenantId;

      if (!staffId) {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Staff ID is required",
        });
      }

      // Get staff details
      const staff = await StaffService.getStaffById(parseInt(staffId), userTenantId);

      if (!staff || staff.responseCode !== responseUtils.RESPONSE_CODES.SUCCESS) {
        return res.status(404).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Staff not found",
        });
      }

      // Generate QR data with staff information
      const qrData = QRService.generateQRData(
        {
          tenantId: userTenantId,
          visitorRegNo: staff.data.staffCode, // Use staffCode as mainid
          visitorCatId: 3, // Staff category
          SecurityCode: staff.data.staffCode,
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
      const fileName = `staff_qr_${staffId}_${Date.now()}.png`;
      const filePath = await FileService.saveBase64Image(
        qrResult.qrBase64,
        FileService.categories.QR_CODES,
        fileName
      );

      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "QR code generated successfully",
        data: {
          staffId: staff.data.staffId,
          staffCode: staff.data.staffCode,
          staffName: staff.data.staffName,
          qrData: qrResult.qrData,
          qrImage: qrResult.qrImage,
          qrFilePath: filePath,
          fileName: fileName,
        },
      });
    } catch (error) {
      console.error("Error in generateStaffQR:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/staff/scan-qr - Process QR code scan and return check-in/check-out status
  static async scanStaffQR(req, res) {
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

      // Validate staff type
      if (type !== "sta") {
        return res.status(400).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "QR code is not for a staff member",
        });
      }

      // Get staff details by staff code
      const staff = await StaffService.getStaffByCode(mainid, userTenantId);

      if (!staff || staff.responseCode !== responseUtils.RESPONSE_CODES.SUCCESS) {
        return res.status(404).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Staff not found",
        });
      }

      // Get staff status to determine next action
      const statusResult = await StaffService.getStaffStatus(
        staff.data.staffId,
        userTenantId
      );

      if (statusResult.responseCode !== responseUtils.RESPONSE_CODES.SUCCESS) {
        return res.status(404).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Staff not found",
        });
      }

      // Determine next action and current status based on actual check-in state
      const isCurrentlyCheckedIn = statusResult.data.isCurrentlyCheckedIn;
      const nextAction = isCurrentlyCheckedIn ? "checkout" : "checkin";
      const currentStatus = isCurrentlyCheckedIn ? "CHECKED_IN" : "CHECKED_OUT";

      res.json({
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "QR scan processed successfully",
        data: {
          staffId: staff.data.staffId,
          tenantId: parseInt(tenantid),
          nextAction: nextAction,
          currentStatus: currentStatus,
          visitorRegId: staff.data.staffId,
          visitorRegNo: mainid,
          staff: {
            name: staff.data.staffName,
            regNo: staff.data.staffCode,
            mobile: staff.data.mobile,
            course: staff.data.department || "N/A",
            hostel: staff.data.designation || "N/A",
          },
          actionPrompt: nextAction === "checkin"
            ? "Staff is currently checked out. Do you want to check in?"
            : "Staff is currently available. Do you want to check out?",
          statusMessage: statusResult.data.actionDescription,
        },
      });
    } catch (error) {
      console.error("Error in scanStaffQR:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/staff/qr-checkin - QR-based check-in for staff
  static async qrCheckinStaff(req, res) {
    try {
      const { staffId, tenantId } = req.body;
      const userTenantId = tenantId || req.user.tenantId;
      const createdBy = req.user.username || "System";

      const result = await StaffService.checkinStaff(parseInt(staffId), userTenantId, createdBy);
      res.json(result);
    } catch (error) {
      console.error("Error in qrCheckinStaff:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }

  // POST /api/staff/qr-checkout - QR-based check-out for staff
  static async qrCheckoutStaff(req, res) {
    try {
      const { staffId, tenantId, purposeId, purposeName } = req.body;
      const userTenantId = tenantId || req.user.tenantId;
      const createdBy = req.user.username || "System";

      const result = await StaffService.checkoutStaff(
        parseInt(staffId),
        userTenantId,
        purposeId ? parseInt(purposeId) : null,
        purposeName,
        createdBy
      );
      res.json(result);
    } catch (error) {
      console.error("Error in qrCheckoutStaff:", error);
      res.status(500).json({
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: "Internal server error",
      });
    }
  }
}
module.exports = StaffController;