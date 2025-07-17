# Rely Gate API Documentation

A comprehensive multi-tenant visitor management system API with authentication, file uploads, analytics, and real-time features.

## Base URL
- Development: `http://localhost:3000/api` (internal) or `http://localhost:3333/api` (Docker)
- Production: `https://your-domain.com/api`

## Authentication

All protected endpoints require JWT authentication using Bearer token in the Authorization header.

### Headers Required
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### JWT Token Structure
The JWT contains:
- `loginId`: User's login ID
- `username`: Username
- `tenantId`: Tenant ID for multi-tenancy
- `roleAccessId`: Role access ID
- `roleName`: Role name

---

## Response Format

All API responses follow a standardized format:

```json
{
  "responseCode": "S|E|F|X",
  "responseMessage": "Success/Error message",
  "data": {},
  "count": 0,
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "totalItems": 0
  }
}
```

### Response Codes
- `S`: Success
- `E`: Error
- `F`: Record already exists
- `X`: Mobile number already exists

---

## 1. Authentication APIs

### POST /api/auth/register
Register a new user account.

**Body Parameters:**
```json
{
  "userName": "string", // required
  "password": "string", // required
  "tenantId": "number"  // required
}
```

**Response:**
```json
{
  "responseCode": "S",
  "responseMessage": "User registered successfully",
  "token": "jwt_token_here",
  "loginuser": {
    "id": 123,
    "userName": "testuser",
    "tenantId": 1
  }
}
```

### POST /api/auth/login
Authenticate user and get JWT token.

**Body Parameters:**
```json
{
  "username": "string", // required
  "password": "string", // required
  "tenantid": "number"  // required
}
```

**Response:**
```json
{
  "responseCode": "S",
  "responseMessage": "Login successful",
  "token": "jwt_token_here",
  "loginuser": {
    "loginId": 123,
    "tenantId": 1,
    "isActive": "Y",
    "roleAccessId": 1,
    "roleName": "Admin",
    "firstName": "John",
    "lastName": "Doe",
    "userName": "johndoe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "tenantName": "Sample Tenant"
  }
}
```

### GET /api/auth/userinfo
Get current user information.

**Headers:** Authorization required

**Response:**
```json
{
  "responseCode": "S",
  "loginuser": {
    "loginId": 123,
    "tenantId": 1,
    "userName": "johndoe",
    "firstName": "John",
    "email": "john@example.com"
  }
}
```

---

## 2. Visitor Management APIs

### GET /api/visitors/purposes
Get visitor purposes by category.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `purposeCatId` (optional): Purpose category ID (default: 0)

**Response:**
```json
{
  "responseCode": "S",
  "data": [
    {
      "purposeId": 1,
      "purposeName": "Delivery",
      "purposeCatId": 1
    }
  ]
}
```

### GET /api/visitors/subcategories
Get visitor subcategories.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `visitorCatId` (optional): Visitor category ID (default: 0)

### POST /api/visitors/send-otp
Send OTP for visitor registration.

**Body Parameters:**
```json
{
  "mobile": "9876543210",     // required, 10 digits
  "tenantId": 123,            // optional
  "visitorTypeId": 1          // optional
}
```

**Response:**
```json
{
  "responseCode": "S",
  "responseMessage": "OTP sent successfully",
  "data": {
    "refId": 12345,
    "otpSent": true
  }
}
```

### POST /api/visitors/verify-otp
Verify OTP sent to visitor's mobile.

**Body Parameters:**
```json
{
  "refId": 12345,           // required
  "otpNumber": "123456",    // required, 6 digits
  "mobile": "9876543210"    // required, 10 digits
}
```

### POST /api/visitors/create-unregistered
Create an unregistered visitor entry.

