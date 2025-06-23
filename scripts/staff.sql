-- Staff Management Dummy Data Script

-- Insert Staff Bulk Upload Data
INSERT INTO BulkVisitorUpload (StudentID, Name, Mobile, Course, Hostel, TenantID, Type) VALUES
-- Security Staff
('SEC001', 'Rajesh Kumar', '9876540001', 'Senior Security Officer', 'Main Gate', 1, 'staff'),
('SEC002', 'Suresh Sharma', '9876540002', 'Security Guard', 'North Gate', 1, 'staff'),
('SEC003', 'Mahesh Gupta', '9876540003', 'Security Guard', 'East Gate', 1, 'staff'),
('SEC004', 'Ramesh Yadav', '9876540004', 'Security Guard', 'South Gate', 1, 'staff'),
('SEC005', 'Dinesh Patel', '9876540005', 'Night Shift Security', 'Main Gate', 1, 'staff'),

-- Maintenance Staff  
('MNT001', 'Anil Verma', '9876540006', 'Maintenance Supervisor', 'Block A', 1, 'staff'),
('MNT002', 'Vijay Singh', '9876540007', 'Electrician', 'Block B', 1, 'staff'),
('MNT003', 'Sanjay Mishra', '9876540008', 'Plumber', 'Block C', 1, 'staff'),
('MNT004', 'Prakash Joshi', '9876540009', 'HVAC Technician', 'Central Plant', 1, 'staff'),
('MNT005', 'Ashok Kumar', '9876540010', 'Carpenter', 'Workshop', 1, 'staff'),

-- Cleaning Staff
('CLN001', 'Mohan Lal', '9876540011', 'Cleaning Supervisor', 'All Blocks', 1, 'staff'),
('CLN002', 'Gopal Das', '9876540012', 'Janitor', 'Block A', 1, 'staff'),
('CLN003', 'Ravi Shankar', '9876540013', 'Janitor', 'Block B', 1, 'staff'),
('CLN004', 'Kiran Pal', '9876540014', 'Janitor', 'Block C', 1, 'staff'),
('CLN005', 'Manoj Tiwari', '9876540015', 'Housekeeping', 'Common Areas', 1, 'staff'),

-- Administrative Staff
('ADM001', 'Deepak Rai', '9876540016', 'Office Assistant', 'Admin Block', 1, 'staff'),
('ADM002', 'Rajendra Prasad', '9876540017', 'Receptionist', 'Front Desk', 1, 'staff'),
('ADM003', 'Dr. Samir Khan', '9876540018', 'Facility Manager', 'Admin Block', 1, 'staff'),
('ADM004', 'Sunil Rana', '9876540019', 'HR Assistant', 'HR Department', 1, 'staff'),
('ADM005', 'Amar Singh', '9876540020', 'Accounts Assistant', 'Accounts Department', 1, 'staff'),

-- Kitchen/Canteen Staff
('KTC001', 'Raman Lal', '9876540021', 'Head Cook', 'Main Canteen', 1, 'staff'),
('KTC002', 'Jagdish Yadav', '9876540022', 'Cook', 'Main Canteen', 1, 'staff'),
('KTC003', 'Mukesh Agarwal', '9876540023', 'Kitchen Helper', 'Main Canteen', 1, 'staff'),

-- Additional Support Staff
('SUP001', 'Sanjay Mishra', '9876540030', 'Driver', 'Transport Pool', 1, 'staff'),
('SUP002', 'Lakshmi Menon', '9876540031', 'Nurse', 'Medical Center', 1, 'staff'),
('SUP003', 'Arun Krishnan', '9876540032', 'Gardener', 'Landscaping', 1, 'staff');

-- Insert Staff Registration Records
INSERT INTO VisitorRegistration (
    TenantID, VistorName, Mobile, VisitorCatID, VisitorCatName,
    VisitorSubCatID, VisitorSubCatName, VisitorRegNo, SecurityCode,
    StatusID, StatusName, IsActive, CreatedDate, UpdatedDate, 
    CreatedBy, UpdatedBy, Email, AssociatedFlat, AssociatedBlock
) VALUES

