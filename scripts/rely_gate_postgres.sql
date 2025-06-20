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

-- Table: DepartmentMaster
CREATE TABLE DepartmentMaster (
    DeptID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    DeptCode varchar(50),
    DeptName varchar(250),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: FCM
CREATE TABLE FCM (
    FirebaseID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    FCMID varchar(250),
    AndroidID varchar(250),
    LoginUserID int,
    FlatID int,
    FlatName varchar(450),
    DeviceName varchar(250),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    Custom_3 varchar(50),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: FlatMaster
CREATE TABLE FlatMaster (
    FlatID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    FlatName varchar(350),
    FloorID int,
    FloorName varchar(250),
    BlockID int,
    BlockName varchar(250),
    OwnerFName varchar(50),
    OwnerMName varchar(50),
    OwnerLName varchar(50),
    RentFlag char(1),
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
    IsVacant char(1),
    OwnerPhotoFlag char(1),
    OwnerPhotoPath varchar(750),
    OwnerPhoto varchar(750),
    RenterPhotoFlag char(1),
    RenterPhotoPath varchar(750),
    RenterPhoto varchar(750),
    RenterIDProofFlag char(1),
    RentID int,
    RenterIDName varchar(50),
    NoFamilyMember int,
    NoChildren int,
    NoMaid int,
    Remark varchar(750),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: FloorMaster
CREATE TABLE FloorMaster (
    FloorID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) NOT NULL,
    FloorName varchar(250) NOT NULL,
    BlockID int,
    BlockName varchar(250),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: FuctionalityMaster
CREATE TABLE FuctionalityMaster (
    FuncID int PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    FuctionalityName varchar(750),
    GroupID int,
    GroupName varchar(50),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: FuncRoleAccess
CREATE TABLE FuncRoleAccess (
    AccessID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    RoleAccessID int NOT NULL,
    FuncID int NOT NULL,
    FuctionalityName varchar(750),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(250),
    UpdatedBy varchar(250),
    CustomField varchar(450)
);

-- Table: IDMaster
CREATE TABLE IDMaster (
    IdentityID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    IDName varchar(250),
    IDIconFlag char(1),
    IDIconPath varchar(750),
    IDIconPic varchar(750),
    Remark varchar(250),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: ImportanceMaster
CREATE TABLE ImportanceMaster (
    ImportanceID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    Importance varchar(50),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: ImportantContact
CREATE TABLE ImportantContact (
    ContactID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    ContactGroupID int,
    ContactGroupName varchar(50),
    ContactGroupOrder int,
    ContactName varchar(50),
    ContactNumber varchar(50),
    ContactDisplayOrder int,
    Priority varchar(50),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: IncidentCatMaster
CREATE TABLE IncidentCatMaster (
    IncidentCatID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    IncidentCatName varchar(250),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: IncidentEntry
CREATE TABLE IncidentEntry (
    IncidentID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
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
    PhotoFlag char(1),
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
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);


-- Table: ModuleMaster
CREATE TABLE ModuleMaster (
    ModuleID int PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) NOT NULL,
    ParentMenuID int,
    ModuleName varchar(450) NOT NULL,
    MenuUrl varchar(1000) NOT NULL,
    CusName varchar(350),
    HomeIconFlag char(1),
    ImageURL varchar(1000),
    ImageHeight varchar(50),
    Version varchar(50),
    DisplayOrder int,
    HomeIconDispOrder int,
    ChildIconDisplayOrder int,
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: Notice
CREATE TABLE Notice (
    NoticeID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    NoticeCatID int,
    NoticeCategoryName varchar(50),
    IsImportant char(1),
    NoticeDesc varchar(750),
    ActiveDate varchar(50),
    DisplayTillDate varchar(50),
    DisplayOrder int,
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: NoticeCategoryMaster
CREATE TABLE NoticeCategoryMaster (
    NoticeCatID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    NoticeCategoryName varchar(50),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: Photo
CREATE TABLE Photo (
    PhotoID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    StatusID int,
    PCategoryID int,
    CategoryName varchar(50),
    PhotoPath varchar(250),
    PhotoN varchar(50),
    Phototext varchar(250),
    OrderNumber int,
    IsCoverPhoro char(1),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: PortalOTP
CREATE TABLE PortalOTP (
    PPOTPID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    MobileNo varchar(20),
    OTPNumber varchar(50),
    CreatedDate timestamp,
    CreatedBy varchar(250)
);

-- Table: RelationMaster
CREATE TABLE RelationMaster (
    RelationCatID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    RelationName varchar(50),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    Custom_3 varchar(50),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: ReportProblem
CREATE TABLE ReportProblem (
    ReportProblemID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    StatusID int,
    StatusName varchar(50),
    SubjectName varchar(750),
    Message varchar(4000),
    CreatedDateTxt varchar(50),
    ImportanceCatID int,
    ImportanceCat varchar(50),
    AttachFileFlag char(1),
    AttachFileName varchar(250),
    AttachFileLocation varchar(250),
    ResolvedDate varchar(50),
    ResolvedBy varchar(50),
    ResolvedRemark varchar(750),
    Important char(1),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(20),
    UpdatedBy varchar(20)
);

-- Table: RoleMaster
CREATE TABLE RoleMaster (
    RoleID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) NOT NULL,
    RoleCode varchar(50),
    RoleName varchar(250) NOT NULL,
    RoleRemark varchar(450),
    CreatedDate timestamp,
    UpdatedDate timestamp,
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
    IsActive char(1),
    CustomField varchar(450)
);

-- Table: SMSGatewayMaster
CREATE TABLE SMSGatewayMaster (
    SMSGatewayID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    SMSEnabledFlag char(1) NOT NULL,
    GatewayURL varchar(750),
    ApiKeyFlag char(1),
    ApiKeyName varchar(750),
    UserName varchar(450),
    Passwrd varchar(450),
    SenderVendor varchar(450),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

-- Table: StatusCodeMaster
CREATE TABLE StatusCodeMaster (
    StatusID int PRIMARY KEY,
    TenantID int NOT NULL,
    StatusCode varchar(20) NOT NULL,
    StatusShortName varchar(50) NOT NULL,
    StatusLongName varchar(250),
    IsActive char(1),
    Process varchar(50),
    SubProcess varchar(250),
    SubSubPro varchar(50),
    CreatedDate timestamp,
    UpdatedDate timestamp
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
    IsActive char(1),
    StatusID int,
    SuscriptionStartDate timestamp,
    SuscriptionEndDate timestamp,
    TenantRemark varchar(750),
    FinancialYear int,
    EntityLogoFlag char(1),
    EntityLogo varchar(750),
    EntityLogoPath varchar(750),
    CompanyNo varchar(50),
    GSTNo varchar(50),
    ServiceRegNo varchar(250),
    RegNPrefix varchar(50),
    MoneyRecPrefix varchar(50),
    BillRefPrefix varchar(50),
    KeyActivateFlag char(1),
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
    CreatedDate timestamp,
    UpdatedDate timestamp
);

-- Table: TenantPaymentHistory
CREATE TABLE TenantPaymentHistory (
    TenantPayID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
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
    ReceiptPaidFlag char(1),
    AckFlag char(1),
    AckBy varchar(250),
    AckDate varchar(50),
    PublishFlag char(1),
    AttachFileFlag char(1),
    AttachFilePath varchar(750),
    AttachFileName varchar(750),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    CreatedDate timestamp,
    UpdatedDate timestamp,
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
    EntityLogoFlag char(1),
    EntityLogo varchar(750),
    TIN varchar(250),
    PAN varchar(250),
    ServiceRegNo varchar(250),
    IsActive char(1),
    FinancialYearFrom int,
    FinancialYearTo int,
    RegNPrefix varchar(50),
    MoneyRecPrefix varchar(50),
    BillRefPrefix varchar(50),
    KeyActivateFlag char(1),
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
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CurrencyFlag char(1),
    CurrencyName varchar(50)
);

-- Table: VisitorCategory
CREATE TABLE VisitorCategory (
    VisitorCatID int PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    VisitorCatName varchar(100),
    VisitorCatIconFlag char(1),
    VisitorCatIconPath varchar(750),
    VisitorCatIcon varchar(750),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: VisitorMaster
CREATE TABLE VisitorMaster (
    VisitorID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
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
    OTPVerified char(1),
    Address_1 varchar(250),
    OTPVerifiedDate varchar(50),
    TotalVisitor int,
    FlatID int,
    FlatName varchar(50),
    MeetingWithID int,
    MeetingWith varchar(50),
    LoginID int,
    LoginName varchar(50),
    VisitDate timestamp,
    VisitDateTxt varchar(50),
    PhotoFlag char(1),
    PhotoPath varchar(750),
    PhotoName varchar(750),
    VehiclelNo varchar(50),
    VehiclePhotoFlag char(1),
    VehiclePhotoPath varchar(750),
    VehiclePhotoName varchar(750),
    Remark varchar(250),
    INTime timestamp,
    INTimeTxt varchar(50),
    OutTime timestamp,
    OutTimeTxt varchar(50),
    IsProblematic char(1),
    ProblematicRemark varchar(750),
    ConvertFlag char(1),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: VisitorPuposeMaster
CREATE TABLE VisitorPuposeMaster (
    VisitPurposeID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    PurposeCatID int,
    PurposeCatName varchar(250),
    VisitPurpose varchar(250),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: VisitorRegistration
CREATE TABLE VisitorRegistration (
    VisitorRegID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
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
    PhotoFlag char(1),
    PhotoPath varchar(750),
    PhotoName varchar(750),
    VehiclelNo varchar(50),
    VehiclePhotoFlag char(1),
    VehiclePhotoPath varchar(750),
    VehiclePhotoName varchar(750),
    Remark varchar(250),
    IdentityID int,
    IDName varchar(250),
    IDNumber varchar(50),
    IDPhotoFlag char(1),
    IDPhotoPath varchar(750),
    IDPhotoName varchar(750),
    AssociatedFlat varchar(750),
    AssociatedBlock varchar(750),
    ValidityFlag char(1),
    ValidStartDate timestamp,
    ValidEndDate timestamp,
    FlatID int,
    FlatName varchar(50),
    IsProblematic char(1),
    ProblematicRemark varchar(750),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    Custom_3 varchar(50),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: VisitorRegVisitHistory
CREATE TABLE VisitorRegVisitHistory (
    RegVisitorHistoryID BIGSERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    IsRegFlag char(1),
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
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Table: VisitorSubCategory
CREATE TABLE VisitorSubCategory (
    VisitorSubCatID SERIAL PRIMARY KEY,
    TenantID int,
    IsActive char(1),
    VisitorCatID int,
    VisitorCatName varchar(100),
    VisitorCatIconFlag char(1),
    VisitorCatIconPath varchar(750),
    VisitorCatIcon varchar(750),
    VisitorSubCatName varchar(100),
    VisitorSubCatIconFlag char(1),
    VisitorSubCatIconPath varchar(750),
    VisitorSubCatIcon varchar(750),
    CreatedDate timestamp,
    UpdatedDate timestamp,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);

-- Foreign Key Constraints
ALTER TABLE FuncRoleAccess 
    ADD CONSTRAINT FK_FuncRoleAccess_RoleMaster 
    FOREIGN KEY (RoleAccessID) REFERENCES RoleMaster(RoleID);

ALTER TABLE Notice 
    ADD CONSTRAINT FK_Notice_NoticeCategoryMaster 
    FOREIGN KEY (NoticeCatID) REFERENCES NoticeCategoryMaster(NoticeCatID);

ALTER TABLE RoleMenuMapping 
    ADD CONSTRAINT FK_RoleMenuMapping_RoleMaster 
    FOREIGN KEY (RoleMasterID) REFERENCES RoleMaster(RoleID);

ALTER TABLE VisitorSubCategory 
    ADD CONSTRAINT FK_VisitorSubCategory_VisitorCategory 
    FOREIGN KEY (VisitorCatID) REFERENCES VisitorCategory(VisitorCatID);

CREATE INDEX idx_tenant_id ON DepartmentMaster(TenantID);
CREATE INDEX idx_fcm_tenant_login ON FCM(TenantID, LoginUserID);
CREATE INDEX idx_flat_tenant ON FlatMaster(TenantID);
CREATE INDEX idx_incident_tenant_status ON IncidentEntry(TenantID, StatusID);
CREATE INDEX idx_login_user_tenant ON LoginUser(TenantID, UserName);
CREATE INDEX idx_visitor_tenant_status ON VisitorMaster(TenantID, StatusID);
CREATE INDEX idx_visitor_reg_tenant ON VisitorRegistration(TenantID);

