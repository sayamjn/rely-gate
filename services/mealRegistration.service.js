const MealModel = require('../models/meal.model');
const MealSettingsModel = require('../models/mealSettings.model');
const StudentModel = require('../models/student.model');
const ResponseFormatter = require('../utils/response');
const responseUtils = require('../utils/constants');

class MealRegistrationService {
  // Register student for meal during booking window (Phase 1)
  static async registerStudentForMeal(studentId, tenantId, mealType, isSpecial = false, specialRemarks = '', createdBy) {
    try {
      // Get student details
      const student = await StudentModel.getStudentById(studentId, tenantId);
      if (!student) {
        return ResponseFormatter.error('Student not found');
      }

      // Check if registration window is open
      const windowCheck = await this.validateRegistrationWindow(tenantId, mealType);
      if (!windowCheck.valid) {
        return ResponseFormatter.error(windowCheck.message);
      }

      // Check if student already registered for this meal today
      const existingRegistration = await MealModel.checkExistingMealRegistration(
        tenantId, 
        studentId, 
        mealType
      );

      if (existingRegistration) {
        if (existingRegistration.status === 'confirmed') {
          return ResponseFormatter.error('Student already registered for this meal today');
        } else if (existingRegistration.status === 'consumed') {
          return ResponseFormatter.error('Student already consumed this meal today');
        }
      }

      // Prepare meal data
      const mealData = {
        tenantId,
        studentId,
        studentRegNo: student.visitorregno,
        studentName: student.name,
        mobile: student.mobile,
        email: student.email || '',
        address: student.address || '',
        course: student.course || '',
        hostel: student.hostel || '',
        associatedFlat: student.associatedflat || '',
        associatedBlock: student.associatedblock || '',
        mealType,
        isSpecial: isSpecial ? 'Y' : 'N',
        specialRemarks: specialRemarks || '',
        createdBy
      };

      // Register for meal
      const mealRegistration = await MealModel.registerForMeal(mealData);

      return ResponseFormatter.success('Meal registered successfully', {
        mealId: mealRegistration.mealid,
        tokenNumber: mealRegistration.tokennumber,
        mealType,
        mealDate: mealRegistration.mealdate,
        mealTime: mealRegistration.mealtime,
        isSpecial: mealRegistration.isspecial === 'Y',
        specialRemarks: mealRegistration.specialremarks,
        student: {
          id: studentId,
          name: student.name,
          regNo: student.visitorregno,
          mobile: student.mobile,
          course: student.course,
          hostel: student.hostel
        }
      });

    } catch (error) {
      console.error('Error in registerStudentForMeal:', error);
      return ResponseFormatter.error('Failed to register for meal', error.message);
    }
  }

  // Register via QR code during booking window
  static async registerViaQR(qrData, tenantId, isSpecial = false, specialRemarks = '', createdBy) {
    try {
      const { student_id, meal_type } = qrData;

      if (!student_id || !meal_type) {
        return ResponseFormatter.error('Invalid QR data: student_id and meal_type required');
      }

      return await this.registerStudentForMeal(
        parseInt(student_id), 
        tenantId, 
        meal_type, 
        isSpecial, 
        specialRemarks, 
        createdBy
      );

    } catch (error) {
      console.error('Error in registerViaQR:', error);
      return ResponseFormatter.error('Failed to register via QR code', error.message);
    }
  }

