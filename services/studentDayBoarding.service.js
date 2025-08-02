const StudentDayBoardingModel = require('../models/studentDayBoarding.model');
const OTPModel = require('../models/otp.model');
const QRService = require('./qr.service');
const responseUtils = require('../utils/constants');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

class StudentDayBoardingService {

  // ================================================================================
  // BULK UPLOAD METHODS
  // ================================================================================

  // Process CSV bulk upload
  static async processBulkUpload(tenantId, filePath, createdBy) {
    try {
      const csvData = await this._parseCSV(filePath);
      
      // Validate CSV structure
      const validation = this._validateCSVData(csvData);
      if (!validation.valid) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: validation.message,
          data: validation.errors
        };
      }

      // Process students data
      const studentsData = csvData.map(row => ({
        studentId: row.StudentID || row.studentid || row.student_id,
        studentName: row.StudentName || row.studentname || row.student_name,
        course: row.Course || row.course,
        section: row.Section || row.section,
        year: row.Year || row.year,
        primaryGuardianName: row.PrimaryGuardianName || row.primaryguardianname || row.guardian_name,
        primaryGuardianPhone: row.PrimaryGuardianPhone || row.primaryguardianphone || row.guardian_phone,
        guardianRelation: row.GuardianRelation || row.guardianrelation || row.relation || 'Guardian'
      }));

      // Bulk insert students
      const results = await StudentDayBoardingModel.bulkInsertStudents(studentsData, tenantId, createdBy);
      
