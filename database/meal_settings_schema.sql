-- MealSettings table for tenant-specific meal timing configurations
CREATE TABLE IF NOT EXISTS MealSettings (
    MealSettingID SERIAL PRIMARY KEY,
    TenantID INTEGER NOT NULL,
    
    -- Lunch Settings
    LunchBookingStartTime TIME NOT NULL DEFAULT '10:00:00',
    LunchBookingEndTime TIME NOT NULL DEFAULT '12:00:00',
    LunchStartTime TIME NOT NULL DEFAULT '13:00:00',
    LunchEndTime TIME NOT NULL DEFAULT '15:00:00',
    
    -- Dinner Settings
    DinnerBookingStartTime TIME NOT NULL DEFAULT '16:00:00',
    DinnerBookingEndTime TIME NOT NULL DEFAULT '18:00:00',
    DinnerStartTime TIME NOT NULL DEFAULT '19:00:00',
    DinnerEndTime TIME NOT NULL DEFAULT '21:00:00',
    
    -- Audit fields
    IsActive VARCHAR(1) DEFAULT 'Y' CHECK (IsActive IN ('Y', 'N')),
    CreatedDate TIMESTAMP DEFAULT NOW(),
    UpdatedDate TIMESTAMP DEFAULT NOW(),
    CreatedBy VARCHAR(100),
    UpdatedBy VARCHAR(100),
    
    -- Constraints
    CONSTRAINT fk_meal_settings_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID),
    CONSTRAINT unique_meal_settings_tenant UNIQUE (TenantID, IsActive),
    
    -- Time validation constraints
    CONSTRAINT check_lunch_booking_times CHECK (LunchBookingStartTime < LunchBookingEndTime),
    CONSTRAINT check_lunch_meal_times CHECK (LunchStartTime < LunchEndTime),
    CONSTRAINT check_dinner_booking_times CHECK (DinnerBookingStartTime < DinnerBookingEndTime),
    CONSTRAINT check_dinner_meal_times CHECK (DinnerStartTime < DinnerEndTime),
    CONSTRAINT check_lunch_booking_before_meal CHECK (LunchBookingEndTime <= LunchStartTime),
    CONSTRAINT check_dinner_booking_before_meal CHECK (DinnerBookingEndTime <= DinnerStartTime)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_meal_settings_tenant ON MealSettings(TenantID, IsActive);

-- Insert default settings for existing tenants
INSERT INTO MealSettings (
    TenantID, 
    LunchBookingStartTime, LunchBookingEndTime, LunchStartTime, LunchEndTime,
    DinnerBookingStartTime, DinnerBookingEndTime, DinnerStartTime, DinnerEndTime,
    CreatedBy
)
SELECT 
    TenantID,
    '10:00:00', '12:00:00', '13:00:00', '15:00:00',
    '16:00:00', '18:00:00', '19:00:00', '21:00:00',
    'SYSTEM_DEFAULT'
FROM Tenant 
WHERE TenantID NOT IN (SELECT TenantID FROM MealSettings WHERE IsActive = 'Y');

-- Comments
COMMENT ON TABLE MealSettings IS 'Tenant-specific meal timing configurations for booking and serving times';
COMMENT ON COLUMN MealSettings.LunchBookingStartTime IS 'Time when lunch booking opens';
COMMENT ON COLUMN MealSettings.LunchBookingEndTime IS 'Time when lunch booking closes';
COMMENT ON COLUMN MealSettings.LunchStartTime IS 'Time when lunch serving starts';
COMMENT ON COLUMN MealSettings.LunchEndTime IS 'Time when lunch serving ends';
COMMENT ON COLUMN MealSettings.DinnerBookingStartTime IS 'Time when dinner booking opens';
COMMENT ON COLUMN MealSettings.DinnerBookingEndTime IS 'Time when dinner booking closes';
COMMENT ON COLUMN MealSettings.DinnerStartTime IS 'Time when dinner serving starts';
COMMENT ON COLUMN MealSettings.DinnerEndTime IS 'Time when dinner serving ends';