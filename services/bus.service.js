
const { query } = require('../config/database');
const BusModel = require('../models/bus.model');
const responseUtils = require("../utils/constants");

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

          // Format dates
          const formatDateTime = (dateTime) => {
            if (!dateTime) return null;
            const date = new Date(dateTime);
            return {
              date: date.toISOString().split('T')[0],
              time: date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
              }),
              dateTime: date.toISOString(),
              timestamp: date.getTime()
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
                dateTime: formatDateTime(busData.lastcheckoutdatetime),
                timeText: busData.lastcheckouttime
              },
              checkIn: {
                dateTime: formatDateTime(busData.lastcheckindatetime),
                timeText: busData.lastcheckintime
              },
              visitDate: formatDateTime(busData.lastvisitdate),
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
          checkOutTime: new Date().toLocaleTimeString('en-US', { 
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
            checkInTime: new Date().toLocaleTimeString('en-US', { 
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
      let whereConditions = ['vr.TenantID = $1', "vr.IsActive = 'Y'", "vr.VisitorCatName = 'Bus'"];
      let params = [tenantId];
      let paramIndex = 2;

      // Apply filters
      if (filters.registrationNumber && filters.registrationNumber.trim()) {
        whereConditions.push(`vr.VisitorRegNo ILIKE $${paramIndex}`);
        params.push(`%${filters.registrationNumber.trim()}%`);
        paramIndex++;
      }

      if (filters.driverName && filters.driverName.trim()) {
        whereConditions.push(`vr.VistorName ILIKE $${paramIndex}`);
        params.push(`%${filters.driverName.trim()}%`);
        paramIndex++;
      }

      if (filters.fromDate) {
        whereConditions.push(`vr.CreatedDate >= $${paramIndex}`);
        params.push(filters.fromDate);
        paramIndex++;
      }

      if (filters.toDate) {
        whereConditions.push(`vr.CreatedDate <= $${paramIndex}`);
        params.push(filters.toDate);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Fixed SQL without DISTINCT conflict
      const sql = `
        SELECT 
          vr.VisitorRegNo as "Bus Registration",
          vr.VistorName as "Driver Name",
          vr.Mobile as "Driver Mobile",
          vr.VisitorSubCatName as "Bus Type",
          vr.AssociatedFlat as "Route",
          vr.AssociatedBlock as "Area",
          vr.StatusName as "Status",
          TO_CHAR(vr.CreatedDate, 'YYYY-MM-DD') as "Registration Date"
        FROM VisitorRegistration vr
        WHERE ${whereClause}
        ORDER BY vr.CreatedDate DESC
      `;

      const { query } = require('../config/database');
      const result = await query(sql, params);

      if (result.rows.length === 0) {
        return {
          responseCode: 'E',
          responseMessage: 'No bus data found for export'
        };
      }

      // Convert to CSV
      const headers = Object.keys(result.rows[0]);
      const csvRows = [headers.join(',')];
      
      result.rows.forEach(row => {
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
        count: result.rows.length
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

  // Get buses with pagination and search (legacy)
static async getBuses(tenantId, page = 1, pageSize = 20, search = '') {
  try {
    const offset = (page - 1) * pageSize;
    let whereConditions = ['TenantID = $1', "IsActive = 'Y'", "VisitorCatName = 'Bus'"];
    let params = [tenantId];
    let paramIndex = 2;

    if (search && search.trim()) {
      whereConditions.push(`(VistorName ILIKE $${paramIndex} OR VisitorRegNo ILIKE $${paramIndex} OR Mobile ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM VisitorRegistration
      WHERE ${whereClause}
    `;

    const { query } = require('../config/database');
    const countResult = await query(countSql, params);
    const totalCount = parseInt(countResult.rows[0].total);

    // Get paginated data
    const dataSql = `
      SELECT 
        VisitorRegID as busId,
        VisitorRegNo as busRegNo,
        VistorName as driverName,
        Mobile as driverMobile,
        VisitorSubCatName as busType,
        AssociatedFlat as route,
        AssociatedBlock as area,
        StatusName as status,
        CreatedDate as registrationDate
      FROM VisitorRegistration
      WHERE ${whereClause}
      ORDER BY CreatedDate DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);
    const dataResult = await query(dataSql, params);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
      data: dataResult.rows,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
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
    const sql = `
      SELECT DISTINCT
        vr.VisitorRegID as busId,
        vr.VisitorRegNo as busRegNo,
        vr.VistorName as driverName,
        vr.Mobile as driverMobile,
        vr.VisitorSubCatName as busType,
        vr.AssociatedFlat as route,
        vr.AssociatedBlock as area,
        vh.INTime as checkInTime,
        vh.INTimeTxt as checkInTimeText,
        EXTRACT(EPOCH FROM (NOW() - vh.INTime))/3600 as hoursCheckedIn
      FROM VisitorRegistration vr
      INNER JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID
      WHERE vr.TenantID = $1 
        AND vr.IsActive = 'Y'
        AND vr.VisitorCatName = 'Bus'
        AND vh.TenantID = $1
        AND vh.IsActive = 'Y'
        AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '')
      ORDER BY vh.INTime DESC
    `;

    const { query } = require('../config/database');
    const result = await query(sql, [tenantId]);

    const buses = result.rows.map(row => ({
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


  
}

module.exports = BusService
