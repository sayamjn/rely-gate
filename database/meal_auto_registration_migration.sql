-- ================================================================================
-- MEAL AUTO-REGISTRATION SYSTEM MIGRATION
-- ================================================================================
-- Migration script to update MealMaster table for automatic registration with opt-out
-- Run this script to update existing databases with new meal auto-registration fields
-- Date: 2025-08-26
-- ================================================================================

-- Add MealPreference field (veg/non-veg preference)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mealmaster' AND column_name = 'mealpreference') THEN
        ALTER TABLE MealMaster 
        ADD COLUMN MealPreference VARCHAR(20) DEFAULT 'non-veg' CHECK (MealPreference IN ('veg', 'non-veg'));
        
        RAISE NOTICE 'Added MealPreference column to MealMaster table';
    ELSE
        RAISE NOTICE 'MealPreference column already exists in MealMaster table';
    END IF;
END $$;

-- Update Status field to support new workflow states
-- Current: 'confirmed', 'cancelled' 
-- New: 'registered', 'opted_out', 'consumed', 'cancelled'
DO $$ 
BEGIN
    -- First, drop the existing check constraint
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name LIKE '%status%' AND table_name = 'mealmaster') THEN
        ALTER TABLE MealMaster DROP CONSTRAINT IF EXISTS mealmaster_status_check;
        RAISE NOTICE 'Dropped existing status check constraint';
    END IF;
    
    -- Add new check constraint with updated states
    ALTER TABLE MealMaster 
    ADD CONSTRAINT mealmaster_status_check 
    CHECK (Status IN ('registered', 'opted_out', 'consumed', 'cancelled', 'confirmed'));
    
    RAISE NOTICE 'Updated Status check constraint with new workflow states';
END $$;

-- Update existing 'confirmed' status records to 'registered' for consistency
UPDATE MealMaster 
SET Status = 'registered' 
WHERE Status = 'confirmed' AND IsConsumed = 'N';

-- Update existing consumed records to 'consumed' status
UPDATE MealMaster 
SET Status = 'consumed' 
WHERE Status = 'confirmed' AND IsConsumed = 'Y';

-- Create indexes for new workflow and preferences
CREATE INDEX IF NOT EXISTS idx_mealmaster_preference ON MealMaster(TenantID, MealPreference, MealDate);
CREATE INDEX IF NOT EXISTS idx_mealmaster_status_new ON MealMaster(TenantID, Status, MealDate);
CREATE INDEX IF NOT EXISTS idx_mealmaster_auto_reg ON MealMaster(TenantID, MealType, MealDate, Status);

-- Add column comments for documentation
COMMENT ON COLUMN MealMaster.MealPreference IS 'Student meal preference: veg or non-veg';
COMMENT ON COLUMN MealMaster.Status IS 'Meal workflow status: registered (auto), opted_out (student choice), consumed (eaten), cancelled (admin)';

-- Create a view for active meal registrations (excluding opted out and cancelled)
CREATE OR REPLACE VIEW ActiveMealRegistrations AS
SELECT 
    MealID,
    TenantID,
    StudentID,
    StudentRegNo,
    StudentName,
    Mobile,
    Course,
    Hostel,
    MealType,
    MealDate,
    MealTime,
    TokenNumber,
    Status,
    IsSpecial,
    SpecialRemarks,
    MealPreference,
    IsConsumed,
    ConsumedTime,
    CreatedDate,
    UpdatedDate,
    CreatedBy,
    UpdatedBy
FROM MealMaster
WHERE IsActive = 'Y' 
  AND Status IN ('registered', 'consumed')
  AND MealDate >= CURRENT_DATE - INTERVAL '7 days';

COMMENT ON VIEW ActiveMealRegistrations IS 'View of active meal registrations excluding opted-out and cancelled meals';

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'MEAL AUTO-REGISTRATION MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'Changes applied:';
    RAISE NOTICE '1. Added MealPreference column (veg/non-veg)';
    RAISE NOTICE '2. Updated Status field constraints for new workflow';
    RAISE NOTICE '3. Updated existing data to match new status values';  
    RAISE NOTICE '4. Created performance indexes for new fields';
    RAISE NOTICE '5. Created ActiveMealRegistrations view';
    RAISE NOTICE '================================================================================';
END $$;