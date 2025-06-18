-- Visitor Management Database Schema

-- Table: VisitorCategory
CREATE TABLE IF NOT EXISTS VisitorCategory (
    VisitorCatID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    VisitorCatName varchar(100),
    VisitorCatIconFlag char(1),
    VisitorCatIconPath varchar(750),
    VisitorCatIcon varchar(750),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: VisitorSubCategory
CREATE TABLE IF NOT EXISTS VisitorSubCategory (
    VisitorSubCatID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    VisitorCatID int,
    VisitorCatName varchar(100),
    VisitorCatIconFlag char(1),
    VisitorCatIconPath varchar(750),
    VisitorCatIcon varchar(750),
    VisitorSubCatName varchar(100),
    VisitorSubCatIconFlag char(1),
    VisitorSubCatIconPath varchar(750),
    VisitorSubCatIcon varchar(750),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: VisitorPuposeMaster
CREATE TABLE IF NOT EXISTS VisitorPuposeMaster (
    VisitPurposeID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    PurposeCatID int,
    PurposeCatName varchar(250),
    VisitPurpose varchar(250),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: PortalOTP
CREATE TABLE IF NOT EXISTS PortalOTP (
    PPOTPID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    MobileNo varchar(20),
    OTPNumber varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250)
);

-- Table: VisitorMaster
CREATE TABLE IF NOT EXISTS VisitorMaster (
    VisitorID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    StatusID int DEFAULT 1,
    StatusName varchar(50) DEFAULT 'ACTIVE',
    VisitorCatID int,
    VisitorCatName varchar(100),
    VisitorSubCatID int,
    VisitorSubCatName varchar(100),
    VisitPurposeID int,
    VisitPurpose varchar(250),
    SalutationID int,
    Salutation varchar(50),
    Fname varchar(50),
    Mname varchar(50),
    Lname varchar(50),
    Mobile varchar(20),
    OTPVerified char(1) DEFAULT 'N',
    Address_1 varchar(250),
    OTPVerifiedDate varchar(50),
    TotalVisitor int DEFAULT 1,
    FlatID int,
    FlatName varchar(50),
    MeetingWithID int,
    MeetingWith varchar(50),
    LoginID int,
    LoginName varchar(50),
    VisitDate timestamp DEFAULT CURRENT_TIMESTAMP,
    VisitDateTxt varchar(50),
    PhotoFlag char(1) DEFAULT 'N',
    PhotoPath varchar(750),
    PhotoName varchar(750),
    VehiclelNo varchar(50),
    VehiclePhotoFlag char(1) DEFAULT 'N',
    VehiclePhotoPath varchar(750),
    VehiclePhotoName varchar(750),
    Remark varchar(250),
    INTime timestamp DEFAULT CURRENT_TIMESTAMP,
    INTimeTxt varchar(50),
    OutTime timestamp,
    OutTimeTxt varchar(50),
    IsProblematic char(1) DEFAULT 'N',
    ProblematicRemark varchar(750),
    ConvertFlag char(1) DEFAULT 'N',
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: VisitorRegistration
CREATE TABLE IF NOT EXISTS VisitorRegistration (
    VisitorRegID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    StatusID int DEFAULT 1,
    StatusName varchar(50) DEFAULT 'ACTIVE',
    VisitorCatID int,
    VisitorCatName varchar(100),
    VisitorSubCatID int,
    VisitorSubCatName varchar(100),
    VisitorRegNo varchar(50),
    SecurityCode varchar(250),
    VistorName varchar(150),
    Mobile varchar(20),
    Email varchar(50),
    PhotoFlag char(1) DEFAULT 'N',
    PhotoPath varchar(750),
    PhotoName varchar(750),
    VehiclelNo varchar(50),
    VehiclePhotoFlag char(1) DEFAULT 'N',
    VehiclePhotoPath varchar(750),
    VehiclePhotoName varchar(750),
    Remark varchar(250),
    IdentityID int,
    IDName varchar(250),
    IDNumber varchar(50),
    IDPhotoFlag char(1) DEFAULT 'N',
    IDPhotoPath varchar(750),
    IDPhotoName varchar(750),
    AssociatedFlat varchar(750),
    AssociatedBlock varchar(750),
    ValidityFlag char(1) DEFAULT 'Y',
    ValidStartDate timestamp DEFAULT CURRENT_TIMESTAMP,
    ValidEndDate timestamp,
    FlatID int,
    FlatName varchar(50),
    IsProblematic char(1) DEFAULT 'N',
    ProblematicRemark varchar(750),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    Custom_3 varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: VisitorRegVisitHistory
CREATE TABLE IF NOT EXISTS VisitorRegVisitHistory (
    RegVisitorHistoryID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    IsRegFlag char(1) DEFAULT 'Y',
    VisitorRegID bigint,
    VisitorRegNo varchar(50),
    SecurityCode varchar(250),
    VistorName varchar(150),
    Mobile varchar(20),
    VehiclelNo varchar(50),
    Remark varchar(250),
    VisitorCatID int,
    VisitorCatName varchar(100),
    VisitorSubCatID int,
    VisitorSubCatName varchar(100),
    AssociatedFlat varchar(750),
    AssociatedBlock varchar(750),
    INTime timestamp DEFAULT CURRENT_TIMESTAMP,
    INTimeTxt varchar(50),
    OutTime timestamp,
    OutTimeTxt varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: FlatMaster (referenced in visitor tables)
CREATE TABLE IF NOT EXISTS FlatMaster (
    FlatID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    FlatName varchar(350),
    FloorID int,
    FloorName varchar(250),
    BlockID int,
    BlockName varchar(250),
    OwnerFName varchar(50),
    OwnerMName varchar(50),
    OwnerLName varchar(50),
    RentFlag char(1) DEFAULT 'N',
    DOP varchar(50),
    DOC varchar(50),
    OwnerMobile varchar(50),
    OwnerMobile_2 varchar(50),
    RenterFName varchar(50),
    RenterMName varchar(50),
    RenterLName varchar(50),
    RenterMobile varchar(50),
    Area decimal(18,2),
    FlatRemark varchar(750),
    RentPerMonth decimal(18,2),
    SocietyFeePerMonth decimal(18,2),
    IsVacant char(1) DEFAULT 'N',
    OwnerPhotoFlag char(1) DEFAULT 'N',
    OwnerPhotoPath varchar(750),
    OwnerPhoto varchar(750),
    RenterPhotoFlag char(1) DEFAULT 'N',
    RenterPhotoPath varchar(750),
    RenterPhoto varchar(750),
    RenterIDProofFlag char(1) DEFAULT 'N',
    RentID int,
    RenterIDName varchar(50),
    NoFamilyMember int DEFAULT 0,
    NoChildren int DEFAULT 0,
    NoMaid int DEFAULT 0,
    Remark varchar(750),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: IDMaster (for identity types)
CREATE TABLE IF NOT EXISTS IDMaster (
    IdentityID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    IDName varchar(250),
    IDIconFlag char(1) DEFAULT 'N',
    IDIconPath varchar(750),
    IDIconPic varchar(750),
    Remark varchar(250),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Foreign Key Constraints
DO $$ BEGIN
    ALTER TABLE VisitorSubCategory 
        ADD CONSTRAINT FK_VisitorSubCategory_VisitorCategory 
        FOREIGN KEY (VisitorCatID) REFERENCES VisitorCategory(VisitorCatID);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitor_master_tenant_mobile ON VisitorMaster(TenantID, Mobile);
CREATE INDEX IF NOT EXISTS idx_visitor_master_tenant_status ON VisitorMaster(TenantID, StatusID);
CREATE INDEX IF NOT EXISTS idx_visitor_registration_tenant_mobile ON VisitorRegistration(TenantID, Mobile);
CREATE INDEX IF NOT EXISTS idx_visitor_registration_tenant_category ON VisitorRegistration(TenantID, VisitorCatID);
CREATE INDEX IF NOT EXISTS idx_portal_otp_mobile_active ON PortalOTP(MobileNo, IsActive);
CREATE INDEX IF NOT EXISTS idx_portal_otp_created_date ON PortalOTP(CreatedDate);
CREATE INDEX IF NOT EXISTS idx_visitor_subcategory_tenant_category ON VisitorSubCategory(TenantID, VisitorCatID);
CREATE INDEX IF NOT EXISTS idx_visitor_purpose_tenant_category ON VisitorPuposeMaster(TenantID, PurposeCatID);


-- Add this before the INSERT statements:
TRUNCATE TABLE VisitorSubCategory, VisitorCategory, VisitorPuposeMaster, IDMaster, FlatMaster RESTART IDENTITY CASCADE;

-- Insert sample data for testing
-- Insert sample data for testing with explicit IDs
INSERT INTO VisitorCategory (VisitorCatID, TenantID, VisitorCatName, IsActive) VALUES 
(1, 1, 'Staff', 'Y'),
(2, 1, 'Unregistered', 'Y'),
(3, 1, 'Student', 'Y'),
(4, 1, 'Guest', 'Y'),
(5, 1, 'Business', 'Y')
ON CONFLICT (VisitorCatID) DO NOTHING;

INSERT INTO VisitorSubCategory (VisitorSubCatID, TenantID, VisitorCatID, VisitorCatName, VisitorSubCatName, IsActive) VALUES 
(1, 1, 1, 'Staff', 'Security', 'Y'),
(2, 1, 1, 'Staff', 'Maintenance', 'Y'),
(3, 1, 1, 'Staff', 'Cleaning', 'Y'),
(4, 1, 2, 'Unregistered', 'Walk-in Visitor', 'Y'),
(5, 1, 2, 'Unregistered', 'Emergency', 'Y'),
(6, 1, 3, 'Student', 'Regular Student', 'Y'),
(7, 1, 3, 'Student', 'New Admission', 'Y'),
(8, 1, 4, 'Guest', 'Family Member', 'Y'),
(9, 1, 4, 'Guest', 'Friend', 'Y'),
(10, 1, 5, 'Business', 'Delivery', 'Y'),
(11, 1, 5, 'Business', 'Service Provider', 'Y')
ON CONFLICT (VisitorSubCatID) DO NOTHING;

INSERT INTO VisitorPuposeMaster (VisitPurposeID, TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive) VALUES 
(1, 1, 1, 'General', 'Meeting', 'Y'),
(2, 1, 1, 'General', 'Visit', 'Y'),
(3, 1, 1, 'General', 'Delivery', 'Y'),
(4, 1, 1, 'General', 'Maintenance', 'Y'),
(5, 1, 1, 'General', 'Emergency', 'Y'),
(6, 1, 2, 'Business', 'Business Meeting', 'Y'),
(7, 1, 2, 'Business', 'Service Call', 'Y'),
(8, 1, 2, 'Business', 'Installation', 'Y'),
(9, 1, 3, 'Personal', 'Family Visit', 'Y'),
(10, 1, 3, 'Personal', 'Social Visit', 'Y')
ON CONFLICT (VisitPurposeID) DO NOTHING;

INSERT INTO IDMaster (IdentityID, TenantID, IDName, IsActive) VALUES 
(1, 1, 'Aadhaar Card', 'Y'),
(2, 1, 'PAN Card', 'Y'),
(3, 1, 'Driving License', 'Y'),
(4, 1, 'Voter ID', 'Y'),
(5, 1, 'Passport', 'Y'),
(6, 1, 'Employee ID', 'Y'),
(7, 1, 'Student ID', 'Y')
ON CONFLICT (IdentityID) DO NOTHING;

INSERT INTO FlatMaster (FlatID, TenantID, FlatName, IsActive) VALUES 
(1, 1, 'A-101', 'Y'),
(2, 1, 'A-102', 'Y'),
(3, 1, 'A-201', 'Y'),
(4, 1, 'A-202', 'Y'),
(5, 1, 'B-101', 'Y'),
(6, 1, 'B-102', 'Y')
ON CONFLICT (FlatID) DO NOTHING;