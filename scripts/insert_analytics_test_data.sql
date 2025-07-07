-- Insert Analytics Test Data for Tenant ID 1001 (June - August 2025)
-- This script provides comprehensive test data for analytics APIs

-- Clear existing test data for tenant 1001 (optional)
-- DELETE FROM VisitorMaster WHERE TenantID = 1001;

-- Insert Visitor Categories (check if exists first)
INSERT INTO VisitorCategory (TenantID, VisitorCatID, VisitorCatName, IsActive, CreatedDate, CreatedBy) 
SELECT 1001, 1, 'Visitor', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorCategory WHERE TenantID = 1001 AND VisitorCatID = 1);

INSERT INTO VisitorCategory (TenantID, VisitorCatID, VisitorCatName, IsActive, CreatedDate, CreatedBy) 
SELECT 1001, 2, 'Bus', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorCategory WHERE TenantID = 1001 AND VisitorCatID = 2);

INSERT INTO VisitorCategory (TenantID, VisitorCatID, VisitorCatName, IsActive, CreatedDate, CreatedBy) 
SELECT 1001, 3, 'Student', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorCategory WHERE TenantID = 1001 AND VisitorCatID = 3);

INSERT INTO VisitorCategory (TenantID, VisitorCatID, VisitorCatName, IsActive, CreatedDate, CreatedBy) 
SELECT 1001, 4, 'Staff', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorCategory WHERE TenantID = 1001 AND VisitorCatID = 4);

INSERT INTO VisitorCategory (TenantID, VisitorCatID, VisitorCatName, IsActive, CreatedDate, CreatedBy) 
SELECT 1001, 6, 'Gate Pass', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorCategory WHERE TenantID = 1001 AND VisitorCatID = 6);

-- Insert Visitor Subcategories (check if exists first)
INSERT INTO VisitorSubCategory (TenantID, VisitorCatID, VisitorSubCatName, IsActive, CreatedDate, CreatedBy)
SELECT 1001, 1, 'ENQUIRY', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorSubCategory WHERE TenantID = 1001 AND VisitorCatID = 1 AND VisitorSubCatName = 'ENQUIRY');

INSERT INTO VisitorSubCategory (TenantID, VisitorCatID, VisitorSubCatName, IsActive, CreatedDate, CreatedBy)
SELECT 1001, 1, 'DELIVERY', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorSubCategory WHERE TenantID = 1001 AND VisitorCatID = 1 AND VisitorSubCatName = 'DELIVERY');

INSERT INTO VisitorSubCategory (TenantID, VisitorCatID, VisitorSubCatName, IsActive, CreatedDate, CreatedBy)
SELECT 1001, 1, 'BUSINESS MEETING', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorSubCategory WHERE TenantID = 1001 AND VisitorCatID = 1 AND VisitorSubCatName = 'BUSINESS MEETING');

INSERT INTO VisitorSubCategory (TenantID, VisitorCatID, VisitorSubCatName, IsActive, CreatedDate, CreatedBy)
SELECT 1001, 1, 'MAINTENANCE', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorSubCategory WHERE TenantID = 1001 AND VisitorCatID = 1 AND VisitorSubCatName = 'MAINTENANCE');

INSERT INTO VisitorSubCategory (TenantID, VisitorCatID, VisitorSubCatName, IsActive, CreatedDate, CreatedBy)
SELECT 1001, 3, 'COLLEGE STUDENT', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorSubCategory WHERE TenantID = 1001 AND VisitorCatID = 3 AND VisitorSubCatName = 'COLLEGE STUDENT');

INSERT INTO VisitorSubCategory (TenantID, VisitorCatID, VisitorSubCatName, IsActive, CreatedDate, CreatedBy)
SELECT 1001, 3, 'SCHOOL STUDENT', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorSubCategory WHERE TenantID = 1001 AND VisitorCatID = 3 AND VisitorSubCatName = 'SCHOOL STUDENT');

