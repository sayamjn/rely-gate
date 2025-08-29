-- Add Primary Guardian to AuthMaster table
-- This will allow the primary guardian to use the verify-phone endpoint

-- First, let's see the current student data
SELECT 
    StudentDayBoardingID,
    StudentID,
    StudentName,
    PrimaryGuardianName,
    PrimaryGuardianPhone,
    GuardianRelation
FROM StudentDayBoardingList 
WHERE TenantID = 1001 AND PrimaryGuardianPhone = '8752814033';

-- Insert the primary guardian into AuthMaster table
-- Replace the values below with actual data from your StudentDayBoardingList
INSERT INTO StudentDayBoardingAuthMaster (
    TenantID,
    StudentDayBoardingID,
    Name,
    PhoneNumber,
    PhotoFlag,
    PhotoPath,
    PhotoName,
    Relation,
    IsActive,
    CreatedDate,
    UpdatedDate,
    CreatedBy,
    UpdatedBy
) VALUES (
    1001,                    -- TenantID
    1,                       -- StudentDayBoardingID (from the student record)
    'Jane Doe',              -- Name (PrimaryGuardianName from student record)
    '8752814033',            -- PhoneNumber (PrimaryGuardianPhone)
    'N',                     -- PhotoFlag
    NULL,                    -- PhotoPath
    NULL,                    -- PhotoName
    'Mother',                -- Relation (GuardianRelation from student record)
    'Y',                     -- IsActive
    NOW(),                   -- CreatedDate
    NOW(),                   -- UpdatedDate
    'system',                -- CreatedBy
    'system'                 -- UpdatedBy
);

-- Also create a link between the student and this primary guardian
INSERT INTO StudentDayBoardingAuthMasterLink (
    TenantID,
    StudentDayBoardingID,
    AuthMasterID,
    StudentID,
    PhoneNumber,
    Relation,
    PhotoFlag,
    PhotoPath,
    PhotoName,
    IsActive,
    CreatedDate,
    UpdatedDate,
    CreatedBy,
    UpdatedBy
) VALUES (
    1001,                    -- TenantID
    1,                       -- StudentDayBoardingID
    (SELECT AuthMasterID FROM StudentDayBoardingAuthMaster 
     WHERE TenantID = 1001 AND PhoneNumber = '8752814033' AND IsActive = 'Y'),  -- AuthMasterID
    'stu001',                -- StudentID
    '8752814033',            -- PhoneNumber
    'Mother',                -- Relation
    'N',                     -- PhotoFlag
    NULL,                    -- PhotoPath
    NULL,                    -- PhotoName
    'Y',                     -- IsActive
    NOW(),                   -- CreatedDate
    NOW(),                   -- UpdatedDate
    'system',                -- CreatedBy
    'system'                 -- UpdatedBy
);