-- SCENARIO 1: First-time staff (no visit history) - Can CHECKIN
(1, 'Rajesh Kumar', '9876540001', 1, 'Staff', 1, 'Security', 'STA1001001', '654321', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '30 days', NOW(), 'System', 'System', 'rajesh.kumar@security.com', 'Main Gate', 'Security-A'),
(1, 'Suresh Sharma', '9876540002', 1, 'Staff', 1, 'Security', 'STA1001002', '654322', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '25 days', NOW(), 'System', 'System', 'suresh.sharma@security.com', 'North Gate', 'Security-B'),
(1, 'Mahesh Gupta', '9876540003', 1, 'Staff', 1, 'Security', 'STA1001003', '654323', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '20 days', NOW(), 'System', 'System', 'mahesh.gupta@security.com', 'East Gate', 'Security-C'),

-- SCENARIO 2: Staff currently checked in (no OutTime) - Can CHECKOUT  
(1, 'Anil Verma', '9876540006', 1, 'Staff', 2, 'Maintenance', 'STA1001006', '654326', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '15 days', NOW(), 'System', 'System', 'anil.verma@maintenance.com', 'Block A', 'Maintenance-A'),
(1, 'Vijay Singh', '9876540007', 1, 'Staff', 2, 'Maintenance', 'STA1001007', '654327', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '18 days', NOW(), 'System', 'System', 'vijay.singh@maintenance.com', 'Block B', 'Maintenance-B'),
(1, 'Mohan Lal', '9876540011', 1, 'Staff', 3, 'Cleaning', 'STA1001011', '654331', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '12 days', NOW(), 'System', 'System', 'mohan.lal@cleaning.com', 'All Blocks', 'Cleaning-A'),

-- SCENARIO 3: Staff with completed previous visits - Can CHECKIN again
(1, 'Deepak Rai', '9876540016', 1, 'Staff', 1, 'Security', 'STA1001016', '654336', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '10 days', NOW(), 'System', 'System', 'deepak.rai@admin.com', 'Admin Block', 'Admin-A'),
(1, 'Rajendra Prasad', '9876540017', 1, 'Staff', 1, 'Security', 'STA1001017', '654337', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '8 days', NOW(), 'System', 'System', 'rajendra.prasad@admin.com', 'Front Desk', 'Admin-B'),
(1, 'Dr. Samir Khan', '9876540018', 1, 'Staff', 2, 'Maintenance', 'STA1001018', '654338', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '7 days', NOW(), 'System', 'System', 'samir.khan@facility.com', 'Admin Block', 'Admin-C'),

-- Additional staff for testing
(1, 'Sunil Rana', '9876540019', 1, 'Staff', 1, 'Security', 'STA1001019', '654339', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '6 days', NOW(), 'System', 'System', 'sunil.rana@hr.com', 'HR Department', 'Admin-D'),
(1, 'Amar Singh', '9876540020', 1, 'Staff', 2, 'Maintenance', 'STA1001020', '654340', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '5 days', NOW(), 'System', 'System', 'amar.singh@accounts.com', 'Accounts Department', 'Admin-E'),
(1, 'Raman Lal', '9876540021', 1, 'Staff', 3, 'Cleaning', 'STA1001021', '654341', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '4 days', NOW(), 'System', 'System', 'raman.lal@kitchen.com', 'Main Canteen', 'Kitchen-A'),
(1, 'Jagdish Yadav', '9876540022', 1, 'Staff', 3, 'Cleaning', 'STA1001022', '654342', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '3 days', NOW(), 'System', 'System', 'jagdish.yadav@kitchen.com', 'Main Canteen', 'Kitchen-B'),
(1, 'Mukesh Agarwal', '9876540023', 1, 'Staff', 1, 'Security', 'STA1001023', '654343', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '2 days', NOW(), 'System', 'System', 'mukesh.agarwal@kitchen.com', 'Main Canteen', 'Kitchen-C'),