INSERT INTO VisitorSubCategory (TenantID, VisitorCatID, VisitorSubCatName, IsActive, CreatedDate, CreatedBy)
SELECT 1001, 4, 'TEACHER', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorSubCategory WHERE TenantID = 1001 AND VisitorCatID = 4 AND VisitorSubCatName = 'TEACHER');

INSERT INTO VisitorSubCategory (TenantID, VisitorCatID, VisitorSubCatName, IsActive, CreatedDate, CreatedBy)
SELECT 1001, 4, 'ADMINISTRATIVE', 'Y', NOW(), 'System'
WHERE NOT EXISTS (SELECT 1 FROM VisitorSubCategory WHERE TenantID = 1001 AND VisitorCatID = 4 AND VisitorSubCatName = 'ADMINISTRATIVE');

-- Insert Visit Purposes (check if exists first)
INSERT INTO VisitorPuposeMaster (TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive, CreatedDate, CreatedBy, ImageFlag, ImagePath, ImageName, ImageUrl)
SELECT 1001, 1, 'Visitor', 'Business Meeting', 'Y', NOW(), 'System', 'N', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM VisitorPuposeMaster WHERE TenantID = 1001 AND PurposeCatID = 1 AND VisitPurpose = 'Business Meeting');

INSERT INTO VisitorPuposeMaster (TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive, CreatedDate, CreatedBy, ImageFlag, ImagePath, ImageName, ImageUrl)
SELECT 1001, 1, 'Visitor', 'Delivery', 'Y', NOW(), 'System', 'N', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM VisitorPuposeMaster WHERE TenantID = 1001 AND PurposeCatID = 1 AND VisitPurpose = 'Delivery');

INSERT INTO VisitorPuposeMaster (TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive, CreatedDate, CreatedBy, ImageFlag, ImagePath, ImageName, ImageUrl)
SELECT 1001, 1, 'Visitor', 'Enquiry', 'Y', NOW(), 'System', 'N', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM VisitorPuposeMaster WHERE TenantID = 1001 AND PurposeCatID = 1 AND VisitPurpose = 'Enquiry');

INSERT INTO VisitorPuposeMaster (TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive, CreatedDate, CreatedBy, ImageFlag, ImagePath, ImageName, ImageUrl)
SELECT 1001, 2, 'Bus', 'School Transport', 'Y', NOW(), 'System', 'N', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM VisitorPuposeMaster WHERE TenantID = 1001 AND PurposeCatID = 2 AND VisitPurpose = 'School Transport');

INSERT INTO VisitorPuposeMaster (TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive, CreatedDate, CreatedBy, ImageFlag, ImagePath, ImageName, ImageUrl)
SELECT 1001, 2, 'Bus', 'Field Trip', 'Y', NOW(), 'System', 'N', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM VisitorPuposeMaster WHERE TenantID = 1001 AND PurposeCatID = 2 AND VisitPurpose = 'Field Trip');

INSERT INTO VisitorPuposeMaster (TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive, CreatedDate, CreatedBy, ImageFlag, ImagePath, ImageName, ImageUrl)
SELECT 1001, 3, 'Student', 'Academic Visit', 'Y', NOW(), 'System', 'N', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM VisitorPuposeMaster WHERE TenantID = 1001 AND PurposeCatID = 3 AND VisitPurpose = 'Academic Visit');

INSERT INTO VisitorPuposeMaster (TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive, CreatedDate, CreatedBy, ImageFlag, ImagePath, ImageName, ImageUrl)
SELECT 1001, 3, 'Student', 'Library Access', 'Y', NOW(), 'System', 'N', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM VisitorPuposeMaster WHERE TenantID = 1001 AND PurposeCatID = 3 AND VisitPurpose = 'Library Access');

INSERT INTO VisitorPuposeMaster (TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive, CreatedDate, CreatedBy, ImageFlag, ImagePath, ImageName, ImageUrl)
SELECT 1001, 4, 'Staff', 'Teaching', 'Y', NOW(), 'System', 'N', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM VisitorPuposeMaster WHERE TenantID = 1001 AND PurposeCatID = 4 AND VisitPurpose = 'Teaching');