**Body Parameters:**
```json
{
  "fname": "John Doe",                    // required
  "mobile": "9876543210",                 // required, 10 digits
  "vehicleNo": "KA01AB1234",             // optional
  "flatName": "A-101",                   // required
  "visitorCatId": 2,                     // required
  "visitorCatName": "Unregistered",     // optional
  "visitorSubCatId": 1,                  // required
  "visitorSubCatName": "Guest",          // optional
  "visitPurposeId": 1,                   // optional
  "visitPurpose": "Personal Visit",      // optional
  "totalVisitor": 2,                     // optional, default: 1
  "photoPath": "base64_image_string",    // optional
  "vehiclePhotoPath": "base64_image",    // optional
  "tenantId": 123                        // optional
}
```

**Response:**
```json
{
  "responseCode": "S",
  "responseMessage": "Visitor created successfully",
  "data": {
    "visitorId": 456,
    "qrCode": "generated_qr_string",
    "photoUrl": "/uploads/visitors/photo.jpg"
  }
}
```

### POST /api/visitors/create-registered
Create a registered visitor entry.

**Body Parameters:**
```json
{
  "vistorName": "Jane Smith",           // required
  "mobile": "9876543210",               // required, 10 digits
  "email": "jane@example.com",          // optional, valid email
  "visitorCatId": 1,                    // required
  "visitorSubCatId": 1,                 // required
  "flatId": 101,                        // optional
  "flatName": "A-101",                  // optional
  "vehicleNo": "KA01AB1234",           // optional
  "identityId": 1,                      // optional
  "idName": "Aadhar Card",             // optional
  "idNumber": "123456789012",          // optional
  "photoPath": "base64_image_string",   // optional
  "vehiclePhotoPath": "base64_image",   // optional
  "idPhotoPath": "base64_image",        // optional
  "tenantId": 123                       // optional
}
```

### GET /api/visitors/registered
Get list of registered visitors.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `visitorCatId` (optional): Visitor category ID (default: 0)
- `visitorSubCatId` (optional): Visitor subcategory ID (default: 0)

### POST /api/visitors/checkin
Check-in a registered visitor.

**Body Parameters:**
```json
{
  "visitorRegId": 123,    // required
  "tenantId": 456         // optional
}
```

### PUT /api/visitors/:visitorId/checkout
Check-out a visitor.

**Path Parameters:**
- `visitorId`: Visitor ID (required, numeric)

**Body Parameters:**
```json
{
  "tenantId": 123  // optional
}
```

### GET /api/visitors/:visitorId/status
Get visitor's current status.

**Path Parameters:**
- `visitorId`: Visitor ID (required, numeric)

**Query Parameters:**
- `tenantId` (optional): Tenant ID

### POST /api/visitors/:visitorRegId/qr
Generate QR code for a visitor.

**Path Parameters:**
- `visitorRegId`: Visitor registration ID (required, numeric)

**Body Parameters:**
```json
{
  "tenantId": 123  // optional
}
```

### POST /api/visitors/scan-qr
Scan a QR code for visitor check-in/out.

**Body Parameters:**
```json
{
  "qrString": "qr_code_string",  // required
  "tenantId": 123                // optional
}
```

### GET /api/visitors/search
Search visitors with pagination.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 100)
- `visitorCatId` (optional): Visitor category ID
- `visitorSubCatId` (optional): Visitor subcategory ID

### POST /api/visitors/list
Advanced visitor listing with filters.

**Body Parameters:**
```json
{
  "page": 1,                          // optional, min: 1
  "pageSize": 20,                     // optional, 1-100
  "search": "john",                   // optional
  "visitorCatId": 1,                  // optional
  "visitorSubCatId": 1,               // optional
  "purposeId": 1,                     // optional
  "flatName": "A-101",                // optional
  "mobile": "9876543210",             // optional
  "fromDate": "2024-01-01",           // optional, ISO8601
  "toDate": "2024-12-31",             // optional, ISO8601
  "status": "CHECKED_IN",             // optional: ACTIVE|INACTIVE|CHECKED_IN|AVAILABLE
  "tenantId": 123                     // optional
}
```

### GET /api/visitors/pending-checkout
Get visitors currently checked in (pending checkout).

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `visitorCatId` (optional): Visitor category ID

### GET /api/visitors/export
Export visitors data to CSV.

