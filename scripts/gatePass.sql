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