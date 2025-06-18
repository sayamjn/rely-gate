const VisitorService = require('../services/visitor.service');

class VisitorController {
  // GET /api/visitors/purposes
  static async getVisitorPurposes(req, res) {
    try {
      const { tenantId, purposeCatId = 0 } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await VisitorService.getVisitorPurposes(
        userTenantId, 
        parseInt(purposeCatId)
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getVisitorPurposes:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/visitors/subcategories
  static async getVisitorSubCategories(req, res) {
    try {
      const { tenantId, visitorCatId = 0 } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await VisitorService.getVisitorSubCategories(
        userTenantId, 
        parseInt(visitorCatId)
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getVisitorSubCategories:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/visitors/send-otp
  static async sendOTP(req, res) {
    try {
      const { mobile, tenantId, visitorTypeId } = req.body;
      const userTenantId = req.user.tenantId;
      const appUser = req.user.username;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      if (!mobile) {
        return res.status(400).json({
          responseCode: 'E',
          responseMessage: 'Mobile number is required'
        });
      }

      const result = await VisitorService.sendOTP(
        mobile, 
        userTenantId, 
        visitorTypeId, 
        appUser
      );

      res.json(result);
    } catch (error) {
      console.error('Error in sendOTP:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/visitors/send-unregistered-otp
  static async sendUnregisteredOTP(req, res) {
    try {
      const { mobile, tenantId } = req.body;
      const userTenantId = req.user.tenantId;
      const appUser = req.user.username;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      if (!mobile) {
        return res.status(400).json({
          responseCode: 'E',
          responseMessage: 'Mobile number is required'
        });
      }

      const result = await VisitorService.sendUnregisteredOTP(
        mobile, 
        userTenantId, 
        appUser
      );

      res.json(result);
    } catch (error) {
      console.error('Error in sendUnregisteredOTP:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/visitors/verify-otp
  static async verifyOTP(req, res) {
    try {
      const { refId, otpNumber, mobile } = req.body;

      if (!refId || !otpNumber || !mobile) {
        return res.status(400).json({
          responseCode: 'E',
          responseMessage: 'RefId, OTP number, and mobile are required'
        });
      }

      const result = await VisitorService.verifyOTP(refId, otpNumber, mobile);

      res.json(result);
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/visitors/create-unregistered
  static async createUnregisteredVisitor(req, res) {
    try {
      const {
        tenantId, fname, mobile, vehicleNo, flatName, visitorCatId,
        visitorCatName, visitorSubCatId, visitorSubCatName, visitPurposeId,
        visitPurpose, totalVisitor, photoPath, vehiclePhotoPath
      } = req.body;

      const userTenantId = req.user;
      console.log("userTenantId: ", userTenantId)
      const createdBy = req.user.username;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      // Validate required fields
      if (!fname || !mobile || !flatName || !visitorCatId || !visitorSubCatId) {
        return res.status(400).json({
          responseCode: 'E',
          responseMessage: 'Required fields: fname, mobile, flatName, visitorCatId, visitorSubCatId'
        });
      }

      const visitorData = {
        tenantId: userTenantId,
        fname,
        mobile,
        vehicleNo,
        flatName,
        visitorCatId: parseInt(visitorCatId),
        visitorCatName,
        visitorSubCatId: parseInt(visitorSubCatId),
        visitorSubCatName,
        visitPurposeId: visitPurposeId ? parseInt(visitPurposeId) : null,
        visitPurpose,
        totalVisitor: totalVisitor ? parseInt(totalVisitor) : 1,
        photoPath,
        vehiclePhotoPath,
        createdBy
      };

      const result = await VisitorService.createUnregisteredVisitor(visitorData);

      res.json(result);
    } catch (error) {
      console.error('Error in createUnregisteredVisitor:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // POST /api/visitors/create-registered
  static async createRegisteredVisitor(req, res) {
    try {
      const {
        tenantId, vistorName, mobile, email, visitorCatId, visitorCatName,
        visitorSubCatId, visitorSubCatName, flatId, flatName, vehicleNo,
        identityId, idName, idNumber, photoPath, vehiclePhotoPath, idPhotoPath
      } = req.body;

      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      // Validate required fields
      if (!vistorName || !mobile || !visitorCatId || !visitorSubCatId) {
        return res.status(400).json({
          responseCode: 'E',
          responseMessage: 'Required fields: vistorName, mobile, visitorCatId, visitorSubCatId'
        });
      }

      const visitorData = {
        tenantId: userTenantId,
        vistorName,
        mobile,
        email,
        visitorCatId: parseInt(visitorCatId),
        visitorCatName,
        visitorSubCatId: parseInt(visitorSubCatId),
        visitorSubCatName,
        flatId: flatId ? parseInt(flatId) : null,
        flatName,
        vehicleNo,
        identityId: identityId ? parseInt(identityId) : null,
        idName,
        idNumber,
        photoPath,
        vehiclePhotoPath,
        idPhotoPath,
        createdBy
      };

      const result = await VisitorService.createRegisteredVisitor(visitorData);

      res.json(result);
    } catch (error) {
      console.error('Error in createRegisteredVisitor:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/visitors/registered
  static async getRegisteredVisitors(req, res) {
    try {
      const { tenantId, visitorCatId = 0, visitorSubCatId = 0 } = req.query;
      const userTenantId = req.user.tenantId;

      // Validate tenant access
      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await VisitorService.getRegisteredVisitors(
        userTenantId,
        parseInt(visitorCatId),
        parseInt(visitorSubCatId)
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getRegisteredVisitors:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // PUT /api/visitors/:visitorId/checkout
  static async checkoutVisitor(req, res) {
    try {
      const { visitorId } = req.params;
      const { tenantId } = req.body;
      const userTenantId = req.user.tenantId;

      // Validate tenant access
      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      if (!visitorId) {
        return res.status(400).json({
          responseCode: 'E',
          responseMessage: 'Visitor ID is required'
        });
      }

      const result = await VisitorService.checkoutVisitor(
        parseInt(visitorId),
        userTenantId
      );

      res.json(result);
    } catch (error) {
      console.error('Error in checkoutVisitor:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

    static async checkinVisitor(req, res) {
    try {
      const { visitorRegId, tenantId } = req.body;
      const userTenantId = req.user.tenantId;
      const createdBy = req.user.username;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      if (!visitorRegId) {
        return res.status(400).json({
          responseCode: 'E',
          responseMessage: 'Visitor registration ID is required'
        });
      }

      const result = await VisitorService.checkinRegisteredVisitor(
        parseInt(visitorRegId),
        userTenantId,
        createdBy
      );

      res.json(result);
    } catch (error) {
      console.error('Error in checkinVisitor:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // PUT /api/visitors/history/:historyId/checkout
  static async checkoutVisitorHistory(req, res) {
    try {
      const { historyId } = req.params;
      const { tenantId } = req.body;
      const userTenantId = req.user.tenantId;
      const updatedBy = req.user.username;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      if (!historyId) {
        return res.status(400).json({
          responseCode: 'E',
          responseMessage: 'History ID is required'
        });
      }

      const result = await VisitorService.checkoutRegisteredVisitor(
        parseInt(historyId),
        userTenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      console.error('Error in checkoutVisitorHistory:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/visitors/:visitorRegId/history
  static async getVisitorHistory(req, res) {
    try {
      const { visitorRegId } = req.params;
      const { tenantId, limit = 10 } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await VisitorService.getVisitHistory(
        parseInt(visitorRegId),
        userTenantId,
        parseInt(limit)
      );

      res.json(result);
    } catch (error) {
      console.error('Error in getVisitorHistory:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }

  // GET /api/visitors/pending-checkout
  static async getPendingCheckout(req, res) {
    try {
      const { tenantId } = req.query;
      const userTenantId = req.user.tenantId;

      if (tenantId && parseInt(tenantId) !== userTenantId) {
        return res.status(403).json({
          responseCode: 'E',
          responseMessage: 'Access denied for this tenant'
        });
      }

      const result = await VisitorService.getVisitorsPendingCheckout(userTenantId);

      res.json(result);
    } catch (error) {
      console.error('Error in getPendingCheckout:', error);
      res.status(500).json({
        responseCode: 'E',
        responseMessage: 'Internal server error'
      });
    }
  }
}

module.exports = VisitorController;