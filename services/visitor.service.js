const { query } = require('../config/database');
const responseUtils = require("../utils/constants");

class VisitorService {
  static async getVisitorsWithFilters(tenantId, filters) {
    try {
      let whereConditions = ['vr.TenantID = $1', "vr.IsActive = 'Y'"];
      let params = [tenantId];
      let paramIndex = 2;

      if (filters.search) {
        whereConditions.push(`(vr.VistorName ILIKE $${paramIndex} OR vr.Mobile ILIKE $${paramIndex} OR vr.VisitorRegNo ILIKE $${paramIndex})`);
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
      const offset = (filters.page - 1) * filters.pageSize;

      const countSql = `
        SELECT COUNT(*) as total
        FROM VisitorRegistration vr
        WHERE ${whereClause}
      `;
      const countResult = await query(countSql, params);
      const totalRecords = parseInt(countResult.rows[0].total);

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
            totalPages: Math.ceil(totalRecords / filters.pageSize)
          }
        }
      };
    } catch (error) {
      console.error('Error getting visitors with filters:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  static async getPendingCheckout(tenantId, visitorCatId = null) {
    try {
      let whereConditions = [
        'vr.TenantID = $1',
        "vr.IsActive = 'Y'",
        'vh.OutTime IS NULL',
        'vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = \'\''
      ];
      let params = [tenantId];
      let paramIndex = 2;

      if (visitorCatId) {
        whereConditions.push(`vr.VisitorCatID = $${paramIndex}`);
        params.push(visitorCatId);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

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
          count: result.rows.length
        }
      };
    } catch (error) {
      console.error('Error getting pending checkout visitors:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Check-in registered visitor - FIXED
  static async checkinRegisteredVisitor(visitorRegId, tenantId, createdBy) {
    try {
      // Check if visitor exists and is not already checked in
      const visitorCheck = await query(`
        SELECT vr.VisitorRegID, vr.VistorName, vr.VisitorRegNo, vr.SecurityCode,
               vr.Mobile, vr.VisitorCatID, vr.VisitorCatName, vr.VisitorSubCatID,
               vr.VisitorSubCatName, vr.AssociatedFlat, vr.AssociatedBlock,
               vh.RegVisitorHistoryID
        FROM VisitorRegistration vr
        LEFT JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID 
                                           AND vh.TenantID = vr.TenantID 
                                           AND (vh.OutTime IS NULL OR vh.OutTimeTxt IS NULL OR vh.OutTimeTxt = '')
        WHERE vr.VisitorRegID = $1 AND vr.TenantID = $2 AND vr.IsActive = 'Y'
      `, [visitorRegId, tenantId]);

      if (visitorCheck.rows.length === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visitor not found or inactive'
        };
      }

      const visitor = visitorCheck.rows[0];

      if (visitor.regvisitorhistoryid) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visitor is already checked in'
        };
      }

      const insertSql = `
        INSERT INTO VisitorRegVisitHistory (
          TenantID, VisitorRegID, VisitorRegNo, SecurityCode,
          VistorName, Mobile, VisitorCatID, VisitorCatName,
          VisitorSubCatID, VisitorSubCatName, AssociatedFlat, AssociatedBlock,
          InTime, InTimeTxt, CreatedDate, CreatedBy, IsActive
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          NOW(), TO_CHAR(NOW(), 'HH12:MI AM'), NOW(), $13, 'Y'
        ) RETURNING RegVisitorHistoryID
      `;

      const result = await query(insertSql, [
        tenantId, visitor.visitorregid, visitor.visitorregno, visitor.securitycode,
        visitor.vistorname, visitor.mobile, visitor.visitorcatid, visitor.visitorcatname,
        visitor.visitorsubcatid, visitor.visitorsubcatname, visitor.associatedflat, visitor.associatedblock,
        createdBy
      ]);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Visitor checked in successfully',
        data: {
          historyId: result.rows[0].regvisitorhistoryid,
          checkInTime: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          }),
          visitor: {
            visitorRegId: visitor.visitorregid,
            visitorName: visitor.vistorname,
            mobile: visitor.mobile
          }
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

  static async checkoutRegisteredVisitor(historyId, tenantId, updatedBy) {
    try {
      const historyCheck = await query(`
        SELECT vh.RegVisitorHistoryID, vh.VistorName, vh.Mobile,
               (vh.OutTime IS NOT NULL AND vh.OutTimeTxt IS NOT NULL AND vh.OutTimeTxt != '') as already_checked_out
        FROM VisitorRegVisitHistory vh
        WHERE vh.RegVisitorHistoryID = $1 AND vh.TenantID = $2
      `, [historyId, tenantId]);

      if (historyCheck.rows.length === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visit history not found'
        };
      }

      const history = historyCheck.rows[0];

      if (history.already_checked_out) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Visitor is already checked out'
        };
      }

      const updateSql = `
        UPDATE VisitorRegVisitHistory
        SET OutTime = NOW(),
            OutTimeTxt = TO_CHAR(NOW(), 'HH12:MI AM'),
            UpdatedDate = NOW(),
            UpdatedBy = $3
        WHERE RegVisitorHistoryID = $1 AND TenantID = $2
        RETURNING RegVisitorHistoryID, OutTime, OutTimeTxt
      `;

      const result = await query(updateSql, [historyId, tenantId, updatedBy]);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Visitor checked out successfully',
        data: {
          historyId: result.rows[0].regvisitorhistoryid,
          checkOutTime: result.rows[0].outtimetxt,
          visitor: {
            visitorName: history.vistorname,
            mobile: history.mobile
          }
        }
      };
    } catch (error) {
      console.error('Error checking out visitor:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Export visitors
  static async exportVisitors(tenantId, filters = {}) {
    try {
      let whereConditions = ['vr.TenantID = $1', "vr.IsActive = 'Y'"];
      let params = [tenantId];
      let paramIndex = 2;

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
          responseMessage: 'No visitor data found for export'
        };
      }

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
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        csvData: csvRows.join('\n'),
        count: result.rows.length
      };
    } catch (error) {
      console.error('Error exporting visitors:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Get visitor purposes
  static async getVisitorPurposes(tenantId, purposeCatId = 0) {
    try {
      let whereConditions = ['TenantID = $1', "IsActive = 'Y'"];
      let params = [tenantId];

      if (purposeCatId && purposeCatId > 0) {
        whereConditions.push('PurposeCatID = $2');
        params.push(purposeCatId);
      }

      const whereClause = whereConditions.join(' AND ');

      const sql = `
        SELECT VisitPurposeID, PurposeCatID, PurposeCatName, VisitPurpose
        FROM VisitorPuposeMaster
        WHERE ${whereClause}
        ORDER BY VisitPurpose
      `;

      const result = await query(sql, params);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: result.rows
      };
    } catch (error) {
      console.error('Error getting visitor purposes:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      };
    }
  }

  // Get visitor subcategories
  static async getVisitorSubCategories(tenantId, visitorCatId = 0) {
    try {
      let whereConditions = ['TenantID = $1', "IsActive = 'Y'"];
      let params = [tenantId];

      if (visitorCatId && visitorCatId > 0) {
        whereConditions.push('VisitorCatID = $2');
        params.push(visitorCatId);
      }

      const whereClause = whereConditions.join(' AND ');

      const sql = `
        SELECT VisitorSubCatID, VisitorCatID, VisitorCatName, VisitorSubCatName
        FROM VisitorSubCategory
        WHERE ${whereClause}
        ORDER BY VisitorSubCatName
      `;

      const result = await query(sql, params);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS,
        data: result.rows
      };
    } catch (error) {
      console.error('Error getting visitor subcategories:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      };
    }
  }

  // Bulk check-in visitors - SIMPLIFIED
  static async bulkCheckin(visitorIds, tenantId, createdBy) {
    try {
      const results = {
        successful: [],
        failed: [],
        alreadyCheckedIn: []
      };

      for (const visitorId of visitorIds) {
        try {
          const checkinResult = await this.checkinRegisteredVisitor(visitorId, tenantId, createdBy);
          
          if (checkinResult.responseCode === responseUtils.RESPONSE_CODES.SUCCESS) {
            results.successful.push({
              visitorId,
              data: checkinResult.data
            });
          } else if (checkinResult.responseMessage.includes('already checked in')) {
            results.alreadyCheckedIn.push({
              visitorId,
              reason: checkinResult.responseMessage
            });
          } else {
            results.failed.push({
              visitorId,
              reason: checkinResult.responseMessage
            });
          }
        } catch (error) {
          results.failed.push({
            visitorId,
            reason: 'Database error: ' + error.message
          });
        }
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: `Bulk check-in completed. Success: ${results.successful.length}, Failed: ${results.failed.length}, Already checked in: ${results.alreadyCheckedIn.length}`,
        data: results
      };
    } catch (error) {
      console.error('Error in bulk check-in:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Bulk check-out visitors - SIMPLIFIED
  static async bulkCheckout(historyIds, tenantId, updatedBy) {
    try {
      const results = {
        successful: [],
        failed: [],
        alreadyCheckedOut: []
      };

      for (const historyId of historyIds) {
        try {
          const checkoutResult = await this.checkoutRegisteredVisitor(historyId, tenantId, updatedBy);
          
          if (checkoutResult.responseCode === responseUtils.RESPONSE_CODES.SUCCESS) {
            results.successful.push({
              historyId,
              data: checkoutResult.data
            });
          } else if (checkoutResult.responseMessage.includes('already checked out')) {
            results.alreadyCheckedOut.push({
              historyId,
              reason: checkoutResult.responseMessage
            });
          } else {
            results.failed.push({
              historyId,
              reason: checkoutResult.responseMessage
            });
          }
        } catch (error) {
          results.failed.push({
            historyId,
            reason: 'Database error: ' + error.message
          });
        }
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: `Bulk check-out completed. Success: ${results.successful.length}, Failed: ${results.failed.length}, Already checked out: ${results.alreadyCheckedOut.length}`,
        data: results
      };
    } catch (error) {
      console.error('Error in bulk check-out:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }
}

module.exports = VisitorService;