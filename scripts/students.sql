-- Student Management Dummy Data Script
-- This script creates realistic test data for the student management system

-- Clean existing test data (optional - uncomment if needed)
-- DELETE FROM VisitorRegVisitHistory WHERE TenantID = 1 AND VisitorCatID = 3;
-- DELETE FROM BulkVisitorUpload WHERE TenantID = 1 AND Type = 'student';
-- DELETE FROM VisitorRegistration WHERE TenantID = 1 AND VisitorCatID = 3;

-- Insert Student Bulk Upload Data (for course and hostel information)
INSERT INTO BulkVisitorUpload (StudentID, Name, Mobile, Course, Hostel, TenantID, Type) VALUES
-- Computer Science Students
('CS001', 'Rahul Sharma', '9876543210', 'Computer Science', 'Hostel A', 1, 'student'),
('CS002', 'Priya Patel', '9876543211', 'Computer Science', 'Hostel B', 1, 'student'),
('CS003', 'Amit Kumar', '9876543212', 'Computer Science', 'Hostel A', 1, 'student'),
('CS004', 'Sneha Singh', '9876543213', 'Computer Science', 'Hostel C', 1, 'student'),
('CS005', 'Vikash Gupta', '9876543214', 'Computer Science', 'Hostel A', 1, 'student'),

-- Electronics Engineering Students  
('EC001', 'Anita Verma', '9876543215', 'Electronics Engineering', 'Hostel B', 1, 'student'),
('EC002', 'Rajesh Yadav', '9876543216', 'Electronics Engineering', 'Hostel D', 1, 'student'),
('EC003', 'Kavya Nair', '9876543217', 'Electronics Engineering', 'Hostel C', 1, 'student'),
('EC004', 'Suresh Reddy', '9876543218', 'Electronics Engineering', 'Hostel A', 1, 'student'),
('EC005', 'Meera Joshi', '9876543219', 'Electronics Engineering', 'Hostel B', 1, 'student'),

-- Mechanical Engineering Students
('ME001', 'Arjun Das', '9876543220', 'Mechanical Engineering', 'Hostel C', 1, 'student'),
('ME002', 'Pooja Mehta', '9876543221', 'Mechanical Engineering', 'Hostel D', 1, 'student'),
('ME003', 'Rohit Agarwal', '9876543222', 'Mechanical Engineering', 'Hostel A', 1, 'student'),
('ME004', 'Deepika Roy', '9876543223', 'Mechanical Engineering', 'Hostel B', 1, 'student'),
('ME005', 'Karan Malhotra', '9876543224', 'Mechanical Engineering', 'Hostel C', 1, 'student'),

-- MBA Students
('MBA001', 'Aadhya Iyer', '9876543225', 'MBA', 'Hostel D', 1, 'student'),
('MBA002', 'Nikhil Chopra', '9876543226', 'MBA', 'Hostel A', 1, 'student'),
('MBA003', 'Shruti Bansal', '9876543227', 'MBA', 'Hostel B', 1, 'student'),
('MBA004', 'Varun Khanna', '9876543228', 'MBA', 'Hostel C', 1, 'student'),
('MBA005', 'Riya Saxena', '9876543229', 'MBA', 'Hostel D', 1, 'student'),

-- PhD Students
('PHD001', 'Dr. Sanjay Mishra', '9876543230', 'PhD Computer Science', 'Research Hostel', 1, 'student'),
('PHD002', 'Dr. Lakshmi Menon', '9876543231', 'PhD Electronics', 'Research Hostel', 1, 'student'),
('PHD003', 'Dr. Arun Krishnan', '9876543232', 'PhD Mechanical', 'Research Hostel', 1, 'student');

-- Insert Student Registration Records
INSERT INTO VisitorRegistration (
    TenantID, VistorName, Mobile, VisitorCatID, VisitorCatName,
    VisitorSubCatID, VisitorSubCatName, VisitorRegNo, SecurityCode,
    StatusID, StatusName, IsActive, CreatedDate, UpdatedDate, 
    CreatedBy, UpdatedBy, Email, AssociatedFlat, AssociatedBlock
) VALUES

