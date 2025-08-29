-- Migration script to transition from MealSettings to MealSettings
-- This script safely migrates existing data and provides rollback options

-- Step 1: Create the enhanced table (if not exists)
CREATE TABLE IF NOT EXISTS MealSettings (
    MealSettingID SERIAL PRIMARY KEY,
    TenantID INTEGER NOT NULL,
    
    -- Lunch Enable/Disable for each day
    LunchEnabledMonday BOOLEAN DEFAULT true,
    LunchEnabledTuesday BOOLEAN DEFAULT true,
    LunchEnabledWednesday BOOLEAN DEFAULT true,
    LunchEnabledThursday BOOLEAN DEFAULT true,
    LunchEnabledFriday BOOLEAN DEFAULT true,
    LunchEnabledSaturday BOOLEAN DEFAULT true,
    LunchEnabledSunday BOOLEAN DEFAULT true,
    
    -- Dinner Enable/Disable for each day
    DinnerEnabledMonday BOOLEAN DEFAULT true,
    DinnerEnabledTuesday BOOLEAN DEFAULT true,
    DinnerEnabledWednesday BOOLEAN DEFAULT true,
    DinnerEnabledThursday BOOLEAN DEFAULT true,
    DinnerEnabledFriday BOOLEAN DEFAULT true,
    DinnerEnabledSaturday BOOLEAN DEFAULT true,
    DinnerEnabledSunday BOOLEAN DEFAULT true,
    
    -- Lunch Booking Times for each day
    LunchBookingStartMonday TIME DEFAULT '10:00:00',
    LunchBookingEndMonday TIME DEFAULT '12:00:00',
    LunchBookingStartTuesday TIME DEFAULT '10:00:00',
    LunchBookingEndTuesday TIME DEFAULT '12:00:00',
    LunchBookingStartWednesday TIME DEFAULT '10:00:00',
    LunchBookingEndWednesday TIME DEFAULT '12:00:00',
    LunchBookingStartThursday TIME DEFAULT '10:00:00',
    LunchBookingEndThursday TIME DEFAULT '12:00:00',
    LunchBookingStartFriday TIME DEFAULT '10:00:00',
    LunchBookingEndFriday TIME DEFAULT '12:00:00',
    LunchBookingStartSaturday TIME DEFAULT '10:00:00',
    LunchBookingEndSaturday TIME DEFAULT '12:00:00',
    LunchBookingStartSunday TIME DEFAULT '10:00:00',
    LunchBookingEndSunday TIME DEFAULT '12:00:00',
    
    -- Lunch Meal Times for each day
    LunchStartMonday TIME DEFAULT '13:00:00',
    LunchEndMonday TIME DEFAULT '15:00:00',
    LunchStartTuesday TIME DEFAULT '13:00:00',
    LunchEndTuesday TIME DEFAULT '15:00:00',
    LunchStartWednesday TIME DEFAULT '13:00:00',
    LunchEndWednesday TIME DEFAULT '15:00:00',
    LunchStartThursday TIME DEFAULT '13:00:00',
    LunchEndThursday TIME DEFAULT '15:00:00',
    LunchStartFriday TIME DEFAULT '13:00:00',
    LunchEndFriday TIME DEFAULT '15:00:00',
    LunchStartSaturday TIME DEFAULT '13:00:00',
    LunchEndSaturday TIME DEFAULT '15:00:00',
    LunchStartSunday TIME DEFAULT '13:00:00',
    LunchEndSunday TIME DEFAULT '15:00:00',
    
    -- Dinner Booking Times for each day
    DinnerBookingStartMonday TIME DEFAULT '16:00:00',
    DinnerBookingEndMonday TIME DEFAULT '18:00:00',
    DinnerBookingStartTuesday TIME DEFAULT '16:00:00',
    DinnerBookingEndTuesday TIME DEFAULT '18:00:00',
    DinnerBookingStartWednesday TIME DEFAULT '16:00:00',
    DinnerBookingEndWednesday TIME DEFAULT '18:00:00',
    DinnerBookingStartThursday TIME DEFAULT '16:00:00',
    DinnerBookingEndThursday TIME DEFAULT '18:00:00',
    DinnerBookingStartFriday TIME DEFAULT '16:00:00',
    DinnerBookingEndFriday TIME DEFAULT '18:00:00',
    DinnerBookingStartSaturday TIME DEFAULT '16:00:00',
    DinnerBookingEndSaturday TIME DEFAULT '18:00:00',
    DinnerBookingStartSunday TIME DEFAULT '16:00:00',
    DinnerBookingEndSunday TIME DEFAULT '18:00:00',
    
    -- Dinner Meal Times for each day
    DinnerStartMonday TIME DEFAULT '19:00:00',
    DinnerEndMonday TIME DEFAULT '21:00:00',
    DinnerStartTuesday TIME DEFAULT '19:00:00',
    DinnerEndTuesday TIME DEFAULT '21:00:00',
    DinnerStartWednesday TIME DEFAULT '19:00:00',
    DinnerEndWednesday TIME DEFAULT '21:00:00',
    DinnerStartThursday TIME DEFAULT '19:00:00',
    DinnerEndThursday TIME DEFAULT '21:00:00',
    DinnerStartFriday TIME DEFAULT '19:00:00',
    DinnerEndFriday TIME DEFAULT '21:00:00',
    DinnerStartSaturday TIME DEFAULT '19:00:00',
    DinnerEndSaturday TIME DEFAULT '21:00:00',
    DinnerStartSunday TIME DEFAULT '19:00:00',
    DinnerEndSunday TIME DEFAULT '21:00:00',
    
    -- Audit fields
    IsActive VARCHAR(1) DEFAULT 'Y' CHECK (IsActive IN ('Y', 'N')),
    CreatedDate TIMESTAMP DEFAULT NOW(),
    UpdatedDate TIMESTAMP DEFAULT NOW(),
    CreatedBy VARCHAR(100),
    UpdatedBy VARCHAR(100),
    
    -- Constraints
    CONSTRAINT fk_meal_settings_enhanced_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID),
    CONSTRAINT unique_meal_settings_enhanced_tenant UNIQUE (TenantID, IsActive)
);

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_meal_settings_enhanced_tenant ON MealSettings(TenantID, IsActive);

