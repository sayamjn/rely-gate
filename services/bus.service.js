const BusModel = require('../models/bus.model');
const responseUtils = require("../utils/constants");
const DateFormatter = require('../utils/dateFormatter');

class BusService {

  // Get buses with filters
  static async getBusesWithFilters(tenantId, filters = {}) {
    try {
      const buses = await BusModel.getBusesWithFilters(tenantId, filters);
      
      const totalCount = buses.length > 0 ? parseInt(buses[0].total_count) : 0;
      const currentPage = parseInt(filters.page) || 1;
      const pageSize = parseInt(filters.pageSize) || 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: buses.map(bus => {
          const { total_count, ...busData } = bus;
          
          // Calculate formatted duration
          const formatDuration = (hours) => {
            if (!hours || hours <= 0) return null;
            const h = Math.floor(hours);
            const m = Math.round((hours % 1) * 60);
            return {
              hours: h,
              minutes: m,
              formatted: `${h}h ${m}m`,
              totalMinutes: Math.round(hours * 60)
            };
          };


          return {
            ...busData,
            lastPurpose: {
              purposeId: busData.lastvisitpurposeid,
              purposeName: busData.lastvisitpurpose,
              purposeCatId: busData.lastpurposecatid,
              purposeCatName: busData.lastpurposecatname
            },
            lastActivity: {
              checkOut: {
                dateTime: DateFormatter.formatDateTime(busData.lastcheckoutdatetime),
                timeText: busData.lastcheckouttime
              },
              checkIn: {
                dateTime: DateFormatter.formatDateTime(busData.lastcheckindatetime),
                timeText: busData.lastcheckintime
              },
              visitDate: DateFormatter.formatDateTime(busData.lastvisitdate),
              historyId: busData.lasthistoryid
            },
            duration: {
              lastVisit: busData.lastvisitdurationhours ? 
                formatDuration(busData.lastvisitdurationhours) : null,
              currentCheckout: busData.currentcheckoutdurationhours ? 
                formatDuration(busData.currentcheckoutdurationhours) : null
            },
            status: {
              current: busData.currentstatus,
              isCheckedOut: busData.currentstatus === 'CHECKED_OUT',
              isCheckedIn: busData.currentstatus === 'CHECKED_IN'
            }
          };
        }),
        pagination: {
          currentPage,
          pageSize,
          totalCount,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        },
        filters: filters
      };
    } catch (error) {
      console.error('Error fetching buses with filters:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get bus purposes 
  static async getBusPurposes(tenantId, purposeCatId = 2) {
    try {
      const purposes = await BusModel.getBusPurposes(tenantId, purposeCatId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: purposes,
        count: purposes.length
      };
    } catch (error) {
      console.error('Error fetching bus purposes:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get bus status
  static async getBusStatus(busId, tenantId) {
    try {
      const bus = await BusModel.getBusById(busId, tenantId);
      
      if (!bus) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Bus not found'
        };
      }

      const activeVisit = await BusModel.getActiveVisit(busId, tenantId);
      
      let status = {
        busId: bus.visitorregid,
        busNumber: bus.busnumber || 'N/A',
        registrationNumber: bus.registrationnumber || 'N/A',
        driverName: bus.drivername || 'N/A',
        busRegNo: bus.visitorregno,
        mobile: bus.mobile,
        canCheckOut: false,
        canCheckIn: false,
        lastActivity: null,
        lastPurpose: null,
        isFirstVisit: false
      };

      if (!activeVisit) {
        status.canCheckOut = true;
        status.isFirstVisit = true;
        status.action = 'CHECKOUT';
        status.message = 'Bus can check out (first visit)';
      } else if (!activeVisit.outtime || !activeVisit.outtimetxt) {
        status.canCheckIn = true;
        status.action = 'CHECKIN';
        status.message = 'Bus can check in';
        status.lastActivity = {
          checkOutTime: activeVisit.intimeTxt,
          checkOutDate: activeVisit.intime,
          historyId: activeVisit.regvisitorhistoryid
        };
        status.lastPurpose = {
          purposeId: activeVisit.visitpurposeid,
          purposeName: activeVisit.visitpurpose,
          purposeCatId: activeVisit.purposecatid,
          purposeCategory: activeVisit.purposecatname
        };
      } else {
        status.canCheckOut = true;
        status.action = 'CHECKOUT';
        status.message = 'Bus can check out';
        status.lastActivity = {
          checkInTime: activeVisit.outtimetxt,
          checkInDate: activeVisit.outtime,
          checkOutTime: activeVisit.intimeTxt,
          checkOutDate: activeVisit.intime,
          historyId: activeVisit.regvisitorhistoryid
        };
        status.lastPurpose = {
          purposeId: activeVisit.visitpurposeid,
          purposeName: activeVisit.visitpurpose,
          purposeCatId: activeVisit.purposecatid,
          purposeCategory: activeVisit.purposecatname
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: status
      };
    } catch (error) {
      console.error('Error getting bus status:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Checkout bus with purpose 
  static async checkoutBus(busId, tenantId, purposeId, purposeName, createdBy) {
    try {
      const bus = await BusModel.getBusById(busId, tenantId);
      
      if (!bus) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Bus not found'
        };
      }

      const activeVisit = await BusModel.getActiveVisit(busId, tenantId);
      
      if (activeVisit && (!activeVisit.outtime || !activeVisit.outtimetxt)) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Bus is already checked out',
          data: {
            historyId: activeVisit.regvisitorhistoryid,
            checkOutTime: activeVisit.intimeTxt,
            currentPurpose: {
              purposeId: activeVisit.visitpurposeid,
              purposeName: activeVisit.visitpurpose
            }
          }
        };
      }

      // Handle purpose logic
      let finalPurposeId = null;
      let finalPurposeName = '';
      let purposeCatId = 2; // Bus category
      let purposeCatName = 'Bus';

      if (purposeId === -1) {
        finalPurposeId = -1;
        finalPurposeName = purposeName || 'Other';
      } else if (purposeId && purposeId > 0) {
        const purpose = await BusModel.getPurposeById(purposeId, tenantId);
        if (purpose) {
          finalPurposeId = purpose.visitpurposeid;
          finalPurposeName = purpose.visitpurpose;
          purposeCatId = purpose.purposecatid;
          purposeCatName = purpose.purposecatname;
        } else {
          return {
            responseCode: responseUtils.RESPONSE_CODES.ERROR,
            responseMessage: 'Invalid purpose ID provided'
          };
        }
      } else {
        finalPurposeId = 6; // Default bus purpose
        finalPurposeName = 'Bus Meeting';
      }

      const visitHistory = await BusModel.createVisitHistory({
        tenantId,
        visitorRegId: bus.visitorregid,
        visitorRegNo: bus.visitorregno,
        securityCode: bus.securitycode,
        vistorName: bus.vistorname,
        mobile: bus.mobile,
        vehicleNo: bus.vehicleno || '',
        visitorCatId: 5, // Bus category
        visitorCatName: 'Bus',
        visitorSubCatId: bus.visitorsubcatid,
        visitorSubCatName: bus.visitorsubcatname,
        associatedFlat: bus.associatedflat || '',
        associatedBlock: bus.associatedblock || '',
        visitPurposeId: finalPurposeId,
        visitPurpose: finalPurposeName,
        purposeCatId,
        purposeCatName,
        createdBy
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Bus checked out successfully',
        data: {
          historyId: visitHistory.regvisitorhistoryid,
          busNumber: bus.busnumber || 'N/A',
          registrationNumber: bus.registrationnumber || 'N/A',
          driverName: bus.drivername || 'N/A',
          checkOutTime: new Date().toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          }),
          purpose: {
            purposeId: finalPurposeId,
            purposeName: finalPurposeName,
            purposeCatId: purposeCatId,
            purposeCatName: purposeCatName,
            isCustom: purposeId === -1
          },
          isFirstVisit: !activeVisit
        }
      };
    } catch (error) {
      console.error('Error checking out bus:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Check-in bus
  static async checkinBus(busId, tenantId, updatedBy) {
    try {
      const activeVisit = await BusModel.getActiveVisit(busId, tenantId);
      
      if (!activeVisit) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'No active visit found for bus'
        };
      }

      if (activeVisit.outtime && activeVisit.outtimetxt) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Bus is already checked in'
        };
      }

      const result = await BusModel.updateVisitHistoryCheckin(
        activeVisit.regvisitorhistoryid,
        tenantId,
        updatedBy
      );
      
      if (result) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
          responseMessage: 'Bus checked in successfully',
          data: {
            historyId: result.regvisitorhistoryid,
            checkInTime: new Date().toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: true 
            }),
            purpose: {
              purposeId: activeVisit.visitpurposeid,
              purposeName: activeVisit.visitpurpose,
              purposeCatId: activeVisit.purposecatid,
              purposeCatName: activeVisit.purposecatname
            }
          }
        };
      } else {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visit history not found or already checked in'
        };
      }
    } catch (error) {
      console.error('Error checking in bus:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get bus history
  static async getBusHistory(busId, tenantId, limit = 10) {
    try {
      const history = await BusModel.getBusHistory(busId, tenantId, limit);
      
      const enhancedHistory = history.map(visit => ({
        ...visit,
        status: (!visit.outtime || !visit.outtimetxt) ? 'CHECKED_OUT' : 'COMPLETED',
        purpose: {
          purposeId: visit.visitpurposeid,
          purposeName: visit.visitpurpose,
          purposeCatId: visit.purposecatid,
          purposeCatName: visit.purposecatname
        },
        duration: visit.durationhours ? {
          hours: Math.floor(visit.durationhours),
          minutes: Math.round((visit.durationhours % 1) * 60),
          formatted: `${Math.floor(visit.durationhours)}h ${Math.round((visit.durationhours % 1) * 60)}m`
        } : null
      }));

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: enhancedHistory,
        count: enhancedHistory.length
      };
    } catch (error) {
      console.error('Error fetching bus history:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get buses pending check-in
  static async getBusesPendingCheckin(tenantId) {
    try {
      const buses = await BusModel.getBusesPendingCheckin(tenantId);
      
      const enhancedBuses = buses.map(bus => {
        const checkoutTime = new Date(bus.intime);
        const now = new Date();
        const timeDiff = now - checkoutTime;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
          ...bus,
          purpose: {
            purposeId: bus.visitpurposeid,
            purposeName: bus.visitpurpose,
            purposeCatId: bus.purposecatid,
            purposeCatName: bus.purposecatname
          },
          timeElapsed: {
            hours,
            minutes,
            formatted: `${hours}h ${minutes}m ago`
          }
        };
      });

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: enhancedBuses,
        count: enhancedBuses.length
      };
    } catch (error) {
      console.error('Error fetching pending check-in buses:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  static async exportBuses(tenantId, filters = {}) {
    try {
      const result = await BusModel.exportBuses(tenantId, filters);

      if (result.length === 0) {
        return {
          responseCode: 'E',
          responseMessage: 'No bus data found for export'
        };
      }

      // Convert to CSV
      const headers = Object.keys(result[0]);
      const csvRows = [headers.join(',')];
      
      result.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || '';
          const stringValue = value.toString();
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvRows.push(values.join(','));
      });

      return {
        responseCode: 'S',
        csvData: csvRows.join('\n'),
        count: result.length
      };
    } catch (error) {
      console.error('Error exporting buses:', error);
      return {
        responseCode: 'E',
        responseMessage: 'Record(s) failed to save',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Add new purpose
  static async addBusPurpose(purposeData) {
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

      const exists = await BusModel.checkPurposeExists(
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
          url: `/uploads/purposes/${imageFile.filename}`
        };
      }

      const newPurpose = await BusModel.addBusPurpose({
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
      console.error("Error in addBusPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Update purpose
  static async updateBusPurpose(
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

      const exists = await BusModel.checkPurposeExists(
        tenantId,
        purposeName.trim()
      );
      if (exists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: "Purpose name already exists"
        };
      }

      const updatedPurpose = await BusModel.updateBusPurpose(
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
      console.error("Error in updateBusPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Delete purpose
  static async deleteBusPurpose(purposeId, tenantId, updatedBy) {
    try {
      const purpose = await BusModel.checkPurposeStatus(purposeId, tenantId);

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

      const deletedPurpose = await BusModel.deleteBusPurpose(
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
      console.error("Error in deleteBusPurpose service:", error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }
  }

  // Get buses with pagination and search (legacy)
static async getBuses(tenantId, page = 1, pageSize = 20, search = '', category = '') {
  try {
    const result = await BusModel.getBusesBasic(tenantId, page, pageSize, search, category);
    const totalPages = Math.ceil(result.totalCount / pageSize);

    return {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      data: result.rows,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount: result.totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching buses:', error);
    return {
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}

// Get buses currently checked in (pending checkout)
static async getPendingCheckout(tenantId) {
  try {
    const result = await BusModel.getBusesPendingCheckout(tenantId);

    const buses = result.map(row => ({
      ...row,
      hoursCheckedIn: Math.round(row.hourscheckedin * 100) / 100
    }));

    return {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      data: buses,
      count: buses.length
    };
  } catch (error) {
    console.error('Error fetching pending checkout buses:', error);
    return {
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}

// New method: Get buses list with comprehensive filters and IST formatting
static async getBusesList(tenantId, filters = {}) {
  try {
    const result = await BusModel.getBusesList(tenantId, filters);


    // Map data to proper response format with IST formatting
    const mappedData = result.data.map((bus) => ({
      VisitorRegID: String(bus.visitorregid || ''),
      VisitorRegNo: bus.visitorregno || '',
      SecurityCode: bus.securitycode || '',
      VistorName: bus.vistorname || '',
      Mobile: bus.mobile || '',
      Email: bus.email || '',
      VisitorCatID: bus.visitorcatid || 5,
      VisitorCatName: bus.visitorcatname || 'Bus',
      VisitorSubCatID: bus.visitorsubcatid || '',
      VisitorSubCatName: bus.visitorsubcatname || '',
      FlatID: bus.flatid || '',
      FlatName: bus.flatname || '',
      AssociatedFlat: bus.associatedflat || '',
      AssociatedBlock: bus.associatedblock || '',
      VehiclelNo: bus.vehiclelno || '',
      PhotoFlag: bus.photoflag || 'N',
      PhotoPath: bus.photopath || '',
      PhotoName: bus.photoname || '',
      IsActive: bus.isactive || 'Y',
      CreatedDate: bus.createddate,
      CreatedBy: bus.createdby || '',
      BusNumber: bus.busnumber || '',
      RegistrationNumber: bus.registrationnumber || '',
      DriverName: bus.drivername || '',
      BusType: bus.bustype || '',
      Route: bus.associatedflat || '',
      Area: bus.associatedblock || '',

      // Visit history with IST formatting
      RegVisitorHistoryID: bus.regvisitorhistoryid || null,

      // InTime represents checkout time (when bus leaves)
      InTime: bus.lastcheckintime,
      InTimeTxt: bus.lastcheckintimetxt || DateFormatter.formatDateTime(bus.lastcheckintime),

      // OutTime represents checkin time (when bus returns)
      OutTime: bus.lastcheckouttime,
      OutTimeTxt: bus.lastcheckouttimetxt || DateFormatter.formatDateTime(bus.lastcheckouttime),

      // Purpose details
      VisitPurposeID: bus.visitpurposeid || null,
      VisitPurpose: bus.visitpurpose || '',
      PurposeCatID: bus.purposecatid || null,
      PurposeCatName: bus.purposecatname || '',

      // Current status
      CurrentStatus: bus.currentstatus || 'AVAILABLE',

      // Additional fields for better tracking
      Remark: null,
      VehiclePhotoFlag: 'N',
      VehiclePhotoName: null
    }));
    

    return {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      responseMessage: 'Record(s) retrieved successfully',
      data: mappedData,
      count: result.pagination.totalItems,
      pagination: result.pagination
    };
  } catch (error) {
    console.error("Error fetching buses list:", error);
    return {
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    };
  }
}

// Get all unique bus subcategories for a tenant
static async getBusSubCategories(tenantId) {
  try {
    const subCategories = await BusModel.getBusSubCategories(tenantId);
    return {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      data: subCategories,
      count: subCategories.length,
    };
  } catch (error) {
    console.error("Error fetching bus subcategories:", error);
    return {
      responseCode: responseUtils.RESPONSE_CODES.ERROR,
      responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    };
  }
}
}

module.exports = BusService
