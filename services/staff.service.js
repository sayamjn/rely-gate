const StaffModel = require('../models/staff.model');
const responseUtils = require('../utils/constants');

class StaffService {
  // Get all staff with pagination and search
  static async getStaff(tenantId, page = 1, pageSize = 10, search = '') {
    try {
      const staff = await StaffModel.getStaff(tenantId, page, pageSize, search);
      const totalCount = await StaffModel.getStaffCount(tenantId, search);
      
      const totalPages = Math.ceil(totalCount / pageSize);
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: staff.rows,
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
      console.error('Error fetching staff:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Check-in staff member (First action - arrival for work, creates INTime)
  static async checkinStaff(staffId, tenantId, createdBy) {
    try {
      const staff = await StaffModel.getStaffById(staffId, tenantId);
      
      if (!staff) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff not found'
        };
      }

      const activeVisit = await StaffModel.getActiveVisit(staffId, tenantId);
      
      if (activeVisit && (!activeVisit.outtime || !activeVisit.outtimetxt)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff is already checked in',
          data: {
            historyId: activeVisit.regvisitorhistoryid,
            checkinTime: activeVisit.intimetxt,
            staffName: activeVisit.vistorname
          }
        };
      }

      const visitHistory = await StaffModel.createVisitHistory({
        tenantId,
        visitorRegId: staff.visitorregid,
        visitorRegNo: staff.visitorregno,
        securityCode: staff.securitycode,
        vistorName: staff.vistorname,
        mobile: staff.mobile,
        vehicleNo: staff.vehicleno || '',
        visitorCatId: 1, // Staff category
        visitorCatName: 'Staff',
        visitorSubCatId: staff.visitorsubcatid,
        visitorSubCatName: staff.visitorsubcatname,
        associatedFlat: staff.associatedflat || '',
        associatedBlock: staff.associatedblock || '',
        createdBy
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Staff checked in successfully',
        data: {
          historyId: visitHistory.regvisitorhistoryid,
          staffId: staffId,
          staffName: staff.vistorname,
          checkinTime: visitHistory.intimetxt,
          staffType: staff.visitorsubcatname,
          action: 'CHECKED_IN'
        }
      };

    } catch (error) {
      console.error('Error checking in staff:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Check-out staff member (Second action - leaving work, adds OutTime)
  static async checkoutStaff(staffId, tenantId, updatedBy) {
    try {
      const staff = await StaffModel.getStaffById(staffId, tenantId);
      
      if (!staff) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff not found'
        };
      }

      const activeVisit = await StaffModel.getActiveVisit(staffId, tenantId);
      
      if (!activeVisit) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff is not currently checked in'
        };
      }

      const updatedVisit = await StaffModel.updateVisitHistory(
        activeVisit.regvisitorhistoryid,
        tenantId,
        updatedBy
      );

      if (!updatedVisit) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Failed to check out staff'
        };
      }

      // Calculate duration
      const checkinTime = new Date(activeVisit.intime);
      const checkoutTime = new Date(updatedVisit.outtime);
      const durationHours = (checkoutTime - checkinTime) / (1000 * 60 * 60);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Staff checked out successfully',
        data: {
          historyId: updatedVisit.regvisitorhistoryid,
          staffId: staffId,
          staffName: staff.vistorname,
          checkinTime: updatedVisit.intimetxt,
          checkoutTime: updatedVisit.outtimetxt,
          durationHours: Math.round(durationHours * 100) / 100,
          staffType: staff.visitorsubcatname,
          action: 'CHECKED_OUT'
        }
      };

    } catch (error) {
      console.error('Error checking out staff:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get staff visit history
  static async getStaffHistory(staffId, tenantId, limit = 10) {
    try {
      const staff = await StaffModel.getStaffById(staffId, tenantId);
      
      if (!staff) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff not found'
        };
      }

      const history = await StaffModel.getStaffHistory(staffId, tenantId, limit);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: {
          staffInfo: {
            staffId: staff.visitorregid,
            staffName: staff.vistorname,
            staffRegNo: staff.visitorregno,
            staffType: staff.visitorsubcatname,
            mobile: staff.mobile
          },
          visitHistory: history
        }
      };
    } catch (error) {
      console.error('Error fetching staff history:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get staff currently checked in (pending checkout)
  static async getPendingCheckout(tenantId) {
    try {
      const pendingStaff = await StaffModel.getPendingCheckout(tenantId);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: pendingStaff,
        count: pendingStaff.length
      };
    } catch (error) {
      console.error('Error fetching pending checkout staff:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get staff status (first visit check)
  static async getStaffStatus(staffId, tenantId) {
    try {
      const status = await StaffModel.getStaffStatus(staffId, tenantId);
      
      if (!status) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Staff not found'
        };
      }

      // Determine what action is available
      let availableAction = '';
      let actionDescription = '';
      
      if (status.isFirstVisit) {
        availableAction = 'CHECKIN';
        actionDescription = 'Staff can check in (first visit)';
      } else if (status.isCurrentlyCheckedIn) {
        availableAction = 'CHECKOUT';
        actionDescription = 'Staff can check out (currently checked in)';
      } else {
        availableAction = 'CHECKIN';
        actionDescription = 'Staff can check in (not currently checked in)';
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: {
          ...status,
          availableAction,
          actionDescription
        }
      };
    } catch (error) {
      console.error('Error fetching staff status:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }
}

module.exports = StaffService;