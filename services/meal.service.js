const MealModel = require("../models/meal.model");
const StudentModel = require("../models/student.model");
const responseUtils = require("../utils/constants");

class MealService {
  
  // Main meal check-in service
  static async processMealCheckIn(studentId, tenantId, confirmed = false) {
    try {
      // Get current meal type based on time
      const currentMealType = MealModel.getCurrentMealType();
      
      if (!currentMealType) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Meal check-in is not allowed at this time. Breakfast: 8-10 AM, Lunch: 1-3 PM, Dinner: 7-9 PM',
          data: {
            allowedTimes: MealModel.getMealTimings()
          }
        };
      }

      // No student validation - external API will populate student data later

      // Check if student already checked in for this meal today
      const existingEntry = await MealModel.checkExistingMealEntry(
        tenantId, 
        studentId, 
        currentMealType
      );

      if (existingEntry) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: `You have already checked in for ${currentMealType} today`,
          data: {
            mealType: currentMealType,
            tokenNumber: existingEntry.tokennumber,
            mealTime: existingEntry.mealtime,
            status: existingEntry.status
          }
        };
      }

      // If not confirmed, return confirmation prompt
      if (!confirmed) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: `Are you sure you want to confirm ${currentMealType}?`,
          data: {
            mealType: currentMealType,
            studentId: studentId,
            requiresConfirmation: true
          }
        };
      }

      // Get next token number
      const tokenNumber = await MealModel.getNextTokenNumber(tenantId, currentMealType);

      // Create meal entry with minimal data - external API will populate student details later
      const mealData = {
        tenantId,
        studentId,
        studentRegNo: studentId.toString(),
        studentName: '',
        mobile: '',
        email: '',
        address: '',
        course: '',
        hostel: '',
        associatedFlat: '',
        associatedBlock: '',
        vehicleNo: '',
        visitorCatName: '',
        visitorSubCatName: '',
        securityCode: '',
        idNumber: '',
        idName: '',
        photoFlag: 'N',
        photoPath: '',
        photoName: '',
        validStartDate: null,
        validEndDate: null,
        mealType: currentMealType,
        tokenNumber,
        createdBy: 'STUDENT_QR'
      };

      const mealEntry = await MealModel.createMealEntry(mealData);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: `${currentMealType.charAt(0).toUpperCase() + currentMealType.slice(1)} confirmed successfully!`,
        data: {
          mealType: currentMealType,
          tokenNumber,
          studentName: '',
          mealTime: mealEntry.mealtime,
          mealDate: mealEntry.mealdate,
          status: 'confirmed'
        }
      };

    } catch (error) {
      console.error('Error in processMealCheckIn:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Internal server error during meal check-in',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get student's meal history
  static async getStudentMealHistory(studentId, tenantId, limit = 10) {
    try {
      const history = await MealModel.getStudentMealHistory(tenantId, studentId, limit);
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: history,
        count: history.length
      };
    } catch (error) {
      console.error('Error in getStudentMealHistory:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Error fetching meal history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get current meal queue
  static async getCurrentMealQueue(tenantId, mealType = null) {
    try {
      const currentMealType = mealType || MealModel.getCurrentMealType();
      
      if (!currentMealType) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'No active meal time currently'
        };
      }

      const queue = await MealModel.getCurrentMealQueue(tenantId, currentMealType);
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: {
          mealType: currentMealType,
          queue,
          totalStudents: queue.length,
          currentDate: new Date().toISOString().split('T')[0]
        }
      };
    } catch (error) {
      console.error('Error in getCurrentMealQueue:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Error fetching meal queue',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get meal statistics
  static async getMealStatistics(tenantId, fromDate, toDate) {
    try {
      const stats = await MealModel.getMealStatistics(tenantId, fromDate, toDate);
      
      // Helper function to convert YYYY-MM-DD to DD/MM/YYYY
      const convertToDisplayFormat = (dateStr) => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      };

      // Process statistics for better presentation
      const processedStats = {};
      stats.forEach(stat => {
        const date = stat.mealdate;
        if (!processedStats[date]) {
          processedStats[date] = {};
        }
        processedStats[date][stat.mealtype] = {
          studentCount: parseInt(stat.studentcount),
          maxToken: parseInt(stat.maxtoken)
        };
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: {
          dateRange: { 
            fromDate: convertToDisplayFormat(fromDate), 
            toDate: convertToDisplayFormat(toDate) 
          },
          statistics: processedStats,
          totalDays: Object.keys(processedStats).length
        }
      };
    } catch (error) {
      console.error('Error in getMealStatistics:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Error fetching meal statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Cancel meal entry
  static async cancelMealEntry(tenantId, mealId, updatedBy) {
    try {
      const cancelled = await MealModel.cancelMealEntry(tenantId, mealId, updatedBy);
      
      if (!cancelled) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Meal entry not found or already cancelled'
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Meal entry cancelled successfully',
        data: cancelled
      };
    } catch (error) {
      console.error('Error in cancelMealEntry:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Error cancelling meal entry',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Validate QR code data
  static validateQRData(qrData) {
    if (!qrData) {
      return { valid: false, message: 'QR code data is required' };
    }

    const { student_id, tenant_id } = qrData;

    if (!student_id) {
      return { valid: false, message: 'Student ID is required in QR code' };
    }

    if (!tenant_id) {
      return { valid: false, message: 'Tenant ID is required in QR code' };
    }

    return { valid: true };
  }
}

module.exports = MealService;