-- Bus Management Dummy Data Script

-- Insert Bus Bulk Upload Data (for bus number, registration, and driver information)
INSERT INTO BulkVisitorUpload (StudentID, Name, Mobile, Course, Hostel, TenantID, Type) VALUES
-- School Buses
('REG001', 'School Bus 01', '9876540001', 'Rajesh Kumar', 'Route A - Main Gate', 1, 'bus'),
('REG002', 'School Bus 02', '9876540002', 'Suresh Sharma', 'Route B - North Gate', 1, 'bus'),
('REG003', 'School Bus 03', '9876540003', 'Mahesh Gupta', 'Route C - East Gate', 1, 'bus'),
('REG004', 'School Bus 04', '9876540004', 'Ramesh Yadav', 'Route D - South Gate', 1, 'bus'),
('REG005', 'School Bus 05', '9876540005', 'Dinesh Patel', 'Route A - Main Gate', 1, 'bus'),

-- College Buses  
('REG006', 'College Express 01', '9876540006', 'Anil Verma', 'City Route 1', 1, 'bus'),
('REG007', 'College Express 02', '9876540007', 'Vijay Singh', 'City Route 2', 1, 'bus'),
('REG008', 'College Express 03', '9876540008', 'Sanjay Mishra', 'Highway Route', 1, 'bus'),
('REG009', 'College Express 04', '9876540009', 'Prakash Joshi', 'Metro Route', 1, 'bus'),
('REG010', 'College Express 05', '9876540010', 'Ashok Kumar', 'Ring Road Route', 1, 'bus'),

-- Staff Buses
('REG011', 'Staff Transport 01', '9876540011', 'Mohan Lal', 'Staff Colony Route', 1, 'bus'),
('REG012', 'Staff Transport 02', '9876540012', 'Gopal Das', 'Faculty Housing', 1, 'bus'),
('REG013', 'Staff Transport 03', '9876540013', 'Ravi Shankar', 'Admin Block Route', 1, 'bus'),

-- Shuttle Buses
('REG014', 'Campus Shuttle 01', '9876540014', 'Kiran Pal', 'Internal Campus', 1, 'bus'),
('REG015', 'Campus Shuttle 02', '9876540015', 'Manoj Tiwari', 'Hostel Shuttle', 1, 'bus'),
('REG016', 'Campus Shuttle 03', '9876540016', 'Deepak Rai', 'Library Shuttle', 1, 'bus'),

-- Emergency/Special Buses
('REG017', 'Emergency Bus 01', '9876540017', 'Rajendra Prasad', 'Emergency Route', 1, 'bus'),
('REG018', 'Medical Bus', '9876540018', 'Dr. Samir Khan', 'Medical Emergency', 1, 'bus'),
('REG019', 'Event Bus 01', '9876540019', 'Sunil Rana', 'Event Transport', 1, 'bus'),
('REG020', 'Event Bus 02', '9876540020', 'Amar Singh', 'Special Events', 1, 'bus'),

-- Maintenance/Service Buses
('REG021', 'Maintenance Van', '9876540021', 'Raman Lal', 'Campus Maintenance', 1, 'bus'),
('REG022', 'Security Patrol', '9876540022', 'Jagdish Yadav', 'Security Rounds', 1, 'bus'),
('REG023', 'Delivery Van', '9876540023', 'Mukesh Agarwal', 'Supply Delivery', 1, 'bus');

-- Insert Bus Registration Records
INSERT INTO VisitorRegistration (
    TenantID, VistorName, Mobile, VisitorCatID, VisitorCatName,
    VisitorSubCatID, VisitorSubCatName, VisitorRegNo, SecurityCode,
    StatusID, StatusName, IsActive, CreatedDate, UpdatedDate, 
    CreatedBy, UpdatedBy, Email, AssociatedFlat, AssociatedBlock
) VALUES