      // Generate summary
      const summary = this._generateUploadSummary(results);
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Bulk upload completed successfully',
        data: {
          summary,
          details: results
        }
      };

    } catch (error) {
      console.error('Error in bulk upload:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to process bulk upload',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get students with filters and pagination
  static async getStudents(tenantId, filters = {}) {
    try {
      const students = await StudentDayBoardingModel.getStudentsWithFilters(tenantId, filters);
      
      // Get total count and pagination info
      const totalCount = students.length > 0 ? parseInt(students[0].total_count) : 0;
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Map to response format
      const mapped = students.map(s => ({
        StudentDayBoardingID: s.studentdayboardingid,
        StudentID: s.studentid,
        StudentName: s.studentname,
        Course: s.course,
        Section: s.section,
        Year: s.year,
        PrimaryGuardianName: s.primaryguardianname,
        PrimaryGuardianPhone: s.primaryguardianphone,
        GuardianRelation: s.guardianrelation,
        VisitorCatID: s.visitorcatid || 7,
        VisitorCatName: s.visitorcatname || 'Day Boarding Student',
        QREnabled: true, // QR generation is available for all day boarding students
        CreatedDate: s.createddate,
        CreatedBy: s.createdby
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Students retrieved successfully',
        data: mapped,
        count: mapped.length,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalRecords: totalCount,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      };

    } catch (error) {
      console.error('Error fetching students:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to fetch students',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Generate QR code for student
  static async generateStudentQR(tenantId, studentDayBoardingId, updatedBy) {
    try {
      const student = await StudentDayBoardingModel.getStudentById(studentDayBoardingId, tenantId);
      
      if (!student) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student not found'
        };
      }

      // Generate QR data using QR service with visitorCatId = 7
      const visitorData = {
        tenantId: tenantId,
        visitorCatId: 7,
        studentid: student.studentid,
        studentName: student.studentname
      };
      
      const qrData = QRService.generateQRData(visitorData);
      
      // Add additional student-specific data
      qrData.studentId = student.studentid;
      qrData.studentName = student.studentname;

      // Generate QR code
      const qrResult = await QRService.generateQRCode(qrData);
      
      if (!qrResult.success) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Failed to generate QR code',
          error: qrResult.error
        };
      }

      // Save QR code file
      const qrFileName = `student_dayboard_qr_${studentDayBoardingId}_${Date.now()}.png`;
      const qrPath = path.join('uploads', 'qr_codes', qrFileName);
      const fullPath = path.join(process.cwd(), qrPath);

      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Convert base64 to file
      const qrBuffer = Buffer.from(qrResult.qrBase64, 'base64');
      fs.writeFileSync(fullPath, qrBuffer);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'QR code generated successfully',
        data: {
          qrPath,
          qrFileName,
          qrData,
          qrBase64: qrResult.qrBase64
        }
      };

    } catch (error) {
      console.error('Error generating QR code:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to generate QR code',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // ================================================================================
  // GUARDIAN AUTH MASTER METHODS
  // ================================================================================

  // Verify guardian phone and send OTP
  static async verifyGuardianPhone(tenantId, phoneNumber, createdBy) {
    try {
      const guardian = await StudentDayBoardingModel.getGuardianByPhone(tenantId, phoneNumber);
      
      if (!guardian) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'No data found with the provided phone number'
        };
      }

      // Generate OTP
      const otpResult = await OTPModel.generateOTP(tenantId, phoneNumber, createdBy);
      
      // In production, send SMS here
      console.log(`OTP ${otpResult.otpNumber} generated for ${phoneNumber}`);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'OTP sent successfully',
        data: {
          authMasterId: guardian.authmasterid,
          name: guardian.name,
          relation: guardian.relation,
          otpRef: otpResult.refId,
          // Don't send OTP in production
          ...(process.env.NODE_ENV === 'development' && { otp: otpResult.otpNumber })
        }
      };

    } catch (error) {
      console.error('Error verifying guardian phone:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to verify phone number',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Verify OTP
  static async verifyOTP(otpRef, otpNumber, phoneNumber) {
    try {
      const verification = await OTPModel.verifyOTP(otpRef, otpNumber, phoneNumber);
      
      if (!verification.verified) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid or expired OTP'
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'OTP verified successfully',
        data: {
          verified: true,
          tenantId: verification.tenantId
        }
      };

    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to verify OTP',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get students linked to guardian
  static async getGuardianStudents(tenantId, authMasterId) {
    try {
      const students = await StudentDayBoardingModel.getStudentsByGuardian(tenantId, authMasterId);
      
      const mapped = students.map(s => ({
        StudentDayBoardingID: s.studentdayboardingid,
        StudentID: s.studentid,
        StudentName: s.studentname,
        Course: s.course,
        Section: s.section,
        Year: s.year,
        Relation: s.relation,
        PhotoFlag: s.photoflag === 'Y',
        PhotoPath: s.photopath,
        PhotoName: s.photoname,
        LinkActive: s.linkactive === 'Y'
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Students retrieved successfully',
        data: mapped,
        count: mapped.length
      };

    } catch (error) {
      console.error('Error fetching guardian students:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to fetch students',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Add guardian to auth master
  static async addGuardian(tenantId, guardianData, createdBy) {
    try {
      // Validate that studentDayBoardingId is provided
      if (!guardianData.studentDayBoardingId) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student Day Boarding ID is required'
        };
      }

      // Verify that the student exists
      const student = await StudentDayBoardingModel.getStudentById(guardianData.studentDayBoardingId, tenantId);
      if (!student) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student not found'
        };
      }

      const result = await StudentDayBoardingModel.addGuardianAuth(tenantId, guardianData, createdBy);
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Guardian added successfully',
        data: result
      };

    } catch (error) {
      console.error('Error adding guardian:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to add guardian',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // ================================================================================
  // STUDENT-GUARDIAN LINKING METHODS
  // ================================================================================

  // Link student to guardian
  static async linkStudentToGuardian(tenantId, linkData, createdBy) {
    try {
      // Check if link already exists
      const linkExists = await StudentDayBoardingModel.checkStudentGuardianLink(
        tenantId, linkData.studentDayBoardingId, linkData.authMasterId
      );

      if (linkExists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student is already linked to this guardian'
        };
      }

      const result = await StudentDayBoardingModel.linkStudentToGuardian(tenantId, linkData, createdBy);
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Student linked to guardian successfully',
        data: result
      };

    } catch (error) {
      console.error('Error linking student to guardian:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to link student to guardian',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Inactivate student-guardian link
  static async inactivateLink(tenantId, linkId, updatedBy) {
    try {
      const result = await StudentDayBoardingModel.inactivateStudentGuardianLink(linkId, tenantId, updatedBy);
      
      if (!result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Link not found'
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Link inactivated successfully'
      };

    } catch (error) {
      console.error('Error inactivating link:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to inactivate link',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // ================================================================================
  // CHECKOUT METHODS
  // ================================================================================

  // Process student checkout via QR scan
  static async processCheckout(tenantId, qrData, guardianData, createdBy) {
    try {
      // Get student by StudentID from QR
      const student = await StudentDayBoardingModel.getStudentByStudentId(tenantId, qrData.studentId);
      
      if (!student) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Student not found'
        };
      }

      // Get guardian info
      const guardian = await StudentDayBoardingModel.getGuardianByPhone(tenantId, guardianData.guardianPhone);
      
      if (!guardian) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Guardian not authorized for pickup'
        };
      }

      // Check if guardian is linked to this student
      const linkExists = await StudentDayBoardingModel.checkStudentGuardianLink(
        tenantId, student.studentdayboardingid, guardian.authmasterid
      );

      if (!linkExists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Guardian is not authorized to pick up this student'
        };
      }

      // Create checkout record
      const checkoutData = {
        studentDayBoardingId: student.studentdayboardingid,
        authMasterId: guardian.authmasterid,
        studentId: student.studentid,
        studentName: student.studentname,
        guardianName: guardian.name,
        guardianPhone: guardian.phonenumber,
        relation: guardian.relation,
        status: 'PENDING_OTP',
        remarks: guardianData.remarks || null
      };

      const checkoutResult = await StudentDayBoardingModel.createCheckoutRecord(tenantId, checkoutData, createdBy);

      // Generate and send OTP to primary guardian
      const otpResult = await OTPModel.generateOTP(tenantId, student.primaryguardianphone, createdBy);
      
      // Update checkout record with OTP info
      await StudentDayBoardingModel.updateCheckoutOTP(
        checkoutResult.historyid, tenantId,
        {
          sent: 'Y',
          number: otpResult.otpNumber,
          sentTime: new Date(),
          verified: 'N'
        },
        createdBy
      );

      console.log(`OTP ${otpResult.otpNumber} sent to primary guardian ${student.primaryguardianphone}`);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'OTP sent to primary guardian phone',
        data: {
          historyId: checkoutResult.historyid,
          studentName: student.studentname,
          guardianName: guardian.name,
          primaryGuardianPhone: student.primaryguardianphone,
          otpRef: otpResult.refId,
          // Don't send OTP in production
          ...(process.env.NODE_ENV === 'development' && { otp: otpResult.otpNumber })
        }
      };

    } catch (error) {
      console.error('Error processing checkout:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to process checkout',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Complete checkout after OTP verification
  static async completeCheckout(tenantId, historyId, otpRef, otpNumber, primaryGuardianPhone, updatedBy) {
    try {
      // Verify OTP
      const verification = await OTPModel.verifyOTP(otpRef, otpNumber, primaryGuardianPhone);
      
      if (!verification.verified) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Invalid or expired OTP'
        };
      }

      // Update checkout record
      await StudentDayBoardingModel.updateCheckoutOTP(
        historyId, tenantId,
        {
          verified: 'Y',
          verifiedTime: new Date()
        },
        updatedBy
      );

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Student checkout completed successfully'
      };

    } catch (error) {
      console.error('Error completing checkout:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to complete checkout',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get checkout history
  static async getCheckoutHistory(tenantId, filters = {}) {
    try {
      const history = await StudentDayBoardingModel.getCheckoutHistory(tenantId, filters);
      
      // Get pagination info
      const totalCount = history.length > 0 ? parseInt(history[0].total_count) : 0;
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Map to response format
      const mapped = history.map(h => ({
        HistoryID: h.historyid,
        StudentID: h.studentid,
        StudentName: h.studentname,
        Course: h.course,
        Section: h.section,
        Year: h.year,
        GuardianName: h.guardianname,
        GuardianPhone: h.guardianphone,
        Relation: h.relation,
        VisitorCatID: h.visitorcatid || 7,
        VisitorCatName: h.visitorcatname || 'Day Boarding Student',
        CheckInTime: h.checkintime,
        CheckInTimeTxt: h.checkintimetxt,
        CheckOutTime: h.checkouttime,
        CheckOutTimeTxt: h.checkouttimetxt,
        OTPSent: h.otpsent === 'Y',
        OTPVerified: h.otpverified === 'Y',
        Status: h.status,
        Remarks: h.remarks,
        CreatedDate: h.createddate
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Checkout history retrieved successfully',
        data: mapped,
        count: mapped.length,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalRecords: totalCount,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      };

    } catch (error) {
      console.error('Error fetching checkout history:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to fetch checkout history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // ================================================================================
  // UTILITY METHODS
  // ================================================================================

  // Get filter dropdown data
  static async getFilterData(tenantId) {
    try {
      const [courses, sections, years] = await Promise.all([
        StudentDayBoardingModel.getCourses(tenantId),
        StudentDayBoardingModel.getSections(tenantId),
        StudentDayBoardingModel.getYears(tenantId)
      ]);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Filter data retrieved successfully',
        data: {
          courses: courses.map(c => c.course),
          sections: sections.map(s => s.section),
          years: years.map(y => y.year)
        }
      };

    } catch (error) {
      console.error('Error fetching filter data:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to fetch filter data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // ================================================================================
  // PRIVATE HELPER METHODS
  // ================================================================================

  // Parse CSV file
  static async _parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  // Validate CSV data structure
  static _validateCSVData(csvData) {
    if (!csvData || csvData.length === 0) {
      return {
        valid: false,
        message: 'CSV file is empty',
        errors: []
      };
    }

    const requiredFields = ['StudentID', 'StudentName', 'PrimaryGuardianName', 'PrimaryGuardianPhone'];
    const errors = [];

    // Check for required columns
    const headers = Object.keys(csvData[0]);
    const missingHeaders = requiredFields.filter(field => 
      !headers.some(header => 
        header.toLowerCase().replace(/[^a-z]/g, '') === field.toLowerCase().replace(/[^a-z]/g, '')
      )
    );

    if (missingHeaders.length > 0) {
      return {
        valid: false,
        message: `Missing required columns: ${missingHeaders.join(', ')}`,
        errors: []
      };
    }

    // Validate each row
    csvData.forEach((row, index) => {
      const rowNumber = index + 1;
      
      // Check required fields
      requiredFields.forEach(field => {
        const value = this._getFieldValue(row, field);
        if (!value || value.trim() === '') {
          errors.push(`Row ${rowNumber}: ${field} is required`);
        }
      });

      // Validate phone number
      const phone = this._getFieldValue(row, 'PrimaryGuardianPhone');
      if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
        errors.push(`Row ${rowNumber}: Invalid phone number format`);
      }
    });

    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? 'Validation errors found' : 'Validation passed',
      errors
    };
  }

  // Get field value from CSV row (case insensitive)
  static _getFieldValue(row, fieldName) {
    const keys = Object.keys(row);
    const key = keys.find(k => 
      k.toLowerCase().replace(/[^a-z]/g, '') === fieldName.toLowerCase().replace(/[^a-z]/g, '')
    );
    return key ? row[key] : null;
  }

  // Generate upload summary
  static _generateUploadSummary(results) {
    const total = results.length;
    const successful = results.filter(r => r.status === 'SUCCESS').length;
    const duplicates = results.filter(r => r.status === 'DUPLICATE').length;
    const errors = results.filter(r => r.status === 'ERROR').length;

    return {
      total,
      successful,
      duplicates,
      errors,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : '0%'
    };
  }
}

module.exports = StudentDayBoardingService;