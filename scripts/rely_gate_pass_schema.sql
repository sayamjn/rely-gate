-- ============================================================
-- RELY GATE PASS DATABASE SCHEMA - CONSOLIDATED
-- Database: PostgreSQL
-- Target Server: 181.215.79.153:5432
-- Database User: rely / rely2025
-- Consolidated from all schema files in scripts/
-- ============================================================

-- Drop existing tables if they exist (for clean installation)
DROP TABLE IF EXISTS VisitorRegVisitHistory CASCADE;
DROP TABLE IF EXISTS VisitorRegistration CASCADE;
DROP TABLE IF EXISTS VisitorMaster CASCADE;
DROP TABLE IF EXISTS VisitorSubCategory CASCADE;
DROP TABLE IF EXISTS VisitorCategory CASCADE;
DROP TABLE IF EXISTS VisitorPuposeMaster CASCADE;
DROP TABLE IF EXISTS LoginUser CASCADE;
DROP TABLE IF EXISTS FuncRoleAccess CASCADE;
DROP TABLE IF EXISTS RoleMenuMapping CASCADE;
DROP TABLE IF EXISTS ModuleMaster CASCADE;
DROP TABLE IF EXISTS RoleMaster CASCADE;
DROP TABLE IF EXISTS FlatMaster CASCADE;
DROP TABLE IF EXISTS FloorMaster CASCADE;
DROP TABLE IF EXISTS BlockMaster CASCADE;
DROP TABLE IF EXISTS TenantSetting CASCADE;
DROP TABLE IF EXISTS Tenant CASCADE;
DROP TABLE IF EXISTS StatusCodeMaster CASCADE;
DROP TABLE IF EXISTS DepartmentMaster CASCADE;
DROP TABLE IF EXISTS IDMaster CASCADE;
DROP TABLE IF EXISTS PortalOTP CASCADE;
DROP TABLE IF EXISTS FCM CASCADE;
DROP TABLE IF EXISTS ImportantContact CASCADE;
DROP TABLE IF EXISTS NoticeCategoryMaster CASCADE;
DROP TABLE IF EXISTS Notice CASCADE;
DROP TABLE IF EXISTS SMSGatewayMaster CASCADE;
DROP TABLE IF EXISTS Photo CASCADE;
DROP TABLE IF EXISTS ReportProblem CASCADE;
DROP TABLE IF EXISTS RelationMaster CASCADE;
DROP TABLE IF EXISTS ImportanceMaster CASCADE;
DROP TABLE IF EXISTS IncidentEntry CASCADE;
DROP TABLE IF EXISTS IncidentCatMaster CASCADE;
DROP TABLE IF EXISTS FuctionalityMaster CASCADE;
DROP TABLE IF EXISTS TenantPaymentHistory CASCADE;
DROP TABLE IF EXISTS BulkVisitorUpload CASCADE;

-- ============================================================
-- CORE MASTER TABLES
-- ============================================================

