-- Table: MealMaster
-- This table tracks student meal check-ins with timing and token system
-- Includes comprehensive student information based on VisitorRegistration and BulkVisitorUpload schemas
CREATE TABLE MealMaster (
    MealID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    StudentID int NOT NULL, -- References VisitorRegistration.VisitorRegID
    StudentRegNo varchar(100), -- Student registration number
    StudentName varchar(500), -- Full student name
    Mobile varchar(20), -- Mobile phone number
    Email varchar(500), -- Email address
    Address varchar(1000), -- Student address
    Course varchar(500), -- Course name (e.g., Computer Science, Electronics Engineering)
    Hostel varchar(500), -- Hostel assignment (e.g., Hostel A, Hostel B)
    AssociatedFlat varchar(200), -- Room assignment (e.g., Room-101)
    AssociatedBlock varchar(200), -- Block assignment (e.g., Block-A)
    VehicleNo varchar(50), -- Vehicle number if applicable
    VisitorCatName varchar(100), -- Category name (Student)
    VisitorSubCatName varchar(100), -- Subcategory (Regular Student, New Admission)
    SecurityCode varchar(50), -- Student security/PIN code
    IDNumber varchar(100), -- ID proof number
    IDName varchar(100), -- ID proof type
    PhotoFlag char(1), -- Has photo (Y/N)
    PhotoPath varchar(500), -- Photo file path
    PhotoName varchar(200), -- Photo file name
    ValidStartDate date, -- Validity start date
    ValidEndDate date, -- Validity end date
    MealType varchar(20) NOT NULL, -- 'breakfast', 'lunch', 'dinner'
    MealDate date NOT NULL,
    MealTime timestamp NOT NULL,
    TokenNumber int NOT NULL,
    Status varchar(20) DEFAULT 'confirmed', -- 'confirmed', 'cancelled'
    IsActive char(1) DEFAULT 'Y',
    CreatedDate timestamp DEFAULT NOW(),
    UpdatedDate timestamp DEFAULT NOW(),
    CreatedBy varchar(250),
    UpdatedBy varchar(250),
    -- Add indexes for better performance
    CONSTRAINT meal_unique_student_date_type UNIQUE (TenantID, StudentID, MealDate, MealType)
);

-- Create indexes for performance optimization
CREATE INDEX idx_meal_master_tenant_date_type ON MealMaster (TenantID, MealDate, MealType);
CREATE INDEX idx_meal_master_student_date ON MealMaster (StudentID, MealDate);
CREATE INDEX idx_meal_master_token ON MealMaster (TenantID, MealDate, MealType, TokenNumber);
CREATE INDEX idx_meal_master_mobile ON MealMaster (Mobile);
CREATE INDEX idx_meal_master_course ON MealMaster (Course);
CREATE INDEX idx_meal_master_hostel ON MealMaster (Hostel);
CREATE INDEX idx_meal_master_student_reg_no ON MealMaster (StudentRegNo);

-- Insert sample meal timing configuration (can be used for validation)
-- Note: This could be moved to a separate configuration table if needed
COMMENT ON TABLE MealMaster IS 'Student meal check-in records with comprehensive student information and token system. Meal timings: Breakfast (8-10 AM), Lunch (1-3 PM), Dinner (7-9 PM). Includes complete student profile data from VisitorRegistration and BulkVisitorUpload tables.';