-- SCENARIO 1: First-time students (no visit history) - Can CHECKOUT
(1, 'Rahul Sharma', '9876543210', 3, 'Student', 6, 'Regular Student', 'STU1001001', '123456', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '30 days', NOW(), 'System', 'System', 'rahul.sharma@college.edu', 'Room-101', 'Block-A'),
(1, 'Priya Patel', '9876543211', 3, 'Student', 6, 'Regular Student', 'STU1001002', '123457', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '25 days', NOW(), 'System', 'System', 'priya.patel@college.edu', 'Room-102', 'Block-A'),
(1, 'Amit Kumar', '9876543212', 3, 'Student', 6, 'Regular Student', 'STU1001003', '123458', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '20 days', NOW(), 'System', 'System', 'amit.kumar@college.edu', 'Room-103', 'Block-A'),

-- SCENARIO 2: Students currently checked out (no OutTime) - Can CHECKIN  
(1, 'Sneha Singh', '9876543213', 3, 'Student', 6, 'Regular Student', 'STU1001004', '123459', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '15 days', NOW(), 'System', 'System', 'sneha.singh@college.edu', 'Room-201', 'Block-B'),
(1, 'Vikash Gupta', '9876543214', 3, 'Student', 6, 'Regular Student', 'STU1001005', '123460', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '18 days', NOW(), 'System', 'System', 'vikash.gupta@college.edu', 'Room-202', 'Block-B'),
(1, 'Anita Verma', '9876543215', 3, 'Student', 6, 'Regular Student', 'STU1001006', '123461', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '12 days', NOW(), 'System', 'System', 'anita.verma@college.edu', 'Room-203', 'Block-B'),

-- SCENARIO 3: Students with completed previous visits - Can CHECKOUT again
(1, 'Rajesh Yadav', '9876543216', 3, 'Student', 6, 'Regular Student', 'STU1001007', '123462', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '10 days', NOW(), 'System', 'System', 'rajesh.yadav@college.edu', 'Room-301', 'Block-C'),
(1, 'Kavya Nair', '9876543217', 3, 'Student', 6, 'Regular Student', 'STU1001008', '123463', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '8 days', NOW(), 'System', 'System', 'kavya.nair@college.edu', 'Room-302', 'Block-C'),
(1, 'Suresh Reddy', '9876543218', 3, 'Student', 6, 'Regular Student', 'STU1001009', '123464', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '7 days', NOW(), 'System', 'System', 'suresh.reddy@college.edu', 'Room-303', 'Block-C'),

-- Additional students for pagination testing
(1, 'Meera Joshi', '9876543219', 3, 'Student', 6, 'Regular Student', 'STU1001010', '123465', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '6 days', NOW(), 'System', 'System', 'meera.joshi@college.edu', 'Room-401', 'Block-D'),
(1, 'Arjun Das', '9876543220', 3, 'Student', 6, 'Regular Student', 'STU1001011', '123466', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '5 days', NOW(), 'System', 'System', 'arjun.das@college.edu', 'Room-402', 'Block-D'),
(1, 'Pooja Mehta', '9876543221', 3, 'Student', 6, 'Regular Student', 'STU1001012', '123467', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '4 days', NOW(), 'System', 'System', 'pooja.mehta@college.edu', 'Room-403', 'Block-D'),
(1, 'Rohit Agarwal', '9876543222', 3, 'Student', 6, 'Regular Student', 'STU1001013', '123468', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '3 days', NOW(), 'System', 'System', 'rohit.agarwal@college.edu', 'Room-501', 'Block-E'),
(1, 'Deepika Roy', '9876543223', 3, 'Student', 6, 'Regular Student', 'STU1001014', '123469', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '2 days', NOW(), 'System', 'System', 'deepika.roy@college.edu', 'Room-502', 'Block-E'),
(1, 'Karan Malhotra', '9876543224', 3, 'Student', 6, 'Regular Student', 'STU1001015', '123470', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '1 day', NOW(), 'System', 'System', 'karan.malhotra@college.edu', 'Room-503', 'Block-E'),
(1, 'Aadhya Iyer', '9876543225', 3, 'Student', 6, 'Regular Student', 'STU1001016', '123471', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'aadhya.iyer@college.edu', 'Room-601', 'Block-F'),
(1, 'Nikhil Chopra', '9876543226', 3, 'Student', 6, 'Regular Student', 'STU1001017', '123472', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'nikhil.chopra@college.edu', 'Room-602', 'Block-F'),
(1, 'Shruti Bansal', '9876543227', 3, 'Student', 6, 'Regular Student', 'STU1001018', '123473', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'shruti.bansal@college.edu', 'Room-603', 'Block-F'),
(1, 'Varun Khanna', '9876543228', 3, 'Student', 6, 'Regular Student', 'STU1001019', '123474', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'varun.khanna@college.edu', 'Room-701', 'Block-G'),
(1, 'Riya Saxena', '9876543229', 3, 'Student', 6, 'Regular Student', 'STU1001020', '123475', 1, 'ACTIVE', 'Y', NOW(), NOW(), 'System', 'System', 'riya.saxena@college.edu', 'Room-702', 'Block-G'),

