const { query } = require('../config/database');

class VisitorModel {
  // Get visitor purposes by category
  static async getVisitorPurposeByCategory(tenantId, purposeCatId = 0) {
    const sql = `
      SELECT 
        VisitPurposeID,
        PurposeCatID,
        PurposeCatName,
        VisitPurpose,
        IsActive
      FROM VisitorPuposeMaster
      WHERE TenantID = $1 
        AND IsActive = 'Y'
        ${purposeCatId > 0 ? 'AND PurposeCatID = $2' : ''}
      ORDER BY VisitPurpose
    `;
    
    const params = purposeCatId > 0 ? [tenantId, purposeCatId] : [tenantId];
    const result = await query(sql, params);
    return result.rows;
  }

  // Get visitor subcategories
  static async getVisitorSubCategories(tenantId, visitorCatId = 0) {
    const sql = `
      SELECT 
        VisitorSubCatID,
        VisitorCatID,
        VisitorCatName,
        VisitorSubCatName,
        VisitorSubCatIconFlag,
        VisitorSubCatIconPath,
        VisitorSubCatIcon,
        IsActive
      FROM VisitorSubCategory
      WHERE TenantID = $1 
        AND IsActive = 'Y'
        ${visitorCatId > 0 ? 'AND VisitorCatID = $2' : ''}
      ORDER BY VisitorSubCatName
    `;
    
    const params = visitorCatId > 0 ? [tenantId, visitorCatId] : [tenantId];
    const result = await query(sql, params);
    return result.rows;
  }

