const QRCode = require("qrcode");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

class QRService {
  static generateSecurityCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static generateVisitorRegNo(visitorCatId, tenantId) {
    const prefix = this.getCategoryPrefix(visitorCatId);
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 99)
      .toString()
      .padStart(2, "0");
    return `${prefix}${tenantId}${timestamp}${random}`;
  }

  static getCategoryPrefix(visitorCatId) {
    const prefixes = {
      1: "VIS", // Staff
      2: "STU", // Unregistered
      3: "STA", // Student
      6: "GAT", // Guest
      5: "BUS", // Bus
      7: "DAY", // Day Boarding Student
    };
    return prefixes[visitorCatId] || "VIS";
  }

  static generateQRData(visitor, rtype = '') {
    return {
      tenantid: visitor.tenantId || visitor.tenantid || visitor.TenantID,
      mainid: visitor.visitorRegNo || visitor.securityCode || visitor.VisitorRegNo || visitor.SecurityCode,
      type: this.getTypeCode(visitor.visitorCatId || visitor.visitorcatid || visitor.VisitorCatID),
      rtype: rtype 
    };
  }

  static getTypeCode(visitorCatId) {
    const typeCodes = {
      1: "vis", // Staff
      2: "stu", // Unregistered
      3: "sta", // Student
      6: "gat", // Guest
      5: "bus", // Bus
      7: "dayboard", // Day Boarding Student
    };
    return typeCodes[visitorCatId] || "vis";
  }

  static async generateQRCode(data, options = {}) {
    try {
      const qrOptions = {
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: options.width || 300,
        ...options,
      };

      const qrString = JSON.stringify(data);
      const qrCodeDataURL = await QRCode.toDataURL(qrString, qrOptions);

      return {
        success: true,
        qrData: data,
        qrString: qrString,
        qrImage: qrCodeDataURL,
        qrBase64: qrCodeDataURL.split(",")[1], 
      };
    } catch (error) {
      console.error("Error generating QR code:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static parseQRData(qrString) {
    try {
      const data = JSON.parse(qrString);

      if (!data.tenantid || !data.mainid || !data.type) {
        throw new Error('Invalid QR code format');
      }

      return {
        success: true,
        data: {
          tenantid: data.tenantid,
          mainid: data.mainid, 
          type: data.type,
          rtype: data.rtype || ''
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid QR code format'
      };
    }
  }

  static verifyQRCode(qrData, maxAge = 24 * 60 * 60 * 1000) {
    try {
      const now = Date.now();
      const qrAge = now - qrData.timestamp;

      if (qrAge > maxAge) {
        return {
          valid: false,
          reason: "QR code expired",
        };
      }

      return {
        valid: true,
        age: qrAge,
      };
    } catch (error) {
      return {
        valid: false,
        reason: "Invalid QR code data",
      };
    }
  }

  // ===== MEAL-SPECIFIC QR CODE METHODS =====

  // Generate meal registration QR code (Phase 1 - for booking window)
  static generateMealRegistrationQR(studentData, mealType, tenantId) {
    const qrData = {
      student_id: studentData.studentId || studentData.visitorregid,
      tenant_id: tenantId,
      meal_type: mealType, // 'lunch' or 'dinner'
      action: 'register', // Phase 1 action
      timestamp: Date.now(),
      security_hash: this.generateMealSecurityHash(studentData.studentId || studentData.visitorregid, tenantId, mealType, 'register')
    };

    return qrData;
  }

  // Generate meal consumption QR code (Phase 2 - for serving window)
  static generateMealConsumptionQR(studentData, mealType, tenantId) {
    const qrData = {
      student_id: studentData.studentId || studentData.visitorregid,
      tenant_id: tenantId,
      meal_type: mealType, // 'lunch' or 'dinner'
      action: 'consume', // Phase 2 action
      timestamp: Date.now(),
      security_hash: this.generateMealSecurityHash(studentData.studentId || studentData.visitorregid, tenantId, mealType, 'consume')
    };

    return qrData;
  }

  // Generate unified meal QR code (can be used for both registration and consumption)
  static generateMealQR(studentData, mealType, tenantId, options = {}) {
    const qrData = {
      student_id: studentData.studentId || studentData.visitorregid,
      tenant_id: tenantId,
      meal_type: mealType, // 'lunch' or 'dinner'
      student_name: studentData.name || studentData.studentname,
      student_reg_no: studentData.visitorregno || studentData.studentregno,
      mobile: studentData.mobile,
      course: studentData.course,
      hostel: studentData.hostel,
      timestamp: Date.now(),
      expires_at: Date.now() + (options.validHours || 24) * 60 * 60 * 1000, // Default 24 hours
      security_hash: this.generateMealSecurityHash(studentData.studentId || studentData.visitorregid, tenantId, mealType, 'meal')
    };

    return qrData;
  }

  // Generate security hash for meal QR codes
  static generateMealSecurityHash(studentId, tenantId, mealType, action) {
    const data = `${studentId}-${tenantId}-${mealType}-${action}-${new Date().toISOString().split('T')[0]}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  // Validate meal QR code data
  static validateMealQR(qrData) {
    try {
      const required = ['student_id', 'tenant_id', 'meal_type'];
      const missing = required.filter(field => !qrData[field]);
      
      if (missing.length > 0) {
        return {
          valid: false,
          reason: `Missing required fields: ${missing.join(', ')}`
        };
      }

      // Validate meal type
      if (!['lunch', 'dinner'].includes(qrData.meal_type)) {
        return {
          valid: false,
          reason: 'Invalid meal type. Must be lunch or dinner'
        };
      }

      // Check expiration if expires_at is present
      if (qrData.expires_at && Date.now() > qrData.expires_at) {
        return {
          valid: false,
          reason: 'QR code has expired'
        };
      }

      // Validate security hash if present
      if (qrData.security_hash && qrData.action) {
        const expectedHash = this.generateMealSecurityHash(
          qrData.student_id, 
          qrData.tenant_id, 
          qrData.meal_type, 
          qrData.action
        );
        
        if (qrData.security_hash !== expectedHash) {
          return {
            valid: false,
            reason: 'Invalid security hash'
          };
        }
      }

      return {
        valid: true,
        data: qrData
      };

    } catch (error) {
      return {
        valid: false,
        reason: 'Invalid QR code format'
      };
    }
  }

  // Parse meal QR code string
  static parseMealQR(qrString) {
    try {
      const qrData = JSON.parse(qrString);
      return this.validateMealQR(qrData);
    } catch (error) {
      return {
        valid: false,
        reason: 'Invalid QR code format - not valid JSON'
      };
    }
  }

  // Generate meal QR code image for registration
  static async generateMealRegistrationQRImage(studentData, mealType, tenantId, options = {}) {
    try {
      const qrData = this.generateMealRegistrationQR(studentData, mealType, tenantId);
      const qrResult = await this.generateQRCode(qrData, options);
      
      if (qrResult.success) {
        return {
          success: true,
          qrData,
          qrImage: qrResult.qrImage,
          qrBase64: qrResult.qrBase64,
          qrString: qrResult.qrString,
          phase: 'registration',
          mealType,
          studentInfo: {
            id: studentData.studentId || studentData.visitorregid,
            name: studentData.name || studentData.studentname,
            regNo: studentData.visitorregno || studentData.studentregno
          }
        };
      }
      
      return qrResult;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate meal QR code image for consumption
  static async generateMealConsumptionQRImage(studentData, mealType, tenantId, options = {}) {
    try {
      const qrData = this.generateMealConsumptionQR(studentData, mealType, tenantId);
      const qrResult = await this.generateQRCode(qrData, options);
      
      if (qrResult.success) {
        return {
          success: true,
          qrData,
          qrImage: qrResult.qrImage,
          qrBase64: qrResult.qrBase64,
          qrString: qrResult.qrString,
          phase: 'consumption',
          mealType,
          studentInfo: {
            id: studentData.studentId || studentData.visitorregid,
            name: studentData.name || studentData.studentname,
            regNo: studentData.visitorregno || studentData.studentregno
          }
        };
      }
      
      return qrResult;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate unified meal QR code image (for both phases)
  static async generateMealQRImage(studentData, mealType, tenantId, options = {}) {
    try {
      const qrData = this.generateMealQR(studentData, mealType, tenantId, options);
      const qrResult = await this.generateQRCode(qrData, options);
      
      if (qrResult.success) {
        return {
          success: true,
          qrData,
          qrImage: qrResult.qrImage,
          qrBase64: qrResult.qrBase64,
          qrString: qrResult.qrString,
          phase: 'unified',
          mealType,
          studentInfo: {
            id: studentData.studentId || studentData.visitorregid,
            name: studentData.name || studentData.studentname,
            regNo: studentData.visitorregno || studentData.studentregno,
            mobile: studentData.mobile,
            course: studentData.course,
            hostel: studentData.hostel
          },
          validUntil: new Date(qrData.expires_at).toISOString()
        };
      }
      
      return qrResult;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get meal window status for QR generation
  static async getMealWindowStatus(tenantId, mealType) {
    try {
      const MealSettingsModel = require('../models/mealSettings.model');
      const settings = await MealSettingsModel.getMealSettings(tenantId);
      
      if (!settings) {
        return {
          canGenerate: false,
          reason: 'Meal settings not configured'
        };
      }

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

      // Helper function to convert time to minutes
      const timeToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const currentMinutes = timeToMinutes(currentTime);

      if (mealType === 'lunch') {
        const bookingStart = timeToMinutes(settings.lunchbookingstarttime || settings.lunchBookingStartTime);
        const servingEnd = timeToMinutes(settings.lunchendtime || settings.lunchEndTime);

        if (currentMinutes >= bookingStart && currentMinutes <= servingEnd) {
          const isBookingWindow = currentMinutes <= timeToMinutes(settings.lunchbookingendtime || settings.lunchBookingEndTime);
          const isServingWindow = currentMinutes >= timeToMinutes(settings.lunchstarttime || settings.lunchStartTime);

          return {
            canGenerate: true,
            currentWindow: isBookingWindow ? 'booking' : (isServingWindow ? 'serving' : 'between'),
            mealType: 'lunch'
          };
        }
      } else if (mealType === 'dinner') {
        const bookingStart = timeToMinutes(settings.dinnerbookingstarttime || settings.dinnerBookingStartTime);
        const servingEnd = timeToMinutes(settings.dinnerendtime || settings.dinnerEndTime);

        if (currentMinutes >= bookingStart && currentMinutes <= servingEnd) {
          const isBookingWindow = currentMinutes <= timeToMinutes(settings.dinnerbookingendtime || settings.dinnerBookingEndTime);
          const isServingWindow = currentMinutes >= timeToMinutes(settings.dinnerstarttime || settings.dinnerStartTime);

          return {
            canGenerate: true,
            currentWindow: isBookingWindow ? 'booking' : (isServingWindow ? 'serving' : 'between'),
            mealType: 'dinner'
          };
        }
      }

      return {
        canGenerate: false,
        reason: `${mealType} window is closed`
      };

    } catch (error) {
      return {
        canGenerate: false,
        reason: 'Failed to check meal window status'
      };
    }
  }
}

module.exports = QRService;