  // Validate if registration window is open
  static async validateRegistrationWindow(tenantId, mealType) {
    try {
      const settings = await MealSettingsModel.getMealSettings(tenantId);
      if (!settings) {
        return { valid: false, message: 'Meal settings not configured' };
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
        const bookingEnd = timeToMinutes(settings.lunchbookingendtime || settings.lunchBookingEndTime);

        if (currentMinutes >= bookingStart && currentMinutes <= bookingEnd) {
          return { valid: true, message: 'Lunch booking window is open' };
        } else if (currentMinutes < bookingStart) {
          return { valid: false, message: `Lunch booking opens at ${settings.lunchbookingstarttime || settings.lunchBookingStartTime}` };
        } else {
          return { valid: false, message: `Lunch booking closed at ${settings.lunchbookingendtime || settings.lunchBookingEndTime}` };
        }
      } else if (mealType === 'dinner') {
        const bookingStart = timeToMinutes(settings.dinnerbookingstarttime || settings.dinnerBookingStartTime);
        const bookingEnd = timeToMinutes(settings.dinnerbookingendtime || settings.dinnerBookingEndTime);

        if (currentMinutes >= bookingStart && currentMinutes <= bookingEnd) {
          return { valid: true, message: 'Dinner booking window is open' };
        } else if (currentMinutes < bookingStart) {
          return { valid: false, message: `Dinner booking opens at ${settings.dinnerbookingstarttime || settings.dinnerBookingStartTime}` };
        } else {
          return { valid: false, message: `Dinner booking closed at ${settings.dinnerbookingendtime || settings.dinnerBookingEndTime}` };
        }
      }

      return { valid: false, message: 'Invalid meal type' };

    } catch (error) {
      console.error('Error validating registration window:', error);
      return { valid: false, message: 'Failed to validate booking window' };
    }
  }

  // Get current registration status for a meal type
  static async getRegistrationStatus(tenantId, mealType) {
    try {
      const windowCheck = await this.validateRegistrationWindow(tenantId, mealType);
      const totalRegistrations = await this.getTotalRegistrations(tenantId, mealType);

      return ResponseFormatter.success('Registration status retrieved', {
        mealType,
        isBookingOpen: windowCheck.valid,
        message: windowCheck.message,
        totalRegistrations,
        date: new Date().toISOString().split('T')[0]
      });

    } catch (error) {
      console.error('Error getting registration status:', error);
      return ResponseFormatter.error('Failed to get registration status', error.message);
    }
  }

