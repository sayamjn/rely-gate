-- Enhanced MealSettings table for day-wise meal configurations with enable/disable options.
-- This replaces the existing MealSettings table structure.

-- Drop existing table if updating (uncomment if needed)
-- DROP TABLE IF EXISTS MealSettings CASCADE;

CREATE TABLE IF NOT EXISTS MealSettings (
    MealSettingID SERIAL PRIMARY KEY,
    TenantID INTEGER NOT NULL,

    -- Lunch enable/disable for each day
    LunchEnabledMonday BOOLEAN DEFAULT TRUE,
    LunchEnabledTuesday BOOLEAN DEFAULT TRUE,
    LunchEnabledWednesday BOOLEAN DEFAULT TRUE,
    LunchEnabledThursday BOOLEAN DEFAULT TRUE,
    LunchEnabledFriday BOOLEAN DEFAULT TRUE,
    LunchEnabledSaturday BOOLEAN DEFAULT TRUE,
    LunchEnabledSunday BOOLEAN DEFAULT TRUE,

    -- Dinner enable/disable for each day
    DinnerEnabledMonday BOOLEAN DEFAULT TRUE,
    DinnerEnabledTuesday BOOLEAN DEFAULT TRUE,
    DinnerEnabledWednesday BOOLEAN DEFAULT TRUE,
    DinnerEnabledThursday BOOLEAN DEFAULT TRUE,
    DinnerEnabledFriday BOOLEAN DEFAULT TRUE,
    DinnerEnabledSaturday BOOLEAN DEFAULT TRUE,
    DinnerEnabledSunday BOOLEAN DEFAULT TRUE,

    -- Lunch booking times
    LunchBookingStartMonday TIME DEFAULT '10:00:00',
    LunchBookingEndMonday   TIME DEFAULT '12:00:00',
    LunchBookingStartTuesday TIME DEFAULT '10:00:00',
    LunchBookingEndTuesday   TIME DEFAULT '12:00:00',
    LunchBookingStartWednesday TIME DEFAULT '10:00:00',
    LunchBookingEndWednesday   TIME DEFAULT '12:00:00',
    LunchBookingStartThursday TIME DEFAULT '10:00:00',
    LunchBookingEndThursday   TIME DEFAULT '12:00:00',
    LunchBookingStartFriday TIME DEFAULT '10:00:00',
    LunchBookingEndFriday   TIME DEFAULT '12:00:00',
    LunchBookingStartSaturday TIME DEFAULT '10:00:00',
    LunchBookingEndSaturday   TIME DEFAULT '12:00:00',
    LunchBookingStartSunday TIME DEFAULT '10:00:00',
    LunchBookingEndSunday   TIME DEFAULT '12:00:00',

    -- Lunch meal times
    LunchStartMonday TIME DEFAULT '13:00:00',
    LunchEndMonday   TIME DEFAULT '15:00:00',
    LunchStartTuesday TIME DEFAULT '13:00:00',
    LunchEndTuesday   TIME DEFAULT '15:00:00',
    LunchStartWednesday TIME DEFAULT '13:00:00',
    LunchEndWednesday   TIME DEFAULT '15:00:00',
    LunchStartThursday TIME DEFAULT '13:00:00',
    LunchEndThursday   TIME DEFAULT '15:00:00',
    LunchStartFriday TIME DEFAULT '13:00:00',
    LunchEndFriday   TIME DEFAULT '15:00:00',
    LunchStartSaturday TIME DEFAULT '13:00:00',
    LunchEndSaturday   TIME DEFAULT '15:00:00',
    LunchStartSunday TIME DEFAULT '13:00:00',
    LunchEndSunday   TIME DEFAULT '15:00:00',

    -- Dinner booking times
    DinnerBookingStartMonday TIME DEFAULT '16:00:00',
    DinnerBookingEndMonday   TIME DEFAULT '18:00:00',
    DinnerBookingStartTuesday TIME DEFAULT '16:00:00',
    DinnerBookingEndTuesday   TIME DEFAULT '18:00:00',
    DinnerBookingStartWednesday TIME DEFAULT '16:00:00',
    DinnerBookingEndWednesday   TIME DEFAULT '18:00:00',
    DinnerBookingStartThursday TIME DEFAULT '16:00:00',
    DinnerBookingEndThursday   TIME DEFAULT '18:00:00',
    DinnerBookingStartFriday TIME DEFAULT '16:00:00',
    DinnerBookingEndFriday   TIME DEFAULT '18:00:00',
    DinnerBookingStartSaturday TIME DEFAULT '16:00:00',
    DinnerBookingEndSaturday   TIME DEFAULT '18:00:00',
    DinnerBookingStartSunday TIME DEFAULT '16:00:00',
    DinnerBookingEndSunday   TIME DEFAULT '18:00:00',

    -- Dinner meal times
    DinnerStartMonday TIME DEFAULT '19:00:00',
    DinnerEndMonday   TIME DEFAULT '21:00:00',
    DinnerStartTuesday TIME DEFAULT '19:00:00',
    DinnerEndTuesday   TIME DEFAULT '21:00:00',
    DinnerStartWednesday TIME DEFAULT '19:00:00',
    DinnerEndWednesday   TIME DEFAULT '21:00:00',
    DinnerStartThursday TIME DEFAULT '19:00:00',
    DinnerEndThursday   TIME DEFAULT '21:00:00',
    DinnerStartFriday TIME DEFAULT '19:00:00',
    DinnerEndFriday   TIME DEFAULT '21:00:00',
    DinnerStartSaturday TIME DEFAULT '19:00:00',
    DinnerEndSaturday   TIME DEFAULT '21:00:00',
    DinnerStartSunday TIME DEFAULT '19:00:00',
    DinnerEndSunday   TIME DEFAULT '21:00:00',

    -- Audit fields
    IsActive VARCHAR(1) DEFAULT 'Y' CHECK (IsActive IN ('Y', 'N')),
    CreatedDate TIMESTAMP DEFAULT NOW(),
    UpdatedDate TIMESTAMP DEFAULT NOW(),
    CreatedBy VARCHAR(100),
    UpdatedBy VARCHAR(100),

    -- Constraints
    CONSTRAINT fk_meal_settings_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID),
    CONSTRAINT uq_meal_settings_tenant UNIQUE (TenantID, IsActive)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_meal_settings_tenant ON MealSettings(TenantID, IsActive);

-- Table comments
COMMENT ON TABLE MealSettings IS 'Enhanced tenant-specific meal timing configurations with day-wise settings and enable/disable options';
COMMENT ON COLUMN MealSettings.LunchEnabledMonday IS 'Enable/disable lunch for Monday';
COMMENT ON COLUMN MealSettings.DinnerEnabledMonday IS 'Enable/disable dinner for Monday';
COMMENT ON COLUMN MealSettings.LunchBookingStartMonday IS 'Lunch booking start time for Monday';
COMMENT ON COLUMN MealSettings.LunchStartMonday IS 'Lunch serving start time for Monday';
