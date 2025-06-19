class BulkService {
  static async processStudentCSV(filePath, type, tenantId, createdBy) {
    try {
      const students = [];
      
      return new Promise((resolve, reject) => {
        let isFirstRow = true;
        
        fs.createReadStream(filePath)
          .pipe(csv({ headers: false }))
          .on('data', (row) => {
            // Skip header row
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
              // Bulk insert students
              await this.bulkInsertStudents(students);
              
              // Call stored procedure equivalent
              await this.insertBulkVisitors(tenantId);
              
              resolve(ResponseFormatter.success(
                null,
                `${students.length} student records inserted successfully`,
                students.length
              ));
            } catch (error) {
              reject(error);
            }
          })
          .on('error', reject);
      });
    } catch (error) {
      console.error('Error processing student CSV:', error);
      return ResponseFormatter.error('Failed to process CSV file');
    }
  }

  static async bulkInsertStudents(students) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Clear existing bulk upload data
      await client.query('DELETE FROM "BulkVisitorUpload" WHERE "TenantID" = $1', [students[0]?.tenantId]);
      
      // Bulk insert
      for (const student of students) {
        await client.query(`
          INSERT INTO "BulkVisitorUpload" (
            "StudentID", "Name", "Mobile", "Course", "Hostel", "TenantID", "Type"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          student.studentId,
          student.name, 
          student.mobile,
          student.course,
          student.hostel,
          student.tenantId,
          student.type
        ]);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async insertBulkVisitors(tenantId) {
    // Process bulk upload data and create visitor registrations
    const sql = `
      INSERT INTO "VisitorRegistration" (
        "TenantID", "VistorName", "Mobile", "VisitorCatID", "VisitorCatName",
        "VisitorSubCatID", "VisitorSubCatName", "VisitorRegNo", "SecurityCode",
        "StatusID", "StatusName", "IsActive", "CreatedDate", "UpdatedDate", 
        "CreatedBy", "UpdatedBy"
      )
      SELECT 
        bvu."TenantID",
        bvu."Name",
        bvu."Mobile", 
        CASE bvu."Type" 
          WHEN 'student' THEN 3
          WHEN 'staff' THEN 1
          ELSE 2
        END,
        CASE bvu."Type"
          WHEN 'student' THEN 'Student'
          WHEN 'staff' THEN 'Staff' 
          ELSE 'General'
        END,
        CASE bvu."Type"
          WHEN 'student' THEN 6
          WHEN 'staff' THEN 1
          ELSE 4
        END,
        CASE bvu."Type"
          WHEN 'student' THEN 'Regular Student'
          WHEN 'staff' THEN 'Security'
          ELSE 'Walk-in Visitor'
        END,
        CONCAT(
          CASE bvu."Type" 
            WHEN 'student' THEN 'STU'
            WHEN 'staff' THEN 'STA'
            ELSE 'VIS'
          END,
          bvu."TenantID",
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
      FROM "BulkVisitorUpload" bvu
      WHERE bvu."TenantID" = $1
        AND NOT EXISTS (
          SELECT 1 FROM "VisitorRegistration" vr 
          WHERE vr."Mobile" = bvu."Mobile" 
            AND vr."TenantID" = bvu."TenantID"
            AND vr."IsActive" = 'Y'
        )
    `;
    
    await query(sql, [tenantId]);
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
              resolve(ResponseFormatter.success(
                null,
                `${inserted} visitor records inserted successfully`,
                inserted
              ));
            } catch (error) {
              reject(error);
            }
          })
          .on('error', reject);
      });
    } catch (error) {
      console.error('Error processing visitor CSV:', error);
      return ResponseFormatter.error('Failed to process visitor CSV');
    }
  }

  static async bulkInsertVisitors(visitors) {
    let insertedCount = 0;
    
    for (const visitor of visitors) {
      try {
        // Check if visitor already exists
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
      5: 'Business'
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
}

module.exports = BulkService