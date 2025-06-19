class VehicleService {
  static async searchVehicles(tenantId, vehicleNo = '', from = null, to = null) {
    try {
      const sql = `
        SELECT 
          'registered' as category,
          vr."VisitorRegID" as visitorid,
          vr."VehiclelNo" as "vehicleNo", 
          vr."Mobile" as "phoneNo",
          vr."VistorName" as "visitorName",
          vh."INTimeTxt" as "inTime",
          vh."OutTimeTxt" as "outTime", 
          vr."FlatName" as "flatName",
          vr."PhotoName" as "personPhoto",
          vh."INTime"::date as "inDate",
          vh."OutTime"::date as "outDate"
        FROM "VisitorRegistration" vr
        LEFT JOIN "VisitorRegVisitHistory" vh ON vr."VisitorRegID" = vh."VisitorRegID"
        WHERE vr."TenantID" = $1 
          AND vr."VehiclelNo" ILIKE $2
          AND vr."IsActive" = 'Y'
        
        UNION ALL
        
        SELECT 
          'unregistered' as category,
          vm."VisitorID" as visitorid,
          vm."VehiclelNo" as "vehicleNo",
          vm."Mobile" as "phoneNo", 
          vm."Fname" as "visitorName",
          vm."INTimeTxt" as "inTime",
          vm."OutTimeTxt" as "outTime",
          vm."FlatName" as "flatName", 
          vm."PhotoName" as "personPhoto",
          vm."INTime"::date as "inDate",
          vm."OutTime"::date as "outDate"
        FROM "VisitorMaster" vm
        WHERE vm."TenantID" = $1
          AND vm."VehiclelNo" ILIKE $2
          AND vm."IsActive" = 'Y'
        ORDER BY "inDate" DESC
      `;

      const vehiclePattern = vehicleNo ? `%${vehicleNo}%` : '%';
      const result = await query(sql, [tenantId, vehiclePattern]);

      let vehicles = result.rows;

      // Apply date filter if provided
      if (from && to) {
        vehicles = vehicles.filter(v => {
          const inDate = new Date(v.inDate);
          const fromDate = new Date(from);
          const toDate = new Date(to);
          return inDate >= fromDate && inDate <= toDate;
        });
      }

      return ResponseFormatter.success(vehicles, 'Vehicle search completed', vehicles.length);
    } catch (error) {
      console.error('Error in vehicle search:', error);
      return ResponseFormatter.error('Failed to search vehicles');
    }
  }
}

module.exports = VehicleService