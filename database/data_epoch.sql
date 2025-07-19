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
 'Room 101', 'Hostel Block Boys', 'Y', 'SYSTEM', 'SYSTEM');


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