-- Table: StatusCodeMaster
CREATE TABLE StatusCodeMaster (
    StatusID int PRIMARY KEY,
    TenantID int NOT NULL,
    StatusCode varchar(20) NOT NULL,
    StatusShortName varchar(50) NOT NULL,
    StatusLongName varchar(250),
    IsActive char(1) DEFAULT 'Y',
    Process varchar(50),
    SubProcess varchar(250),
    SubSubPro varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Table: Tenant
CREATE TABLE Tenant (
    TenantID int PRIMARY KEY,
    TenantCode varchar(1000),
    TenantName varchar(450) NOT NULL,
    ShortName varchar(250),
    PAN varchar(250),
    TIN varchar(250),
    ServiceRef varchar(250),
    Address1 varchar(250),
    Address2 varchar(250),
    Address3 varchar(250),
    TenantDesc varchar(750),
    Fax varchar(250),
    Email varchar(250),
    VATno varchar(250),
    DLNo varchar(250),
    CSTNo varchar(250),
    Lanline varchar(250),
    Mobile varchar(250),
    Website varchar(750),
    IsActive char(1) DEFAULT 'Y',
    StatusID int,
    SuscriptionStartDate timestamp,
    SuscriptionEndDate timestamp,
    TenantRemark varchar(750),
    FinancialYear int,
    EntityLogoFlag char(1) DEFAULT 'N',
    EntityLogo varchar(750),
    EntityLogoPath varchar(750),
    CompanyNo varchar(50),
    GSTNo varchar(50),
    ServiceRegNo varchar(250),
    RegNPrefix varchar(50),
    MoneyRecPrefix varchar(50),
    BillRefPrefix varchar(50),
    KeyActivateFlag char(1) DEFAULT 'N',
    ActivateDate timestamp,
    KeyCode varchar(450),
    SuscriptionPlanID int,
    SuscriptionPlan varchar(250),
    PlanStartDate timestamp,
    PlanEndDate timestamp,
    MaxAllowedUnit int,
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    Custom_3 varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Table: DepartmentMaster
CREATE TABLE DepartmentMaster (
    DeptID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    DeptCode varchar(50),
    DeptName varchar(250),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: BlockMaster
CREATE TABLE BlockMaster (
    BlockID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    BlockName varchar(250) NOT NULL,
    BlockCode varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: FloorMaster
CREATE TABLE FloorMaster (
    FloorID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) NOT NULL DEFAULT 'Y',
    FloorName varchar(250) NOT NULL,
    BlockID int,
    BlockName varchar(250),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: FlatMaster
CREATE TABLE FlatMaster (
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
    NoFamilyMember int,
    NoChildren int,
    NoMaid int,
    Remark varchar(750),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- ============================================================
-- ROLE AND USER MANAGEMENT
-- ============================================================

-- Table: RoleMaster
CREATE TABLE RoleMaster (
    RoleID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) NOT NULL DEFAULT 'Y',
    RoleCode varchar(50),
    RoleName varchar(250) NOT NULL,
    RoleRemark varchar(450),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: FuctionalityMaster
CREATE TABLE FuctionalityMaster (
    FuncID int PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    FuctionalityName varchar(750),
    GroupID int,
    GroupName varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: FuncRoleAccess
CREATE TABLE FuncRoleAccess (
    AccessID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    RoleAccessID int NOT NULL,
    FuncID int NOT NULL,
    FuctionalityName varchar(750),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250),
    CustomField varchar(450)
);

-- Table: ModuleMaster
CREATE TABLE ModuleMaster (
    ModuleID int PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) NOT NULL DEFAULT 'Y',
    ParentMenuID int,
    ModuleName varchar(450) NOT NULL,
    MenuUrl varchar(1000) NOT NULL,
    CusName varchar(350),
    HomeIconFlag char(1) DEFAULT 'N',
    ImageURL varchar(1000),
    ImageHeight varchar(50),
    Version varchar(50),
    DisplayOrder int,
    HomeIconDispOrder int,
    ChildIconDisplayOrder int,
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: RoleMenuMapping
CREATE TABLE RoleMenuMapping (
    MappingID SERIAL PRIMARY KEY,
    TenantID int,
    RoleMasterID int,
    RoleName varchar(750),
    ModuleID int,
    IsActive char(1) DEFAULT 'Y',
    CustomField varchar(450)
);

-- Table: LoginUser
CREATE TABLE LoginUser (
    LoginID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    RoleAccessID int,
    RoleName varchar(250),
    FirstN varchar(100),
    MiddleN varchar(100),
    LastN varchar(100),
    UserName varchar(250) NOT NULL,
    Passwrd varchar(1000) NOT NULL,
    DisplayN varchar(250),
    Email varchar(150),
    Mobile varchar(50),
    MobileSecondary varchar(50),
    PhotoFlag char(10) DEFAULT 'N',
    PhotoPath varchar(1000),
    Photo varchar(450),
    LastLogin timestamp,
    LastPasswrdChgedDate timestamp,
    SharedLogin char(10) DEFAULT 'N',
    LoginIP varchar(250),
    LinkFlatFlag char(1) DEFAULT 'N',
    LinkeFlatID varchar(250),
    LinkeFlatName varchar(450),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250),
    
    CONSTRAINT UK_LoginUser_UserName UNIQUE (UserName)
);

-- ============================================================
-- VISITOR MANAGEMENT CORE TABLES
-- ============================================================

-- Table: IDMaster
CREATE TABLE IDMaster (
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

-- Table: VisitorCategory
CREATE TABLE VisitorCategory (
    VisitorCatID int PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    VisitorCatName varchar(100),
    VisitorCatIconFlag char(1) DEFAULT 'N',
    VisitorCatIconPath varchar(750),
    VisitorCatIcon varchar(750),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: VisitorSubCategory
CREATE TABLE VisitorSubCategory (
    VisitorSubCatID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    VisitorCatID int,
    VisitorCatName varchar(100),
    VisitorCatIconFlag char(1) DEFAULT 'N',
    VisitorCatIconPath varchar(750),
    VisitorCatIcon varchar(750),
    VisitorSubCatName varchar(100),
    VisitorSubCatIconFlag char(1) DEFAULT 'N',
    VisitorSubCatIconPath varchar(750),
    VisitorSubCatIcon varchar(750),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: VisitorPuposeMaster
CREATE TABLE VisitorPuposeMaster (
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

-- Table: VisitorRegistration
CREATE TABLE VisitorRegistration (
    VisitorRegID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    StatusID int,
    StatusName varchar(50),
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
    ValidityFlag char(1) DEFAULT 'N',
    ValidStartDate timestamp,
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

-- Table: VisitorMaster
CREATE TABLE VisitorMaster (
    VisitorID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    StatusID int,
    StatusName varchar(50),
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
    VisitDate timestamp,
    VisitDateTxt varchar(50),
    PhotoFlag char(1) DEFAULT 'N',
    PhotoPath varchar(750),
    PhotoName varchar(750),
    VehiclelNo varchar(50),
    VehiclePhotoFlag char(1) DEFAULT 'N',
    VehiclePhotoPath varchar(750),
    VehiclePhotoName varchar(750),
    Remark varchar(250),
    INTime timestamp,
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

-- Table: VisitorRegVisitHistory
CREATE TABLE VisitorRegVisitHistory (
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
    INTime timestamp,
    INTimeTxt varchar(50),
    OutTime timestamp,
    OutTimeTxt varchar(50),
    VisitPurposeID int,
    VisitPurpose varchar(250),
    PurposeCatID int,
    PurposeCatName varchar(250),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- ============================================================
-- SUPPORTING TABLES
-- ============================================================

-- Table: PortalOTP
CREATE TABLE PortalOTP (
    PPOTPID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    MobileNo varchar(20),
    OTPNumber varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250)
);

-- Table: FCM
CREATE TABLE FCM (
    FirebaseID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    FCMID varchar(250),
    AndroidID varchar(250),
    LoginUserID int,
    FlatID int,
    FlatName varchar(450),
    DeviceName varchar(250),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    Custom_3 varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: BulkVisitorUpload
CREATE TABLE BulkVisitorUpload (
    StudentID varchar(100),
    Name varchar(500),
    Mobile varchar(20),
    Course varchar(500),
    Hostel varchar(500),
    TenantID varchar(50),
    Type varchar(50)
);

-- Table: ImportanceMaster
CREATE TABLE ImportanceMaster (
    ImportanceID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    Importance varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: ImportantContact
CREATE TABLE ImportantContact (
    ContactID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    ContactGroupID int,
    ContactGroupName varchar(50),
    ContactGroupOrder int,
    ContactName varchar(50),
    ContactNumber varchar(50),
    ContactDisplayOrder int,
    Priority varchar(50),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: IncidentCatMaster
CREATE TABLE IncidentCatMaster (
    IncidentCatID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    IncidentCatName varchar(250),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: IncidentEntry
CREATE TABLE IncidentEntry (
    IncidentID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    StatusID int,
    StatusName varchar(50),
    IncidentCatID int,
    IncidentCatName varchar(250),
    IncidentSubCatID int,
    IncidentSubCatName varchar(250),
    DeptID int,
    DepartName varchar(250),
    SubDeptCode varchar(50),
    SubDeptID int,
    SubDeptName varchar(250),
    IncNo varchar(50),
    IncidentName varchar(750),
    IncidentDesc text,
    Place varchar(250),
    IncidentDate timestamp,
    IncidentDateTxt varchar(50),
    ResolveDate timestamp,
    ResolveDateTxt varchar(50),
    ImportanceID int,
    Importance varchar(50),
    DurationTimeMin int,
    AssignedToID varchar(20),
    AssignedTo varchar(250),
    ResolvedByID varchar(20),
    ResolvedBy varchar(250),
    LastRemark varchar(750),
    LastRemarkByID varchar(20),
    LastRemarkBy varchar(250),
    PhotoFlag char(1) DEFAULT 'N',
    PhotoPath_1 varchar(450),
    Photo_1 varchar(450),
    PhotoPath_2 varchar(450),
    Photo_2 varchar(450),
    PhotoPath_3 varchar(450),
    Photo_3 varchar(450),
    PhotoPath_4 varchar(450),
    Photo_4 varchar(450),
    PhotoPath_5 varchar(450),
    Photo_5 varchar(450),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: Notice
CREATE TABLE Notice (
    NoticeID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    NoticeCatID int,
    NoticeCategoryName varchar(50),
    IsImportant char(1) DEFAULT 'N',
    NoticeDesc varchar(750),
    ActiveDate varchar(50),
    DisplayTillDate varchar(50),
    DisplayOrder int,
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: NoticeCategoryMaster
CREATE TABLE NoticeCategoryMaster (
    NoticeCatID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    NoticeCategoryName varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: Photo
CREATE TABLE Photo (
    PhotoID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    StatusID int,
    PCategoryID int,
    CategoryName varchar(50),
    PhotoPath varchar(250),
    PhotoN varchar(50),
    Phototext varchar(250),
    OrderNumber int,
    IsCoverPhoro char(1) DEFAULT 'N',
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: RelationMaster
CREATE TABLE RelationMaster (
    RelationCatID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    RelationName varchar(50),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    Custom_3 varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: ReportProblem
CREATE TABLE ReportProblem (
    ReportProblemID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    StatusID int,
    StatusName varchar(50),
    SubjectName varchar(750),
    Message varchar(4000),
    CreatedDateTxt varchar(50),
    ImportanceCatID int,
    ImportanceCat varchar(50),
    AttachFileFlag char(1) DEFAULT 'N',
    AttachFileName varchar(250),
    AttachFileLocation varchar(250),
    ResolvedDate varchar(50),
    ResolvedBy varchar(50),
    ResolvedRemark varchar(750),
    Important char(1) DEFAULT 'N',
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: SMSGatewayMaster
CREATE TABLE SMSGatewayMaster (
    SMSGatewayID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    SMSEnabledFlag char(1) NOT NULL DEFAULT 'N',
    GatewayURL varchar(750),
    ApiKeyFlag char(1) DEFAULT 'N',
    ApiKeyName varchar(750),
    UserName varchar(450),
    Passwrd varchar(450),
    SenderVendor varchar(450),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: TenantPaymentHistory
CREATE TABLE TenantPaymentHistory (
    TenantPayID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1) DEFAULT 'Y',
    TenantName varchar(450),
    ShortName varchar(250),
    StatusID int,
    StatusName varchar(50),
    PayNo varchar(50),
    PayDate timestamp,
    PayDateTxt varchar(50),
    BillAmt decimal(18,2),
    DiscountAmt decimal(18,2),
    NetAmount decimal(18,2),
    RecAmt decimal(18,2),
    DueAmt decimal(18,2),
    PayModeID int,
    PayMode varchar(50),
    BankID int,
    BankName varchar(50),
    BankRef varchar(50),
    PayFeeMonth int,
    PayFeeMonthTxt varchar(50),
    PayFeeYear int,
    Remark varchar(750),
    CollectedBy varchar(250),
    FYear int,
    ReceiptPaidFlag char(1) DEFAULT 'N',
    AckFlag char(1) DEFAULT 'N',
    AckBy varchar(250),
    AckDate varchar(50),
    PublishFlag char(1) DEFAULT 'N',
    AttachFileFlag char(1) DEFAULT 'N',
    AttachFilePath varchar(750),
    AttachFileName varchar(750),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: TenantSetting
CREATE TABLE TenantSetting (
    SettingID SERIAL PRIMARY KEY,
    TenantID int,
    EntityName varchar(450),
    EntityAddress_1 varchar(450),
    EntityAddress_2 varchar(450),
    EntityAddress_3 varchar(450),
    EntityAddress_4 varchar(450),
    EntityAddress_5 varchar(450),
    EntityMobile_1 varchar(50),
    EntityMobile_2 varchar(50),
    EntityLanline_1 varchar(50),
    EntityLanline_2 varchar(50),
    EntityLogoFlag char(1) DEFAULT 'N',
    EntityLogo varchar(750),
    TIN varchar(250),
    PAN varchar(250),
    ServiceRegNo varchar(250),
    IsActive char(1) DEFAULT 'Y',
    FinancialYearFrom int,
    FinancialYearTo int,
    RegNPrefix varchar(50),
    MoneyRecPrefix varchar(50),
    BillRefPrefix varchar(50),
    KeyActivateFlag char(1) DEFAULT 'N',
    ActivateDate timestamp,
    KeyCode varchar(450),
    SuscriptionPlanID int,
    SuscriptionPlan varchar(250),
    PlanStartDate timestamp,
    PlanEndDate timestamp,
    CompanyNo varchar(50),
    GSTNo varchar(50),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    Custom_3 varchar(50),
    UpdatedBy varchar(250),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CurrencyFlag char(1) DEFAULT 'N',
    CurrencyName varchar(50)
);

-- ============================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================

ALTER TABLE FuncRoleAccess 
    ADD CONSTRAINT FK_FuncRoleAccess_RoleMaster 
    FOREIGN KEY (RoleAccessID) REFERENCES RoleMaster(RoleID);

ALTER TABLE RoleMenuMapping 
    ADD CONSTRAINT FK_RoleMenuMapping_RoleMaster 
    FOREIGN KEY (RoleMasterID) REFERENCES RoleMaster(RoleID);

ALTER TABLE VisitorSubCategory 
    ADD CONSTRAINT FK_VisitorSubCategory_VisitorCategory 
    FOREIGN KEY (VisitorCatID) REFERENCES VisitorCategory(VisitorCatID);

ALTER TABLE Notice 
    ADD CONSTRAINT FK_Notice_NoticeCategoryMaster 
    FOREIGN KEY (NoticeCatID) REFERENCES NoticeCategoryMaster(NoticeCatID);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_tenant_id ON DepartmentMaster(TenantID);
CREATE INDEX idx_fcm_tenant_login ON FCM(TenantID, LoginUserID);
CREATE INDEX idx_flat_tenant ON FlatMaster(TenantID);
CREATE INDEX idx_login_user_tenant ON LoginUser(TenantID, UserName);
CREATE INDEX idx_visitor_tenant_status ON VisitorMaster(TenantID, StatusID);
CREATE INDEX idx_visitor_reg_tenant ON VisitorRegistration(TenantID);
CREATE INDEX idx_loginuser_tenant ON LoginUser(TenantID);
CREATE INDEX idx_loginuser_username ON LoginUser(UserName);
CREATE INDEX idx_loginuser_email ON LoginUser(Email);
CREATE INDEX idx_loginuser_role ON LoginUser(RoleAccessID);
CREATE INDEX idx_visitor_mobile ON VisitorMaster(TenantID, Mobile);
CREATE INDEX idx_visitor_intime ON VisitorMaster(TenantID, INTime);
CREATE INDEX idx_visitor_outtime ON VisitorMaster(TenantID, OutTime);
CREATE INDEX idx_visitor_reg_mobile ON VisitorRegistration(TenantID, Mobile);
CREATE INDEX idx_portal_otp_mobile ON PortalOTP(TenantID, MobileNo);
CREATE INDEX idx_incident_tenant_status ON IncidentEntry(TenantID, StatusID);
CREATE INDEX idx_visitor_master_tenant_mobile ON VisitorMaster(TenantID, Mobile);
CREATE INDEX idx_visitor_registration_tenant_mobile ON VisitorRegistration(TenantID, Mobile);
CREATE INDEX idx_visitor_registration_tenant_category ON VisitorRegistration(TenantID, VisitorCatID);
CREATE INDEX idx_portal_otp_mobile_active ON PortalOTP(MobileNo, IsActive);
CREATE INDEX idx_portal_otp_created_date ON PortalOTP(CreatedDate);
CREATE INDEX idx_visitor_subcategory_tenant_category ON VisitorSubCategory(TenantID, VisitorCatID);
CREATE INDEX idx_visitor_purpose_tenant_category ON VisitorPuposeMaster(TenantID, PurposeCatID);
CREATE INDEX idx_visitor_regvisit_tenant_visitor ON VisitorRegVisitHistory(TenantID, VisitorRegID);
CREATE INDEX idx_visitor_regvisit_mobile ON VisitorRegVisitHistory(TenantID, Mobile);
CREATE INDEX idx_visitor_regvisit_intime ON VisitorRegVisitHistory(TenantID, INTime);
CREATE INDEX idx_visitor_regvisit_outtime ON VisitorRegVisitHistory(TenantID, OutTime);
CREATE INDEX idx_visitor_regvisit_category ON VisitorRegVisitHistory(TenantID, VisitorCatID);

-- ============================================================
-- INITIAL DATA SETUP
-- ============================================================

-- Insert default tenant
INSERT INTO Tenant (
    TenantID, TenantName, TenantCode, ShortName, Email, Mobile, Address1,
    IsActive, StatusID, SuscriptionStartDate, SuscriptionEndDate, 
    FinancialYear, EntityLogoFlag, KeyActivateFlag, CreatedDate, UpdatedDate
) VALUES (
    1001, 'Rely Gate Pass System', 'RELY1001', 'RGPS', 
    'admin@relygate.com', '+91-9876543210', 'Technology Center, Innovation Hub',
    'Y', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year', 
    2025, 'N', 'Y', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Insert default status codes
INSERT INTO StatusCodeMaster (StatusID, TenantID, StatusCode, StatusShortName, StatusLongName, IsActive, Process) VALUES
(1, 1001, 'ACTIVE', 'Active', 'Active Status', 'Y', 'General'),
(2, 1001, 'INACTIVE', 'Inactive', 'Inactive Status', 'Y', 'General'),
(3, 1001, 'PENDING', 'Pending', 'Pending Approval', 'Y', 'Visitor'),
(4, 1001, 'APPROVED', 'Approved', 'Approved Entry', 'Y', 'Visitor'),
(5, 1001, 'CHECKEDIN', 'Checked In', 'Visitor Checked In', 'Y', 'Visitor'),
(6, 1001, 'CHECKEDOUT', 'Checked Out', 'Visitor Checked Out', 'Y', 'Visitor'),
(7, 1001, 'REJECTED', 'Rejected', 'Entry Rejected', 'Y', 'Visitor');

-- Insert default roles
INSERT INTO RoleMaster (TenantID, IsActive, RoleCode, RoleName, RoleRemark, CreatedBy, UpdatedBy) VALUES
(1001, 'Y', 'ADMIN', 'Administrator', 'System Administrator', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'GUARD', 'Security Guard', 'Security Personnel', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'RESIDENT', 'Resident', 'Resident User', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'MANAGER', 'Manager', 'Property Manager', 'SYSTEM', 'SYSTEM');

-- Insert default admin user
INSERT INTO LoginUser (
    TenantID, IsActive, RoleAccessID, RoleName, FirstN, LastN, 
    UserName, Passwrd, DisplayN, Email, Mobile, CreatedBy, UpdatedBy
) VALUES (
    1001, 'Y', 1, 'Administrator', 'System', 'Admin', 
    'admin', '$2b$10$rWyWJGE4qx4j8XhTx5OKf.PcEKKZZWjVKZF8nQ8Hx3vJ2qx3xWy1K', 
    'System Administrator', 'admin@relygate.com', '9876543210', 'SYSTEM', 'SYSTEM'
);

-- Insert default visitor categories
INSERT INTO VisitorCategory (VisitorCatID, TenantID, IsActive, VisitorCatName, CreatedBy, UpdatedBy) VALUES
(1, 1001, 'Y', 'Staff', 'SYSTEM', 'SYSTEM'),
(2, 1001, 'Y', 'Unregistered', 'SYSTEM', 'SYSTEM'),
(3, 1001, 'Y', 'Student', 'SYSTEM', 'SYSTEM'),
(4, 1001, 'Y', 'Guest', 'SYSTEM', 'SYSTEM'),
(5, 1001, 'Y', 'Bus', 'SYSTEM', 'SYSTEM');

-- Insert default visitor subcategories
INSERT INTO VisitorSubCategory (TenantID, VisitorCatID, VisitorCatName, VisitorSubCatName, IsActive, CreatedBy, UpdatedBy) VALUES
(1001, 1, 'Staff', 'Security', 'Y', 'SYSTEM', 'SYSTEM'),
(1001, 1, 'Staff', 'Maintenance', 'Y', 'SYSTEM', 'SYSTEM'),
(1001, 1, 'Staff', 'Cleaning', 'Y', 'SYSTEM', 'SYSTEM'),
(1001, 2, 'Unregistered', 'Walk-in Visitor', 'Y', 'SYSTEM', 'SYSTEM'),
(1001, 2, 'Unregistered', 'Emergency', 'Y', 'SYSTEM', 'SYSTEM'),
(1001, 3, 'Student', 'Regular Student', 'Y', 'SYSTEM', 'SYSTEM'),
(1001, 3, 'Student', 'New Admission', 'Y', 'SYSTEM', 'SYSTEM'),
(1001, 4, 'Guest', 'Family Member', 'Y', 'SYSTEM', 'SYSTEM'),
(1001, 4, 'Guest', 'Friend', 'Y', 'SYSTEM', 'SYSTEM'),
(1001, 5, 'Bus', 'Delivery', 'Y', 'SYSTEM', 'SYSTEM'),
(1001, 5, 'Bus', 'Service Provider', 'Y', 'SYSTEM', 'SYSTEM');

-- Insert default visit purposes
INSERT INTO VisitorPuposeMaster (TenantID, IsActive, PurposeCatID, PurposeCatName, VisitPurpose, CreatedBy, UpdatedBy) VALUES
-- General purposes
(1001, 'Y', 1, 'General', 'Personal Visit', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 1, 'General', 'Business Meeting', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 1, 'General', 'Maintenance Work', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 1, 'General', 'Package Delivery', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 1, 'General', 'Emergency Service', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 1, 'General', 'Official Work', 'SYSTEM', 'SYSTEM'),
-- Bus purposes
(1001, 'Y', 2, 'Bus', 'Passenger Transport', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 2, 'Bus', 'Emergency Response', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 2, 'Bus', 'Maintenance Work', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 2, 'Bus', 'Security Patrol', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 2, 'Bus', 'Supply Delivery', 'SYSTEM', 'SYSTEM'),
-- Student purposes
(1001, 'Y', 3, 'Student', 'Library Visit', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 3, 'Student', 'Canteen/Mess', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 3, 'Student', 'Sports Activity', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 3, 'Student', 'Medical Visit', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 3, 'Student', 'Shopping', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 3, 'Student', 'Home Visit', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 3, 'Student', 'Class/Study', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 3, 'Student', 'Administrative Work', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 3, 'Student', 'Recreation', 'SYSTEM', 'SYSTEM');

(1001, 'Y', 6, 'Gate Pass', 'Library Visit', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 6, 'Gate Pass', 'Canteen/Mess', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 6, 'Gate Pass', 'Sports Activity', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 6, 'Gate Pass', 'Medical Visit', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 6, 'Gate Pass', 'Shopping', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 6, 'Gate Pass', 'Home Visit', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 6, 'Gate Pass', 'Class/Study', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 6, 'Gate Pass', 'Administrative Work', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 6, 'Gate Pass', 'Recreation', 'SYSTEM', 'SYSTEM');


-- Insert default ID types
INSERT INTO IDMaster (TenantID, IsActive, IDName, CreatedBy, UpdatedBy) VALUES
(1001, 'Y', 'Aadhaar Card', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'Driving License', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'Passport', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'Voter ID', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'PAN Card', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'Employee ID', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'Student ID', 'SYSTEM', 'SYSTEM');

-- Insert sample flats
INSERT INTO FlatMaster (TenantID, IsActive, FlatName, CreatedBy, UpdatedBy) VALUES
(1001, 'Y', 'A-101', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'A-102', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'A-201', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'A-202', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'B-101', 'SYSTEM', 'SYSTEM'),
(1001, 'Y', 'B-102', 'SYSTEM', 'SYSTEM');

-- ============================================================
-- SAMPLE DATA FOR TESTING - Students
-- ============================================================

-- Insert Student Bulk Upload Data
INSERT INTO BulkVisitorUpload (StudentID, Name, Mobile, Course, Hostel, TenantID, Type) VALUES
-- Computer Science Students
('CS001', 'Rahul Sharma', '9876543210', 'Computer Science', 'Hostel A', '1001', 'student'),
('CS002', 'Priya Patel', '9876543211', 'Computer Science', 'Hostel B', '1001', 'student'),
('CS003', 'Amit Kumar', '9876543212', 'Computer Science', 'Hostel A', '1001', 'student'),
('CS004', 'Sneha Singh', '9876543213', 'Computer Science', 'Hostel C', '1001', 'student'),
('CS005', 'Vikash Gupta', '9876543214', 'Computer Science', 'Hostel A', '1001', 'student'),
-- Electronics Engineering Students  
('EC001', 'Anita Verma', '9876543215', 'Electronics Engineering', 'Hostel B', '1001', 'student'),
('EC002', 'Rajesh Yadav', '9876543216', 'Electronics Engineering', 'Hostel D', '1001', 'student'),
('EC003', 'Kavya Nair', '9876543217', 'Electronics Engineering', 'Hostel C', '1001', 'student'),
('EC004', 'Suresh Reddy', '9876543218', 'Electronics Engineering', 'Hostel A', '1001', 'student'),
('EC005', 'Meera Joshi', '9876543219', 'Electronics Engineering', 'Hostel B', '1001', 'student');

-- ============================================================
-- SAMPLE DATA FOR TESTING - Staff
-- ============================================================

-- Insert Staff Bulk Upload Data
INSERT INTO BulkVisitorUpload (StudentID, Name, Mobile, Course, Hostel, TenantID, Type) VALUES
-- Security Staff
('SEC001', 'Rajesh Kumar', '9876540001', 'Senior Security Officer', 'Main Gate', '1001', 'staff'),
('SEC002', 'Suresh Sharma', '9876540002', 'Security Guard', 'North Gate', '1001', 'staff'),
('SEC003', 'Mahesh Gupta', '9876540003', 'Security Guard', 'East Gate', '1001', 'staff'),
-- Maintenance Staff  
('MNT001', 'Anil Verma', '9876540006', 'Maintenance Supervisor', 'Block A', '1001', 'staff'),
('MNT002', 'Vijay Singh', '9876540007', 'Electrician', 'Block B', '1001', 'staff'),
('MNT003', 'Sanjay Mishra', '9876540008', 'Plumber', 'Block C', '1001', 'staff');

-- ============================================================
-- SAMPLE DATA FOR TESTING - Buses
-- ============================================================

-- Insert Bus Bulk Upload Data
INSERT INTO BulkVisitorUpload (StudentID, Name, Mobile, Course, Hostel, TenantID, Type) VALUES
-- School Buses
('REG001', 'School Bus 01', '9876540001', 'Rajesh Kumar', 'Route A - Main Gate', '1001', 'bus'),
('REG002', 'School Bus 02', '9876540002', 'Suresh Sharma', 'Route B - North Gate', '1001', 'bus'),
('REG003', 'School Bus 03', '9876540003', 'Mahesh Gupta', 'Route C - East Gate', '1001', 'bus'),
-- College Buses  
('REG006', 'College Express 01', '9876540006', 'Anil Verma', 'City Route 1', '1001', 'bus'),
('REG007', 'College Express 02', '9876540007', 'Vijay Singh', 'City Route 2', '1001', 'bus'),
('REG008', 'College Express 03', '9876540008', 'Sanjay Mishra', 'Highway Route', '1001', 'bus');

-- ============================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================