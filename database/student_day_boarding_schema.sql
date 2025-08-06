-- Table: StudentDayBoardingList (Day boarding students from bulk upload)
CREATE TABLE StudentDayBoardingList (
    StudentDayBoardingID BIGSERIAL PRIMARY KEY,
    TenantID INT NOT NULL,
    StudentID VARCHAR(100) NOT NULL,
    StudentName VARCHAR(500) NOT NULL,
    Course VARCHAR(500),
    Section VARCHAR(100),
    Year VARCHAR(50),
    PrimaryGuardianName VARCHAR(250) NOT NULL,
    PrimaryGuardianPhone VARCHAR(20) NOT NULL,
    GuardianRelation VARCHAR(100),
    VisitorCatID INT DEFAULT 7,
    VisitorCatName VARCHAR(100) DEFAULT 'Day Boarding Student',
    IsActive CHAR(1) DEFAULT 'Y',
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CreatedBy VARCHAR(250),
    UpdatedBy VARCHAR(250)
);

-- Table: StudentDayBoardingAuthMaster (Guardian authentication master)
CREATE TABLE StudentDayBoardingAuthMaster (
    AuthMasterID BIGSERIAL PRIMARY KEY,
    TenantID INT NOT NULL,
    StudentDayBoardingID BIGINT NOT NULL, 
    Name VARCHAR(250) NOT NULL,
    PhoneNumber VARCHAR(20) NOT NULL,
    PhotoFlag CHAR(1) DEFAULT 'N',
    PhotoPath VARCHAR(750),
    PhotoName VARCHAR(250),
    Relation VARCHAR(100),
    IsActive CHAR(1) DEFAULT 'Y',
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CreatedBy VARCHAR(250),
    UpdatedBy VARCHAR(250)
);

-- Table: StudentDayBoardingAuthMasterLink (Link between students and guardians)
CREATE TABLE StudentDayBoardingAuthMasterLink (
    LinkID BIGSERIAL PRIMARY KEY,
    TenantID INT NOT NULL,
    StudentDayBoardingID BIGINT NOT NULL,
    AuthMasterID BIGINT NOT NULL,
    StudentID VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(20) NOT NULL, 
    -- PRIMARY phone number of parent/guardain - get only
    -- name
    -- view approvavl by student
    Relation VARCHAR(100),
    PhotoFlag CHAR(1) DEFAULT 'N',
    PhotoPath VARCHAR(750),
    PhotoName VARCHAR(250),
    IsActive CHAR(1) DEFAULT 'Y',
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CreatedBy VARCHAR(250),
    UpdatedBy VARCHAR(250)
);

-- Table: StudentDayBoardingHistory (Check-out history and tracking)
CREATE TABLE StudentDayBoardingHistory (
    HistoryID BIGSERIAL PRIMARY KEY,
    TenantID INT NOT NULL,
    StudentDayBoardingID BIGINT NOT NULL,
    AuthMasterID BIGINT NOT NULL,
    StudentID VARCHAR(100) NOT NULL,
    StudentName VARCHAR(500) NOT NULL,
    GuardianName VARCHAR(250) NOT NULL,
    GuardianPhone VARCHAR(20) NOT NULL,
    Relation VARCHAR(100),
    VisitorCatID INT DEFAULT 7,
    VisitorCatName VARCHAR(100) DEFAULT 'Day Boarding Student',
    CheckInTime TIMESTAMP NOT NULL,
    CheckInTimeTxt VARCHAR(50),
    CheckOutTime TIMESTAMP NOT NULL,
    CheckOutTimeTxt VARCHAR(50),
    OTPSent CHAR(1) DEFAULT 'N',
    OTPVerified CHAR(1) DEFAULT 'N',
    OTPNumber VARCHAR(10),
    OTPSentTime TIMESTAMP,
    OTPVerifiedTime TIMESTAMP,
    Status VARCHAR(50) DEFAULT 'CHECKED_OUT',
    Remarks VARCHAR(500),
    IsActive CHAR(1) DEFAULT 'Y',
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CreatedBy VARCHAR(250),
    UpdatedBy VARCHAR(250)
);