-- SCENARIO 1: First-time buses (no visit history) - Can CHECKOUT
(1, 'School Bus 01', '9876540001', 5, 'Bus', 10, 'Delivery', 'BUS1001001', '654321', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '30 days', NOW(), 'System', 'System', 'transport@school.edu', 'Main Gate', 'Entry-A'),
(1, 'School Bus 02', '9876540002', 5, 'Bus', 10, 'Delivery', 'BUS1001002', '654322', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '25 days', NOW(), 'System', 'System', 'transport@school.edu', 'North Gate', 'Entry-B'),
(1, 'School Bus 03', '9876540003', 5, 'Bus', 10, 'Delivery', 'BUS1001003', '654323', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '20 days', NOW(), 'System', 'System', 'transport@school.edu', 'East Gate', 'Entry-C'),

-- SCENARIO 2: Buses currently checked out (no OutTime) - Can CHECKIN  
(1, 'College Express 01', '9876540006', 5, 'Bus', 11, 'Service Provider', 'BUS1001006', '654326', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '15 days', NOW(), 'System', 'System', 'transport@college.edu', 'City Gate', 'Entry-D'),
(1, 'College Express 02', '9876540007', 5, 'Bus', 11, 'Service Provider', 'BUS1001007', '654327', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '18 days', NOW(), 'System', 'System', 'transport@college.edu', 'Metro Gate', 'Entry-E'),
(1, 'Staff Transport 01', '9876540011', 5, 'Bus', 11, 'Service Provider', 'BUS1001011', '654331', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '12 days', NOW(), 'System', 'System', 'staff@transport.edu', 'Staff Gate', 'Entry-F'),

-- SCENARIO 3: Buses with completed previous visits - Can CHECKOUT again
(1, 'Campus Shuttle 01', '9876540014', 5, 'Bus', 10, 'Delivery', 'BUS1001014', '654334', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '10 days', NOW(), 'System', 'System', 'shuttle@campus.edu', 'Campus Center', 'Entry-G'),
(1, 'Campus Shuttle 02', '9876540015', 5, 'Bus', 10, 'Delivery', 'BUS1001015', '654335', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '8 days', NOW(), 'System', 'System', 'shuttle@campus.edu', 'Hostel Area', 'Entry-H'),
(1, 'Emergency Bus 01', '9876540017', 5, 'Bus', 11, 'Service Provider', 'BUS1001017', '654337', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '7 days', NOW(), 'System', 'System', 'emergency@transport.edu', 'Emergency Bay', 'Entry-I'),

-- Additional buses for pagination testing
(1, 'Medical Bus', '9876540018', 5, 'Bus', 11, 'Service Provider', 'BUS1001018', '654338', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '6 days', NOW(), 'System', 'System', 'medical@transport.edu', 'Medical Center', 'Entry-J'),
(1, 'Event Bus 01', '9876540019', 5, 'Bus', 10, 'Delivery', 'BUS1001019', '654339', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '5 days', NOW(), 'System', 'System', 'events@transport.edu', 'Event Hall', 'Entry-K'),
(1, 'Event Bus 02', '9876540020', 5, 'Bus', 10, 'Delivery', 'BUS1001020', '654340', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '4 days', NOW(), 'System', 'System', 'events@transport.edu', 'Auditorium', 'Entry-L'),
(1, 'Maintenance Van', '9876540021', 5, 'Bus', 11, 'Service Provider', 'BUS1001021', '654341', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '3 days', NOW(), 'System', 'System', 'maintenance@campus.edu', 'Maintenance Yard', 'Service-A'),
(1, 'Security Patrol', '9876540022', 5, 'Bus', 11, 'Service Provider', 'BUS1001022', '654342', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '2 days', NOW(), 'System', 'System', 'security@campus.edu', 'Security HQ', 'Service-B'),
(1, 'Delivery Van', '9876540023', 5, 'Bus', 10, 'Delivery', 'BUS1001023', '654343', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '1 day', NOW(), 'System', 'System', 'delivery@campus.edu', 'Loading Dock', 'Service-C'),

