# Rely Gate Database Documentation

## Overview

The Rely Gate system is a comprehensive multi-tenant visitor management platform built on PostgreSQL. The database architecture supports educational institutions, residential complexes, and corporate environments with strict tenant isolation, audit trails, and role-based access control.

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Multi-Tenant Design](#multi-tenant-design)
3. [Core Tables](#core-tables)
4. [Entity Relationships](#entity-relationships)
5. [Business Domain Models](#business-domain-models)
6. [Audit Trail & Soft Delete Patterns](#audit-trail--soft-delete-patterns)
7. [Indexes and Performance](#indexes-and-performance)
8. [Data Types & Constraints](#data-types--constraints)
9. [Security Patterns](#security-patterns)
10. [Migration Strategy](#migration-strategy)

## Database Architecture

### Connection Configuration
- **Database**: PostgreSQL 12+
- **Connection Pooling**: pg-pool with configurable limits
- **Environment Support**: Development, Staging, Production
- **SSL**: Enabled in production environments

### Naming Conventions
- **Tables**: PascalCase (e.g., `VisitorMaster`, `LoginUser`)
- **Columns**: PascalCase (e.g., `TenantID`, `CreatedDate`)
- **Primary Keys**: Auto-incrementing integers with descriptive suffix (e.g., `VisitorID`, `LoginID`)
- **Foreign Keys**: Matching parent table's primary key name

## Multi-Tenant Design

### Tenant Isolation Strategy
Every table includes a `TenantID` column ensuring complete data segregation:

```sql
-- Example tenant-scoped query pattern
SELECT * FROM VisitorMaster 
WHERE TenantID = $1 AND IsActive = 'Y'
```

### Tenant Table Structure
```sql
CREATE TABLE Tenant (
    TenantID int PRIMARY KEY,
    TenantName varchar(450) NOT NULL,
    TenantCode varchar(1000),
    ShortName varchar(250),
    IsActive char(1),
    SuscriptionStartDate timestamp,
    SuscriptionEndDate timestamp,
    -- Additional tenant configuration fields
);
```

## Core Tables

### 1. Authentication & Authorization

#### LoginUser
**Purpose**: System user authentication and role management
```sql
CREATE TABLE LoginUser (
    LoginID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    UserName varchar(250) NOT NULL UNIQUE,
    Passwrd varchar(1000) NOT NULL,  -- bcrypt hashed
    FirstN varchar(100),
    MiddleN varchar(100),
    LastN varchar(100),
    DisplayN varchar(250),
    Email varchar(150),
    Mobile varchar(50),
    RoleAccessID int,
    RoleName varchar(250),
    IsActive char(1) DEFAULT 'Y',
    LastLogin timestamp,
    LastPasswrdChgedDate timestamp,
    LinkFlatFlag char(1),
    LinkeFlatID varchar(250),
    LinkeFlatName varchar(450),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);
```

#### RoleMaster
**Purpose**: Role definition and permissions
```sql
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
```

### 2. Visitor Management Core

#### VisitorCategory
**Purpose**: Categorizes visitors (Staff, Student, Guest, Bus, etc.)
```sql
CREATE TABLE VisitorCategory (
    VisitorCatID int PRIMARY KEY,
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
```

#### VisitorSubCategory
**Purpose**: Sub-categorization within visitor types
```sql
CREATE TABLE VisitorSubCategory (
    VisitorSubCatID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    VisitorCatID int,
    VisitorCatName varchar(100),
    VisitorSubCatName varchar(100),
    -- Icon and metadata fields
    FOREIGN KEY (VisitorCatID) REFERENCES VisitorCategory(VisitorCatID)
);
```

#### VisitorPuposeMaster
**Purpose**: Visit purposes and business reasons
```sql
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
```

#### VisitorRegistration
**Purpose**: Pre-registered visitor profiles
```sql
CREATE TABLE VisitorRegistration (
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
    
    -- Photo management
    PhotoFlag char(1) DEFAULT 'N',
    PhotoPath varchar(750),
    PhotoName varchar(750),
    
    -- Vehicle information
    VehiclelNo varchar(50),
    VehiclePhotoFlag char(1) DEFAULT 'N',
    VehiclePhotoPath varchar(750),
    VehiclePhotoName varchar(750),
    
    -- Identity documentation
    IdentityID int,
    IDName varchar(250),
    IDNumber varchar(50),
    IDPhotoFlag char(1) DEFAULT 'N',
    IDPhotoPath varchar(750),
    IDPhotoName varchar(750),
    
    -- Location associations
    AssociatedFlat varchar(750),
    AssociatedBlock varchar(750),
    FlatID int,
    FlatName varchar(50),
    
    -- Validity and status
    ValidityFlag char(1) DEFAULT 'Y',
    ValidStartDate timestamp DEFAULT CURRENT_TIMESTAMP,
    ValidEndDate timestamp,
    IsProblematic char(1) DEFAULT 'N',
    ProblematicRemark varchar(750),
    
    -- Audit fields
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50),
    
    -- Custom fields for extensibility
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    Custom_3 varchar(50)
);
```

#### VisitorMaster
**Purpose**: Unregistered/walk-in visitor records
```sql
CREATE TABLE VisitorMaster (
    VisitorID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    StatusID int DEFAULT 1,
    StatusName varchar(50) DEFAULT 'ACTIVE',
    
    -- Visitor categorization
    VisitorCatID int,
    VisitorCatName varchar(100),
    VisitorSubCatID int,
    VisitorSubCatName varchar(100),
    VisitPurposeID int,
    VisitPurpose varchar(250),
    
    -- Personal information
    SalutationID int,
    Salutation varchar(50),
    Fname varchar(50),
    Mname varchar(50),
    Lname varchar(50),
    Mobile varchar(20),
    Address_1 varchar(250),
    
    -- Visit details
    TotalVisitor int DEFAULT 1,
    FlatID int,
    FlatName varchar(50),
    MeetingWithID int,
    MeetingWith varchar(50),
    LoginID int,
    LoginName varchar(50),
    VisitDate timestamp DEFAULT CURRENT_TIMESTAMP,
    VisitDateTxt varchar(50),
    
    -- Photo management
    PhotoFlag char(1) DEFAULT 'N',
    PhotoPath varchar(750),
    PhotoName varchar(750),
    
    -- Vehicle information
    VehiclelNo varchar(50),
    VehiclePhotoFlag char(1) DEFAULT 'N',
    VehiclePhotoPath varchar(750),
    VehiclePhotoName varchar(750),
    
    -- Visit tracking
    INTime timestamp DEFAULT CURRENT_TIMESTAMP,
    INTimeTxt varchar(50),
    OutTime timestamp,
    OutTimeTxt varchar(50),
    
    -- OTP verification
    OTPVerified char(1) DEFAULT 'N',
    OTPVerifiedDate varchar(50),
    
    -- Security flags
    IsProblematic char(1) DEFAULT 'N',
    ProblematicRemark varchar(750),
    ConvertFlag char(1) DEFAULT 'N',
    
    -- Metadata
    Remark varchar(250),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);
```

#### VisitorRegVisitHistory
**Purpose**: Historical visit records for registered visitors
```sql
CREATE TABLE VisitorRegVisitHistory (
    RegVisitorHistoryID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    IsRegFlag char(1) DEFAULT 'Y',
    
    -- Visitor reference
    VisitorRegID bigint,
    VisitorRegNo varchar(50),
    SecurityCode varchar(250),
    VistorName varchar(150),
    Mobile varchar(20),
    VehiclelNo varchar(50),
    
    -- Visit categorization
    VisitorCatID int,
    VisitorCatName varchar(100),
    VisitorSubCatID int,
    VisitorSubCatName varchar(100),
    
    -- Purpose tracking
    VisitPurposeID int,
    VisitPurpose varchar(250),
    PurposeCatID int,
    PurposeCatName varchar(250),
    
    -- Location information
    AssociatedFlat varchar(750),
    AssociatedBlock varchar(750),
    
    -- Time tracking
    INTime timestamp DEFAULT CURRENT_TIMESTAMP,
    INTimeTxt varchar(50),
    OutTime timestamp,
    OutTimeTxt varchar(50),
    
    -- Metadata
    Remark varchar(250),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(50),
    UpdatedBy varchar(50)
);
```

### 3. Infrastructure & Master Data

#### FlatMaster
**Purpose**: Residential unit management
```sql
CREATE TABLE FlatMaster (
    FlatID SERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    FlatName varchar(350),
    FloorID int,
    FloorName varchar(250),
    BlockID int,
    BlockName varchar(250),
    
    -- Owner information
    OwnerFName varchar(50),
    OwnerMName varchar(50),
    OwnerLName varchar(50),
    OwnerMobile varchar(50),
    OwnerMobile_2 varchar(50),
    
    -- Rental information
    RentFlag char(1) DEFAULT 'N',
    RenterFName varchar(50),
    RenterMName varchar(50),
    RenterLName varchar(50),
    RenterMobile varchar(50),
    
    -- Property details
    Area decimal(18,2),
    RentPerMonth decimal(18,2),
    SocietyFeePerMonth decimal(18,2),
    IsVacant char(1) DEFAULT 'N',
    
    -- Family composition
    NoFamilyMember int DEFAULT 0,
    NoChildren int DEFAULT 0,
    NoMaid int DEFAULT 0,
    
    -- Photo management
    OwnerPhotoFlag char(1) DEFAULT 'N',
    OwnerPhotoPath varchar(750),
    OwnerPhoto varchar(750),
    RenterPhotoFlag char(1) DEFAULT 'N',
    RenterPhotoPath varchar(750),
    RenterPhoto varchar(750),
    RenterIDProofFlag char(1) DEFAULT 'N',
    
    -- Metadata
    FlatRemark varchar(750),
    Remark varchar(750),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);
```

#### IDMaster
**Purpose**: Identity document types
```sql
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
```

### 4. OTP & Communication

#### PortalOTP
**Purpose**: OTP management for mobile verification
```sql
CREATE TABLE PortalOTP (
    PPOTPID BIGSERIAL PRIMARY KEY,
    TenantID int NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    MobileNo varchar(20),
    OTPNumber varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250)
);
```

#### FCM (Firebase Cloud Messaging)
**Purpose**: Push notification management
```sql
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
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    Custom_3 varchar(50)
);
```

### 5. Bulk Operations

#### BulkVisitorUpload
**Purpose**: Temporary storage for bulk visitor imports
```sql
CREATE TABLE BulkVisitorUpload (
    StudentID varchar(100),
    Name varchar(500),
    Mobile varchar(20),
    Course varchar(500),
    Hostel varchar(500),
    TenantID varchar(50),
    Type varchar(50)  -- 'student', 'staff', 'bus'
);
```

## Entity Relationships

### Core Relationship Diagram

```
Tenant (1) ──── (∞) LoginUser
   │
   ├── (∞) VisitorCategory
   │     │
   │     └── (∞) VisitorSubCategory
   │
   ├── (∞) VisitorPuposeMaster
   │
   ├── (∞) VisitorRegistration
   │     │
   │     └── (∞) VisitorRegVisitHistory
   │
   ├── (∞) VisitorMaster
   │
   ├── (∞) FlatMaster
   │
   └── (∞) IDMaster
```

### Foreign Key Constraints

```sql
-- Core relationships
ALTER TABLE VisitorSubCategory 
    ADD CONSTRAINT FK_VisitorSubCategory_VisitorCategory 
    FOREIGN KEY (VisitorCatID) REFERENCES VisitorCategory(VisitorCatID);

ALTER TABLE FuncRoleAccess 
    ADD CONSTRAINT FK_FuncRoleAccess_RoleMaster 
    FOREIGN KEY (RoleAccessID) REFERENCES RoleMaster(RoleID);

ALTER TABLE Notice 
    ADD CONSTRAINT FK_Notice_NoticeCategoryMaster 
    FOREIGN KEY (NoticeCatID) REFERENCES NoticeCategoryMaster(NoticeCatID);

ALTER TABLE RoleMenuMapping 
    ADD CONSTRAINT FK_RoleMenuMapping_RoleMaster 
    FOREIGN KEY (RoleMasterID) REFERENCES RoleMaster(RoleID);
```

## Business Domain Models

### 1. Visitor Categories

| Category ID | Category Name | Description | Sub-Categories |
|-------------|---------------|-------------|----------------|
| 1 | Staff | Employee visitors | Security, Maintenance, Cleaning |
| 2 | Unregistered | Walk-in visitors | Walk-in Visitor, Emergency |
| 3 | Student | Student residents | Regular Student, New Admission |
| 4 | Guest | Personal visitors | Family Member, Friend |
| 5 | Bus | Vehicle entries | Delivery, Service Provider |
| 6 | Gate Pass | Special passes | Internal movement |

### 2. Visit Purposes by Category

#### Student Purposes (PurposeCatID = 3)
- Library Visit
- Canteen/Mess
- Sports Activity
- Medical Visit
- Shopping
- Home Visit
- Class/Study
- Administrative Work
- Recreation
- Other

#### Staff Purposes (PurposeCatID = 1)
- Meeting
- Visit
- Delivery
- Maintenance
- Emergency

#### Bus Purposes (PurposeCatID = 2)
- Bus Meeting
- Service Call
- Installation
- Passenger Transport
- Emergency Response
- Maintenance Work
- Security Patrol
- Supply Delivery

### 3. Status Workflow

#### Visitor Status Flow
```
1. PENDING_APPROVAL → 2. APPROVED → CHECKED_IN → CHECKED_OUT
```

#### Gate Pass Workflow
```
1. CREATED → 2. APPROVED → CHECKED_IN → CHECKED_OUT
```

## Audit Trail & Soft Delete Patterns

### Standard Audit Fields
Every table includes:
```sql
CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
CreatedBy varchar(50),
UpdatedBy varchar(50)
```

### Soft Delete Pattern
```sql
IsActive char(1) DEFAULT 'Y'  -- 'Y' = Active, 'N' = Deleted
```

### Query Pattern for Active Records
```sql
SELECT * FROM TableName 
WHERE TenantID = $1 AND IsActive = 'Y'
```

### Update Pattern with Audit Trail
```sql
UPDATE TableName 
SET ColumnName = $1,
    UpdatedDate = NOW(),
    UpdatedBy = $2
WHERE ID = $3 AND TenantID = $4
```

## Indexes and Performance

### Primary Indexes
```sql
-- Tenant-based access patterns
CREATE INDEX idx_tenant_id ON DepartmentMaster(TenantID);
CREATE INDEX idx_fcm_tenant_login ON FCM(TenantID, LoginUserID);
CREATE INDEX idx_flat_tenant ON FlatMaster(TenantID);
CREATE INDEX idx_incident_tenant_status ON IncidentEntry(TenantID, StatusID);
CREATE INDEX idx_login_user_tenant ON LoginUser(TenantID, UserName);
CREATE INDEX idx_visitor_tenant_status ON VisitorMaster(TenantID, StatusID);
CREATE INDEX idx_visitor_reg_tenant ON VisitorRegistration(TenantID);

-- User authentication
CREATE INDEX idx_loginuser_username ON LoginUser(UserName);
CREATE INDEX idx_loginuser_email ON LoginUser(Email);
CREATE INDEX idx_loginuser_role ON LoginUser(RoleAccessID);

-- Visitor management
CREATE INDEX idx_visitor_master_tenant_mobile ON VisitorMaster(TenantID, Mobile);
CREATE INDEX idx_visitor_registration_tenant_mobile ON VisitorRegistration(TenantID, Mobile);
CREATE INDEX idx_visitor_registration_tenant_category ON VisitorRegistration(TenantID, VisitorCatID);

-- OTP and communication
CREATE INDEX idx_portal_otp_mobile_active ON PortalOTP(MobileNo, IsActive);
CREATE INDEX idx_portal_otp_created_date ON PortalOTP(CreatedDate);

-- Visit history
CREATE INDEX idx_visitor_subcategory_tenant_category ON VisitorSubCategory(TenantID, VisitorCatID);
CREATE INDEX idx_visitor_purpose_tenant_category ON VisitorPuposeMaster(TenantID, PurposeCatID);
```

### Performance Optimization Strategies

1. **Tenant Isolation**: All queries include TenantID for optimal performance
2. **Composite Indexes**: Multi-column indexes for common query patterns
3. **Connection Pooling**: Configured pg-pool for connection management
4. **Query Logging**: Performance monitoring with execution time tracking

## Data Types & Constraints

### Standard Data Types

| Type | Usage | Example |
|------|-------|---------|
| `SERIAL/BIGSERIAL` | Auto-incrementing IDs | `VisitorID BIGSERIAL PRIMARY KEY` |
| `varchar(n)` | Text fields | `VistorName varchar(150)` |
| `char(1)` | Status flags | `IsActive char(1) DEFAULT 'Y'` |
| `timestamp` | Date/time fields | `CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP` |
| `decimal(18,2)` | Financial amounts | `RentPerMonth decimal(18,2)` |
| `int` | Numeric references | `TenantID int NOT NULL` |

### Constraint Patterns

#### NOT NULL Constraints
```sql
TenantID int NOT NULL,  -- Required for tenant isolation
UserName varchar(250) NOT NULL,  -- Required for authentication
```

#### Default Values
```sql
IsActive char(1) DEFAULT 'Y',
CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
StatusID int DEFAULT 1,
```

#### Unique Constraints
```sql
CONSTRAINT UK_LoginUser_UserName UNIQUE (UserName)
```

### Business Rules & Constraints

1. **Tenant Isolation**: Every table must include TenantID
2. **Soft Delete**: IsActive field for logical deletion
3. **Audit Trail**: CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
4. **Status Management**: StatusID and StatusName for workflow states
5. **Photo Management**: Flag, Path, and Name columns for file uploads

## Security Patterns

### 1. Data Isolation
- **Tenant Scoping**: All queries filtered by TenantID
- **Row-Level Security**: Implicit through application layer
- **Parameter Binding**: All queries use parameterized statements

### 2. Authentication Security
```sql
-- Password hashing (bcrypt)
Passwrd varchar(1000) NOT NULL  -- Stores bcrypt hash

-- Session management
LastLogin timestamp,
LastPasswrdChgedDate timestamp,
```

### 3. Access Control
```sql
-- Role-based permissions
RoleAccessID int,
RoleName varchar(250),

-- Functional access mapping
CREATE TABLE FuncRoleAccess (
    RoleAccessID int NOT NULL,
    FuncID int NOT NULL,
    FuctionalityName varchar(750)
);
```

### 4. Data Validation Patterns
```javascript
// Model-level validation example
static async checkVisitorExists(mobile, tenantId, visitorCatId) {
    const sql = `
        SELECT COUNT(*) as count
        FROM VisitorRegistration
        WHERE Mobile = $1 AND TenantID = $2 AND VisitorCatID = $3 AND IsActive = 'Y'
    `;
    const result = await query(sql, [mobile, tenantId, visitorCatId]);
    return result.rows[0].count > 0;
}
```

## Migration Strategy

### 1. Database Initialization

#### Core Structure (rely_gate_postgres.sql)
- Creates all master tables
- Establishes foreign key relationships
- Sets up initial indexes

#### Visitor-Specific Tables (visitor_tables.sql)
- Visitor management tables
- Sample data insertion
- Category and purpose setup

#### Dummy Data Scripts
- **students.sql**: Student management test data
- **staff.sql**: Staff management test data  
- **buses.sql**: Bus/vehicle management test data
- **gatePass.sql**: Gate pass configuration

### 2. Version Control Strategy

#### Schema Evolution Pattern
```sql
-- Version tracking table
CREATE TABLE SchemaVersion (
    VersionID SERIAL PRIMARY KEY,
    Version varchar(50),
    AppliedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    Description text
);
```

#### Migration Script Structure
```sql
-- Migration: Add new column
ALTER TABLE VisitorMaster ADD COLUMN NewField varchar(100);

-- Update schema version
INSERT INTO SchemaVersion (Version, Description) 
VALUES ('1.2.0', 'Added NewField to VisitorMaster');
```

### 3. Environment Management

#### Development Environment
```javascript
// Database configuration
const config = {
    host: 'localhost',
    database: 'relygate_dev',
    ssl: false
};
```

#### Production Environment
```javascript
// Database configuration
const config = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
};
```

### 4. Backup and Recovery

#### Regular Backup Strategy
```bash
# Daily backups with timestamp
docker-compose exec postgres pg_dump -U postgres relygate > backup_$(date +%Y%m%d).sql
```

#### Point-in-Time Recovery
```bash
# Restore from backup
docker-compose exec -T postgres psql -U postgres relygate < backup.sql
```

## Performance Monitoring

### Query Performance Tracking
```javascript
// Built-in query logging
const query = async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
};
```

### Connection Pool Monitoring
```javascript
// Connection timeout monitoring
const getClient = async () => {
    const client = await pool.connect();
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);
    return { query: client.query, release: () => clearTimeout(timeout) };
};
```

### Database Health Checks
```javascript
// Connection testing
const testConnection = async () => {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
};
```

---

*This documentation provides a comprehensive overview of the Rely Gate database architecture. For specific implementation details, refer to the model files in `/models/` and SQL scripts in `/scripts/`.*