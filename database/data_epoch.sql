-- ================================================================================
-- RELY GATE VISITOR MANAGEMENT SYSTEM - EPOCH TIME DATA INSERTION
-- ================================================================================
-- Updated data.sql file with epoch time support for visitor module
-- This file replaces the original data.sql visitor section with epoch timestamps
-- 
-- IMPORTANT: This is a partial update focusing on visitor time fields
-- Use this to update existing data.sql or as a reference for epoch conversion
-- ================================================================================

-- ================================================================================
-- SECTION: VISITOR MASTER DATA (EPOCH TIME VERSION)
-- ================================================================================

-- Delete existing visitor data (if needed)
-- DELETE FROM VisitorRegVisitHistory WHERE TenantID IN (1001, 1002, 1003, 1004, 1005);
-- DELETE FROM VisitorMaster WHERE TenantID IN (1001, 1002, 1003, 1004, 1005);

-- Insert Current Visitor Activities (with epoch timestamps)
INSERT INTO VisitorMaster (
    TenantID, Fname, Mname, Lname, Mobile, Salutation,
    VisitPurposeID, VisitPurpose, VisitDate, TotalVisitor,
    INTimeTxt, OutTimeTxt,
    MeetingWithID, MeetingWith, FlatID, FlatName,
    PhotoFlag, PhotoPath, PhotoName, VehiclePhotoFlag, VehiclePhotoPath, VehiclePhotoName,
    OTPVerified, OTPVerifiedDate, VisitorCatID, VisitorSubCatID,
    StatusID, StatusName, IsActive, CreatedBy, UpdatedBy
) VALUES 
-- Active visitor at Greenwood School (Currently checked in)
(1001, 'Ankit', 'Kumar', 'Mishra', '9876543250', 'Mr.', 
 1, 'Meeting', CURRENT_TIMESTAMP, 1, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '2 hours')::TEXT, NULL, 
 3, 'Principal Office', 1, 'Administrative Block', 
 'Y', '/uploads/visits/1001/ankit.jpg', 'ankit.jpg', 'N', NULL, NULL, 
 'Y', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '2 hours')::TEXT, 1, 1, 
 5, 'CHECKEDIN', 'Y', 'SYSTEM', 'SYSTEM'),

-- Completed visitor at Sunrise Residency (Checked out)
(1002, 'Delivery', '', 'Agent', '9876543251', 'Mr.', 
 18, 'Delivery', CURRENT_TIMESTAMP - INTERVAL '3 hours', 1, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '3 hours')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '1 hour')::TEXT, 
 7, 'Resident - Anjali Gupta', 4, 'Flat A-101', 
 'Y', '/uploads/visits/1002/delivery.jpg', 'delivery.jpg', 'Y', '/uploads/visits/1002/delivery_vehicle.jpg', 'delivery_vehicle.jpg', 
 'Y', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '3 hours')::TEXT, 7, 22, 
 13, 'CHECKEDOUT', 'Y', 'SYSTEM', 'SYSTEM'),

-- Active business visitor at TechCorp (Currently checked in)
(1003, 'Client', '', 'Representative', '9876543255', 'Ms.', 
 25, 'Business Meeting', CURRENT_TIMESTAMP - INTERVAL '1 hour', 2, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '1 hour')::TEXT, NULL, 
 11, 'Kavya Nair', 7, 'Office 201', 
 'Y', '/uploads/visits/1003/client.jpg', 'client.jpg', 'N', NULL, NULL, 
 'Y', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '1 hour')::TEXT, 13, 25, 
 19, 'CHECKEDIN', 'Y', 'SYSTEM', 'SYSTEM'),

-- Patient visitor at Hospital (Currently checked in)
(1004, 'Patient', '', 'Relative', '9876543256', 'Mr.', 
 30, 'Patient Visit', CURRENT_TIMESTAMP - INTERVAL '30 minutes', 1, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '30 minutes')::TEXT, NULL, 
 15, 'Dr. Arjun Patel', 12, 'Consultation Room 3', 
 'Y', '/uploads/visits/1004/relative.jpg', 'relative.jpg', 'N', NULL, NULL, 
 'Y', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '30 minutes')::TEXT, 19, 31, 
 26, 'CHECKEDIN', 'Y', 'SYSTEM', 'SYSTEM'),

-- Shopping customer (Completed visit)
(1005, 'Mall', '', 'Customer', '9876543257', 'Mrs.', 
 37, 'Shopping', CURRENT_TIMESTAMP - INTERVAL '4 hours', 3, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '4 hours')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '2 hours')::TEXT, 
 19, 'Store Manager', 13, 'Store E-101', 
 'Y', '/uploads/visits/1005/customer.jpg', 'customer.jpg', 'Y', '/uploads/visits/1005/customer_car.jpg', 'customer_car.jpg', 
 'Y', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '4 hours')::TEXT, 25, 43, 
 34, 'CHECKEDOUT', 'Y', 'SYSTEM', 'SYSTEM'),