  // Get total registrations for today's meal
  static async getTotalRegistrations(tenantId, mealType, mealDate = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      const registrations = await MealModel.getRegisteredMeals(tenantId, mealType, targetDate);
      return registrations.length;
    } catch (error) {
      console.error('Error getting total registrations:', error);
      return 0;
    }
  }

  // Update meal registration (special requests)
  static async updateRegistration(tenantId, mealId, updateData, updatedBy) {
    try {
      const { isSpecial, specialRemarks } = updateData;

      // Validate that registration exists and is in correct state
      const registration = await MealModel.checkExistingMealRegistration(tenantId, null, null, null);
      if (!registration) {
        return ResponseFormatter.error('Meal registration not found');
      }

      if (registration.status !== 'confirmed' || registration.isconsumed === 'Y') {
        return ResponseFormatter.error('Cannot update consumed or cancelled meal');
      }

      const updatedRegistration = await MealModel.updateMealRegistration(
        tenantId,
        mealId,
        {
          isSpecial: isSpecial ? 'Y' : 'N',
          specialRemarks: specialRemarks || ''
        },
        updatedBy
      );

      if (!updatedRegistration) {
        return ResponseFormatter.error('Failed to update meal registration');
      }

      return ResponseFormatter.success('Meal registration updated successfully', {
        mealId: updatedRegistration.mealid,
        tokenNumber: updatedRegistration.tokennumber,
        studentName: updatedRegistration.studentname,
        mealType: updatedRegistration.mealtype,
        isSpecial: updatedRegistration.isspecial === 'Y',
        specialRemarks: updatedRegistration.specialremarks
      });

    } catch (error) {
      console.error('Error updating meal registration:', error);
      return ResponseFormatter.error('Failed to update meal registration', error.message);
    }
  }

  // Cancel meal registration (only during booking window)
  static async cancelRegistration(tenantId, mealId, cancelledBy) {
    try {
      // Check if we're still in booking window
      const registration = await MealModel.checkExistingMealRegistration(tenantId, null, null, null);
      if (!registration) {
        return ResponseFormatter.error('Meal registration not found');
      }

      const windowCheck = await this.validateRegistrationWindow(tenantId, registration.mealtype);
      if (!windowCheck.valid) {
        return ResponseFormatter.error('Cannot cancel registration outside booking window');
      }

      const cancelledRegistration = await MealModel.cancelMealRegistration(
        tenantId,
        mealId,
        cancelledBy
      );

      if (!cancelledRegistration) {
        return ResponseFormatter.error('Failed to cancel meal registration');
      }

      return ResponseFormatter.success('Meal registration cancelled successfully', {
        mealId: cancelledRegistration.mealid,
        tokenNumber: cancelledRegistration.tokennumber,
        studentName: cancelledRegistration.studentname,
        mealType: cancelledRegistration.mealtype
      });

    } catch (error) {
      console.error('Error cancelling meal registration:', error);
      return ResponseFormatter.error('Failed to cancel meal registration', error.message);
    }
  }

  // Get student's meal registrations for today
  static async getStudentRegistrations(tenantId, studentId) {
    try {
      const mealDate = new Date().toISOString().split('T')[0];
      const registrations = [];

      // Check for lunch registration
      const lunchReg = await MealModel.checkExistingMealRegistration(tenantId, studentId, 'lunch', mealDate);
      if (lunchReg) {
        registrations.push({
          mealId: lunchReg.mealid,
          mealType: 'lunch',
          tokenNumber: lunchReg.tokennumber,
          status: lunchReg.status,
          isSpecial: lunchReg.isspecial === 'Y',
          specialRemarks: lunchReg.specialremarks,
          isConsumed: lunchReg.isconsumed === 'Y',
          consumedTime: lunchReg.consumedtime,
          registrationTime: lunchReg.mealtime
        });
      }

      // Check for dinner registration
      const dinnerReg = await MealModel.checkExistingMealRegistration(tenantId, studentId, 'dinner', mealDate);
      if (dinnerReg) {
        registrations.push({
          mealId: dinnerReg.mealid,
          mealType: 'dinner',
          tokenNumber: dinnerReg.tokennumber,
          status: dinnerReg.status,
          isSpecial: dinnerReg.isspecial === 'Y',
          specialRemarks: dinnerReg.specialremarks,
          isConsumed: dinnerReg.isconsumed === 'Y',
          consumedTime: dinnerReg.consumedtime,
          registrationTime: dinnerReg.mealtime
        });
      }

      return ResponseFormatter.success('Student meal registrations retrieved', {
        studentId,
        date: mealDate,
        registrations
      });

    } catch (error) {
      console.error('Error getting student registrations:', error);
      return ResponseFormatter.error('Failed to get student meal registrations', error.message);
    }
  }

  // Get all registrations for a meal type today
  static async getMealRegistrations(tenantId, mealType, mealDate = null) {
    try {
      const targetDate = mealDate || new Date().toISOString().split('T')[0];
      const registrations = await MealModel.getRegisteredMeals(tenantId, mealType, targetDate);

      return ResponseFormatter.success('Meal registrations retrieved', {
        mealType,
        date: targetDate,
        totalRegistrations: registrations.length,
        registrations: registrations.map(reg => ({
          mealId: reg.mealid,
          studentId: reg.studentid,
          studentName: reg.studentname,
          studentRegNo: reg.studentregno,
          mobile: reg.mobile,
          course: reg.course,
          hostel: reg.hostel,
          tokenNumber: reg.tokennumber,
          registrationTime: reg.mealtime,
          isSpecial: reg.isspecial === 'Y',
          specialRemarks: reg.specialremarks,
          status: reg.status
        }))
      });

    } catch (error) {
      console.error('Error getting meal registrations:', error);
      return ResponseFormatter.error('Failed to get meal registrations', error.message);
    }
  }
}

module.exports = MealRegistrationService;