-- Additional test buses
(1, 'School Bus 04', '9876540004', 5, 'Bus', 10, 'Delivery', 'BUS1001004', '654324', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'transport@school.edu', 'South Gate', 'Entry-M'),
(1, 'School Bus 05', '9876540005', 5, 'Bus', 10, 'Delivery', 'BUS1001005', '654325', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'transport@school.edu', 'West Gate', 'Entry-N'),
(1, 'College Express 03', '9876540008', 5, 'Bus', 11, 'Service Provider', 'BUS1001008', '654328', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'transport@college.edu', 'Highway Gate', 'Entry-O'),
(1, 'College Express 04', '9876540009', 5, 'Bus', 11, 'Service Provider', 'BUS1001009', '654329', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'transport@college.edu', 'Ring Road', 'Entry-P'),
(1, 'College Express 05', '9876540010', 5, 'Bus', 11, 'Service Provider', 'BUS1001010', '654330', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'transport@college.edu', 'Central Station', 'Entry-Q');

-- Insert Visit History Data

-- SCENARIO 2: Buses currently checked out (Have INTime but no OutTime)
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy,
    VisitPurposeID, VisitPurpose, PurposeCatID, PurposeCatName
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 5, 'Bus', vr.VisitorSubCatID, vr.VisitorSubCatName,
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '2 hours', 
    TO_CHAR(NOW() - INTERVAL '2 hours', 'HH12:MI AM'), 
    NOW() - INTERVAL '2 hours', 
    NOW() - INTERVAL '2 hours', 
    'Security', 'Security',
    6, 'Bus Meeting', 2, 'Bus'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 5 AND vr.VistorName = 'College Express 01';

INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy,
    VisitPurposeID, VisitPurpose, PurposeCatID, PurposeCatName
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 5, 'Bus', vr.VisitorSubCatID, vr.VisitorSubCatName,
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '4 hours', 
    TO_CHAR(NOW() - INTERVAL '4 hours', 'HH12:MI AM'), 
    NOW() - INTERVAL '4 hours', 
    NOW() - INTERVAL '4 hours', 
    'Security', 'Security',
    7, 'Service Call', 2, 'Bus'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 5 AND vr.VistorName = 'College Express 02';

INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy,
    VisitPurposeID, VisitPurpose, PurposeCatID, PurposeCatName
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 5, 'Bus', vr.VisitorSubCatID, vr.VisitorSubCatName,
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '1 hour', 
    TO_CHAR(NOW() - INTERVAL '1 hour', 'HH12:MI AM'), 
    NOW() - INTERVAL '1 hour', 
    NOW() - INTERVAL '1 hour', 
    'Security', 'Security',
    8, 'Installation', 2, 'Bus'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 5 AND vr.VistorName = 'Staff Transport 01';

