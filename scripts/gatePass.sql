ALTER TABLE VisitorMaster 
ALTER COLUMN INTime DROP DEFAULT;


-- Use lowercase column names (no quotes)
INSERT INTO visitorpuposemaster (
    tenantid, isactive, purposecatid, purposecatname, 
    visitpurpose, createdby
)
SELECT 
    1001 as tenantid, 
    isactive, 
    purposecatid, 
    purposecatname, 
    visitpurpose, 
    'System' as createdby
FROM visitorpuposemaster 
WHERE tenantid = 1 AND purposecatid = 6
ON CONFLICT DO NOTHING;



INSERT INTO Tenant (
    TenantID, TenantName, TenantCode, ShortName, Email, Mobile, Address1,
    IsActive, StatusID, SuscriptionStartDate, SuscriptionEndDate, 
    FinancialYear, EntityLogoFlag, KeyActivateFlag, CreatedDate, UpdatedDate
) VALUES (
    1002, 'Sample Tenant Company', 'TEN1002', 'STC', 
    'contact@sampletenant.com', '+91-9876543210', '123 Business District, City Name',
    'Y', 1, NOW(), NOW() + INTERVAL '1 year', 
    2025, 'N', 'Y', NOW(), NOW()
);

INSERT INTO VisitorPuposemaster (
    VisitPurposeID, TenantID, IsActive, PurposeCatID, PurposeCatName,
    VisitPurpose, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy            
) VALUES                                                                
(7, 1002, 'Y', 6, 'General', 'Meeting', NOW(), NOW(), 'ADMIN', 'ADMIN'),
(8, 1002, 'Y', 6, 'General', 'Delivery', NOW(), NOW(), 'ADMIN', 'ADMIN'),            
(9, 1002, 'Y', 6, 'General', 'Maintenance', NOW(), NOW(), 'ADMIN', 'ADMIN'),
(10, 1002, 'Y', 6, 'General', 'Emergency', NOW(), NOW(), 'ADMIN', 'ADMIN'),
(11, 1002, 'Y', 6, 'General', 'Official Visit', NOW(), NOW(), 'ADMIN', 'ADMIN');
