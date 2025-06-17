-- Create LoginUser table
CREATE TABLE IF NOT EXISTS LoginUser (
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
    PhotoFlag char(10),
    PhotoPath varchar(1000),
    Photo varchar(450),
    LastLogin timestamp,
    LastPasswrdChgedDate timestamp,
    SharedLogin char(10),
    LoginIP varchar(250),
    LinkFlatFlag char(1),
    LinkeFlatID varchar(250),
    LinkeFlatName varchar(450),
    Custom_1 varchar(50),
    Custom_2 varchar(50),
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CreatedBy varchar(250),
    UpdatedBy varchar(250)
);

CREATE INDEX idx_loginuser_username_tenant ON LoginUser(UserName, TenantID);

CREATE TABLE IF NOT EXISTS Tenant (
    TenantID SERIAL PRIMARY KEY,
    TenantName varchar(250) NOT NULL,
    IsActive char(1) DEFAULT 'Y',
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO LoginUser (
    TenantID, IsActive, RoleAccessID, RoleName, FirstN, LastN, 
    UserName, Passwrd, DisplayN, Email, Mobile
) VALUES 
(1, 'Y', 1, 'Admin', 'John', 'Doe', 'admin', 'admin123', 'John Doe', 'admin@example.com', '1234567890'),
(1, 'Y', 2, 'User', 'Jane', 'Smith', 'user', 'user123', 'Jane Smith', 'user@example.com', '0987654321'),
(2, 'Y', 1, 'Admin', 'Bob', 'Wilson', 'admin2', 'admin123', 'Bob Wilson', 'admin2@example.com', '1122334455');

-- Insert sample tenant data
INSERT INTO Tenant (TenantID, TenantName, IsActive) VALUES 
(1, 'Apartment Complex A', 'Y'),
(2, 'Apartment Complex B', 'Y');