INSERT INTO VisitorPuposeMaster (TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive, CreatedDate, CreatedBy, ImageFlag, ImagePath, ImageName, ImageUrl)
SELECT 1001, 4, 'Staff', 'Administration', 'Y', NOW(), 'System', 'N', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM VisitorPuposeMaster WHERE TenantID = 1001 AND PurposeCatID = 4 AND VisitPurpose = 'Administration');

INSERT INTO VisitorPuposeMaster (TenantID, PurposeCatID, PurposeCatName, VisitPurpose, IsActive, CreatedDate, CreatedBy, ImageFlag, ImagePath, ImageName, ImageUrl)
SELECT 1001, 6, 'Gate Pass', 'Emergency Exit', 'Y', NOW(), 'System', 'N', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM VisitorPuposeMaster WHERE TenantID = 1001 AND PurposeCatID = 6 AND VisitPurpose = 'Emergency Exit');

-- June 2025 Data (30 days)
INSERT INTO VisitorMaster (
    TenantID, VisitorCatID, VisitorCatName, VisitorSubCatID, VisitorSubCatName,
    Fname, Mobile, VisitDate, VisitPurposeID, VisitPurpose,
    InTime, OutTime, IsActive, CreatedDate, CreatedBy
) VALUES 
-- June 1, 2025 - Students
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'John Doe', '9876543210', '2025-06-01 08:30:00', 1, 'Academic Visit', '2025-06-01 08:30:00', '2025-06-01 15:30:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Jane Smith', '9876543211', '2025-06-01 09:00:00', 1, 'Library Access', '2025-06-01 09:00:00', '2025-06-01 16:00:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 6, 'SCHOOL STUDENT', 'Mike Johnson', '9876543212', '2025-06-01 09:15:00', 1, 'Academic Visit', '2025-06-01 09:15:00', '2025-06-01 15:45:00', 'Y', NOW(), 'System'),

-- June 1, 2025 - Visitors
(1001, 1, 'Visitor', 1, 'ENQUIRY', 'Alice Brown', '9876543213', '2025-06-01 10:00:00', 2, 'Enquiry', '2025-06-01 10:00:00', '2025-06-01 11:30:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 2, 'DELIVERY', 'Bob Wilson', '9876543214', '2025-06-01 11:00:00', 3, 'Delivery', '2025-06-01 11:00:00', '2025-06-01 11:45:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 3, 'BUSINESS MEETING', 'Carol Davis', '9876543215', '2025-06-01 14:00:00', 1, 'Business Meeting', '2025-06-01 14:00:00', '2025-06-01 16:30:00', 'Y', NOW(), 'System'),

-- June 1, 2025 - Staff
(1001, 4, 'Staff', 7, 'TEACHER', 'David Lee', '9876543216', '2025-06-01 08:00:00', 4, 'Teaching', '2025-06-01 08:00:00', '2025-06-01 17:00:00', 'Y', NOW(), 'System'),
(1001, 4, 'Staff', 8, 'ADMINISTRATIVE', 'Eva Martinez', '9876543217', '2025-06-01 09:00:00', 5, 'Administration', '2025-06-01 09:00:00', '2025-06-01 18:00:00', 'Y', NOW(), 'System'),

-- June 2, 2025 - Mixed Data
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Frank Taylor', '9876543218', '2025-06-02 08:45:00', 1, 'Academic Visit', '2025-06-02 08:45:00', '2025-06-02 15:15:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 6, 'SCHOOL STUDENT', 'Grace White', '9876543219', '2025-06-02 09:30:00', 2, 'Library Access', '2025-06-02 09:30:00', '2025-06-02 16:30:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 1, 'ENQUIRY', 'Henry Black', '9876543220', '2025-06-02 10:30:00', 3, 'Enquiry', '2025-06-02 10:30:00', '2025-06-02 12:00:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 2, 'DELIVERY', 'Ivy Green', '9876543221', '2025-06-02 13:00:00', 3, 'Delivery', '2025-06-02 13:00:00', '2025-06-02 13:30:00', 'Y', NOW(), 'System'),

