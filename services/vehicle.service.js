const { query } = require('../config/database');
const responseUtils = require('../utils/constants');

class VehicleService {
  static async searchVehicles(tenantId, vehicleNo = '', from = null, to = null) {
    try {
      const sql = `
        SELECT 
          'registered' as category,
          vr.VisitorRegID as visitorid,
          vr.VehiclelNo as vehicle_no, 
          vr.Mobile as phone_no,
          vr.VistorName as visitor_name,
          vh.INTimeTxt as in_time,
          vh.OutTimeTxt as out_time, 
          vr.FlatName as flat_name,
          vr.PhotoName as person_photo,
          vh.INTime::date as in_date,
          vh.OutTime::date as out_date
        FROM VisitorRegistration vr
        LEFT JOIN VisitorRegVisitHistory vh ON vr.VisitorRegID = vh.VisitorRegID
        WHERE vr.TenantID = $1 
          AND vr.VehiclelNo ILIKE $2
          AND vr.IsActive = 'Y'
        
        UNION ALL
        
        SELECT 
          'unregistered' as category,
          vm.VisitorID as visitorid,
          vm.VehiclelNo as vehicle_no,
          vm.Mobile as phone_no, 
          vm.Fname as visitor_name,
          vm.INTimeTxt as in_time,
          vm.OutTimeTxt as out_time,
          vm.FlatName as flat_name, 
          vm.PhotoName as person_photo,
          vm.INTime::date as in_date,
          vm.OutTime::date as out_date
        FROM VisitorMaster vm
        WHERE vm.TenantID = $1
          AND vm.VehiclelNo ILIKE $2
          AND vm.IsActive = 'Y'
        ORDER BY in_date DESC
      `;

      const vehiclePattern = vehicleNo ? `%${vehicleNo}%` : '%';
      const result = await query(sql, [tenantId, vehiclePattern]);

      let vehicles = result.rows;

      // Apply date filter if provided
      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        vehicles = vehicles.filter(v => {
          const inDate = new Date(v.in_date);
          return inDate >= fromDate && inDate <= toDate;
        });
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: vehicles,
        count: vehicles.length,
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
}

module.exports = VehicleService;