-- PhD Students  
(1, 'Dr. Sanjay Mishra', '9876543230', 3, 'Student', 7, 'New Admission', 'STU1001021', '123476', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '60 days', NOW(), 'System', 'System', 'sanjay.mishra@college.edu', 'Research-101', 'Research-Block'),
(1, 'Dr. Lakshmi Menon', '9876543231', 3, 'Student', 7, 'New Admission', 'STU1001022', '123477', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '45 days', NOW(), 'System', 'System', 'lakshmi.menon@college.edu', 'Research-102', 'Research-Block'),
(1, 'Dr. Arun Krishnan', '9876543232', 3, 'Student', 7, 'New Admission', 'STU1001023', '123478', 1, 'ACTIVE', 'Y', NOW() - INTERVAL '30 days', NOW(), 'System', 'System', 'arun.krishnan@college.edu', 'Research-103', 'Research-Block');

-- Insert Visit History Data

-- SCENARIO 2: Students currently checked out (Have INTime but no OutTime)
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) VALUES
-- Sneha Singh - checked out 2 hours ago
((SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543213'), 'Y', 'Y', 
 (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543213'), 'STU1001004', '123459',
 'Sneha Singh', '9876543213', 3, 'Student', 6, 'Regular Student',
 'Room-201', 'Block-B', NOW() - INTERVAL '2 hours', TO_CHAR(NOW() - INTERVAL '2 hours', 'HH12:MI AM'), 
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', 'Security', 'Security'),

-- Vikash Gupta - checked out 4 hours ago  
((SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543214'), 'Y', 'Y',
 (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543214'), 'STU1001005', '123460',
 'Vikash Gupta', '9876543214', 3, 'Student', 6, 'Regular Student', 
 'Room-202', 'Block-B', NOW() - INTERVAL '4 hours', TO_CHAR(NOW() - INTERVAL '4 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', 'Security', 'Security'),

-- Anita Verma - checked out 1 hour ago
((SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543215'), 'Y', 'Y',
 (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543215'), 'STU1001006', '123461',
 'Anita Verma', '9876543215', 3, 'Student', 6, 'Regular Student',
 'Room-203', 'Block-B', NOW() - INTERVAL '1 hour', TO_CHAR(NOW() - INTERVAL '1 hour', 'HH12:MI AM'),
 NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', 'Security', 'Security');

-- SCENARIO 3: Students with completed visits (Have both INTime and OutTime) 
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) VALUES
-- Rajesh Yadav - completed visit yesterday
((SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543216'), 'Y', 'Y',
 (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543216'), 'STU1001007', '123462',
 'Rajesh Yadav', '9876543216', 3, 'Student', 6, 'Regular Student',
 'Room-301', 'Block-C', NOW() - INTERVAL '1 day 6 hours', TO_CHAR(NOW() - INTERVAL '1 day 6 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '1 day 2 hours', TO_CHAR(NOW() - INTERVAL '1 day 2 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '1 day 6 hours', NOW() - INTERVAL '1 day 2 hours', 'Security', 'Security'),

-- Kavya Nair - completed visit 2 days ago
((SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543217'), 'Y', 'Y',
 (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543217'), 'STU1001008', '123463',
 'Kavya Nair', '9876543217', 3, 'Student', 6, 'Regular Student',
 'Room-302', 'Block-C', NOW() - INTERVAL '2 days 8 hours', TO_CHAR(NOW() - INTERVAL '2 days 8 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '2 days 3 hours', TO_CHAR(NOW() - INTERVAL '2 days 3 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '2 days 3 hours', 'Security', 'Security'),

-- Suresh Reddy - completed visit 3 days ago
((SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543218'), 'Y', 'Y',
 (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543218'), 'STU1001009', '123464',
 'Suresh Reddy', '9876543218', 3, 'Student', 6, 'Regular Student',
 'Room-303', 'Block-C', NOW() - INTERVAL '3 days 5 hours', TO_CHAR(NOW() - INTERVAL '3 days 5 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '3 days 1 hour', TO_CHAR(NOW() - INTERVAL '3 days 1 hour', 'HH12:MI AM'),
 NOW() - INTERVAL '3 days 5 hours', NOW() - INTERVAL '3 days 1 hour', 'Security', 'Security');

-- Multiple visit history for some students to test comprehensive history
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) VALUES
-- Rajesh Yadav - older completed visit
((SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543216'), 'Y', 'Y',
 (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543216'), 'STU1001007', '123462',
 'Rajesh Yadav', '9876543216', 3, 'Student', 6, 'Regular Student',
 'Room-301', 'Block-C', NOW() - INTERVAL '5 days 8 hours', TO_CHAR(NOW() - INTERVAL '5 days 8 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '5 days 4 hours', TO_CHAR(NOW() - INTERVAL '5 days 4 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '5 days 8 hours', NOW() - INTERVAL '5 days 4 hours', 'Security', 'Security'),

-- Kavya Nair - older completed visit
((SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543217'), 'Y', 'Y',
 (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543217'), 'STU1001008', '123463',
 'Kavya Nair', '9876543217', 3, 'Student', 6, 'Regular Student',
 'Room-302', 'Block-C', NOW() - INTERVAL '7 days 6 hours', TO_CHAR(NOW() - INTERVAL '7 days 6 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '7 days 2 hours', TO_CHAR(NOW() - INTERVAL '7 days 2 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '7 days 6 hours', NOW() - INTERVAL '7 days 2 hours', 'Security', 'Security'),

-- Meera Joshi - has completed and current visit
((SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543219'), 'Y', 'Y',
 (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543219'), 'STU1001010', '123465',
 'Meera Joshi', '9876543219', 3, 'Student', 6, 'Regular Student',
 'Room-401', 'Block-D', NOW() - INTERVAL '4 days 7 hours', TO_CHAR(NOW() - INTERVAL '4 days 7 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '4 days 3 hours', TO_CHAR(NOW() - INTERVAL '4 days 3 hours', 'HH12:MI AM'),
 NOW() - INTERVAL '4 days 7 hours', NOW() - INTERVAL '4 days 3 hours', 'Security', 'Security');

-- Current visit for Meera Joshi (checked out, pending check-in)
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) VALUES
((SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543219'), 'Y', 'Y',
 (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543219'), 'STU1001010', '123465',
 'Meera Joshi', '9876543219', 3, 'Student', 6, 'Regular Student',
 'Room-401', 'Block-D', NOW() - INTERVAL '30 minutes', TO_CHAR(NOW() - INTERVAL '30 minutes', 'HH12:MI AM'),
 NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', 'Security', 'Security');

-- Update the TenantID to use the actual value instead of subquery for performance
UPDATE VisitorRegVisitHistory 
SET TenantID = 1 
WHERE TenantID = (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543213' LIMIT 1) 
   OR TenantID = (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543214' LIMIT 1)
   OR TenantID = (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543215' LIMIT 1)
   OR TenantID = (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543216' LIMIT 1)
   OR TenantID = (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543217' LIMIT 1)
   OR TenantID = (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543218' LIMIT 1)
   OR TenantID = (SELECT VisitorRegID FROM VisitorRegistration WHERE Mobile = '9876543219' LIMIT 1);


-- Corrected Visit History Insert Script
-- Run this AFTER the main student dummy data script

-- First, let's get the VisitorRegIDs for our test students
-- You can run this to see the IDs first:
-- SELECT VisitorRegID, VistorName, Mobile FROM VisitorRegistration 
-- WHERE TenantID = 1 AND VisitorCatID = 3 ORDER BY VisitorRegID;

-- Delete any existing visit history for clean testing
DELETE FROM VisitorRegVisitHistory WHERE TenantID = 1 AND VisitorCatID = 3;

-- SCENARIO 2: Students currently checked out (Have INTime but no OutTime)
-- Assuming VisitorRegIDs start from 1 and increment - adjust these IDs based on your actual data

-- Insert for students who should be "checked out" (can check in)
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 3, 'Student', 6, 'Regular Student',
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '2 hours', 
    TO_CHAR(NOW() - INTERVAL '2 hours', 'HH12:MI AM'), 
    NOW() - INTERVAL '2 hours', 
    NOW() - INTERVAL '2 hours', 
    'Security', 'Security'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 3 AND vr.VistorName = 'Sneha Singh';

INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 3, 'Student', 6, 'Regular Student',
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '4 hours', 
    TO_CHAR(NOW() - INTERVAL '4 hours', 'HH12:MI AM'), 
    NOW() - INTERVAL '4 hours', 
    NOW() - INTERVAL '4 hours', 
    'Security', 'Security'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 3 AND vr.VistorName = 'Vikash Gupta';

INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 3, 'Student', 6, 'Regular Student',
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '1 hour', 
    TO_CHAR(NOW() - INTERVAL '1 hour', 'HH12:MI AM'), 
    NOW() - INTERVAL '1 hour', 
    NOW() - INTERVAL '1 hour', 
    'Security', 'Security'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 3 AND vr.VistorName = 'Anita Verma';

INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 3, 'Student', 6, 'Regular Student',
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '30 minutes', 
    TO_CHAR(NOW() - INTERVAL '30 minutes', 'HH12:MI AM'), 
    NOW() - INTERVAL '30 minutes', 
    NOW() - INTERVAL '30 minutes', 
    'Security', 'Security'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 3 AND vr.VistorName = 'Meera Joshi';

-- SCENARIO 3: Students with completed visits (Have both INTime and OutTime)
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 3, 'Student', 6, 'Regular Student',
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '1 day 6 hours', 
    TO_CHAR(NOW() - INTERVAL '1 day 6 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '1 day 2 hours', 
    TO_CHAR(NOW() - INTERVAL '1 day 2 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '1 day 6 hours', 
    NOW() - INTERVAL '1 day 2 hours', 
    'Security', 'Security'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 3 AND vr.VistorName = 'Rajesh Yadav';

INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 3, 'Student', 6, 'Regular Student',
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '2 days 8 hours', 
    TO_CHAR(NOW() - INTERVAL '2 days 8 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '2 days 3 hours', 
    TO_CHAR(NOW() - INTERVAL '2 days 3 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '2 days 8 hours', 
    NOW() - INTERVAL '2 days 3 hours', 
    'Security', 'Security'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 3 AND vr.VistorName = 'Kavya Nair';

INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 3, 'Student', 6, 'Regular Student',
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '3 days 5 hours', 
    TO_CHAR(NOW() - INTERVAL '3 days 5 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '3 days 1 hour', 
    TO_CHAR(NOW() - INTERVAL '3 days 1 hour', 'HH12:MI AM'),
    NOW() - INTERVAL '3 days 5 hours', 
    NOW() - INTERVAL '3 days 1 hour', 
    'Security', 'Security'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 3 AND vr.VistorName = 'Suresh Reddy';

-- Add some older completed visits for history testing
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 3, 'Student', 6, 'Regular Student',
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '5 days 8 hours', 
    TO_CHAR(NOW() - INTERVAL '5 days 8 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '5 days 4 hours', 
    TO_CHAR(NOW() - INTERVAL '5 days 4 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '5 days 8 hours', 
    NOW() - INTERVAL '5 days 4 hours', 
    'Security', 'Security'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 3 AND vr.VistorName = 'Rajesh Yadav';

INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 3, 'Student', 6, 'Regular Student',
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '7 days 6 hours', 
    TO_CHAR(NOW() - INTERVAL '7 days 6 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '7 days 2 hours', 
    TO_CHAR(NOW() - INTERVAL '7 days 2 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '7 days 6 hours', 
    NOW() - INTERVAL '7 days 2 hours', 
    'Security', 'Security'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 3 AND vr.VistorName = 'Kavya Nair';

-- Add a completed visit for Meera Joshi (who also has a current checkout)
INSERT INTO VisitorRegVisitHistory (
    TenantID, IsActive, IsRegFlag, VisitorRegID, VisitorRegNo, SecurityCode,
    VistorName, Mobile, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock, INTime, INTimeTxt, OutTime, OutTimeTxt,
    CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
) 
SELECT 
    1, 'Y', 'Y', vr.VisitorRegID, vr.VisitorRegNo, vr.SecurityCode,
    vr.VistorName, vr.Mobile, 3, 'Student', 6, 'Regular Student',
    vr.AssociatedFlat, vr.AssociatedBlock, 
    NOW() - INTERVAL '4 days 7 hours', 
    TO_CHAR(NOW() - INTERVAL '4 days 7 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '4 days 3 hours', 
    TO_CHAR(NOW() - INTERVAL '4 days 3 hours', 'HH12:MI AM'),
    NOW() - INTERVAL '4 days 7 hours', 
    NOW() - INTERVAL '4 days 3 hours', 
    'Security', 'Security'
FROM VisitorRegistration vr
WHERE vr.TenantID = 1 AND vr.VisitorCatID = 3 AND vr.VistorName = 'Meera Joshi';