-- June 15, 2025 - Peak day
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Jack Blue', '9876543222', '2025-06-15 08:00:00', 1, 'Academic Visit', '2025-06-15 08:00:00', '2025-06-15 15:00:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Kate Red', '9876543223', '2025-06-15 08:15:00', 2, 'Library Access', '2025-06-15 08:15:00', '2025-06-15 16:15:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 6, 'SCHOOL STUDENT', 'Liam Orange', '9876543224', '2025-06-15 08:30:00', 1, 'Academic Visit', '2025-06-15 08:30:00', '2025-06-15 15:30:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 6, 'SCHOOL STUDENT', 'Maya Purple', '9876543225', '2025-06-15 08:45:00', 2, 'Library Access', '2025-06-15 08:45:00', '2025-06-15 16:45:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 1, 'ENQUIRY', 'Noah Yellow', '9876543226', '2025-06-15 09:00:00', 3, 'Enquiry', '2025-06-15 09:00:00', '2025-06-15 10:30:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 1, 'ENQUIRY', 'Olivia Pink', '9876543227', '2025-06-15 10:00:00', 3, 'Enquiry', '2025-06-15 10:00:00', '2025-06-15 11:00:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 3, 'BUSINESS MEETING', 'Paul Gray', '9876543228', '2025-06-15 11:00:00', 1, 'Business Meeting', '2025-06-15 11:00:00', '2025-06-15 14:00:00', 'Y', NOW(), 'System'),
(1001, 4, 'Staff', 7, 'TEACHER', 'Quinn Brown', '9876543229', '2025-06-15 07:30:00', 4, 'Teaching', '2025-06-15 07:30:00', '2025-06-15 16:30:00', 'Y', NOW(), 'System'),
(1001, 4, 'Staff', 8, 'ADMINISTRATIVE', 'Rachel Silver', '9876543230', '2025-06-15 08:30:00', 5, 'Administration', '2025-06-15 08:30:00', '2025-06-15 17:30:00', 'Y', NOW(), 'System'),

-- July 2025 Data
-- July 10, 2025
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Sam Gold', '9876543231', '2025-07-10 08:30:00', 1, 'Academic Visit', '2025-07-10 08:30:00', '2025-07-10 15:30:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Tina Copper', '9876543232', '2025-07-10 09:00:00', 2, 'Library Access', '2025-07-10 09:00:00', '2025-07-10 16:00:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 6, 'SCHOOL STUDENT', 'Uma Bronze', '9876543233', '2025-07-10 09:15:00', 1, 'Academic Visit', '2025-07-10 09:15:00', '2025-07-10 15:45:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 1, 'ENQUIRY', 'Victor Steel', '9876543234', '2025-07-10 10:00:00', 3, 'Enquiry', '2025-07-10 10:00:00', '2025-07-10 11:30:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 2, 'DELIVERY', 'Wendy Iron', '9876543235', '2025-07-10 11:00:00', 3, 'Delivery', '2025-07-10 11:00:00', '2025-07-10 11:45:00', 'Y', NOW(), 'System'),
(1001, 4, 'Staff', 7, 'TEACHER', 'Xander Lead', '9876543236', '2025-07-10 08:00:00', 4, 'Teaching', '2025-07-10 08:00:00', '2025-07-10 17:00:00', 'Y', NOW(), 'System'),