-- Step 3: Migrate existing data from MealSettings to MealSettings
INSERT INTO MealSettings (
    TenantID,
    -- Copy existing times to all days (Lunch Booking Times)
    LunchBookingStartMonday, LunchBookingEndMonday,
    LunchBookingStartTuesday, LunchBookingEndTuesday,
    LunchBookingStartWednesday, LunchBookingEndWednesday,
    LunchBookingStartThursday, LunchBookingEndThursday,
    LunchBookingStartFriday, LunchBookingEndFriday,
    LunchBookingStartSaturday, LunchBookingEndSaturday,
    LunchBookingStartSunday, LunchBookingEndSunday,
    
    -- Copy existing times to all days (Lunch Meal Times)
    LunchStartMonday, LunchEndMonday,
    LunchStartTuesday, LunchEndTuesday,
    LunchStartWednesday, LunchEndWednesday,
    LunchStartThursday, LunchEndThursday,
    LunchStartFriday, LunchEndFriday,
    LunchStartSaturday, LunchEndSaturday,
    LunchStartSunday, LunchEndSunday,
    
    -- Copy existing times to all days (Dinner Booking Times)
    DinnerBookingStartMonday, DinnerBookingEndMonday,
    DinnerBookingStartTuesday, DinnerBookingEndTuesday,
    DinnerBookingStartWednesday, DinnerBookingEndWednesday,
    DinnerBookingStartThursday, DinnerBookingEndThursday,
    DinnerBookingStartFriday, DinnerBookingEndFriday,
    DinnerBookingStartSaturday, DinnerBookingEndSaturday,
    DinnerBookingStartSunday, DinnerBookingEndSunday,
    
    -- Copy existing times to all days (Dinner Meal Times)
    DinnerStartMonday, DinnerEndMonday,
    DinnerStartTuesday, DinnerEndTuesday,
    DinnerStartWednesday, DinnerEndWednesday,
    DinnerStartThursday, DinnerEndThursday,
    DinnerStartFriday, DinnerEndFriday,
    DinnerStartSaturday, DinnerEndSaturday,
    DinnerStartSunday, DinnerEndSunday,
    
    -- Audit fields
    CreatedBy, UpdatedBy, CreatedDate, UpdatedDate, IsActive
)
SELECT 
    TenantID,
    -- Replicate lunch booking times for all days
    LunchBookingStartTime, LunchBookingEndTime,
    LunchBookingStartTime, LunchBookingEndTime,
    LunchBookingStartTime, LunchBookingEndTime,
    LunchBookingStartTime, LunchBookingEndTime,
    LunchBookingStartTime, LunchBookingEndTime,
    LunchBookingStartTime, LunchBookingEndTime,
    LunchBookingStartTime, LunchBookingEndTime,
    
    -- Replicate lunch meal times for all days
    LunchStartTime, LunchEndTime,
    LunchStartTime, LunchEndTime,
    LunchStartTime, LunchEndTime,
    LunchStartTime, LunchEndTime,
    LunchStartTime, LunchEndTime,
    LunchStartTime, LunchEndTime,
    LunchStartTime, LunchEndTime,
    
    -- Replicate dinner booking times for all days
    DinnerBookingStartTime, DinnerBookingEndTime,
    DinnerBookingStartTime, DinnerBookingEndTime,
    DinnerBookingStartTime, DinnerBookingEndTime,
    DinnerBookingStartTime, DinnerBookingEndTime,
    DinnerBookingStartTime, DinnerBookingEndTime,
    DinnerBookingStartTime, DinnerBookingEndTime,
    DinnerBookingStartTime, DinnerBookingEndTime,
    
    -- Replicate dinner meal times for all days
    DinnerStartTime, DinnerEndTime,
    DinnerStartTime, DinnerEndTime,
    DinnerStartTime, DinnerEndTime,
    DinnerStartTime, DinnerEndTime,
    DinnerStartTime, DinnerEndTime,
    DinnerStartTime, DinnerEndTime,
    DinnerStartTime, DinnerEndTime,
    
    -- Audit fields
    COALESCE(CreatedBy, 'MIGRATION'), 
    COALESCE(UpdatedBy, 'MIGRATION'), 
    COALESCE(CreatedDate, NOW()), 
    COALESCE(UpdatedDate, NOW()),
    IsActive