**Query Parameters:**
- `visitorCatId` (optional): Visitor category ID
- `visitorSubCatId` (optional): Visitor subcategory ID
- `status` (optional): CHECKED_IN or AVAILABLE
- `fromDate` (optional): ISO8601 date
- `toDate` (optional): ISO8601 date
- `format` (optional): csv (default)
- `tenantId` (optional): Tenant ID

**Response:** CSV file download

### GET /api/visitors/template
Download CSV template for bulk visitor upload.

**Query Parameters:**
- `visitorCatId` (optional): Visitor category ID (1-5, default: 2)

**Response:** CSV template file

---

## 3. Student Management APIs

### POST /api/students/list
List students with advanced filtering.

**Body Parameters:**
```json
{
  "page": 1,                    // optional, min: 1
  "pageSize": 20,               // optional, 1-100
  "search": "john",             // optional
  "purposeId": 1,               // optional
  "studentId": "STU001",        // optional
  "firstName": "John",          // optional
  "course": "Computer Science", // optional
  "hostel": "A Block",          // optional
  "fromDate": "2024-01-01",     // optional, ISO8601
  "toDate": "2024-12-31",       // optional, ISO8601
  "tenantId": 123               // optional
}
```

### GET /api/students/purposes
Get available purposes for students.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `purposeCatId` (optional): Purpose category ID (min: 1)

### GET /api/students/pending-checkin
Get students currently checked out (pending check-in).

**Query Parameters:**
- `tenantId` (optional): Tenant ID

### GET /api/students/:studentId/status
Get student's current status.

**Path Parameters:**
- `studentId`: Student ID (required, positive integer)

**Query Parameters:**
- `tenantId` (optional): Tenant ID

### POST /api/students/:studentId/checkout
Checkout student with purpose support.

**Path Parameters:**
- `studentId`: Student ID (required, positive integer)

**Body Parameters:**
```json
{
  "tenantId": 123,                // optional
  "purposeId": 1,                 // optional (-1 for custom purpose)
  "purposeName": "Medical Visit"  // required if purposeId is -1
}
```

### POST /api/students/:studentId/checkin
Check-in a student.

**Path Parameters:**
- `studentId`: Student ID (required, positive integer)

**Body Parameters:**
```json
{
  "tenantId": 123  // optional
}
```

### GET /api/students/:studentId/history
Get student's visit history.

**Path Parameters:**
- `studentId`: Student ID (required, positive integer)

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `limit` (optional): Limit results (1-50, default: 10)

### GET /api/students/export
Export students data to CSV.

**Query Parameters:**
- `course` (optional): Course name
- `hostel` (optional): Hostel name
- `status` (optional): CHECKED_OUT or AVAILABLE
- `fromDate` (optional): ISO8601 date
- `toDate` (optional): ISO8601 date
- `format` (optional): csv
- `tenantId` (optional): Tenant ID

### GET /api/students/template
Download CSV template for student bulk upload.

**Response:** CSV template file

---

## 4. Staff Management APIs

### GET /api/staff
List staff with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (min: 1)
- `pageSize` (optional): Items per page (1-100)
- `search` (optional): Search term
- `tenantId` (optional): Tenant ID

### POST /api/staff/list
List staff with advanced filtering.

**Body Parameters:**
```json
{
  "page": 1,                  // optional, min: 1
  "pageSize": 20,             // optional, 1-100
  "search": "john",           // optional
  "designation": "Manager",   // optional
  "staffId": "EMP001",        // optional
  "name": "John Doe",         // optional
  "fromDate": "2024-01-01",   // optional, ISO8601
  "toDate": "2024-12-31",     // optional, ISO8601
  "tenantId": 123             // optional
}
```

### GET /api/staff/:staffId/status
Get staff's current status.

**Path Parameters:**
- `staffId`: Staff ID (required, positive integer)

**Query Parameters:**
- `tenantId` (optional): Tenant ID

### POST /api/staff/:staffId/checkin
Check-in staff member.

**Path Parameters:**
- `staffId`: Staff ID (required, positive integer)

**Body Parameters:**
```json
{
  "tenantId": 123  // optional
}
```