  // Check if visitor exists by mobile and category
  static async checkVisitorExists(mobile, tenantId, visitorCatId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM VisitorRegistration
      WHERE Mobile = $1 AND TenantID = $2 AND VisitorCatID = $3 AND IsActive = 'Y'
    `;
    
    const result = await query(sql, [mobile, tenantId, visitorCatId]);
    return result.rows[0].count > 0;
  }

  // Get recent visitor by mobile
  static async getRecentVisitorByMobile(tenantId, mobile) {
    const sql = `
      SELECT 
        vm.VisitorID,
        vm.Fname,
        vm.Mobile,
        vm.VehiclelNo,
        vm.FlatName,
        vm.VisitorSubCatName,
        vm.CreatedDate
      FROM VisitorMaster vm
      WHERE vm.TenantID = $1 AND vm.Mobile = $2
      ORDER BY vm.CreatedDate DESC
      LIMIT 5
    `;
    
    const result = await query(sql, [tenantId, mobile]);
    return result.rows;
  }

  // Create unregistered visitor
  static async createUnregisteredVisitor(visitorData) {
    const {
      tenantId, fname, mobile, vehicleNo, flatName, visitorCatId, 
      visitorCatName, visitorSubCatId, visitorSubCatName, visitPurposeId,
      visitPurpose, totalVisitor, photoData, vehiclePhotoData, createdBy
    } = visitorData;

    const sql = `
      INSERT INTO VisitorMaster (
        TenantID, Fname, Mobile, VehiclelNo, FlatName, VisitorCatID,
        VisitorCatName, VisitorSubCatID, VisitorSubCatName, VisitPurposeID,
        VisitPurpose, TotalVisitor, VisitDate, INTime, INTimeTxt,
        IsActive, StatusID, StatusName, PhotoFlag, PhotoName, PhotoPath,
        VehiclePhotoFlag, VehiclePhotoName, VehiclePhotoPath,
        CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
        NOW(), NOW(), TO_CHAR(NOW(), 'HH12:MI AM'), 'Y', 1, 'ACTIVE',
        $13, $14, $15, $16, $17, $18, NOW(), NOW(), $19, $19
      ) RETURNING VisitorID
    `;

    const photoFlag = photoData ? 'Y' : 'N';
    const photoName = photoData ? `UnRegVisitor_${Date.now()}.jpeg` : null;
    const photoPath = photoData ? '/uploads/visitors/' : null;

    const vehiclePhotoFlag = vehiclePhotoData ? 'Y' : 'N';
    const vehiclePhotoName = vehiclePhotoData ? `Vehicle_${Date.now()}.jpeg` : null;
    const vehiclePhotoPath = vehiclePhotoData ? '/uploads/vehicles/' : null;

    const result = await query(sql, [
      tenantId, fname, mobile, vehicleNo, flatName, visitorCatId,
      visitorCatName, visitorSubCatId, visitorSubCatName, visitPurposeId,
      visitPurpose, totalVisitor || 1, photoFlag, photoName, photoPath,
      vehiclePhotoFlag, vehiclePhotoName, vehiclePhotoPath, createdBy
    ]);

    return result.rows[0];
  }

  // Create registered visitor
  static async createRegisteredVisitor(visitorData) {
    const {
      tenantId, vistorName, mobile, email, visitorCatId, visitorCatName,
      visitorSubCatId, visitorSubCatName, flatId, flatName, vehicleNo,
      identityId, idName, idNumber, photoData, vehiclePhotoData, 
      idPhotoData, createdBy
    } = visitorData;

    // Generate security code
    const securityCode = Math.floor(100000 + Math.random() * 900000).toString();

    const sql = `
      INSERT INTO VisitorRegistration (
        TenantID, VistorName, Mobile, Email, VisitorCatID, VisitorCatName,
        VisitorSubCatID, VisitorSubCatName, SecurityCode, FlatID, FlatName,
        VehiclelNo, IdentityID, IDName, IDNumber, IsActive, StatusID, StatusName,
        PhotoFlag, PhotoName, PhotoPath, VehiclePhotoFlag, VehiclePhotoName, 
        VehiclePhotoPath, IDPhotoFlag, IDPhotoName, IDPhotoPath,
        ValidityFlag, ValidStartDate, ValidEndDate, CreatedDate, UpdatedDate,
        CreatedBy, UpdatedBy
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        'Y', 1, 'ACTIVE', $16, $17, $18, $19, $20, $21, $22, $23, $24,
        'Y', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW(), $25, $25
      ) RETURNING VisitorRegID, SecurityCode
    `;

    const photoFlag = photoData ? 'Y' : 'N';
    const photoName = photoData ? `RegVisitor_${Date.now()}.jpeg` : null;
    const photoPath = photoData ? '/uploads/registered_visitors/' : null;

    const vehiclePhotoFlag = vehiclePhotoData ? 'Y' : 'N';
    const vehiclePhotoName = vehiclePhotoData ? `RegVehicle_${Date.now()}.jpeg` : null;
    const vehiclePhotoPath = vehiclePhotoData ? '/uploads/vehicles/' : null;

    const idPhotoFlag = idPhotoData ? 'Y' : 'N';
    const idPhotoName = idPhotoData ? `RegVisitorID_${Date.now()}.jpeg` : null;
    const idPhotoPath = idPhotoData ? '/uploads/visitor_ids/' : null;

    const result = await query(sql, [
      tenantId, vistorName, mobile, email, visitorCatId, visitorCatName,
      visitorSubCatId, visitorSubCatName, securityCode, flatId, flatName,
      vehicleNo, identityId, idName, idNumber, photoFlag, photoName, photoPath,
      vehiclePhotoFlag, vehiclePhotoName, vehiclePhotoPath, idPhotoFlag, 
      idPhotoName, idPhotoPath, createdBy
    ]);

    return result.rows[0];
  }

  // Get registered visitors
  static async getRegisteredVisitors(tenantId, visitorCatId = 0, visitorSubCatId = 0) {
    const sql = `
      SELECT 
        VisitorRegID, VistorName, Mobile, Email, VisitorCatID, VisitorCatName,
        VisitorSubCatID, VisitorSubCatName, VisitorRegNo, SecurityCode,
        FlatID, FlatName, VehiclelNo, PhotoName, PhotoPath, IsActive,
        CreatedDate, UpdatedDate
      FROM VisitorRegistration
      WHERE TenantID = $1 AND IsActive = 'Y'
        ${visitorCatId > 0 ? 'AND VisitorCatID = $2' : ''}
        ${visitorSubCatId > 0 ? 'AND VisitorSubCatID = $3' : ''}
      ORDER BY CreatedDate DESC
    `;

    let params = [tenantId];
    if (visitorCatId > 0) params.push(visitorCatId);
    if (visitorSubCatId > 0) params.push(visitorSubCatId);

    const result = await query(sql, params);
    return result.rows;
  }

  // Update visitor checkout
  static async updateVisitorCheckout(visitorId, tenantId) {
    const sql = `
      UPDATE VisitorMaster 
      SET OutTime = NOW(), 
          OutTimeTxt = TO_CHAR(NOW(), 'HH12:MI AM'),
          UpdatedDate = NOW()
      WHERE VisitorID = $1 AND TenantID = $2
      RETURNING VisitorID
    `;

    const result = await query(sql, [visitorId, tenantId]);
    return result.rows[0];
  }
}

module.exports = VisitorModel;