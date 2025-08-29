-- ================================================================================
-- MINIMAL MESS INCHARGE SYSTEM - DATABASE SCHEMA  
-- ================================================================================
-- Simple extension to existing meal system for mess incharge functionality
-- Leverages existing MealMaster and MealSettings tables
-- ================================================================================

-- ================================================================================
-- 1. MESS MENU TABLE (Minimal)
-- ================================================================================
CREATE TABLE IF NOT EXISTS MessMenu (
    MenuID BIGSERIAL PRIMARY KEY,
    TenantID INT NOT NULL,
    MenuDate DATE NOT NULL,
    MealType VARCHAR(20) NOT NULL CHECK (MealType IN ('breakfast', 'lunch', 'dinner')),
    
    -- Simple menu content
    MenuItems TEXT NOT NULL, -- Simple text description of menu
    MenuDescription TEXT,
    
    -- Basic flags
    IsVegetarian BOOLEAN DEFAULT TRUE,
    IsAvailable BOOLEAN DEFAULT TRUE,
    
    -- Audit fields  
    IsActive CHAR(1) DEFAULT 'Y' CHECK (IsActive IN ('Y', 'N')),
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CreatedBy VARCHAR(250),
    UpdatedBy VARCHAR(250),
    
    -- Constraints
    FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID),
    CONSTRAINT unique_menu_date_meal UNIQUE (TenantID, MenuDate, MealType)
);

-- ================================================================================
-- INDEXES
-- ================================================================================
CREATE INDEX IF NOT EXISTS idx_mess_menu_tenant_date ON MessMenu(TenantID, MenuDate);
CREATE INDEX IF NOT EXISTS idx_mess_menu_available ON MessMenu(IsAvailable, IsActive);

-- ================================================================================
-- SAMPLE DATA
-- ================================================================================
INSERT INTO MessMenu (TenantID, MenuDate, MealType, MenuItems, MenuDescription, CreatedBy)
VALUES 
(1001, CURRENT_DATE, 'lunch', 'Rice, Dal, Sabzi, Roti, Salad', 'Regular lunch menu', 'System'),
(1001, CURRENT_DATE, 'dinner', 'Rice, Sambar, Dry Vegetable, Chapati, Curd', 'Regular dinner menu', 'System'),
(1001, CURRENT_DATE + 1, 'lunch', 'Biryani, Raita, Papad, Sweet', 'Special lunch menu', 'System');