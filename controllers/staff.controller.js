const StaffService = require('../services/staff.service');
const responseUtils = require('../utils/constants');

class StaffController {
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
        designation,
        staffId,
        name,
        fromDate,
        toDate
      };

      const result = await StaffService.getStaffWithFilters(userTenantId, filters);
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
      const { page = 1, pageSize = 10, search = '', tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await StaffService.getStaff(
        userTenantId,
        parseInt(page),
        parseInt(pageSize),
        search
      );

      res.json(result);
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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      'StaffID,Name,Mobile,Designation,Email,Address',
      'STF001,John Doe,9876543210,Sales Executive,john.doe@company.com,123 Main St',
      'STF002,Jane Smith,9876543211,Manager,jane.smith@company.com,456 Oak Ave',
      'STF003,Mike Johnson,9876543212,Security,mike.johnson@company.com,789 Pine Rd'
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
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        });
      }

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
      const { tenantId } = req.query;

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
}
module.exports = StaffController;