-- SCENARIO 3: Buses with completed visits (Have both INTime and OutTime)
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy,
    VisitPurposeID, VisitPurpose, PurposeCatID, PurposeCatName
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 5, 'Bus', vr.VisitorSubCatID, vr.VisitorSubCatName,
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '1 day 6 hours', 
    TO_CHAR(NOW() - INTERVAL '1 day 6 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '1 day 2 hours', 
    TO_CHAR(NOW() - INTERVAL '1 day 2 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '1 day 6 hours', 
    NOW() - INTERVAL '1 day 2 hours', 
    'Security', 'Security',
    6, 'Bus Meeting', 2, 'Bus'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 5 AND vr.VistorName = 'Campus Shuttle 01';

INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy,
    VisitPurposeID, VisitPurpose, PurposeCatID, PurposeCatName
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 5, 'Bus', vr.VisitorSubCatID, vr.VisitorSubCatName,
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '2 days 8 hours', 
    TO_CHAR(NOW() - INTERVAL '2 days 8 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '2 days 3 hours', 
    TO_CHAR(NOW() - INTERVAL '2 days 3 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '2 days 8 hours', 
    NOW() - INTERVAL '2 days 3 hours', 
    'Security', 'Security',
    7, 'Service Call', 2, 'Bus'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 5 AND vr.VistorName = 'Campus Shuttle 02';

INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy,
    VisitPurposeID, VisitPurpose, PurposeCatID, PurposeCatName
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 5, 'Bus', vr.VisitorSubCatID, vr.VisitorSubCatName,
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '3 days 5 hours', 
    TO_CHAR(NOW() - INTERVAL '3 days 5 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '3 days 1 hour', 
    TO_CHAR(NOW() - INTERVAL '3 days 1 hour', 'HH12:MI AM'),
    NOW() - INTERVAL '3 days 5 hours', 
    NOW() - INTERVAL '3 days 1 hour', 
    'Security', 'Security',
    8, 'Installation', 2, 'Bus'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 5 AND vr.VistorName = 'Emergency Bus 01';

-- Multiple visit history for some buses to test comprehensive history
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy,
    VisitPurposeID, VisitPurpose, PurposeCatID, PurposeCatName
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 5, 'Bus', vr.VisitorSubCatID, vr.VisitorSubCatName,
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '5 days 8 hours', 
    TO_CHAR(NOW() - INTERVAL '5 days 8 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '5 days 4 hours', 
    TO_CHAR(NOW() - INTERVAL '5 days 4 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '5 days 8 hours', 
    NOW() - INTERVAL '5 days 4 hours', 
    'Security', 'Security',
    6, 'Bus Meeting', 2, 'Bus'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 5 AND vr.VistorName = 'Campus Shuttle 01';

-- Add current visit for Medical Bus (checked out, pending check-in)
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy,
    VisitPurposeID, VisitPurpose, PurposeCatID, PurposeCatName
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 5, 'Bus', vr.VisitorSubCatID, vr.VisitorSubCatName,
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '30 minutes', 
    TO_CHAR(NOW() - INTERVAL '30 minutes', 'HH12:MI AM'),
    NOW() - INTERVAL '30 minutes', 
    NOW() - INTERVAL '30 minutes', 
    'Security', 'Security',
    8, 'Installation', 2, 'Bus'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 5 AND vr.VistorName = 'Medical Bus';

-- Insert purpose categories for buses (if not exist)
INSERT INTO VisitorPuposeMaster (VisitPurposeID, TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive) VALUES 
-- Bus specific purposes
(21, 1, 2, 'Bus', 'Passenger Transport', 'Y'),
(22, 1, 2, 'Bus', 'Emergency Response', 'Y'),
(23, 1, 2, 'Bus', 'Maintenance Work', 'Y'),
(24, 1, 2, 'Bus', 'Security Patrol', 'Y'),
(25, 1, 2, 'Bus', 'Supply Delivery', 'Y'),
(26, 1, 2, 'Bus', 'Route Service', 'Y'),
(27, 1, 2, 'Bus', 'Special Event', 'Y'),
(28, 1, 2, 'Bus', 'Medical Emergency', 'Y'),
(29, 1, 2, 'Bus', 'Staff Transport', 'Y'),
(30, 1, 2, 'Bus', 'Other', 'Y')
ON CONFLICT (VisitPurposeID) DO NOTHING;

-- Update existing visit history with proper purposes
UPDATE VisitorRegVisitHistory 
SET VisitPurposeID = 6, 
    VisitPurpose = 'Bus Meeting',
    PurposeCatID = 2,
    PurposeCatName = 'Bus'
WHERE VisitorCatID = 5 
  AND (VisitPurposeID IS NULL OR VisitPurpose IS NULL);

-- Insert additional dummy purposes for testing
INSERT INTO VisitorPuposeMaster (TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive) VALUES 
(1, 2, 'Bus', 'Fuel Refill', 'Y'),
(1, 2, 'Bus', 'Driver Break', 'Y'),
(1, 2, 'Bus', 'Inspection', 'Y'),
(1, 2, 'Bus', 'Cleaning Service', 'Y'),
(1, 2, 'Bus', 'Loading/Unloading', 'Y')
ON CONFLICT DO NOTHING;