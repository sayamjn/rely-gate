const VisitorModel = require('../models/visitor.model');
const OTPModel = require('../models/otp.model');
const fs = require('fs').promises;
const path = require('path');
const responseUtils = require("../utils/constants");
const QRService = require('./qr.service');

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

      await fs.mkdir(filePath, { recursive: true });

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


  static async checkinRegisteredVisitor(visitorRegId, tenantId, createdBy) {
    try {
      // Get visitor details
      const visitor = await VisitorModel.getVisitorForCheckIn(visitorRegId, tenantId);
      
      if (!visitor) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visitor not found'
        };
      }

      // Check if already checked in
      const activeVisit = await VisitorModel.getActiveVisitHistory(visitorRegId, tenantId);
      
      if (activeVisit) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visitor is already checked in',
          data: {
            historyId: activeVisit.regvisitorhistoryid,
            checkInTime: activeVisit.intimeTxt
          }
        };
      }

      // Create visit history record
      const visitHistory = await VisitorModel.createVisitHistory({
        tenantId,
        visitorRegId: visitor.visitorregid,
        visitorRegNo: visitor.visitorregno,
        securityCode: visitor.securitycode,
        vistorName: visitor.vistorname,
        mobile: visitor.mobile,
        vehicleNo: visitor.vehicleno,
        visitorCatId: visitor.visitorcatid,
        visitorCatName: visitor.visitorcatname,
        visitorSubCatId: visitor.visitorsubcatid,
        visitorSubCatName: visitor.visitorsubcatname,
        associatedFlat: visitor.associatedflat,
        associatedBlock: visitor.associatedblock,
        createdBy
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Visitor checked in successfully',
        data: {
          historyId: visitHistory.regvisitorhistoryid,
          visitorName: visitor.vistorname,
          checkInTime: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          })
        }
      };
    } catch (error) {
      console.error('Error checking in visitor:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Check-out registered visitor
  static async checkoutRegisteredVisitor(historyId, tenantId, updatedBy) {
    try {
      const result = await VisitorModel.updateVisitHistoryCheckout(historyId, tenantId, updatedBy);
      
      if (result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: 'Visitor checked out successfully',
          data: {
            historyId: result.regvisitorhistoryid,
            checkOutTime: new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: true 
            })
          }
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visit history not found or already checked out'
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

  // Get visit history
  static async getVisitHistory(visitorRegId, tenantId, limit = 10) {
    try {
      const history = await VisitorModel.getVisitHistory(visitorRegId, tenantId, limit);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: history,
        count: history.length
      };
    } catch (error) {
      console.error('Error fetching visit history:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get visitors pending checkout
  static async getVisitorsPendingCheckout(tenantId) {
    try {
      const visitors = await VisitorModel.getVisitorsPendingCheckout(tenantId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: visitors,
        count: visitors.length
      };
    } catch (error) {
      console.error('Error fetching pending checkout visitors:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

static async generateVisitorQR(visitorRegId, tenantId) {
  try {
    const visitor = await VisitorModel.getVisitorForCheckIn(visitorRegId, tenantId);
    
    if (!visitor) {
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Visitor not found'
      };
    }

    // DEBUG: Log what we got from database
    console.log('Raw visitor data from DB:', visitor);

    // Ensure all required fields are present
    const completeVisitorData = {
      tenantId: tenantId,
      tenantid: tenantId, // Add both variants
      TenantID: tenantId,
      
      visitorRegNo: visitor.visitorregno || visitor.VisitorRegNo,
      VisitorRegNo: visitor.visitorregno || visitor.VisitorRegNo,
      
      securityCode: visitor.securitycode || visitor.SecurityCode,
      SecurityCode: visitor.securitycode || visitor.SecurityCode,
      
      visitorCatId: visitor.visitorcatid || visitor.VisitorCatID,
      VisitorCatID: visitor.visitorcatid || visitor.VisitorCatID,
      
      vistorName: visitor.vistorname || visitor.VistorName,
      VistorName: visitor.vistorname || visitor.VistorName,
      
      mobile: visitor.mobile || visitor.Mobile,
      Mobile: visitor.mobile || visitor.Mobile,
      
      flatName: visitor.flatname || visitor.FlatName || visitor.associatedflat,
      FlatName: visitor.flatname || visitor.FlatName || visitor.associatedflat,
      associatedFlat: visitor.associatedflat || visitor.flatname
    };

    console.log('Complete visitor data for QR:', completeVisitorData);

    const qrData = QRService.generateQRData(completeVisitorData);
    
    console.log('Generated QR data:', qrData);
    
    const qrResult = await QRService.generateQRCode(qrData, {
      width: 300,
      margin: 2
    });

    if (!qrResult.success) {
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to generate QR code'
      };
    }

    return {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      responseMessage: 'QR code generated successfully',
      data: {
        visitorRegId: visitor.visitorregid,
        visitorName: visitor.vistorname,
        qrData: qrResult.qrData,
        qrImage: qrResult.qrImage,
        qrBase64: qrResult.qrBase64
      }
    };
  } catch (error) {
    console.error('Error generating visitor QR:', error);
    return {
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}
static async scanQRCode(qrString, tenantId, userInfo) {
  try {
    const parseResult = QRService.parseQRData(qrString);
    
    if (!parseResult.success) {
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: parseResult.error
      };
    }

    const qrData = parseResult.data;

    // Validate required fields
    if (!qrData.tenantid || !qrData.mainid || !qrData.type) {
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Invalid QR code format - missing required fields'
      };
    }

    // Verify QR code age
    const verifyResult = QRService.verifyQRCode(qrData);
    if (!verifyResult.valid) {
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: verifyResult.reason
      };
    }

    // Check tenant access
    if (parseInt(qrData.tenantid) !== tenantId) {
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Access denied for this tenant'
      };
    }

    // Get category ID from type
    let visitorCatId = 0;
    if (qrData.type === 'stu') visitorCatId = 3;
    if (qrData.type === 'sta') visitorCatId = 1; 
    if (qrData.type === 'bus') visitorCatId = 5;

    // First try to find by registration number
    let visitor = await VisitorModel.getVisitorByRegNo(qrData.mainid, tenantId, visitorCatId);
    
    // If not found, try to find by security code
    if (!visitor) {
      visitor = await VisitorModel.getVisitorBySecurityCode(qrData.mainid, tenantId);
      
      // Additional check for category if found by security code
      if (visitor && visitorCatId > 0 && visitor.visitorcatid !== visitorCatId) {
        visitor = null; // Category mismatch
      }
    }

    if (!visitor) {
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Visitor not found or QR code invalid'
      };
    }

    return {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      responseMessage: 'QR code scanned successfully',
      data: {
        visitor: visitor,
        qrData: qrData,
        scanTime: new Date().toISOString(),
        scannedBy: userInfo.username
      }
    };
  } catch (error) {
    console.error('Error scanning QR code:', error);
    return {
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}

  static getCategoryIdFromType(typeCode) {
    const typeMap = {
      'sta': 1, // Staff
      'unr': 2, // Unregistered
      'stu': 3, // Student
      'gue': 4, // Guest
      'bus': 5  // Bus
    };
    return typeMap[typeCode] || 2;
  }

  // Search visitors with advanced filtering
  static async searchVisitors(tenantId, searchParams) {
    try {
      const visitors = await VisitorModel.searchVisitors(tenantId, searchParams);
      
      const totalCount = visitors.length > 0 ? parseInt(visitors[0].total_count) : 0;
      const currentPage = parseInt(searchParams.page) || 1;
      const pageSize = parseInt(searchParams.pageSize) || 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: visitors.map(v => {
          const { total_count, ...visitorData } = v;
          return visitorData;
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
      console.error('Error searching visitors:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Update existing createRegisteredVisitor to include security code and reg number
  static async createRegisteredVisitor(visitorData) {
    try {
      const securityCode = QRService.generateSecurityCode();
      const visitorRegNo = QRService.generateVisitorRegNo(
        visitorData.visitorCatId, 
        visitorData.tenantId
      );

      visitorData.securityCode = securityCode;
      visitorData.visitorRegNo = visitorRegNo;

      const result = await VisitorModel.createRegisteredVisitor(visitorData);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.VISITOR_CREATED,
        visitorRegId: result.visitorregid,
        securityCode: result.securitycode,
        visitorRegNo: visitorRegNo
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
}

module.exports = VisitorService;