### POST /api/staff/:staffId/checkout
Check-out staff member.

**Path Parameters:**
- `staffId`: Staff ID (required, positive integer)

**Body Parameters:**
```json
{
  "tenantId": 123  // optional
}
```

### POST /api/staff/register
Staff registration with OTP verification.

**Body Parameters:**
```json
{
  "mobile": "9876543210",    // required, 10 digits
  "designation": "Manager",  // required
  "tenantId": 123           // optional
}
```

### POST /api/staff/verify-registration
Verify OTP and complete staff registration.

**Body Parameters:**
```json
{
  "mobile": "9876543210",        // required, 10 digits
  "otpNumber": "123456",         // required, 6 digits
  "name": "John Doe",            // required
  "designation": "Manager",      // required
  "address1": "123 Main St",     // optional
  "address2": "Apt 4B",          // optional
  "remarks": "New employee",     // optional
  "vehicleNumber": "KA01AB1234", // optional
  "tenantId": 123                // optional
}
```

### GET /api/staff/designations
Get available staff designations.

**Query Parameters:**
- `tenantId` (optional): Tenant ID

### GET /api/staff/pending-checkout
Get staff currently checked in (pending checkout).

**Query Parameters:**
- `tenantId` (optional): Tenant ID

### GET /api/staff/export
Export staff data to CSV.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `designation` (optional): Filter by designation

### GET /api/staff/template
Download CSV template for staff bulk upload.

---

## 5. Gate Pass Management APIs

### POST /api/gatepass
Create new gate pass.

**Body Parameters:**
```json
{
  "fname": "John Doe",              // required
  "mobile": "9876543210",           // required, 10 digits
  "visitDate": "2024-06-30",        // required, ISO8601
  "purposeId": 1,                   // required
  "purposeName": "Custom Purpose",  // required if purposeId is -1
  "statusId": 1,                    // optional, 1=Pending, 2=Approved
  "tenantId": 123,                  // required
  "remark": "Visiting for meeting"  // optional
}
```

### GET /api/gatepass
List gate passes with basic filtering.

**Query Parameters:**
- `page` (optional): Page number (min: 1)
- `pageSize` (optional): Items per page (1-100)
- `search` (optional): Search term
- `tenantId` (required): Tenant ID

### POST /api/gatepass/list
List gate passes with advanced filtering.

**Body Parameters:**
```json
{
  "page": 1,                  // optional, min: 1
  "pageSize": 20,             // optional, 1-100
  "search": "john",           // optional
  "purposeId": 1,             // optional
  "statusId": 1,              // optional
  "fromDate": "2024-01-01",   // optional, ISO8601
  "toDate": "2024-12-31",     // optional, ISO8601
  "tenantId": 123             // required
}
```

### PUT /api/gatepass/:visitorId/approve
Approve a gate pass (does not auto check-in).

**Path Parameters:**
- `visitorId`: Visitor ID (required, numeric)

**Body Parameters:**
```json
{
  "tenantId": 123  // required
}
```

### POST /api/gatepass/:visitorId/checkin
Check-in gate pass visitor (sets InTime).

**Path Parameters:**
- `visitorId`: Visitor ID (required, numeric)

**Body Parameters:**
```json
{
  "tenantId": 123  // required
}
```

### POST /api/gatepass/:visitorId/checkout
Check-out gate pass visitor (sets OutTime).

**Path Parameters:**
- `visitorId`: Visitor ID (required, numeric)

**Body Parameters:**
```json
{
  "tenantId": 123  // required
}
```

### GET /api/gatepass/:visitorId/status
Get gate pass current status.

**Path Parameters:**
- `visitorId`: Visitor ID (required, numeric)

**Query Parameters:**
- `tenantId` (required): Tenant ID

### GET /api/gatepass/pending-checkin
Get gate passes ready for check-in.

**Query Parameters:**
- `tenantId` (required): Tenant ID

### GET /api/gatepass/pending-checkout
Get gate passes that need check-out.

**Query Parameters:**
- `tenantId` (required): Tenant ID