-- July 20, 2025
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Yara Tin', '9876543237', '2025-07-20 08:45:00', 1, 'Academic Visit', '2025-07-20 08:45:00', '2025-07-20 15:15:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 6, 'SCHOOL STUDENT', 'Zane Zinc', '9876543238', '2025-07-20 09:30:00', 2, 'Library Access', '2025-07-20 09:30:00', '2025-07-20 16:30:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 1, 'ENQUIRY', 'Amy Crystal', '9876543239', '2025-07-20 10:30:00', 3, 'Enquiry', '2025-07-20 10:30:00', '2025-07-20 12:00:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 3, 'BUSINESS MEETING', 'Ben Diamond', '9876543240', '2025-07-20 14:00:00', 1, 'Business Meeting', '2025-07-20 14:00:00', '2025-07-20 16:30:00', 'Y', NOW(), 'System'),
(1001, 4, 'Staff', 8, 'ADMINISTRATIVE', 'Cleo Pearl', '9876543241', '2025-07-20 09:00:00', 5, 'Administration', '2025-07-20 09:00:00', '2025-07-20 18:00:00', 'Y', NOW(), 'System'),

-- August 2025 Data
-- August 5, 2025
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Dan Ruby', '9876543242', '2025-08-05 08:30:00', 1, 'Academic Visit', '2025-08-05 08:30:00', '2025-08-05 15:30:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Ella Jade', '9876543243', '2025-08-05 09:00:00', 2, 'Library Access', '2025-08-05 09:00:00', '2025-08-05 16:00:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 6, 'SCHOOL STUDENT', 'Finn Opal', '9876543244', '2025-08-05 09:15:00', 1, 'Academic Visit', '2025-08-05 09:15:00', '2025-08-05 15:45:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 1, 'ENQUIRY', 'Gina Topaz', '9876543245', '2025-08-05 10:00:00', 3, 'Enquiry', '2025-08-05 10:00:00', '2025-08-05 11:30:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 2, 'DELIVERY', 'Hugo Amber', '9876543246', '2025-08-05 11:00:00', 3, 'Delivery', '2025-08-05 11:00:00', '2025-08-05 11:45:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 3, 'BUSINESS MEETING', 'Iris Coral', '9876543247', '2025-08-05 14:00:00', 1, 'Business Meeting', '2025-08-05 14:00:00', '2025-08-05 16:30:00', 'Y', NOW(), 'System'),
(1001, 4, 'Staff', 7, 'TEACHER', 'Jake Quartz', '9876543248', '2025-08-05 08:00:00', 4, 'Teaching', '2025-08-05 08:00:00', '2025-08-05 17:00:00', 'Y', NOW(), 'System'),
(1001, 4, 'Staff', 8, 'ADMINISTRATIVE', 'Kira Marble', '9876543249', '2025-08-05 09:00:00', 5, 'Administration', '2025-08-05 09:00:00', '2025-08-05 18:00:00', 'Y', NOW(), 'System'),

