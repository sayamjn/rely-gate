const VisitorModel = require('../models/visitor.model');
const OTPModel = require('../models/otp.model');
const fs = require('fs').promises;
const path = require('path');
const responseUtils = require("../utils/constants")

class VisitorService {

  // Get visitor purposes by category
  static async getVisitorPurposes(tenantId, purposeCatId = 0) {
    try {
      const purposes = await VisitorModel.getVisitorPurposeByCategory(tenantId, purposeCatId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: purposes,
        count: purposes.length
      };
    } catch (error) {
      console.error('Error fetching visitor purposes:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get visitor subcategories
  static async getVisitorSubCategories(tenantId, visitorCatId = 0) {
    try {
      const subcategories = await VisitorModel.getVisitorSubCategories(tenantId, visitorCatId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: subcategories,
        count: subcategories.length
      };
    } catch (error) {
      console.error('Error fetching visitor subcategories:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Send OTP for visitor registration
  static async sendOTP(mobile, tenantId, visitorTypeId, appuser) {
    try {
      // Validate mobile number
      if (!mobile || mobile.length !== 10 || !/^\d+$/.test(mobile)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid mobile number'
        };
      }

      // Check if visitor already exists for registered visitors
      if (visitorTypeId) {
        const exists = await VisitorModel.checkVisitorExists(mobile, tenantId, parseInt(visitorTypeId));
        if (exists) {
          return {
            responseCode: responseUtils.RESPONSE_CODES.MOBILE_EXISTS,
            responseMessage: responseUtils.RESPONSE_MESSAGES.MOBILE_EXISTS
          };
        }
      }

      // Generate and store OTP
      const otpResult = await OTPModel.generateOTP(tenantId, mobile, appuser);

      // In production, you would integrate with SMS gateway here
      // For now, we'll just return the OTP for testing
      console.log(`OTP for ${mobile}: ${otpResult.otpNumber}`);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.OTP_SENT,
        refId: otpResult.refId,
        // Remove this in production - only for testing
        otp: process.env.NODE_ENV === 'development' ? otpResult.otpNumber : undefined
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Send OTP for unregistered visitors
  static async sendUnregisteredOTP(mobile, tenantId, appuser) {
    try {
      // Validate mobile number
      if (!mobile || mobile.length !== 10 || !/^\d+$/.test(mobile)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid mobile number'
        };
      }

      // Generate and store OTP
      const otpResult = await OTPModel.generateOTP(tenantId, mobile, appuser);

      // Get recent visitor data for this mobile
      const recentVisitors = await VisitorModel.getRecentVisitorByMobile(tenantId, mobile);

      // In production, integrate with SMS gateway
      console.log(`OTP for ${mobile}: ${otpResult.otpNumber}`);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.OTP_SENT,
        refId: otpResult.refId,
        data: recentVisitors,
        // Remove this in production - only for testing
        otp: process.env.NODE_ENV === 'development' ? otpResult.otpNumber : undefined
      };
    } catch (error) {
      console.error('Error sending unregistered OTP:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Verify OTP
  static async verifyOTP(refId, otpNumber, mobile) {
    try {
      const verification = await OTPModel.verifyOTP(refId, otpNumber, mobile);

      if (verification.verified) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: responseUtils.RESPONSE_MESSAGES.OTP_VERIFIED,
          tenantId: verification.tenantId,
          mobile: verification.mobile
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: responseUtils.RESPONSE_MESSAGES.OTP_INVALID
        };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Save base64 image to file system
  static async saveImage(base64String, imageName, extension, filePath) {
    try {
      if (!base64String || extension === 'N/A') {
        return false;
      }

      // Ensure directory exists
      await fs.mkdir(filePath, { recursive: true });

      // Clean base64 string
      const cleanBase64 = base64String.replace(/\n/g, '').replace(/ /g, '');
      const imageBuffer = Buffer.from(cleanBase64, 'base64');

      // Save file
      const fullPath = path.join(filePath, `${imageName}${extension}`);
      await fs.writeFile(fullPath, imageBuffer);

      return true;
    } catch (error) {
      console.error('Error saving image:', error);
      return false;
    }
  }

  // Create unregistered visitor
  static async createUnregisteredVisitor(visitorData) {
    try {
      const {
        tenantId, fname, mobile, vehicleNo, flatName, visitorCatId,
        visitorCatName, visitorSubCatId, visitorSubCatName, visitPurposeId,
        visitPurpose, totalVisitor, photoPath, vehiclePhotoPath, createdBy
      } = visitorData;

      // Handle photo uploads
      let photoData = null;
      let vehiclePhotoData = null;

      if (photoPath) {
        const photoName = `UnRegVisitor_${Date.now()}`;
        const saved = await this.saveImage(photoPath, photoName, '.jpeg', './uploads/visitors/');
        if (saved) photoData = `${photoName}.jpeg`;
      }

      if (vehiclePhotoPath) {
        const vehiclePhotoName = `Vehicle_${Date.now()}`;
        const saved = await this.saveImage(vehiclePhotoPath, vehiclePhotoName, '.jpeg', './uploads/vehicles/');
        if (saved) vehiclePhotoData = `${vehiclePhotoName}.jpeg`;
      }

      const result = await VisitorModel.createUnregisteredVisitor({
        ...visitorData,
        photoData,
        vehiclePhotoData
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.VISITOR_CREATED,
        visitorId: result.visitorid
      };
    } catch (error) {
      console.error('Error creating unregistered visitor:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Create registered visitor
  static async createRegisteredVisitor(visitorData) {
    try {
      const {
        tenantId, vistorName, mobile, email, visitorCatId, visitorCatName,
        visitorSubCatId, visitorSubCatName, flatId, flatName, vehicleNo,
        identityId, idName, idNumber, photoPath, vehiclePhotoPath,
        idPhotoPath, createdBy
      } = visitorData;

      // Handle photo uploads
      let photoData = null;
      let vehiclePhotoData = null;
      let idPhotoData = null;

      if (photoPath) {
        const photoName = `RegVisitor_${Date.now()}`;
        const saved = await this.saveImage(photoPath, photoName, '.jpeg', './uploads/registered_visitors/');
        if (saved) photoData = `${photoName}.jpeg`;
      }

      if (vehiclePhotoPath) {
        const vehiclePhotoName = `RegVehicle_${Date.now()}`;
        const saved = await this.saveImage(vehiclePhotoPath, vehiclePhotoName, '.jpeg', './uploads/vehicles/');
        if (saved) vehiclePhotoData = `${vehiclePhotoName}.jpeg`;
      }

      if (idPhotoPath) {
        const idPhotoName = `RegVisitorID_${Date.now()}`;
        const saved = await this.saveImage(idPhotoPath, idPhotoName, '.jpeg', './uploads/visitor_ids/');
        if (saved) idPhotoData = `${idPhotoName}.jpeg`;
      }

      const result = await VisitorModel.createRegisteredVisitor({
        ...visitorData,
        photoData,
        vehiclePhotoData,
        idPhotoData
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.VISITOR_CREATED,
        visitorRegId: result.visitorregid,
        securityCode: result.securitycode
      };
    } catch (error) {
      console.error('Error creating registered visitor:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get registered visitors
  static async getRegisteredVisitors(tenantId, visitorCatId = 0, visitorSubCatId = 0) {
    try {
      const visitors = await VisitorModel.getRegisteredVisitors(tenantId, visitorCatId, visitorSubCatId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: visitors,
        count: visitors.length
      };
    } catch (error) {
      console.error('Error fetching registered visitors:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Checkout visitor
  static async checkoutVisitor(visitorId, tenantId) {
    try {
      const result = await VisitorModel.updateVisitorCheckout(visitorId, tenantId);
      
      if (result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: 'Visitor checked out successfully'
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visitor not found or already checked out'
        };
      }
    } catch (error) {
      console.error('Error checking out visitor:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }
}

module.exports = VisitorService;