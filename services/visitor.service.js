const VisitorModel = require('../models/visitor.model');
const OTPModel = require('../models/otp.model');
const fs = require('fs').promises;
const path = require('path');
const responseUtils = require("../utils/constants");
const QRService = require('./qr.service');
const FCMService = require('./fcm.service');

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

  // OTP sending with visitor type validation
  static async sendOTP(mobile, tenantId, visitorTypeId, appuser) {
    try {
      if (!mobile || mobile.length !== 10 || !/^\d+$/.test(mobile)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid mobile number'
        };
      }

      if (visitorTypeId) {
        const exists = await VisitorModel.checkVisitorExists(mobile, tenantId, parseInt(visitorTypeId));
        if (exists) {
          return {
            responseCode: responseUtils.RESPONSE_CODES.MOBILE_EXISTS,
            responseMessage: responseUtils.RESPONSE_MESSAGES.MOBILE_EXISTS
          };
        }
      }

      const otpResult = await OTPModel.generateOTP(tenantId, mobile, appuser);

      if (process.env.SMS_ENABLED === 'Y') {
        // TODO: Implement SMS service
        console.log(`SMS would be sent to ${mobile}: ${otpResult.otpNumber}`);
      }

      console.log(`OTP for ${mobile}: ${otpResult.otpNumber}`);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.OTP_SENT,
        refId: otpResult.refId,
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

  // unregistered OTP with recent visitor data
  static async sendUnregisteredOTP(mobile, tenantId, appuser) {
    try {
      if (!mobile || mobile.length !== 10 || !/^\d+$/.test(mobile)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid mobile number'
        };
      }

      const otpResult = await OTPModel.generateOTP(tenantId, mobile, appuser);

      const recentVisitors = await VisitorModel.getRecentVisitorByMobile(tenantId, mobile);

      console.log(`OTP for ${mobile}: ${otpResult.otpNumber}`);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.OTP_SENT,
        refId: otpResult.refId,
        data: recentVisitors,
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

  // image saving with better error handling
  static async saveImage(base64String, imageName, extension, filePath) {
    try {
      if (!base64String || extension === 'N/A') {
        return false;
      }

      await fs.mkdir(filePath, { recursive: true });

      const cleanBase64 = base64String.replace(/\n/g, '').replace(/ /g, '');
      
      const base64Data = cleanBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      const fullPath = path.join(filePath, `${imageName}${extension}`);
      await fs.writeFile(fullPath, imageBuffer);

      return true;
    } catch (error) {
      console.error('Error saving image:', error);
      return false;
    }
  }

  // unregistered visitor creation with FCM notifications
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

      try {
        await FCMService.notifyVisitorCheckIn({
          tenantId,
          flatName,
          visitorName: fname,
          visitorCategory: visitorSubCatName,
          photoUrl: photoData ? `/uploads/visitors/${photoData}` : null,
          type: 'UNREGISTERED_CHECKIN'
        });
      } catch (fcmError) {
        console.error('FCM notification failed:', fcmError);
        // Don't fail the entire operation if FCM fails
      }

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

  // registered visitor creation
  static async createRegisteredVisitor(visitorData) {
    try {
      const securityCode = QRService.generateSecurityCode();
      const visitorRegNo = QRService.generateVisitorRegNo(
        visitorData.visitorCatId, 
        visitorData.tenantId
      );

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
        securityCode,
        visitorRegNo,
        photoData,
        vehiclePhotoData,
        idPhotoData
      });

      if (process.env.SMS_ENABLED === 'Y') {
        // TODO: Implement SMS service for security code
        console.log(`Security code ${securityCode} would be sent to ${mobile}`);
      }

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

  // checkout with proper validation
  static async checkoutVisitor(visitorId, tenantId) {
    try {
      const result = await VisitorModel.updateVisitorCheckout(visitorId, tenantId);
      
      if (result) {
        try {
          const visitorDetails = await VisitorModel.getVisitorById(visitorId, tenantId);
          if (visitorDetails) {
            await FCMService.notifyVisitorCheckOut({
              tenantId,
              flatName: visitorDetails.flatname,
              visitorName: visitorDetails.fname,
              visitorCategory: visitorDetails.visitorsubcatname,
              type: 'UNREGISTERED_CHECKOUT'
            });
          }
        } catch (fcmError) {
          console.error('FCM notification failed:', fcmError);
        }

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

  // registered visitor check-in
  static async checkinRegisteredVisitor(visitorRegId, tenantId, createdBy) {
    try {
      const visitor = await VisitorModel.getVisitorForCheckIn(visitorRegId, tenantId);
      
      if (!visitor) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visitor not found'
        };
      }

      const activeVisit = await VisitorModel.getActiveVisitHistory(visitorRegId, tenantId);
      
      if (activeVisit) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visitor is already checked in',
          data: {
            historyId: activeVisit.regvisitorhistoryid,
            checkInTime: activeVisit.intimetxt
          }
        };
      }

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
        associatedFlat: visitor.flatname || visitor.associatedflat,
        associatedBlock: visitor.associatedblock,
        createdBy
      });

      try {
        await FCMService.notifyVisitorCheckIn({
          tenantId,
          flatName: visitor.flatname || visitor.associatedflat,
          visitorName: visitor.vistorname,
          visitorCategory: visitor.visitorsubcatname,
          photoUrl: visitor.photopath ? `${visitor.photopath}/${visitor.photoname}` : null,
          type: 'REGISTERED_CHECKIN'
        });
      } catch (fcmError) {
        console.error('FCM notification failed:', fcmError);
      }

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

  // checkout for registered visitors
  static async checkoutRegisteredVisitor(historyId, tenantId, updatedBy) {
    try {
      const result = await VisitorModel.updateVisitHistoryCheckout(historyId, tenantId, updatedBy);
      
      if (result) {
        try {
          const visitDetails = await VisitorModel.getVisitHistoryById(historyId, tenantId);
          if (visitDetails) {
            await FCMService.notifyVisitorCheckOut({
              tenantId,
              flatName: visitDetails.associatedflat,
              visitorName: visitDetails.vistorname,
              visitorCategory: visitDetails.visitorsubcatname,
              type: 'REGISTERED_CHECKOUT'
            });
          }
        } catch (fcmError) {
          console.error('FCM notification failed:', fcmError);
        }

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

  // QR generation with proper data structure
  static async generateVisitorQR(visitorRegId, tenantId) {
    try {
      const visitor = await VisitorModel.getVisitorForCheckIn(visitorRegId, tenantId);
      
      if (!visitor) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visitor not found'
        };
      }

      let securityCode = visitor.securitycode;
      let visitorRegNo = visitor.visitorregno;

      if (!securityCode || !visitorRegNo) {
        securityCode = QRService.generateSecurityCode();
        visitorRegNo = QRService.generateVisitorRegNo(visitor.visitorcatid, tenantId);
        
        await VisitorModel.updateVisitorSecurity(visitorRegId, securityCode, visitorRegNo, tenantId);
      }

      const completeVisitorData = {
        tenantid: tenantId,
        mainid: visitorRegNo || securityCode,
        type: QRService.getTypeCode(visitor.visitorcatid),
        name: visitor.vistorname,
        mobile: visitor.mobile,
        flat: visitor.flatname || visitor.associatedflat,
        timestamp: Date.now(),
        uuid: require('uuid').v4()
      };

      const qrResult = await QRService.generateQRCode(completeVisitorData, {
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
          securityCode: securityCode,
          visitorRegNo: visitorRegNo,
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

  // QR scanning with proper visitor lookup logic
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

      if (!qrData.tenantid || !qrData.mainid || !qrData.type) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid QR code format - missing required fields'
        };
      }

      const verifyResult = QRService.verifyQRCode(qrData, 24 * 60 * 60 * 1000);
      if (!verifyResult.valid) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: verifyResult.reason
        };
      }

      if (parseInt(qrData.tenantid) !== tenantId) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Access denied for this tenant'
        };
      }

      const visitorCatId = this.getCategoryIdFromType(qrData.type);

      let visitor = null;

      // Try multiple lookup strategies based on C# logic
      // 1. First try to find by registration number
      visitor = await VisitorModel.getVisitorByRegNo(qrData.mainid, tenantId, visitorCatId);
      
      // 2. If not found, try by security code
      if (!visitor) {
        visitor = await VisitorModel.getVisitorBySecurityCode(qrData.mainid, tenantId);
        
        // Validate category if found by security code
        if (visitor && visitorCatId > 0 && visitor.visitorcatid !== visitorCatId) {
          visitor = null; // Category mismatch
        }
      }

      // 3. If still not found and it's a special type, try alternative lookup
      if (!visitor && (qrData.type === 'stu' || qrData.type === 'sta')) {
        // For students/staff, try alternative lookup logic
        visitor = await VisitorModel.getVisitorByAlternativeId(qrData.mainid, tenantId, visitorCatId);
      }

      if (!visitor) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visitor not found or QR code invalid'
        };
      }

      const checkInOutInfo = await VisitorModel.getVisitorCheckInOutStatus(visitor.visitorregid, tenantId, visitorCatId);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'QR code scanned successfully',
        data: {
          visitor: visitor,
          qrData: qrData,
          checkInOutInfo: checkInOutInfo,
          scanTime: new Date().toISOString(),
          scannedBy: userInfo.username,
          actionRequired: checkInOutInfo.code === 1 ? 'CHECK_IN' : 'CHECK_OUT'
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

  // search with advanced filtering
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

    static async saveQRCodeImage(qrBase64, visitorRegId) {
    try {
      const qrResult = await FileService.saveBase64Image(
        qrBase64,
        FileService.categories.QR_CODES,
        `QR_${visitorRegId}_${Date.now()}.png`
      );

      return qrResult;
    } catch (error) {
      console.error('Error saving QR code:', error);
      return { success: false, error: error.message };
    }
  }
  
}

module.exports = VisitorService;