const { query } = require('../config/database');
const responseUtils = require('../utils/constants');

class VehicleService {
  static async searchVehicles(tenantId, filters = {}) {
    try {
      let {
        vehicleNo = '',
        phoneNo = '',
        visitorName = '',
        address = '',
        flatName = '',
        from = null,
        to = null,
        category = 'all',
        page = 1,
        pageSize = 50
      } = filters;

      // Convert date formats if needed
      const convertDate = (dateStr) => {
        if (!dateStr) return null;
        
        // If DD-MM-YYYY or DD/MM/YYYY format, convert to YYYY-MM-DD
        if (dateStr.match(/^\d{2}[-\/]\d{2}[-\/]\d{4}$/)) {
          const parts = dateStr.split(/[-\/]/);
          return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert to YYYY-MM-DD
        }
        
        return dateStr; // Assume already in correct format
      };

      from = convertDate(from);
      to = convertDate(to);

      const params = [tenantId];
      let paramIndex = 2;

      let sql = '';
      
      if (category === 'all' || category === 'registered') {
        sql += `
          SELECT 
            'registered' as category,
            vr.VisitorRegID as visitorid,
            vr.VehiclelNo as vehicle_no,
            vr.Mobile as phone_no,
            vr.VistorName as visitor_name,
            '' as address,
            vh.INTimeTxt as in_time,
            vh.OutTimeTxt as out_time,
            vr.FlatName as flat_name,
            vr.PhotoName as person_photo,
            vr.VehiclePhotoName as vehicle_photo,
            vr.IDPhotoName as id_photo,
            vr.Email as email,
            vr.Remark as remark,
            vh.INTime::date as in_date,
            vh.OutTime::date as out_date,
            vr.VisitorCatName as visitor_category,
            vr.VisitorSubCatName as visitor_subcategory,
            vh.VisitPurpose as visit_purpose,
            vr.CreatedDate as registration_date
          FROM VisitorRegistration vr
          LEFT JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID
          WHERE vr.TenantID = $1 AND vr.IsActive = 'Y' AND vr.VehiclelNo IS NOT NULL AND vr.VehiclelNo != ''`;

        // Add registered vehicle conditions
        if (vehicleNo) {
          sql += ` AND vr.VehiclelNo ILIKE $${paramIndex}`;
          params.push(`%${vehicleNo}%`);
          paramIndex++;
        }
        if (phoneNo) {
          sql += ` AND vr.Mobile ILIKE $${paramIndex}`;
          params.push(`%${phoneNo}%`);
          paramIndex++;
        }
        if (visitorName) {
          sql += ` AND vr.VistorName ILIKE $${paramIndex}`;
          params.push(`%${visitorName}%`);
          paramIndex++;
        }
        if (flatName) {
          sql += ` AND vr.FlatName ILIKE $${paramIndex}`;
          params.push(`%${flatName}%`);
          paramIndex++;
        }
      }

      if (category === 'all' || category === 'unregistered') {
        if (sql) sql += ' UNION ALL ';
        
        sql += `
          SELECT 
            'unregistered' as category,
            vm.VisitorID as visitorid,
            vm.VehiclelNo as vehicle_no,
            vm.Mobile as phone_no,
            CONCAT(vm.Fname, ' ', COALESCE(vm.Mname, ''), ' ', COALESCE(vm.Lname, '')) as visitor_name,
            vm.Address_1 as address,
            vm.INTimeTxt as in_time,
            vm.OutTimeTxt as out_time,
            vm.FlatName as flat_name,
            vm.PhotoName as person_photo,
            vm.VehiclePhotoName as vehicle_photo,
            '' as id_photo,
            '' as email,
            vm.Remark as remark,
            vm.INTime::date as in_date,
            vm.OutTime::date as out_date,
            vm.VisitorCatName as visitor_category,
            vm.VisitorSubCatName as visitor_subcategory,
            vm.VisitPurpose as visit_purpose,
            vm.CreatedDate as registration_date
          FROM VisitorMaster vm
          WHERE vm.TenantID = $1 AND vm.IsActive = 'Y' AND vm.VehiclelNo IS NOT NULL AND vm.VehiclelNo != ''`;

        // Add unregistered vehicle conditions  
        if (vehicleNo) {
          sql += ` AND vm.VehiclelNo ILIKE $${paramIndex}`;
          params.push(`%${vehicleNo}%`);
          paramIndex++;
        }
        if (phoneNo) {
          sql += ` AND vm.Mobile ILIKE $${paramIndex}`;
          params.push(`%${phoneNo}%`);
          paramIndex++;
        }
        if (visitorName) {
          sql += ` AND (vm.Fname ILIKE $${paramIndex} OR vm.Mname ILIKE $${paramIndex} OR vm.Lname ILIKE $${paramIndex})`;
          params.push(`%${visitorName}%`);
          paramIndex++;
        }
        if (address) {
          sql += ` AND vm.Address_1 ILIKE $${paramIndex}`;
          params.push(`%${address}%`);
          paramIndex++;
        }
        if (flatName) {
          sql += ` AND vm.FlatName ILIKE $${paramIndex}`;
          params.push(`%${flatName}%`);
          paramIndex++;
        }
      }

      // Add date filtering by directly appending to each section
      if (from && to) {
        // Add date filter to registered section
        if (category === 'all' || category === 'registered') {
          sql = sql.replace(
            'WHERE vr.TenantID = $1 AND vr.IsActive = \'Y\' AND vr.VehiclelNo IS NOT NULL AND vr.VehiclelNo != \'\'',
            `WHERE vr.TenantID = $1 AND vr.IsActive = 'Y' AND vr.VehiclelNo IS NOT NULL AND vr.VehiclelNo != '' AND vh.INTime::date BETWEEN $${paramIndex} AND $${paramIndex + 1}`
          );
          params.push(from, to);
          paramIndex += 2;
        }
        
        // Add date filter to unregistered section
        if (category === 'all' || category === 'unregistered') {
          sql = sql.replace(
            'WHERE vm.TenantID = $1 AND vm.IsActive = \'Y\' AND vm.VehiclelNo IS NOT NULL AND vm.VehiclelNo != \'\'',
            `WHERE vm.TenantID = $1 AND vm.IsActive = 'Y' AND vm.VehiclelNo IS NOT NULL AND vm.VehiclelNo != '' AND vm.INTime::date BETWEEN $${paramIndex} AND $${paramIndex + 1}`
          );
          params.push(from, to);
          paramIndex += 2;
        }
      }

      // Add ordering and pagination
      sql += ' ORDER BY in_date DESC, registration_date DESC';
      
      // Add pagination
      const offset = (page - 1) * pageSize;
      sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(pageSize, offset);

      const result = await query(sql, params);

      // Get total count for pagination
      let countSql = `SELECT COUNT(*) as total FROM (${sql.split('LIMIT')[0]}) as count_query`;
      const countResult = await query(countSql, params.slice(0, -2)); // Remove LIMIT and OFFSET params
      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: result.rows,
        count: result.rows.length,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: totalPages,
          totalItems: totalItems
        },
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS
      };
    } catch (error) {
      console.error('Error in vehicle search:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      };
    }
  }

  static async searchUnregisteredVehicles(tenantId, filters = {}) {
    try {
      let {
        vehicleNo = '',
        phoneNo = '',
        visitorName = '',
        address = '',
        from = null,
        to = null,
        page = 1,
        pageSize = 50
      } = filters;

      // Convert date formats if needed
      const convertDate = (dateStr) => {
        if (!dateStr) return null;
        
        // If DD-MM-YYYY or DD/MM/YYYY format, convert to YYYY-MM-DD
        if (dateStr.match(/^\d{2}[-\/]\d{2}[-\/]\d{4}$/)) {
          const parts = dateStr.split(/[-\/]/);
          return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert to YYYY-MM-DD
        }
        
        return dateStr; // Assume already in correct format
      };

      from = convertDate(from);
      to = convertDate(to);

      let sql = `
        SELECT 
          vm.VisitorID as visitorid,
          vm.VehiclelNo as vehicle_no,
          vm.Mobile as phone_no,
          CONCAT(vm.Fname, ' ', COALESCE(vm.Mname, ''), ' ', COALESCE(vm.Lname, '')) as visitor_name,
          vm.Address_1 as address,
          vm.INTimeTxt as in_time,
          vm.OutTimeTxt as out_time,
          vm.FlatName as flat_name,
          vm.PhotoName as person_photo,
          vm.VehiclePhotoName as vehicle_photo,
          vm.PhotoPath as person_photo_path,
          vm.VehiclePhotoPath as vehicle_photo_path,
          vm.Remark as remark,
          vm.INTime as in_datetime,
          vm.OutTime as out_datetime,
          vm.INTime::date as in_date,
          vm.OutTime::date as out_date,
          vm.VisitorCatName as visitor_category,
          vm.VisitorSubCatName as visitor_subcategory,
          vm.VisitPurpose as visit_purpose,
          vm.MeetingWith as meeting_with,
          vm.TotalVisitor as total_visitors,
          vm.OTPVerified as otp_verified,
          vm.CreatedDate as registration_date,
          vm.CreatedBy as created_by
        FROM VisitorMaster vm
        WHERE vm.TenantID = $1 AND vm.IsActive = 'Y' AND vm.VehiclelNo IS NOT NULL AND vm.VehiclelNo != ''`;

      const params = [tenantId];
      let paramIndex = 2;

      // Add filters
      if (vehicleNo) {
        sql += ` AND vm.VehiclelNo ILIKE $${paramIndex}`;
        params.push(`%${vehicleNo}%`);
        paramIndex++;
      }
      if (phoneNo) {
        sql += ` AND vm.Mobile ILIKE $${paramIndex}`;
        params.push(`%${phoneNo}%`);
        paramIndex++;
      }
      if (visitorName) {
        sql += ` AND (vm.Fname ILIKE $${paramIndex} OR vm.Mname ILIKE $${paramIndex} OR vm.Lname ILIKE $${paramIndex})`;
        params.push(`%${visitorName}%`);
        paramIndex++;
      }
      if (address) {
        sql += ` AND vm.Address_1 ILIKE $${paramIndex}`;
        params.push(`%${address}%`);
        paramIndex++;
      }
      if (from && to) {
        sql += ` AND vm.INTime::date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(from, to);
        paramIndex += 2;
      }

      // Add ordering and pagination
      sql += ' ORDER BY vm.INTime DESC, vm.CreatedDate DESC';
      
      const offset = (page - 1) * pageSize;
      sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(pageSize, offset);

      const result = await query(sql, params);

      // Get total count
      let countSql = sql.split('ORDER BY')[0].replace('SELECT vm.VisitorID', 'SELECT COUNT(*)');
      const countResult = await query(countSql, params.slice(0, -2));
      const totalItems = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: result.rows,
        count: result.rows.length,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: totalPages,
          totalItems: totalItems
        },
        responseMessage: responseUtils.RESPONSE_MESSAGES.SUCCESS
      };
    } catch (error) {
      console.error('Error in unregistered vehicle search:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: responseUtils.RESPONSE_MESSAGES.ERROR
      };
    }
  }
}

module.exports = VehicleService;