FROM MealSettings 
WHERE IsActive = 'Y'
AND TenantID NOT IN (
    SELECT TenantID 
    FROM MealSettings 
    WHERE IsActive = 'Y'
);

-- Step 4: Verification queries
-- Check migration success
SELECT 
    'Original MealSettings' as source,
    COUNT(*) as record_count
FROM MealSettings 
WHERE IsActive = 'Y'

UNION ALL

SELECT 
    'Enhanced MealSettings' as source,
    COUNT(*) as record_count
FROM MealSettings 
WHERE IsActive = 'Y';

-- Step 5: Sample verification for a specific tenant
-- Replace TenantID = 1 with actual tenant ID for testing
SELECT 
    'Original' as type,
    TenantID,
    LunchBookingStartTime,
    LunchBookingEndTime,
    DinnerBookingStartTime,
    DinnerBookingEndTime
FROM MealSettings 
WHERE TenantID = 1 AND IsActive = 'Y'

UNION ALL

SELECT 
    'Enhanced Monday' as type,
    TenantID,
    LunchBookingStartMonday,
    LunchBookingEndMonday,
    DinnerBookingStartMonday,
    DinnerBookingEndMonday
FROM MealSettings 
WHERE TenantID = 1 AND IsActive = 'Y';

-- Step 6: Comments for the enhanced table
COMMENT ON TABLE MealSettings IS 'Enhanced tenant-specific meal timing configurations with day-wise settings and enable/disable options';
COMMENT ON COLUMN MealSettings.LunchEnabledMonday IS 'Enable/disable lunch for Monday';
COMMENT ON COLUMN MealSettings.DinnerEnabledMonday IS 'Enable/disable dinner for Monday';
COMMENT ON COLUMN MealSettings.LunchBookingStartMonday IS 'Lunch booking start time for Monday';
COMMENT ON COLUMN MealSettings.LunchStartMonday IS 'Lunch serving start time for Monday';

-- Step 7: Create a backup table (optional, for rollback)
CREATE TABLE MealSettings_Backup AS 
SELECT * FROM MealSettings WHERE IsActive = 'Y';

COMMENT ON TABLE MealSettings_Backup IS 'Backup of original MealSettings before migration to enhanced version';

-- Step 8: Post-migration cleanup (run after confirming migration success)
-- CAUTION: Only run this after thorough testing of the enhanced system
-- UPDATE MealSettings SET IsActive = 'N', UpdatedBy = 'MIGRATION_CLEANUP', UpdatedDate = NOW() WHERE IsActive = 'Y';

-- Step 9: Rollback script (if needed)
/*
-- ROLLBACK INSTRUCTIONS (use only if migration needs to be reversed):

-- 1. Restore original MealSettings
UPDATE MealSettings 
SET IsActive = 'Y', UpdatedBy = 'ROLLBACK', UpdatedDate = NOW() 
WHERE TenantID IN (SELECT TenantID FROM MealSettings_Backup);

-- 2. Deactivate enhanced settings
UPDATE MealSettings 
SET IsActive = 'N', UpdatedBy = 'ROLLBACK', UpdatedDate = NOW() 
WHERE IsActive = 'Y';

-- 3. Verify rollback
SELECT 'After Rollback - Original' as status, COUNT(*) as count 
FROM MealSettings WHERE IsActive = 'Y'
UNION ALL
SELECT 'After Rollback - Enhanced' as status, COUNT(*) as count 
FROM MealSettings WHERE IsActive = 'Y';
*/

-- Migration completed successfully
SELECT 'Migration to Enhanced Meal Settings completed successfully!' as status;