### GET /api/gatepass/purposes
Get available gate pass purposes.

**Query Parameters:**
- `tenantId` (required): Tenant ID

### POST /api/gatepass/purposes
Add new gate pass purpose.

**Body Parameters:**
```json
{
  "purposeName": "Medical Visit",  // required, 1-250 chars
  "tenantId": 123                  // optional
}
```

### PUT /api/gatepass/purposes/:purposeId
Update gate pass purpose.

**Path Parameters:**
- `purposeId`: Purpose ID (required, numeric)

**Body Parameters:**
```json
{
  "purposeName": "Updated Purpose", // required, 1-250 chars
  "tenantId": 123                   // optional
}
```

### DELETE /api/gatepass/purposes/:purposeId
Delete gate pass purpose.

**Path Parameters:**
- `purposeId`: Purpose ID (required, numeric)

**Body Parameters:**
```json
{
  "tenantId": 123  // optional
}
```

### GET /api/gatepass/export
Export gate passes to CSV.

**Query Parameters:**
- `purposeId` (optional): Purpose ID filter
- `statusId` (optional): Status ID filter
- `fromDate` (optional): ISO8601 date
- `toDate` (optional): ISO8601 date
- `format` (optional): csv
- `tenantId` (required): Tenant ID

### GET /api/gatepass/template
Download CSV template for gate pass bulk upload.

---

## 6. Bus Management APIs

### GET /api/buses
List buses with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (min: 1)
- `pageSize` (optional): Items per page (1-100)
- `search` (optional): Search term
- `tenantId` (optional): Tenant ID

### POST /api/buses/list
List buses with advanced filtering.

**Body Parameters:**
```json
{
  "page": 1,                      // optional, min: 1
  "pageSize": 20,                 // optional, 1-100
  "search": "bus",                // optional
  "purposeId": 1,                 // optional
  "busNumber": "BUS001",          // optional
  "registrationNumber": "KA01AB1234", // optional
  "driverName": "John Driver",    // optional
  "fromDate": "2024-01-01",       // optional, ISO8601
  "toDate": "2024-12-31",         // optional, ISO8601
  "tenantId": 123                 // optional
}
```

### GET /api/buses/purposes
Get available purposes for buses.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `purposeCatId` (optional): Purpose category ID (min: 1)

### GET /api/buses/:busId/status
Get bus's current status.

**Path Parameters:**
- `busId`: Bus ID (required, positive integer)

**Query Parameters:**
- `tenantId` (optional): Tenant ID

### POST /api/buses/:busId/checkout
Checkout bus with purpose support.

**Path Parameters:**
- `busId`: Bus ID (required, positive integer)

**Body Parameters:**
```json
{
  "tenantId": 123,              // optional
  "purposeId": 1,               // optional (-1 for custom)
  "purposeName": "Field Trip"   // required if purposeId is -1
}
```

### POST /api/buses/:busId/checkin
Check-in a bus.

**Path Parameters:**
- `busId`: Bus ID (required, positive integer)

**Body Parameters:**
```json
{
  "tenantId": 123  // optional
}
```

### GET /api/buses/:busId/history
Get bus's visit history.

**Path Parameters:**
- `busId`: Bus ID (required, positive integer)

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `limit` (optional): Limit results (1-50)

### GET /api/buses/pending-checkin
Get buses currently checked out (pending check-in).

**Query Parameters:**
- `tenantId` (optional): Tenant ID

### GET /api/buses/pending-checkout
Get buses currently checked in (pending checkout).

**Query Parameters:**
- `tenantId` (optional): Tenant ID

### GET /api/buses/export
Export buses data to CSV.

**Query Parameters:**
- `purposeId` (optional): Purpose ID filter
- `registrationNumber` (optional): Registration number filter
- `driverName` (optional): Driver name filter
- `fromDate` (optional): ISO8601 date
- `toDate` (optional): ISO8601 date
- `format` (optional): csv
- `tenantId` (optional): Tenant ID

### GET /api/buses/template
Download CSV template for bus bulk upload.

---

