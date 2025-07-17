const VisitorModel = require("../models/visitor.model");
const OTPModel = require("../models/otp.model");
const fs = require("fs").promises;
const path = require("path");
const responseUtils = require("../utils/constants");
const QRService = require("./qr.service");
const FCMService = require("./fcm.service");
const { query } = require("../config/database");
const MessagingService = require("./messaging.service");

class VisitorService {
  // Get visitor purposes by category
  static async getVisitorPurposes(tenantId, purposeCatId = 0) {
    try {
      const purposes = await VisitorModel.getVisitorPurposeByCategory(
        tenantId,
        purposeCatId
      );
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: purposes,
        count: purposes.length,
      };
    } catch (error) {
      console.error("Error fetching visitor purposes:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get visitor subcategories
  static async getVisitorSubCategories(tenantId, visitorCatId = 0) {
    try {
      const subcategories = await VisitorModel.getVisitorSubCategories(
        tenantId,
        visitorCatId
      );
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: subcategories,
        count: subcategories.length,
      };
    } catch (error) {
      console.error("Error fetching visitor subcategories:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // OTP sending with visitor type validation
  static async sendOTP(mobile, tenantId, visitorTypeId, appuser) {
    try {
      if (!mobile || mobile.length !== 10 || !/^\d+$/.test(mobile)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid mobile number",
        };
      }

      if (visitorTypeId) {
        const exists = await VisitorModel.checkVisitorExists(
          mobile,
          tenantId,
          parseInt(visitorTypeId)
        );
        if (exists) {
          return {
            responseCode: responseUtils.RESPONSE_CODES.MOBILE_EXISTS,
            responseMessage: responseUtils.RESPONSE_MESSAGES.MOBILE_EXISTS,
          };
        }
      }


      const otpResult = await MessagingService.sendVisitorOTP(
        mobile,
        tenantId,
        visitorTypeId,
        appuser
      );

      if (!otpResult.success) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: otpResult.message,
        };
      }

      console.log(`OTP for ${mobile}: ${otpResult.otpNumber}`);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.OTP_SENT,
        refId: otpResult.refId,
        otp:
          process.env.NODE_ENV === "development"
            ? otpResult.otpNumber
            : undefined,
      };
    } catch (error) {
      console.error("Error sending OTP:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // unregistered OTP with recent visitor data
  static async sendUnregisteredOTP(mobile, tenantId, appuser) {
    try {
      if (!mobile || mobile.length !== 10 || !/^\d+$/.test(mobile)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid mobile number",
        };
      }

     const otpResult = await MessagingService.generateAndSendOTP(tenantId, mobile, appuser);

      const recentVisitors = await VisitorModel.getRecentVisitorByMobile(
        tenantId,
        mobile
      );

      console.log(`OTP for ${mobile}: ${otpResult.otpNumber}`);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.OTP_SENT,
        refId: otpResult.refId,
        data: recentVisitors,
        otp:
          process.env.NODE_ENV === "development"
            ? otpResult.otpNumber
            : undefined,
      };
    } catch (error) {
      console.error("Error sending unregistered OTP:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Verify OTP
  static async verifyOTP(refId, otpNumber, mobile) {
    try {
      const verification = await MessagingService.verifyOTP(refId, otpNumber, mobile);

      if (verification.verified) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: responseUtils.RESPONSE_MESSAGES.OTP_VERIFIED,
          tenantId: verification.tenantId,
          mobile: verification.mobile,
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: responseUtils.RESPONSE_MESSAGES.OTP_INVALID,
        };
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // image saving with better error handling
  static async saveImage(base64String, imageName, extension, filePath) {
    try {
      if (!base64String || extension === "N/A") {
        return false;
      }

      await fs.mkdir(filePath, { recursive: true });

      const cleanBase64 = base64String.replace(/\n/g, "").replace(/ /g, "");

      const base64Data = cleanBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");

      const fullPath = path.join(filePath, `${imageName}${extension}`);
      await fs.writeFile(fullPath, imageBuffer);

      return true;
    } catch (error) {
      console.error("Error saving image:", error);
      return false;
    }
  }

  // unregistered visitor creation with FCM notifications
  static async createUnregisteredVisitor(visitorData) {
    try {
      const {
        tenantId,
        fname,
        mobile,
        vehicleNo,
        flatName,
        visitorCatId,
        visitorCatName,
        visitorSubCatId,
        visitorSubCatName,
        visitPurposeId,
        visitPurpose,
        totalVisitor,
        photoPath,
        vehiclePhotoPath,
        createdBy,
      } = visitorData;

      let photoData = null;
      let vehiclePhotoData = null;

      if (photoPath) {
        const photoName = `UnRegVisitor_${Date.now()}`;
        const saved = await this.saveImage(
          photoPath,
          photoName,
          ".jpeg",
          "./uploads/visitors/"
        );
        if (saved) photoData = `${photoName}.jpeg`;
      }

      if (vehiclePhotoPath) {
        const vehiclePhotoName = `Vehicle_${Date.now()}`;
        const saved = await this.saveImage(
          vehiclePhotoPath,
          vehiclePhotoName,
          ".jpeg",
          "./uploads/vehicles/"
        );
        if (saved) vehiclePhotoData = `${vehiclePhotoName}.jpeg`;
      }

      const result = await VisitorModel.createUnregisteredVisitor({
        ...visitorData,
        photoData,
        vehiclePhotoData,
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.VISITOR_CREATED,
        visitorId: result.visitorid,
      };
    } catch (error) {
      console.error("Error creating unregistered visitor:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
        tenantId,
        vistorName,
        mobile,
        email,
        visitorCatId,
        visitorCatName,
        visitorSubCatId,
        visitorSubCatName,
        flatId,
        flatName,
        vehicleNo,
        identityId,
        idName,
        idNumber,
        photoPath,
        vehiclePhotoPath,
        idPhotoPath,
        createdBy,
      } = visitorData;

      let photoData = null;
      let vehiclePhotoData = null;
      let idPhotoData = null;

      if (photoPath) {
        const photoName = `RegVisitor_${Date.now()}`;
        const saved = await this.saveImage(
          photoPath,
          photoName,
          ".jpeg",
          "./uploads/registered_visitors/"
        );
        if (saved) photoData = `${photoName}.jpeg`;
      }

      if (vehiclePhotoPath) {
        const vehiclePhotoName = `RegVehicle_${Date.now()}`;
        const saved = await this.saveImage(
          vehiclePhotoPath,
          vehiclePhotoName,
          ".jpeg",
          "./uploads/vehicles/"
        );
        if (saved) vehiclePhotoData = `${vehiclePhotoName}.jpeg`;
      }

      if (idPhotoPath) {
        const idPhotoName = `RegVisitorID_${Date.now()}`;
        const saved = await this.saveImage(
          idPhotoPath,
          idPhotoName,
          ".jpeg",
          "./uploads/visitor_ids/"
        );
        if (saved) idPhotoData = `${idPhotoName}.jpeg`;
      }

      const result = await VisitorModel.createRegisteredVisitor({
        ...visitorData,
        securityCode,
        visitorRegNo,
        photoData,
        vehiclePhotoData,
        idPhotoData,
      });

      if (process.env.SMS_ENABLED === "Y") {
        // TODO: Implement SMS service for security code
        console.log(`Security code ${securityCode} would be sent to ${mobile}`);
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.VISITOR_CREATED,
        visitorRegId: result.visitorregid,
        securityCode: result.securitycode,
        visitorRegNo: visitorRegNo,
      };
    } catch (error) {
      console.error("Error creating registered visitor:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get registered visitors
  static async getRegisteredVisitors(
    tenantId,
    visitorCatId = 0,
    visitorSubCatId = 0
  ) {
    try {
      const visitors = await VisitorModel.getRegisteredVisitors(
        tenantId,
        visitorCatId,
        visitorSubCatId
      );
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: visitors,
        count: visitors.length,
      };
    } catch (error) {
      console.error("Error fetching registered visitors:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // checkout with proper validation
  static async checkoutVisitor(visitorId, tenantId) {
    try {
      const result = await VisitorModel.updateVisitorCheckout(
        visitorId,
        tenantId
      );

      if (result) {
        try {
          const visitorDetails = await VisitorModel.getVisitorById(
            visitorId,
            tenantId
          );
          if (visitorDetails) {
            await FCMService.notifyVisitorCheckOut({
              tenantId,
              flatName: visitorDetails.flatname,
              visitorName: visitorDetails.fname,
              visitorCategory: visitorDetails.visitorsubcatname,
              type: "UNREGISTERED_CHECKOUT",
            });
          }
        } catch (fcmError) {
          console.error("FCM notification failed:", fcmError);
        }

        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: "Visitor checked out successfully",
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visitor not found or already checked out",
        };
      }
    } catch (error) {
      console.error("Error checking out visitor:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // registered visitor check-in
  static async checkinRegisteredVisitor(visitorRegId, tenantId, createdBy) {
    try {
      const visitor = await VisitorModel.getVisitorForCheckIn(
        visitorRegId,
        tenantId
      );

      if (!visitor) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visitor not found",
        };
      }

      const activeVisit = await VisitorModel.getActiveVisitHistory(
        visitorRegId,
        tenantId
      );

      if (activeVisit) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visitor is already checked in",
          data: {
            historyId: activeVisit.regvisitorhistoryid,
            checkInTime: activeVisit.intimetxt,
          },
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
        createdBy,
      });

      try {
        await FCMService.notifyVisitorCheckIn({
          tenantId,
          flatName: visitor.flatname || visitor.associatedflat,
          visitorName: visitor.vistorname,
          visitorCategory: visitor.visitorsubcatname,
          photoUrl: visitor.photopath
            ? `${visitor.photopath}/${visitor.photoname}`
            : null,
          type: "REGISTERED_CHECKIN",
        });
      } catch (fcmError) {
        console.error("FCM notification failed:", fcmError);
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "Visitor checked in successfully",
        data: {
          historyId: visitHistory.regvisitorhistoryid,
          visitorName: visitor.vistorname,
          checkInTime: Math.floor(Date.now() / 1000),
        },
      };
    } catch (error) {
      console.error("Error checking in visitor:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // checkout for registered visitors
  static async checkoutRegisteredVisitor(historyId, tenantId, updatedBy) {
    try {
      const result = await VisitorModel.updateVisitHistoryCheckout(
        historyId,
        tenantId,
        updatedBy
      );

      if (result) {
        try {
          const visitDetails = await VisitorModel.getVisitHistoryById(
            historyId,
            tenantId
          );
          if (visitDetails) {
            await FCMService.notifyVisitorCheckOut({
              tenantId,
              flatName: visitDetails.associatedflat,
              visitorName: visitDetails.vistorname,
              visitorCategory: visitDetails.visitorsubcatname,
              type: "REGISTERED_CHECKOUT",
            });
          }
        } catch (fcmError) {
          console.error("FCM notification failed:", fcmError);
        }

        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: "Visitor checked out successfully",
          data: {
            historyId: result.regvisitorhistoryid,
            checkOutTime: Math.floor(Date.now() / 1000),
          },
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visit history not found or already checked out",
        };
      }
    } catch (error) {
      console.error("Error checking out visitor:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get visit history
  static async getVisitHistory(visitorRegId, tenantId, limit = 10) {
    try {
      const history = await VisitorModel.getVisitHistory(
        visitorRegId,
        tenantId,
        limit
      );
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: history,
        count: history.length,
      };
    } catch (error) {
      console.error("Error fetching visit history:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
        count: visitors.length,
      };
    } catch (error) {
      console.error("Error fetching pending checkout visitors:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // QR generation with proper data structure
  static async generateVisitorQR(visitorRegId, tenantId) {
    try {
      const visitor = await VisitorModel.getVisitorForCheckIn(
        visitorRegId,
        tenantId
      );

      if (!visitor) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visitor not found",
        };
      }

      let securityCode = visitor.securitycode;
      let visitorRegNo = visitor.visitorregno;

      if (!securityCode || !visitorRegNo) {
        securityCode = QRService.generateSecurityCode();
        visitorRegNo = QRService.generateVisitorRegNo(
          visitor.visitorcatid,
          tenantId
        );

        await VisitorModel.updateVisitorSecurity(
          visitorRegId,
          securityCode,
          visitorRegNo,
          tenantId
        );
      }

      const completeVisitorData = {
        tenantid: tenantId,
        mainid: visitorRegNo || securityCode,
        type: QRService.getTypeCode(visitor.visitorcatid),
        name: visitor.vistorname,
        mobile: visitor.mobile,
        flat: visitor.flatname || visitor.associatedflat,
        timestamp: Date.now(),
        uuid: require("uuid").v4(),
      };

      const qrResult = await QRService.generateQRCode(completeVisitorData, {
        width: 300,
        margin: 2,
      });

      if (!qrResult.success) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Failed to generate QR code",
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "QR code generated successfully",
        data: {
          visitorRegId: visitor.visitorregid,
          visitorName: visitor.vistorname,
          securityCode: securityCode,
          visitorRegNo: visitorRegNo,
          qrData: qrResult.qrData,
          qrImage: qrResult.qrImage,
          qrBase64: qrResult.qrBase64,
        },
      };
    } catch (error) {
      console.error("Error generating visitor QR:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          responseMessage: parseResult.error,
        };
      }

      const qrData = parseResult.data;

      if (!qrData.tenantid || !qrData.mainid || !qrData.type) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Invalid QR code format - missing required fields",
        };
      }

      const verifyResult = QRService.verifyQRCode(qrData, 24 * 60 * 60 * 1000);
      if (!verifyResult.valid) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: verifyResult.reason,
        };
      }

      if (parseInt(qrData.tenantid) !== tenantId) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Access denied for this tenant",
        };
      }

      const visitorCatId = this.getCategoryIdFromType(qrData.type);

      let visitor = null;

      // Try multiple lookup strategies based on C# logic
      // 1. First try to find by registration number
      visitor = await VisitorModel.getVisitorByRegNo(
        qrData.mainid,
        tenantId,
        visitorCatId
      );

      // 2. If not found, try by security code
      if (!visitor) {
        visitor = await VisitorModel.getVisitorBySecurityCode(
          qrData.mainid,
          tenantId
        );

        // Validate category if found by security code
        if (
          visitor &&
          visitorCatId > 0 &&
          visitor.visitorcatid !== visitorCatId
        ) {
          visitor = null; // Category mismatch
        }
      }

      // 3. If still not found and it's a special type, try alternative lookup
      if (!visitor && (qrData.type === "stu" || qrData.type === "sta")) {
        // For students/staff, try alternative lookup logic
        visitor = await VisitorModel.getVisitorByAlternativeId(
          qrData.mainid,
          tenantId,
          visitorCatId
        );
      }

      if (!visitor) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Visitor not found or QR code invalid",
        };
      }

      const checkInOutInfo = await VisitorModel.getVisitorCheckInOutStatus(
        visitor.visitorregid,
        tenantId,
        visitorCatId
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: "QR code scanned successfully",
        data: {
          visitor: visitor,
          qrData: qrData,
          checkInOutInfo: checkInOutInfo,
          scanTime: Math.floor(Date.now() / 1000),
          scannedBy: userInfo.username,
          actionRequired: checkInOutInfo.code === 1 ? "CHECK_IN" : "CHECK_OUT",
        },
      };
    } catch (error) {
      console.error("Error scanning QR code:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  static getCategoryIdFromType(typeCode) {
    const typeMap = {
      sta: 1, // Staff
      unr: 2, // Unregistered
      stu: 3, // Student
      gue: 4, // Guest
      bus: 5, // Bus
    };
    return typeMap[typeCode] || 2;
  }

  // search with advanced filtering
  static async searchVisitors(tenantId, searchParams) {
    try {
      const visitors = await VisitorModel.searchVisitors(
        tenantId,
        searchParams
      );

      const totalCount =
        visitors.length > 0 ? parseInt(visitors[0].total_count) : 0;
      const currentPage = parseInt(searchParams.page) || 1;
      const pageSize = parseInt(searchParams.pageSize) || 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: visitors.map((v) => {
          const { total_count, ...visitorData } = v;
          return visitorData;
        }),
        pagination: {
          currentPage,
          pageSize,
          totalCount,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      };
    } catch (error) {
      console.error("Error searching visitors:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
      console.error("Error saving QR code:", error);
      return { success: false, error: error.message };
    }
  }

  static async getVisitorsWithFilters(tenantId, filters) {
    try {
      let whereConditions = ["vr.TenantID = $1", "vr.IsActive = 'Y'"];
      let params = [tenantId];
      let paramIndex = 2;

      // Build dynamic WHERE clause
      if (filters.search) {
        whereConditions.push(
          `(vr.VistorName ILIKE $${paramIndex} OR vr.Mobile ILIKE $${paramIndex} OR vr.VisitorRegNo ILIKE $${paramIndex})`
        );
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters.visitorCatId) {
        whereConditions.push(`vr.VisitorCatID = $${paramIndex}`);
        params.push(filters.visitorCatId);
        paramIndex++;
      }

      if (filters.visitorSubCatId) {
        whereConditions.push(`vr.VisitorSubCatID = $${paramIndex}`);
        params.push(filters.visitorSubCatId);
        paramIndex++;
      }

      if (filters.flatName) {
        whereConditions.push(`vr.AssociatedFlat ILIKE $${paramIndex}`);
        params.push(`%${filters.flatName}%`);
        paramIndex++;
      }

      if (filters.mobile) {
        whereConditions.push(`vr.Mobile ILIKE $${paramIndex}`);
        params.push(`%${filters.mobile}%`);
        paramIndex++;
      }

      if (filters.fromDate) {
        whereConditions.push(`vr.CreatedDate >= TO_TIMESTAMP($${paramIndex})`);
        params.push(filters.fromDate);
        paramIndex++;
      }

      if (filters.toDate) {
        whereConditions.push(`vr.CreatedDate <= TO_TIMESTAMP($${paramIndex})`);
        params.push(filters.toDate);
        paramIndex++;
      }

      const whereClause = whereConditions.join(" AND ");
      const offset = (filters.page - 1) * filters.pageSize;

      // Get total count
      const countSql = `
          SELECT COUNT(*) as total
          FROM VisitorRegistration vr
          WHERE ${whereClause}
        `;
      const countResult = await query(countSql, params);
      const totalRecords = parseInt(countResult.rows[0].total);

      // Get paginated data with visit status - FIXED table name
      const sql = `
          SELECT 
            vr.*,
            CASE 
              WHEN vh.RegVisitorHistoryID IS NOT NULL AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '') 
              THEN 'CHECKED_IN'
              ELSE 'AVAILABLE'
            END as current_status,
            vh.RegVisitorHistoryID as active_visit_id,
            vh.InTime as last_checkin_time,
            vh.InTimeTxt as last_checkin_time_txt
          FROM VisitorRegistration vr
          LEFT JOIN (
            SELECT DISTINCT ON (VisitorRegID) 
              RegVisitorHistoryID, VisitorRegID, InTime, InTimeTxt, OutTime, OutTimeTxt
            FROM VisitorRegVisitHistory 
            WHERE TenantID = $1 
            ORDER BY VisitorRegID, RegVisitorHistoryID DESC
          ) vh ON vr.VisitorRegID = vh.VisitorRegID
          WHERE ${whereClause}
          ORDER BY vr.CreatedDate DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

      params.push(filters.pageSize, offset);
      const result = await query(sql, params);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: {
          visitors: result.rows,
          pagination: {
            currentPage: filters.page,
            pageSize: filters.pageSize,
            totalRecords,
            totalPages: Math.ceil(totalRecords / filters.pageSize),
          },
        },
      };
    } catch (error) {
      console.error("Error getting visitors with filters:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  static async exportVisitors(tenantId, filters = {}) {
    try {
      let whereConditions = ["vr.TenantID = $1", "vr.IsActive = 'Y'"];
      let params = [tenantId];
      let paramIndex = 2;

      // Apply filters
      if (filters.visitorCatId) {
        whereConditions.push(`vr.VisitorCatID = $${paramIndex}`);
        params.push(filters.visitorCatId);
        paramIndex++;
      }

      if (filters.visitorSubCatId) {
        whereConditions.push(`vr.VisitorSubCatID = $${paramIndex}`);
        params.push(filters.visitorSubCatId);
        paramIndex++;
      }

      if (filters.fromDate) {
        whereConditions.push(`vr.CreatedDate >= TO_TIMESTAMP($${paramIndex})`);
        params.push(filters.fromDate);
        paramIndex++;
      }

      if (filters.toDate) {
        whereConditions.push(`vr.CreatedDate <= TO_TIMESTAMP($${paramIndex})`);
        params.push(filters.toDate);
        paramIndex++;
      }

      const whereClause = whereConditions.join(" AND ");

      const sql = `
        SELECT 
          vr.VisitorRegNo as "Visitor ID",
          vr.VistorName as "Name",
          vr.Mobile as "Mobile",
          vr.Email as "Email",
          vr.VisitorCatName as "Category",
          vr.VisitorSubCatName as "Sub Category",
          vr.AssociatedFlat as "Flat/Unit",
          vr.AssociatedBlock as "Block",
          vr.StatusName as "Status",
          TO_CHAR(vr.CreatedDate, 'YYYY-MM-DD HH24:MI') as "Registration Date",
          CASE 
            WHEN vh.RegVisitorHistoryID IS NOT NULL AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '') 
            THEN 'CHECKED_IN'
            ELSE 'AVAILABLE'
          END as "Current Status"
        FROM VisitorRegistration vr
        LEFT JOIN (
          SELECT DISTINCT ON (VisitorRegID) 
            RegVisitorHistoryID, VisitorRegID, OutTime, OutTimeTxt
          FROM VisitorRegVisitHistory 
          WHERE TenantID = $1 
          ORDER BY VisitorRegID, RegVisitorHistoryID DESC
        ) vh ON vr.VisitorRegID = vh.VisitorRegID
        WHERE ${whereClause}
        ORDER BY vr.CreatedDate DESC
      `;

      const result = await query(sql, params);

      if (result.rows.length === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "No visitor data found for export",
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
      console.error("Error exporting visitors:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }
  static async getPendingCheckout(tenantId, visitorCatId = null) {
    try {
      let whereConditions = [
        "vr.TenantID = $1",
        "vr.IsActive = 'Y'",
        "vh.OutTime IS NULL",
        "vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = ''",
      ];
      let params = [tenantId];
      let paramIndex = 2;

      if (visitorCatId) {
        whereConditions.push(`vr.VisitorCatID = $${paramIndex}`);
        params.push(visitorCatId);
        paramIndex++;
      }

      const whereClause = whereConditions.join(" AND ");

      const sql = `
        SELECT 
          vr.VisitorRegID,
          vr.VisitorRegNo,
          vr.VistorName,
          vr.Mobile,
          vr.VisitorCatName,
          vr.VisitorSubCatName,
          vr.AssociatedFlat,
          vr.AssociatedBlock,
          vh.RegVisitorHistoryID,
          vh.InTime,
          vh.InTimeTxt,
          EXTRACT(EPOCH FROM (NOW() - vh.InTime))/3600 as hours_since_checkin
        FROM VisitorRegistration vr
        INNER JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID 
                                        AND vh.TenantID = vr.TenantID
        WHERE ${whereClause}
        ORDER BY vh.InTime ASC
      `;

      const result = await query(sql, params);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: {
          pendingCheckout: result.rows,
          count: result.rows.length,
        },
      };
    } catch (error) {
      console.error("Error getting pending checkout visitors:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Add new purpose
  static async addVisitorPurpose(purposeData) {
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

      const exists = await VisitorModel.checkPurposeExists(
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
          url: `${baseUrl}/uploads/purposes/${imageFile.filename}`
        };
      }

      const newPurpose = await VisitorModel.addVisitorPurpose({
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
      console.error("Error in addVisitorPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Update purpose
  static async updateVisitorPurpose(
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

      const exists = await VisitorModel.checkPurposeExists(
        tenantId,
        purposeName.trim()
      );
      if (exists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose name already exists"
        };
      }

      const updatedPurpose = await VisitorModel.updateVisitorPurpose(
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
      console.error("Error in updateVisitorPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Delete purpose
  static async deleteVisitorPurpose(purposeId, tenantId, updatedBy) {
    try {
      const purpose = await VisitorModel.checkPurposeStatus(purposeId, tenantId);

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

      const deletedPurpose = await VisitorModel.deleteVisitorPurpose(
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
      console.error("Error in deleteVisitorPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // getVisitors method - refactored to use model layer
  static async getVisitors(tenantId, page = 1, pageSize = 20, search = "", visitorSubCatId = 0, fromDate = null, toDate = null) {
    try {
      // Call the model method instead of having SQL queries in service
      const result = await VisitorModel.getVisitors(
        tenantId,
        parseInt(page),
        parseInt(pageSize),
        search,
        parseInt(visitorSubCatId),
        fromDate,
        toDate
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: result.data,
        pagination: {
          currentPage: parseInt(page),
          pageSize: parseInt(pageSize),
          totalCount: result.totalCount,
          totalPages: result.totalPages,
          hasNext: parseInt(page) < result.totalPages,
          hasPrev: parseInt(page) > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching visitors:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get unregistered visitors list (legacy format)
  static async getUnregisteredVisitorsList(tenantId, filters) {
    try {
      const visitorData = await VisitorModel.getUnregisteredVisitorsList(tenantId, filters);
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        count: visitorData.length,
        unregvisitorlist: visitorData,
        responseMessage: "Record(s) saved successfully"
      };
    } catch (error) {
      console.error("Error fetching unregistered visitors list:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }
}

module.exports = VisitorService;
