const fs = require('fs');
const csv = require('csv-parser');
const { query } = require('../config/database');
const VisitorModel = require('../models/visitor.model');
const QRService = require('./qr.service');
const responseUtils = require('../utils/constants');

class BulkService {
  static async processStudentCSV(filePath, type, tenantId, createdBy) {
    try {
      const students = [];
      
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
            
            if (values.length >= 5) {
              students.push({
                studentId: values[0]?.trim() || '',
                name: values[1]?.trim() || '',
                mobile: values[2]?.trim() || '',
                course: values[3]?.trim() || '', 
                hostel: values[4]?.trim() || '',
                tenantId: tenantId.toString(),
                type: type?.trim() || ''
              });
            }
          })
          .on('end', async () => {
            try {
              await this.bulkInsertStudents(students, tenantId);
              
              await this.insertBulkVisitors(tenantId);
              
              resolve({
                responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
                responseMessage: `${students.length} student records inserted successfully`,
                count: students.length
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', reject);
      });
    } catch (error) {
      console.error('Error processing student CSV:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      };
    }
  }

  static async bulkInsertStudents(students, tenantId) {
    try {
      await query(`
        CREATE TEMP TABLE IF NOT EXISTS temp_bulk_upload (
          student_id VARCHAR(50),
          name VARCHAR(150),
          mobile VARCHAR(20),
          course VARCHAR(100),
          hostel VARCHAR(100),
          tenant_id INTEGER,
          type VARCHAR(50)
        )
      `);

      await query('DELETE FROM temp_bulk_upload');

      for (let i = 0; i < students.length; i += 100) {
        const batch = students.slice(i, i + 100);
        const values = batch.map(student => 
          `('${student.studentId}', '${student.name}', '${student.mobile}', '${student.course}', '${student.hostel}', ${tenantId}, '${student.type}')`
        ).join(',');

        await query(`
          INSERT INTO temp_bulk_upload (student_id, name, mobile, course, hostel, tenant_id, type)
          VALUES ${values}
        `);
      }

      console.log(`Bulk inserted ${students.length} students`);
    } catch (error) {
      console.error('Error in bulk insert:', error);
      throw error;
    }
  }

  static async insertBulkVisitors(tenantId) {
    try {
      const sql = `
        INSERT INTO VisitorRegistration (
          TenantID, VistorName, Mobile, VisitorCatID, VisitorCatName,
          VisitorSubCatID, VisitorSubCatName, VisitorRegNo, SecurityCode,
          StatusID, StatusName, IsActive, CreatedDate, UpdatedDate, 
          CreatedBy, UpdatedBy
        )
        SELECT 
          $1,
          t.name,
          t.mobile, 
          CASE t.type 
            WHEN 'student' THEN 3
            WHEN 'staff' THEN 1
            ELSE 2
          END,
          CASE t.type
            WHEN 'student' THEN 'Student'
            WHEN 'staff' THEN 'Staff' 
            ELSE 'General'
          END,
          CASE t.type
            WHEN 'student' THEN 6
            WHEN 'staff' THEN 1
            ELSE 4
          END,
          CASE t.type
            WHEN 'student' THEN 'Regular Student'
            WHEN 'staff' THEN 'Security'
            ELSE 'Walk-in Visitor'
          END,
          CONCAT(
            CASE t.type 
              WHEN 'student' THEN 'STU'
              WHEN 'staff' THEN 'STA'
              ELSE 'VIS'
            END,
            $1,
            EXTRACT(EPOCH FROM NOW())::bigint,
            LPAD((RANDOM() * 99)::int::text, 2, '0')
          ),
          LPAD((RANDOM() * 999999)::int::text, 6, '0'),
          1,
          'ACTIVE',
          'Y',
          NOW(),
          NOW(),
          'System',
          'System'
        FROM temp_bulk_upload t
        WHERE NOT EXISTS (
          SELECT 1 FROM VisitorRegistration vr 
          WHERE vr.Mobile = t.mobile 
            AND vr.TenantID = $1
            AND vr.IsActive = 'Y'
        )
      `;
      
      await query(sql, [tenantId]);
      console.log('Bulk visitors created from uploaded data');
    } catch (error) {
      console.error('Error creating bulk visitors:', error);
      throw error;
    }
  }

  static async processVisitorCSV(filePath, visitorCatId, tenantId, createdBy) {
    try {
      const visitors = [];
      
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
              visitors.push({
                name: values[0]?.trim() || '',
                mobile: values[1]?.trim() || '',
                email: values[2]?.trim() || '',
                flatName: values[3]?.trim() || '',
                vehicleNo: values[4]?.trim() || '',
                visitorCatId,
                tenantId,
                createdBy
              });
            }
          })
          .on('end', async () => {
            try {
              const inserted = await this.bulkInsertVisitors(visitors);
              resolve({
                responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
                responseMessage: `${inserted} visitor records inserted successfully`,
                count: inserted
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', reject);
      });
    } catch (error) {
      console.error('Error processing visitor CSV:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      };
    }
  }

  static async bulkInsertVisitors(visitors) {
    let insertedCount = 0;
    
    for (const visitor of visitors) {
      try {
        const exists = await VisitorModel.checkVisitorExists(
          visitor.mobile, 
          visitor.tenantId, 
          visitor.visitorCatId
        );
        
        if (!exists) {
          const securityCode = QRService.generateSecurityCode();
          const visitorRegNo = QRService.generateVisitorRegNo(
            visitor.visitorCatId, 
            visitor.tenantId
          );

          await VisitorModel.createRegisteredVisitor({
            ...visitor,
            securityCode,
            visitorRegNo,
            vistorName: visitor.name,
            visitorCatName: this.getCategoryName(visitor.visitorCatId),
            visitorSubCatId: this.getDefaultSubCatId(visitor.visitorCatId),
            visitorSubCatName: this.getSubCategoryName(visitor.visitorCatId)
          });
          
          insertedCount++;
        }
      } catch (error) {
        console.error(`Error inserting visitor ${visitor.name}:`, error);
      }
    }
    
    return insertedCount;
  }

  static getCategoryName(catId) {
    const categories = {
      1: 'Staff',
      2: 'Unregistered', 
      3: 'Student',
      4: 'Guest',
      5: 'Bus'
    };
    return categories[catId] || 'General';
  }

  static getDefaultSubCatId(catId) {
    const defaultSubCats = {
      1: 1, // Security
      2: 4, // Walk-in Visitor
      3: 6, // Regular Student
      4: 8, // Family Member
      5: 10 // Delivery
    };
    return defaultSubCats[catId] || 4;
  }

  static getSubCategoryName(catId) {
    const subCategories = {
      1: 'Security',
      2: 'Walk-in Visitor',
      3: 'Regular Student', 
      4: 'Family Member',
      5: 'Delivery'
    };
    return subCategories[catId] || 'General';
  }

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
            return; // Skip header row
          }

          const values = Object.values(row);
          
          // Expected CSV format: StaffID, Name, Mobile, Designation, Email, Address
          if (values.length >= 4) {
            staff.push({
              staffId: values[0]?.trim() || '',
              name: values[1]?.trim() || '',
              mobile: values[2]?.trim() || '',
              designation: values[3]?.trim() || '',
              email: values[5]?.trim() || '',
              address: values[6]?.trim() || '',
              type: 'staff',
              tenantId,
              createdBy
            });
          }
        })
        .on('end', async () => {
          try {
            const inserted = await this.bulkInsertStaff(staff, tenantId, createdBy);
            resolve({
              responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
              responseMessage: `${inserted} staff records inserted successfully`,
              count: inserted
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

// Bulk insert staff records

static async bulkInsertStaff(staffList, tenantId, createdBy) {
  try {
    if (!staffList || staffList.length === 0) {
      return 0;
    }

    let insertedCount = 0;
    let skippedCount = 0;

    console.log(`Processing ${staffList.length} staff records...`);

    for (const staff of staffList) {
      try {
        if (!staff.name || !staff.mobile) {
          console.log(`Skipping record: Missing name or mobile - ${staff.name || 'Unknown'}`);
          skippedCount++;
          continue;
        }

        const cleanMobile = staff.mobile.toString().trim();
        if (cleanMobile.length < 10) {
          console.log(`Skipping record: Invalid mobile number - ${staff.name}: ${cleanMobile}`);
          skippedCount++;
          continue;
        }

        const checkSql = `
          SELECT COUNT(*) as count
          FROM VisitorRegistration
          WHERE TenantID = $1 AND Mobile = $2 AND VisitorCatName = 'Staff' AND IsActive = 'Y'
        `;
        const checkResult = await query(checkSql, [tenantId, cleanMobile]);
        
        if (checkResult.rows[0].count > 0) {
          console.log(`Staff with mobile ${cleanMobile} already exists, skipping...`);
          skippedCount++;
          continue;
        }

        let visitorSubCatId = 1; // Default
        const designation = staff.designation && staff.designation.trim() ? staff.designation.trim() : 'Staff';
        
        const designationSql = `
          SELECT VisitorSubCatID
          FROM VisitorSubCategory
          WHERE TenantID = $1 AND VisitorSubCatName ILIKE $2 AND VisitorCatID = 1 AND IsActive = 'Y'
          LIMIT 1
        `;
        const designationResult = await query(designationSql, [tenantId, designation]);
        
        if (designationResult.rows.length > 0) {
          visitorSubCatId = designationResult.rows[0].visitorsubcatid;
        } else {
          const newDesignationSql = `
            INSERT INTO VisitorSubCategory (
              TenantID, VisitorCatID, VisitorCatName, VisitorSubCatName,
              IsActive, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
            ) VALUES (
              $1, 1, 'Staff', $2, 'Y', NOW(), NOW(), $3, $3
            ) RETURNING VisitorSubCatID
          `;
          const newDesignationResult = await query(newDesignationSql, [
            tenantId, 
            designation, 
            createdBy
          ]);
          visitorSubCatId = newDesignationResult.rows[0].visitorsubcatid;
          console.log(`Created new designation: ${designation}`);
        }

        const staffRegNo = staff.staffId && staff.staffId.trim() ? 
          staff.staffId.trim() : 
          `STA${tenantId}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`;
        const securityCode = Math.floor(100000 + Math.random() * 900000).toString();

        const staffName = staff.name.trim();
        const staffEmail = staff.email && staff.email.trim() ? staff.email.trim() : '';
        const staffAddress = staff.address && staff.address.trim() ? staff.address.trim() : '';
        const staffDepartment = staff.department && staff.department.trim() ? staff.department.trim() : '';

        const insertSql = `
          INSERT INTO VisitorRegistration (
            TenantID, VistorName, Mobile, VisitorCatID, VisitorCatName,
            VisitorSubCatID, VisitorSubCatName, VisitorRegNo, SecurityCode,
            StatusID, StatusName, IsActive, Email, AssociatedFlat, AssociatedBlock,
            CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW(), $16, $16
          )
        `;

        const values = [
          tenantId,                    // $1 - TenantID
          staffName,                   // $2 - VistorName
          cleanMobile,                 // $3 - Mobile
          1,                          // $4 - VisitorCatID (Staff = 1)
          'Staff',                    // $5 - VisitorCatName
          visitorSubCatId,            // $6 - VisitorSubCatID
          designation,                // $7 - VisitorSubCatName
          staffRegNo,                 // $8 - VisitorRegNo
          securityCode,               // $9 - SecurityCode
          1,                          // $10 - StatusID (Active = 1)
          'ACTIVE',                   // $11 - StatusName
          'Y',                        // $12 - IsActive
          staffEmail,                 // $13 - Email
          staffAddress,               // $14 - AssociatedFlat (Address)
          staffDepartment,            // $15 - AssociatedBlock (Department)
          createdBy                   // $16 - CreatedBy & UpdatedBy
        ];

        console.log(`Inserting staff: ${staffName} with ${values.length} parameters`);
        
        await query(insertSql, values);
        insertedCount++;
        
        console.log(`✅ Inserted staff: ${staffName} (${cleanMobile})`);
        
      } catch (error) {
        console.error(`❌ Error inserting staff ${staff.name}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`📊 Staff bulk insert completed:`);
    console.log(`   - Total processed: ${staffList.length}`);
    console.log(`   - Successfully inserted: ${insertedCount}`);
    console.log(`   - Skipped/Failed: ${skippedCount}`);

    return insertedCount;

  } catch (error) {
    console.error('Error in bulk insert staff:', error);
    throw error;
  }
}
}

module.exports = BulkService;