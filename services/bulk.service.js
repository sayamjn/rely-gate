
const csv = require('csv-parser');
const fs = require('fs');
const { query } = require('../config/database');
const responseUtils = require('../utils/constants');
const QRService = require('./qr.service');

class BulkService {
  // Process bus CSV file
  static async processBusCSV(filePath, tenantId, createdBy) {
    try {
      const buses = [];
      
      return new Promise((resolve, reject) => {
        let isFirstRow = true;
        
        fs.createReadStream(filePath)
          .pipe(csv({ headers: false }))
          .on('data', (row) => {
            if (isFirstRow) {
              isFirstRow = false;
              return;
            }

            const values = Object.values(row);
            
            if (values.length >= 4) {
              buses.push({
                busNumber: values[0]?.trim() || '',
                registrationNumber: values[1]?.trim() || '',
                driverName: values[2]?.trim() || '',
                driverMobile: values[3]?.trim() || '',
                route: values[4]?.trim() || '',
                vehicleType: values[5]?.trim() || 'Bus',
                capacity: values[6]?.trim() || '',
                purpose: values[7]?.trim() || 'Bus Meeting',
                tenantId,
                createdBy
              });
            }
          })
          .on('end', async () => {
            try {
              const inserted = await this.bulkInsertBuses(buses);
              resolve({
                responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
                responseMessage: `Successfully processed ${buses.length} buses. Inserted: ${inserted.successful}, Failed: ${inserted.failed}`,
                data: {
                  totalProcessed: buses.length,
                  successful: inserted.successful,
                  failed: inserted.failed,
                  details: inserted.details
                }
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    } catch (error) {
      console.error('Error processing bus CSV:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Bulk insert buses - FIXED method name and implementation
  static async bulkInsertBuses(buses) {
    const results = {
      successful: 0,
      failed: 0,
      details: []
    };

    for (const bus of buses) {
      try {
        // Check if bus already exists
        const existingBus = await query(`
          SELECT VisitorRegID FROM VisitorRegistration 
          WHERE (Mobile = $1 OR VisitorRegNo LIKE $2) 
            AND TenantID = $3 
            AND VisitorCatName = 'Bus'
            AND IsActive = 'Y'
        `, [bus.driverMobile, `%${bus.registrationNumber}%`, bus.tenantId]);

        if (existingBus.rows.length > 0) {
          results.failed++;
          results.details.push({
            item: `${bus.busNumber} - ${bus.driverName}`,
            status: 'Failed',
            reason: 'Bus already exists with same mobile or registration'
          });
          continue;
        }

        // Generate registration number and security code
        const visitorRegNo = `BUS${bus.tenantId}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`;
        const securityCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Insert bus registration
        const insertSql = `
          INSERT INTO VisitorRegistration (
            TenantID, VistorName, Mobile, VisitorCatID, VisitorCatName,
            VisitorSubCatID, VisitorSubCatName, VisitorRegNo, SecurityCode,
            StatusID, StatusName, IsActive, CreatedDate, UpdatedDate, 
            CreatedBy, UpdatedBy, Email, AssociatedFlat, AssociatedBlock
          ) VALUES (
            $1, $2, $3, 5, 'Bus',
            10, $4, $5, $6,
            1, 'ACTIVE', 'Y', NOW(), NOW(), 
            $7, $7, '', $8, $9
          ) RETURNING VisitorRegID
        `;

        await query(insertSql, [
          bus.tenantId,
          bus.driverName,
          bus.driverMobile,
          bus.vehicleType || 'Delivery',
          visitorRegNo,
          securityCode,
          bus.createdBy,
          bus.route,
          bus.busNumber
        ]);

        results.successful++;
        results.details.push({
          item: `${bus.busNumber} - ${bus.driverName}`,
          status: 'Success',
          visitorRegNo,
          securityCode
        });

      } catch (error) {
        results.failed++;
        results.details.push({
          item: `${bus.busNumber} - ${bus.driverName}`,
          status: 'Failed',
          reason: error.message
        });
      }
    }

    return results;
  }

  // Process visitor CSV file - FIXED
  static async processVisitorCSV(filePath, visitorCatId, tenantId, createdBy) {
    try {
      const visitors = [];
      
      return new Promise((resolve, reject) => {
        let isFirstRow = true;
        let rowNumber = 0;
        
        fs.createReadStream(filePath)
          .pipe(csv({ headers: false }))
          .on('data', (row) => {
            rowNumber++;
            if (isFirstRow) {
              isFirstRow = false;
              return;
            }

            const values = Object.values(row);
            
            if (values.length >= 4) {
              visitors.push({
                name: values[0]?.trim() || '',
                mobile: values[1]?.trim() || '',
                email: values[2]?.trim() || '',
                flatName: values[3]?.trim() || '',
                vehicleNumber: values[4]?.trim() || '',
                visitorCatId,
                tenantId,
                createdBy,
                rowNumber
              });
            }
          })
          .on('end', async () => {
            try {
              const inserted = await this.bulkInsertVisitors(visitors);
              resolve({
                responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
                responseMessage: `Successfully processed ${visitors.length} visitors. Inserted: ${inserted.successful}, Failed: ${inserted.failed}`,
                data: {
                  totalProcessed: visitors.length,
                  successful: inserted.successful,
                  failed: inserted.failed,
                  details: inserted.details
                }
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    } catch (error) {
      console.error('Error processing visitor CSV:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Bulk insert visitors - FIXED
  static async bulkInsertVisitors(visitors) {
    const results = {
      successful: 0,
      failed: 0,
      details: []
    };

    for (const visitor of visitors) {
      try {
        // Validate mobile number
        if (!visitor.mobile || !/^\d{10}$/.test(visitor.mobile)) {
          results.failed++;
          results.details.push({
            row: visitor.rowNumber,
            item: visitor.name || 'Unknown',
            status: 'Failed',
            reason: 'Invalid mobile number (must be 10 digits)'
          });
          continue;
        }

        // Check if visitor already exists
        const existingVisitor = await query(`
          SELECT VisitorRegID FROM VisitorRegistration 
          WHERE Mobile = $1 AND TenantID = $2 AND IsActive = 'Y'
        `, [visitor.mobile, visitor.tenantId]);

        if (existingVisitor.rows.length > 0) {
          results.failed++;
          results.details.push({
            row: visitor.rowNumber,
            item: visitor.name || 'Unknown',
            status: 'Failed',
            reason: 'Mobile number already registered'
          });
          continue;
        }

        // Generate registration number and security code
        const categoryPrefix = visitor.visitorCatId === 1 ? 'STA' : visitor.visitorCatId === 3 ? 'STU' : 'VIS';
        const visitorRegNo = `${categoryPrefix}${visitor.tenantId}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`;
        const securityCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Get category info
        const categoryInfo = await this.getCategoryInfo(visitor.visitorCatId);

        // Insert visitor registration
        const insertSql = `
          INSERT INTO VisitorRegistration (
            TenantID, VistorName, Mobile, VisitorCatID, VisitorCatName,
            VisitorSubCatID, VisitorSubCatName, VisitorRegNo, SecurityCode,
            StatusID, StatusName, IsActive, CreatedDate, UpdatedDate, 
            CreatedBy, UpdatedBy, Email, AssociatedFlat, AssociatedBlock
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, 
            1, 'ACTIVE', 'Y', NOW(), NOW(), $10, $10, $11, $12, $13
          ) RETURNING VisitorRegID
        `;

        await query(insertSql, [
          visitor.tenantId,
          visitor.name,
          visitor.mobile,
          visitor.visitorCatId,
          categoryInfo.visitorcatname,
          categoryInfo.visitorsubcatid,
          categoryInfo.visitorsubcatname,
          visitorRegNo,
          securityCode,
          visitor.createdBy,
          visitor.email,
          visitor.flatName,
          ''
        ]);

        results.successful++;
        results.details.push({
          row: visitor.rowNumber,
          item: visitor.name || 'Unknown',
          status: 'Success',
          visitorRegNo,
          securityCode
        });

      } catch (error) {
        results.failed++;
        results.details.push({
          row: visitor.rowNumber,
          item: visitor.name || 'Unknown',
          status: 'Failed',
          reason: error.message
        });
      }
    }

    return results;
  }

  // Helper method to get category information
  static async getCategoryInfo(visitorCatId) {
    try {
      const sql = `
        SELECT vc.VisitorCatName, vsc.VisitorSubCatID, vsc.VisitorSubCatName
        FROM VisitorCategory vc
        LEFT JOIN VisitorSubCategory vsc ON vc.VisitorCatID = vsc.VisitorCatID
        WHERE vc.VisitorCatID = $1 AND vc.IsActive = 'Y'
        ORDER BY vsc.VisitorSubCatID
        LIMIT 1
      `;
      
      const result = await query(sql, [visitorCatId]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      // Fallback defaults
      const defaults = {
        1: { visitorcatname: 'Staff', visitorsubcatid: 1, visitorsubcatname: 'Security' },
        2: { visitorcatname: 'Unregistered', visitorsubcatid: 4, visitorsubcatname: 'Walk-in Visitor' },
        3: { visitorcatname: 'Student', visitorsubcatid: 6, visitorsubcatname: 'Regular Student' },
        4: { visitorcatname: 'Guest', visitorsubcatid: 8, visitorsubcatname: 'Family Member' },
        5: { visitorcatname: 'Bus', visitorsubcatid: 10, visitorsubcatname: 'Delivery' }
      };
      
      return defaults[visitorCatId] || defaults[2];
    } catch (error) {
      console.error('Error getting category info:', error);
      return { visitorcatname: 'Unregistered', visitorsubcatid: 4, visitorsubcatname: 'Walk-in Visitor' };
    }
  }

  // Process staff CSV - SIMPLIFIED
  static async processStaffCSV(filePath, tenantId, createdBy) {
    try {
      const staff = [];
      
      return new Promise((resolve, reject) => {
        let isFirstRow = true;
        
        fs.createReadStream(filePath)
          .pipe(csv({ headers: false }))
          .on('data', (row) => {
            if (isFirstRow) {
              isFirstRow = false;
              return;
            }

            const values = Object.values(row);
            
            if (values.length >= 3) {
              staff.push({
                name: values[0]?.trim() || '',
                mobile: values[1]?.trim() || '',
                email: values[2]?.trim() || '',
                designation: values[3]?.trim() || 'Security',
                department: values[4]?.trim() || '',
                tenantId,
                createdBy
              });
            }
          })
          .on('end', async () => {
            try {
              const inserted = await this.bulkInsertStaff(staff);
              resolve({
                responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
                responseMessage: `Successfully processed ${staff.length} staff. Inserted: ${inserted.successful}, Failed: ${inserted.failed}`,
                data: {
                  totalProcessed: staff.length,
                  successful: inserted.successful,
                  failed: inserted.failed,
                  details: inserted.details
                }
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    } catch (error) {
      console.error('Error processing staff CSV:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  // Bulk insert staff
  static async bulkInsertStaff(staffList) {
    const results = {
      successful: 0,
      failed: 0,
      details: []
    };

    for (const staff of staffList) {
      try {
        // Check if staff already exists
        const existingStaff = await query(`
          SELECT VisitorRegID FROM VisitorRegistration 
          WHERE Mobile = $1 AND TenantID = $2 AND VisitorCatName = 'Staff' AND IsActive = 'Y'
        `, [staff.mobile, staff.tenantId]);

        if (existingStaff.rows.length > 0) {
          results.failed++;
          results.details.push({
            item: staff.name,
            status: 'Failed',
            reason: 'Staff already exists with same mobile'
          });
          continue;
        }

        // Generate registration number and security code
        const visitorRegNo = `STA${staff.tenantId}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`;
        const securityCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Insert staff registration
        const insertSql = `
          INSERT INTO VisitorRegistration (
            TenantID, VistorName, Mobile, VisitorCatID, VisitorCatName,
            VisitorSubCatID, VisitorSubCatName, VisitorRegNo, SecurityCode,
            StatusID, StatusName, IsActive, CreatedDate, UpdatedDate, 
            CreatedBy, UpdatedBy, Email, AssociatedFlat, AssociatedBlock
          ) VALUES (
            $1, $2, $3, 1, 'Staff',
            1, $4, $5, $6,
            1, 'ACTIVE', 'Y', NOW(), NOW(), 
            $7, $7, $8, '', $9
          ) RETURNING VisitorRegID
        `;

        await query(insertSql, [
          staff.tenantId,
          staff.name,
          staff.mobile,
          staff.designation,
          visitorRegNo,
          securityCode,
          staff.createdBy,
          staff.email,
          staff.department
        ]);

        results.successful++;
        results.details.push({
          item: staff.name,
          status: 'Success',
          visitorRegNo,
          securityCode
        });

      } catch (error) {
        results.failed++;
        results.details.push({
          item: staff.name,
          status: 'Failed',
          reason: error.message
        });
      }
    }

    return results;
  }
}

module.exports = BulkService;