-- August 15, 2025 - High volume day
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Leo Granite', '9876543250', '2025-08-15 08:00:00', 1, 'Academic Visit', '2025-08-15 08:00:00', '2025-08-15 15:00:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Mia Slate', '9876543251', '2025-08-15 08:15:00', 2, 'Library Access', '2025-08-15 08:15:00', '2025-08-15 16:15:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Nico Onyx', '9876543252', '2025-08-15 08:30:00', 1, 'Academic Visit', '2025-08-15 08:30:00', '2025-08-15 15:30:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 6, 'SCHOOL STUDENT', 'Ava Flint', '9876543253', '2025-08-15 08:45:00', 2, 'Library Access', '2025-08-15 08:45:00', '2025-08-15 16:45:00', 'Y', NOW(), 'System'),
(1001, 3, 'Student', 6, 'SCHOOL STUDENT', 'Owen Shale', '9876543254', '2025-08-15 09:00:00', 1, 'Academic Visit', '2025-08-15 09:00:00', '2025-08-15 15:00:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 1, 'ENQUIRY', 'Pia Pumice', '9876543255', '2025-08-15 09:30:00', 3, 'Enquiry', '2025-08-15 09:30:00', '2025-08-15 11:00:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 1, 'ENQUIRY', 'Quin Basalt', '9876543256', '2025-08-15 10:00:00', 3, 'Enquiry', '2025-08-15 10:00:00', '2025-08-15 11:30:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 1, 'ENQUIRY', 'Rita Obsidian', '9876543257', '2025-08-15 10:30:00', 3, 'Enquiry', '2025-08-15 10:30:00', '2025-08-15 12:00:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 2, 'DELIVERY', 'Solo Limestone', '9876543258', '2025-08-15 11:00:00', 3, 'Delivery', '2025-08-15 11:00:00', '2025-08-15 11:30:00', 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 3, 'BUSINESS MEETING', 'Tara Sandstone', '9876543259', '2025-08-15 13:00:00', 1, 'Business Meeting', '2025-08-15 13:00:00', '2025-08-15 15:30:00', 'Y', NOW(), 'System'),
(1001, 4, 'Staff', 7, 'TEACHER', 'Uma Feldspar', '9876543260', '2025-08-15 07:30:00', 4, 'Teaching', '2025-08-15 07:30:00', '2025-08-15 16:30:00', 'Y', NOW(), 'System'),
(1001, 4, 'Staff', 7, 'TEACHER', 'Vale Mica', '9876543261', '2025-08-15 08:00:00', 4, 'Teaching', '2025-08-15 08:00:00', '2025-08-15 17:00:00', 'Y', NOW(), 'System'),
(1001, 4, 'Staff', 8, 'ADMINISTRATIVE', 'Wade Calcite', '9876543262', '2025-08-15 08:30:00', 5, 'Administration', '2025-08-15 08:30:00', '2025-08-15 17:30:00', 'Y', NOW(), 'System'),

-- Bus entries (few entries as they are typically less frequent)
(1001, 2, 'Bus', NULL, 'School Bus', 'Driver Alpha', '9876543270', '2025-06-15 07:00:00', 4, 'School Transport', '2025-06-15 07:00:00', '2025-06-15 18:00:00', 'Y', NOW(), 'System'),
(1001, 2, 'Bus', NULL, 'School Bus', 'Driver Beta', '9876543271', '2025-07-10 07:15:00', 5, 'Field Trip', '2025-07-10 07:15:00', '2025-07-10 17:45:00', 'Y', NOW(), 'System'),
(1001, 2, 'Bus', NULL, 'School Bus', 'Driver Gamma', '9876543272', '2025-08-05 07:30:00', 4, 'School Transport', '2025-08-05 07:30:00', '2025-08-05 18:30:00', 'Y', NOW(), 'System'),

-- Some entries without OutTime (currently checked in)
(1001, 3, 'Student', 5, 'COLLEGE STUDENT', 'Active Student1', '9876543280', '2025-08-15 08:00:00', 1, 'Academic Visit', '2025-08-15 08:00:00', NULL, 'Y', NOW(), 'System'),
(1001, 1, 'Visitor', 1, 'ENQUIRY', 'Active Visitor1', '9876543281', '2025-08-15 10:00:00', 3, 'Enquiry', '2025-08-15 10:00:00', NULL, 'Y', NOW(), 'System'),
(1001, 4, 'Staff', 7, 'TEACHER', 'Active Staff1', '9876543282', '2025-08-15 08:30:00', 4, 'Teaching', '2025-08-15 08:30:00', NULL, 'Y', NOW(), 'System');

-- Update sequences (if needed)
-- SELECT setval('visitormaster_visitorid_seq', (SELECT MAX(VisitorID) FROM VisitorMaster));

-- Verification queries
SELECT 
    DATE(VisitDate) as date,
    VisitorCatName as category,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN InTime IS NOT NULL THEN 1 END) as entries_with_intime,
    COUNT(CASE WHEN OutTime IS NOT NULL THEN 1 END) as entries_with_outtime
FROM VisitorMaster 
WHERE TenantID = 1001 
    AND VisitDate >= '2025-06-01' 
    AND VisitDate <= '2025-08-31'
GROUP BY DATE(VisitDate), VisitorCatName
ORDER BY date, category;

COMMIT;