## 7. Dashboard & Analytics APIs

### GET /api/dashboard/summary
Get dashboard summary statistics.

**Response:**
```json
{
  "responseCode": "S",
  "data": {
    "totalVisitors": 150,
    "checkedInVisitors": 25,
    "todayVisits": 45,
    "recentVisits": [...]
  }
}
```

### GET /api/dashboard/visitor-details
Get latest visitor visit details.

### GET /api/analytics/dashboard
Get comprehensive dashboard analytics.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `date` (optional): Specific date (YYYY-MM-DD)

### GET /api/analytics/visitor-frequency
Get visitor frequency analytics.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `days` (optional): Number of days to analyze

### GET /api/analytics/peak-hours
Get peak hours analytics.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `days` (optional): Number of days to analyze

### GET /api/analytics/flat-wise
Get flat-wise visit analytics.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `days` (optional): Number of days to analyze

### GET /api/analytics/recent-activity
Get recent activity feed.

**Query Parameters:**
- `tenantId` (optional): Tenant ID
- `limit` (optional): Number of records to return

---

## 8. Bulk Upload APIs

All bulk upload endpoints require file upload with multipart/form-data.

### POST /api/bulk/students
Upload student data via CSV.

**Form Data:**
- `file`: CSV file (required, max 10MB)
- `type`: Upload type (optional)
- `tenantId`: Tenant ID (optional)

**Response:**
```json
{
  "responseCode": "S",
  "responseMessage": "Bulk upload completed",
  "data": {
    "processed": 100,
    "successful": 95,
    "failed": 5,
    "errors": [...]
  }
}
```

### POST /api/bulk/visitors
Upload visitor data via CSV.

**Form Data:**
- `file`: CSV file (required, max 10MB)
- `tenantId`: Tenant ID (optional)

### POST /api/bulk/staff
Upload staff data via CSV.

**Form Data:**
- `file`: CSV file (required, max 10MB)
- `tenantId`: Tenant ID (optional)

### POST /api/bulk/buses
Upload bus data via CSV.

**Form Data:**
- `file`: CSV file (required, max 10MB)
- `tenantId`: Tenant ID (optional)

---

## 9. File Management APIs

### GET /api/files/:category/:filename/info
Get file information.

**Path Parameters:**
- `category`: File category
- `filename`: File name

### DELETE /api/files/:category/:filename
Delete a file.

**Path Parameters:**
- `category`: File category
- `filename`: File name

### POST /api/files/cleanup/:category
Cleanup old files in a category.

**Path Parameters:**
- `category`: File category to cleanup

---

## 10. Vehicle Management APIs

### GET /api/vehicles/search
Search vehicles by number and date range.

**Query Parameters:**
- `vehicleNo` (optional): Vehicle number
- `from` (optional): From date (valid date)
- `to` (optional): To date (valid date)
- `tenantId` (optional): Tenant ID

---

## 11. FCM (Push Notification) APIs

### POST /api/fcm/register
Register FCM token for push notifications.

**Body Parameters:**
```json
{
  "firebaseId": "fcm_token_here",  // required
  "androidId": "android_device_id", // required
  "userName": "john_doe",          // optional
  "tenantId": 123                  // optional
}
```

### PUT /api/fcm/update
Update FCM token.

**Body Parameters:**
```json
{
  "firebaseId": "new_fcm_token",   // required
  "androidId": "android_device_id", // required
  "tenantId": 123                  // optional
}
```

### PUT /api/fcm/notification-preferences
Update notification preferences.

**Body Parameters:**
```json
{
  "androidId": "android_device_id", // required
  "notificationFlag": "Y",         // required (Y/N)
  "tenantId": 123                  // optional
}
```

---

## 12. Protected Routes