-- Emergency gate pass at Greenwood (Active)
(1001, 'Emergency', '', 'Exit', '9876543258', 'Mr.', 
 14, 'Emergency Exit', CURRENT_TIMESTAMP - INTERVAL '15 minutes', 1, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '15 minutes')::TEXT, NULL, 
 2, 'Security Guard', 1, 'Main Gate', 
 'Y', '/uploads/visits/1001/emergency.jpg', 'emergency.jpg', 'N', NULL, NULL, 
 'Y', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '15 minutes')::TEXT, 6, 18, 
 5, 'CHECKEDIN', 'Y', 'SYSTEM', 'SYSTEM'),

-- Additional epoch time test data for comprehensive testing
(1001, 'Test', 'Epoch', 'User1', '9876543301', 'Mr.', 
 1, 'Testing', CURRENT_TIMESTAMP - INTERVAL '5 hours', 1, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '5 hours')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '4 hours')::TEXT, 
 3, 'Testing Department', 1, 'Test Room', 
 'Y', '/uploads/visits/1001/test1.jpg', 'test1.jpg', 'N', NULL, NULL, 
 'Y', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '5 hours')::TEXT, 1, 1, 
 6, 'CHECKEDOUT', 'Y', 'SYSTEM', 'SYSTEM'),

(1002, 'Test', 'Epoch', 'User2', '9876543302', 'Ms.', 
 18, 'Testing', CURRENT_TIMESTAMP - INTERVAL '6 hours', 1, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '6 hours')::TEXT, NULL, 
 7, 'Testing Resident', 4, 'Test Flat', 
 'Y', '/uploads/visits/1002/test2.jpg', 'test2.jpg', 'N', NULL, NULL, 
 'Y', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '6 hours')::TEXT, 7, 22, 
 12, 'CHECKEDIN', 'Y', 'SYSTEM', 'SYSTEM');

-- ================================================================================
-- SECTION: VISITOR VISIT HISTORY (EPOCH TIME VERSION)
-- ================================================================================

-- Insert Comprehensive Visit History (with epoch timestamps)
INSERT INTO VisitorRegVisitHistory (
    TenantID, VisitorRegID, VisitorRegNo, VistorName, Mobile, SecurityCode,
    INTimeTxt, OutTimeTxt,
    VisitPurposeID, VisitPurpose, PurposeCatID, PurposeCatName,
    VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    AssociatedFlat, AssociatedBlock,
    IsActive, CreatedBy, UpdatedBy
) VALUES 
-- Student check-ins for today (Greenwood School) - with epoch timestamps
(1001, 1, 'GIS2024001', 'Rahul Sharma', '9876543210', 'STU001', 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '8 hours')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '30 minutes')::TEXT, 
 6, 'Class Attendance', 2, 'Student', 2, 'Student', 5, 'Regular Student', 
 'Room 101', 'Hostel Block Boys', 'Y', 'SYSTEM', 'SYSTEM'),

(1001, 2, 'GIS2024002', 'Priya Patel', '9876543211', 'STU002', 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '8 hours')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '45 minutes')::TEXT, 
 6, 'Class Attendance', 2, 'Student', 2, 'Student', 5, 'Regular Student', 
 'Room 102', 'Hostel Block Girls', 'Y', 'SYSTEM', 'SYSTEM'),

-- Resident visits at Sunrise Residency - with epoch timestamps
(1002, 5, 'SRS2024005', 'Anjali Gupta', '9876543215', 'RES001', 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '2 days')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '3 hours')::TEXT, 
 19, 'Home Visit', 3, 'Resident', 7, 'Resident', 20, 'Flat Owner', 
 'Flat A-101', 'Tower A', 'Y', 'SYSTEM', 'SYSTEM'),

(1002, 6, 'SRS2024006', 'Kavya Nair', '9876543216', 'RES002', 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '1 day')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '2 hours')::TEXT, 
 19, 'Home Visit', 3, 'Resident', 7, 'Resident', 21, 'Tenant', 
 'Flat B-205', 'Tower B', 'Y', 'SYSTEM', 'SYSTEM'),

-- Corporate visits at TechCorp - with epoch timestamps
(1003, 9, 'TCS2024009', 'Arun Kumar', '9876543219', 'EMP001', 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '3 days')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '8 hours')::TEXT, 
 26, 'Work', 4, 'Employee', 1, 'Staff', 2, 'Office Staff', 
 'Office 201', 'Office Block 1', 'Y', 'SYSTEM', 'SYSTEM'),

-- Hospital visits - with epoch timestamps
(1004, 13, 'CGH2024013', 'Dr. Arjun Patel', '9876543223', 'DOC001', 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '4 days')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '12 hours')::TEXT, 
 31, 'Medical Consultation', 5, 'Medical', 20, 'Medical Staff', 32, 'Doctor', 
 'Consultation Room 3', 'Medical Block', 'Y', 'SYSTEM', 'SYSTEM'),

