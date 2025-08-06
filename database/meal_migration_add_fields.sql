-- Migration script to add new fields to MealMaster table
-- Run this script to update existing databases with new meal system fields
-- Date: 2025-08-04

-- Add IsSpecial field (Y/N flag to mark special meals)
ALTER TABLE MealMaster 
ADD COLUMN IsSpecial CHAR(1) DEFAULT 'N' CHECK (IsSpecial IN ('Y', 'N'));

-- Add IsConsumed field (Y/N flag to mark if meal was consumed)
ALTER TABLE MealMaster 
ADD COLUMN IsConsumed CHAR(1) DEFAULT 'N' CHECK (IsConsumed IN ('Y', 'N'));

-- Add SpecialRemarks field (text field for special meal remarks)
ALTER TABLE MealMaster 
ADD COLUMN SpecialRemarks VARCHAR(500);

-- Add ConsumedTime field (timestamp when meal was consumed)
ALTER TABLE MealMaster 
ADD COLUMN ConsumedTime TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN MealMaster.IsSpecial IS 'Flag to indicate if this is a special meal (Y/N)';
COMMENT ON COLUMN MealMaster.IsConsumed IS 'Flag to indicate if the meal was consumed (Y/N)';
COMMENT ON COLUMN MealMaster.SpecialRemarks IS 'Special remarks or notes about the meal';
COMMENT ON COLUMN MealMaster.ConsumedTime IS 'Timestamp when the meal was actually consumed';

-- Create index for performance on consumption queries
CREATE INDEX idx_mealmaster_consumed ON MealMaster(TenantID, IsConsumed, MealDate);
CREATE INDEX idx_mealmaster_special ON MealMaster(TenantID, IsSpecial, MealDate);
CREATE INDEX idx_mealmaster_consumed_time ON MealMaster(ConsumedTime);