-- Additional test staff
(1, 'Ramesh Yadav', '9876540004', 1, 'Staff', 1, 'Security', 'STA1001004', '654324', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'ramesh.yadav@security.com', 'South Gate', 'Security-D'),
(1, 'Dinesh Patel', '9876540005', 1, 'Staff', 1, 'Security', 'STA1001005', '654325', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'dinesh.patel@security.com', 'Main Gate', 'Security-E'),
(1, 'Sanjay Mishra', '9876540008', 1, 'Staff', 2, 'Maintenance', 'STA1001008', '654328', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'sanjay.mishra@maintenance.com', 'Block C', 'Maintenance-C'),
(1, 'Prakash Joshi', '9876540009', 1, 'Staff', 2, 'Maintenance', 'STA1001009', '654329', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'prakash.joshi@maintenance.com', 'Central Plant', 'Maintenance-D'),
(1, 'Ashok Kumar', '9876540010', 1, 'Staff', 2, 'Maintenance', 'STA1001010', '654330', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'ashok.kumar@maintenance.com', 'Workshop', 'Maintenance-E'),
(1, 'Gopal Das', '9876540012', 1, 'Staff', 3, 'Cleaning', 'STA1001012', '654332', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'gopal.das@cleaning.com', 'Block A', 'Cleaning-B'),
(1, 'Ravi Shankar', '9876540013', 1, 'Staff', 3, 'Cleaning', 'STA1001013', '654333', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'ravi.shankar@cleaning.com', 'Block B', 'Cleaning-C'),
(1, 'Kiran Pal', '9876540014', 1, 'Staff', 3, 'Cleaning', 'STA1001014', '654334', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'kiran.pal@cleaning.com', 'Block C', 'Cleaning-D'),
(1, 'Manoj Tiwari', '9876540015', 1, 'Staff', 3, 'Cleaning', 'STA1001015', '654335', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'manoj.tiwari@cleaning.com', 'Common Areas', 'Cleaning-E'),

-- Support Staff  
(1, 'Sanjay Mishra', '9876540030', 1, 'Staff', 2, 'Maintenance', 'STA1001030', '654350', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '60 days', NOW(), 'System', 'System', 'sanjay.driver@support.com', 'Transport Pool', 'Support-A'),
(1, 'Lakshmi Menon', '9876540031', 1, 'Staff', 1, 'Security', 'STA1001031', '654351', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '45 days', NOW(), 'System', 'System', 'lakshmi.nurse@medical.com', 'Medical Center', 'Medical-A'),
(1, 'Arun Krishnan', '9876540032', 1, 'Staff', 3, 'Cleaning', 'STA1001032', '654352', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '30 days', NOW(), 'System', 'System', 'arun.gardener@landscape.com', 'Landscaping', 'Grounds-A');

-- Insert Staff Visit History Records
-- NOTE: For staff, INTime represents CHECK-IN and OutTime represents CHECK-OUT
-- This is opposite to students/buses where INTime is checkout and OutTime is checkin

-- Staff who are currently CHECKED IN (have INTime but no OutTime) - Can CHECKOUT
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VehiclelNo, VisitorCatID, VisitorCatName,
    VisitorSubCatID, VisitorSubCatName, AssociatedFlat, AssociatedBlock,
    INTime, INTimeTxt, OutTime, OutTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    vr.TenantID, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, vr.VehiclelNo, vr.VisitorCatID, vr.VisitorCatName,
    vr.VisitorSubCatID, vr.VisitorSubCatName, vr.AssociatedFlat, vr.AssociatedBlock,
    NOW() - INTERVAL '2 hours', 
    TO_CHAR(NOW() - INTERVAL '2 hours', 'DD/MM/YYYY HH24:MI:SS'),
    NULL, NULL, NOW() - INTERVAL '2 hours', NOW(), 'System', 'System'
FROM VisitorRegistration vr
WHERE vr.VisitorCatID = 1 AND vr.VisitorRegNo IN ('STA1001006', 'STA1001007', 'STA1001011');

-- Staff with completed visits (both INTime and OutTime) - Can CHECKIN again
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VehiclelNo, VisitorCatID, VisitorCatName,
    VisitorSubCatID, VisitorSubCatName, AssociatedFlat, AssociatedBlock,
    INTime, INTimeTxt, OutTime, OutTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    vr.TenantID, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, vr.VehiclelNo, vr.VisitorCatID, vr.VisitorCatName,
    vr.VisitorSubCatID, vr.VisitorSubCatName, vr.AssociatedFlat, vr.AssociatedBlock,
    NOW() - INTERVAL '8 hours', 
    TO_CHAR(NOW() - INTERVAL '8 hours', 'DD/MM/YYYY HH24:MI:SS'),
    NOW() - INTERVAL '30 minutes',
    TO_CHAR(NOW() - INTERVAL '30 minutes', 'DD/MM/YYYY HH24:MI:SS'),
    NOW() - INTERVAL '8 hours', NOW(), 'System', 'System'
FROM VisitorRegistration vr
WHERE vr.VisitorCatID = 1 AND vr.VisitorRegNo IN ('STA1001016', 'STA1001017', 'STA1001018');