### GET /api/me
Test protected route access.

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "message": "Access granted to protected route",
  "user": {
    "loginId": 123,
    "username": "johndoe",
    "tenantId": 1,
    "roleName": "Admin"
  }
}
```

---

## Error Handling

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (resource already exists)
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error

### Error Response Format
```json
{
  "responseCode": "E",
  "responseMessage": "Error description",
  "error": "Detailed error message (development only)",
  "validationErrors": [
    {
      "field": "mobile",
      "message": "Mobile must be 10 digits"
    }
  ]
}
```

---

## File Upload Specifications

### Supported Image Formats
- JPEG/JPG
- PNG
- Base64 encoded images

### File Categories
- `visitors`: Visitor photos
- `registered_visitors`: Registered visitor photos
- `vehicles`: Vehicle photos
- `visitor_ids`: ID document photos
- `qr_codes`: Generated QR codes

### File Naming Convention
`{timestamp}_{randomHash}.{extension}`

### Directory Structure
`uploads/{category}/{tenantId}/{filename}`

### Base64 Upload Format
When uploading images as base64:
```json
{
  "photoPath": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

---

## Rate Limiting

Default rate limits:
- 100 requests per 15-minute window per IP and tenant
- Identified by combination of IP address and tenant ID
- Returns HTTP 429 with retry-after header when exceeded

---

## Multi-Tenancy

### Tenant Isolation
- All database queries are scoped by `tenantId`
- JWT tokens contain tenant context
- Automatic tenant validation on all protected routes
- Cross-tenant access is strictly forbidden

### Tenant Validation
- Request tenant ID must match JWT token tenant ID
- 403 Forbidden returned for cross-tenant access attempts
- Applies to all query parameters, body parameters, and path parameters

---

## Business Rules & Constraints

### Visitor Management
- Unregistered visitors require mobile OTP verification
- Registered visitors can have pre-approved access
- QR codes generated for contactless check-in/out
- Vehicle information is optional but recommended
- Photos stored as base64 and converted to files

### Student/Staff Management
- First-time check-in creates history record
- Purpose tracking for checkout operations
- Custom purposes supported with purposeId = -1
- Status tracking: AVAILABLE → CHECKED_OUT → AVAILABLE

### Gate Pass System
- Three-stage process: Created → Approved → Checked-in → Checked-out
- Approval does not automatically check-in visitors
- Visit date validation ensures future or current dates only
- Custom purposes supported with validation

### Check-in/Check-out Flow
1. **Check-in**: Records entry time (InTime)
2. **Check-out**: Records exit time (OutTime)
3. **Status**: Automatically calculated based on times
4. **Duration**: Calculated between InTime and OutTime

---

## Security Features

### Authentication
- JWT-based authentication with expiration
- Bearer token in Authorization header
- Token contains user and tenant context

### Authorization  
- Role-based access control (RBAC)
- Tenant-level isolation
- Route-level permission checks

### Data Validation
- Express-validator for request validation
- SQL injection prevention with parameterized queries
- File type validation for uploads
- Mobile number format validation (10 digits)
- Email format validation

### File Security
- Organized directory structure by tenant
- File type restrictions
- Size limitations (10MB for bulk uploads)
- Secure file serving with proper headers

---

## API Usage Examples

### Complete Visitor Registration Flow
```javascript
// 1. Send OTP
const otpResponse = await fetch('/api/visitors/send-otp', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    mobile: '9876543210'
  })
});

// 2. Verify OTP
const verifyResponse = await fetch('/api/visitors/verify-otp', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refId: otpResponse.data.refId,
    otpNumber: '123456',
    mobile: '9876543210'
  })
});

// 3. Create Visitor
const createResponse = await fetch('/api/visitors/create-unregistered', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fname: 'John Doe',
    mobile: '9876543210',
    flatName: 'A-101',
    visitorCatId: 2,
    visitorSubCatId: 1,
    photoPath: 'data:image/jpeg;base64,...'
  })
});
```

### Bulk CSV Upload Example
```javascript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('tenantId', '123');

const uploadResponse = await fetch('/api/bulk/students', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

---

## Health Check

### GET /health
System health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-06-30T10:30:00.000Z",
  "uptime": 3600.123,
  "version": "1.0.0"
}
```

---

This documentation covers all available API endpoints in the Rely Gate visitor management system. For additional support or questions about specific endpoints, please refer to the source code or contact the development team.