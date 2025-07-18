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
      1: "STA", // Staff
      2: "UNR", // Unregistered
      3: "STU", // Student
      4: "GUE", // Guest
      5: "BUS", // Bus
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
      1: "sta", // Staff
      2: "unr", // Unregistered
      3: "stu", // Student
      4: "gue", // Guest
      5: "bus", // Bus
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
}

module.exports = QRService;