-- Shopping mall visits - with epoch timestamps
(1005, 17, 'MSM2024017', 'Rohit Gupta', '9876543227', 'CUS001', 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '5 days')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '4 hours')::TEXT, 
 37, 'Shopping', 6, 'Customer', 25, 'Customer', 43, 'Regular Customer', 
 'Store E-101', 'Commercial Block', 'Y', 'SYSTEM', 'SYSTEM'),

-- Recent visits (last 24 hours) - with epoch timestamps for testing
(1001, 3, 'GIS2024003', 'Test Recent', '9876543303', 'TEST001', 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '4 hours')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '2 hours')::TEXT, 
 1, 'Testing', 1, 'Visitor', 2, 'Guest', 4, 'Regular Guest', 
 'Test Room', 'Test Block', 'Y', 'SYSTEM', 'SYSTEM'),

-- Current active visit (no checkout) - with epoch timestamps
(1002, 7, 'SRS2024007', 'Active Test', '9876543304', 'ACTIVE001', 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '30 minutes')::TEXT, NULL, 
 18, 'Testing', 1, 'Visitor', 2, 'Guest', 4, 'Regular Guest', 
 'Test Flat', 'Test Block', 'Y', 'SYSTEM', 'SYSTEM'),

-- Older visit for analytics testing - with epoch timestamps
(1003, 11, 'TCS2024011', 'Analytics Test', '9876543305', 'ANAL001', 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '7 days')::TEXT, 
 EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '6 hours')::TEXT, 
 25, 'Analytics Testing', 4, 'Employee', 1, 'Staff', 2, 'Office Staff', 
 'Analytics Room', 'Data Center', 'Y', 'SYSTEM', 'SYSTEM');

-- ================================================================================
-- VERIFICATION QUERIES FOR EPOCH TIME DATA
-- ================================================================================

-- Verify epoch timestamps are correctly inserted
SELECT 
    'VISITOR MASTER EPOCH CHECK' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN INTimeTxt ~ '^[0-9]+$' THEN 1 END) as valid_epoch_in,
    COUNT(CASE WHEN OutTimeTxt ~ '^[0-9]+$' THEN 1 END) as valid_epoch_out,
    COUNT(CASE WHEN OutTimeTxt IS NULL THEN 1 END) as active_visits
FROM VisitorMaster 
WHERE TenantID IN (1001, 1002, 1003, 1004, 1005);

-- Verify visit history epoch timestamps
SELECT 
    'VISIT HISTORY EPOCH CHECK' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN INTimeTxt ~ '^[0-9]+$' THEN 1 END) as valid_epoch_in,
    COUNT(CASE WHEN OutTimeTxt ~ '^[0-9]+$' THEN 1 END) as valid_epoch_out,
    COUNT(CASE WHEN OutTimeTxt IS NULL THEN 1 END) as active_visits
FROM VisitorRegVisitHistory 
WHERE TenantID IN (1001, 1002, 1003, 1004, 1005);

-- Show sample epoch timestamp conversion
SELECT 
    'EPOCH CONVERSION SAMPLE' as info,
    VistorName,
    INTimeTxt as epoch_timestamp,
    TO_TIMESTAMP(INTimeTxt::BIGINT) as human_readable,
    CASE 
        WHEN OutTimeTxt IS NOT NULL 
        THEN (OutTimeTxt::BIGINT - INTimeTxt::BIGINT) / 3600.0 
        ELSE NULL 
    END as duration_hours
FROM VisitorRegVisitHistory 
WHERE TenantID = 1001 
LIMIT 3;

-- ================================================================================
-- USAGE NOTES
-- ================================================================================

/*
EPOCH TIME CONVERSION NOTES:

1. INTimeTxt and OutTimeTxt now contain epoch timestamps as TEXT
2. INTime and OutTime TIMESTAMP columns have been removed - only epoch timestamps are used
3. All calculations should use epoch timestamps for consistency
4. API responses will return epoch timestamps in INTimeTxt/OutTimeTxt fields

TESTING SCENARIOS:
- Filter by epoch date range
- Calculate visit duration using epoch timestamps
- Analytics with epoch-based calculations
- Real-time visitor status using epoch timestamps

DATABASE VERIFICATION:
- Run verification queries above to ensure data integrity
- Check that epoch timestamps are numeric strings
- Verify calculations work correctly with epoch values

API INTEGRATION:
- All visitor endpoints now expect epoch timestamps
- Date filters use epoch values (e.g., fromDate=1704067200)
- Time calculations return epoch-based results
*/

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'EPOCH TIME DATA INSERTION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'Updated Records:';
    RAISE NOTICE '- VisitorMaster: INTimeTxt and OutTimeTxt now contain epoch timestamps';
    RAISE NOTICE '- VisitorRegVisitHistory: INTimeTxt and OutTimeTxt now contain epoch timestamps';
    RAISE NOTICE '- All time calculations updated to use epoch format';
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test visitor endpoints with epoch time filtering';
    RAISE NOTICE '2. Verify analytics calculations work correctly';
    RAISE NOTICE '3. Run test roadmap scenarios';
    RAISE NOTICE '===============================================================================';
END $$;

COMMIT;