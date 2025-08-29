# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Start production server
npm start
```

### Docker Development
```bash
# Start development environment
docker-compose up -d

# View application logs
docker-compose logs -f app

# Restart just the app service
docker-compose restart app

# Stop all services
docker-compose down

# Reset everything (including data)
docker-compose down -v
```

### Database Management
```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d relygate

# Database backup with timestamp
docker-compose exec postgres pg_dump -U postgres relygate > backup_$(date +%Y%m%d).sql

# Database restore
docker-compose exec -T postgres psql -U postgres relygate < backup.sql

# Check database size
docker-compose exec postgres psql -U postgres -d relygate -c "SELECT pg_size_pretty(pg_database_size('relygate'));"
```

### Health & Testing
```bash
# Health check (note: app runs on port 3333 in Docker)
curl http://localhost:3333/health

# API health check
curl http://localhost:3333/api/health

# Test with JWT authentication
export JWT_TOKEN="your-jwt-token"
curl -X GET "http://localhost:3333/api/visitors/purposes" -H "Authorization: Bearer $JWT_TOKEN"

# Test meal system health
curl -X GET "http://localhost:3333/api/meals/health" -H "Authorization: Bearer $JWT_TOKEN"

# Test meal system info
curl -X GET "http://localhost:3333/api/meals/system/info" -H "Authorization: Bearer $JWT_TOKEN"

# No test framework configured - tests need to be added
# Current test script: echo "Error: no test specified" && exit 1
```

### Container Management
```bash
# Access application container shell
docker-compose exec app sh

# Copy files to/from container
docker cp local-file.txt rely-gate-app-1:/app/
docker cp rely-gate-app-1:/app/logs/ ./local-logs/

# Check container resource usage
docker stats rely-gate-app-1 rely-gate-postgres-1
```

## Architecture Overview

### Enhanced Dependencies & Technologies
**Core Dependencies (New/Updated)**:
- **node-cron**: Background job scheduling for automated meal registration and reporting
- **express-rate-limit**: Multi-tier rate limiting with tenant-aware restrictions
- **pdfmake**: Dynamic PDF generation for reports and documents
- **nodemailer**: Email delivery system for automated daily reports
- **sharp**: Advanced image processing and optimization
- **moment-timezone**: Timezone-aware date/time handling for global tenants
- **helmet**: Enhanced security headers and protection
- **uuid**: Unique identifier generation for various entities

### Background Jobs System
**Automated Task Management**:
- **Meal Auto-Registration**: Scheduled cron jobs for automatic student meal registration
- **Email Reports**: Daily automated report generation and delivery to stakeholders
- **File Cleanup**: Automated cleanup of temporary files and expired uploads
- **Database Maintenance**: Scheduled database optimization and cleanup tasks

**Job Management Architecture**:
```javascript
// jobs/mealCronJobs.js - Tenant-aware cron scheduling
class MealCronJobs {
  static initializeCronJobs() // Initialize jobs for all active tenants
  static initializeTenantCronJobs(tenantId) // Per-tenant job scheduling
  static scheduleLunchRegistration() // Automated lunch registration
  static scheduleDinnerRegistration() // Automated dinner registration
}
```

**Job Execution Flow**:
1. Server startup initializes all tenant-specific cron jobs
2. Jobs run according to each tenant's meal settings schedule
3. Automatic registration triggered at booking start times
4. Error handling and retry mechanisms for failed jobs
5. Real-time job status monitoring and management

### Security & Performance Enhancements
**Multi-Tier Rate Limiting**:
- **General API**: 100 requests per 15 minutes per IP+tenant
- **Authentication**: 5 attempts per 15 minutes (brute force protection)
- **OTP Requests**: 5 requests per 5 minutes per IP+mobile
- **File Uploads**: 20 uploads per hour per IP+tenant
- **Bulk Operations**: 5 operations per hour per IP+tenant

**Enhanced Security Middleware**:
- **Helmet**: Security headers including CSP, HSTS, X-Frame-Options
- **CSRF Protection**: Cross-site request forgery protection
- **Input Sanitization**: Enhanced validation and sanitization
- **File Upload Security**: Advanced file type validation and virus scanning

### Multi-Tenant Design
This is a **multi-tenant visitor management system** with strict tenant isolation:
- Every database table includes a `TenantID` column for row-level security
- JWT tokens contain tenant context and user roles (`TenantID`, `UserID`, `Role`)
- All database queries are automatically scoped by tenant
- Middleware validates tenant access on every request
- Supports educational institutions and residential complexes

### Layered MVC Architecture
**Models** (`models/`): Data access layer with static methods
- Use parameterized queries exclusively for security
- Include audit fields: `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy`
- Soft delete pattern with `IsActive` boolean field
- Consistent naming: PascalCase for columns, camelCase for JavaScript

**Services** (`services/`): Business logic coordination
- Handle complex workflows and external integrations
- Coordinate between multiple models
- Manage file uploads, OTP verification, and analytics
- Transform data between controller and model layers

**Controllers** (`controllers/`): Thin HTTP handlers
- Validate requests using express-validator
- Delegate business logic to services
- Return standardized response format
- Handle authentication and authorization

**Routes** (`routes/`): API endpoint definitions
- Apply authentication middleware (`auth.js`)
- Apply tenant validation middleware (`tenant.js`)
- Include request validation middleware (`validation.js`)

### Database Patterns
- **Connection**: PostgreSQL with connection pooling
- **Schema**: Every table has TenantID, IsActive, audit fields
- **Queries**: Always use parameterized queries with tenant scoping
- **Transactions**: Use for multi-step operations
- **Initialization**: SQL scripts in `scripts/` directory

### Security Architecture
**Multi-layer security validation**:
1. Route-level authentication (JWT required)
2. Tenant-level authorization (TenantID validation)
3. Role-based access control (user roles)
4. Input validation (express-validator)

**JWT Structure**: Contains `TenantID`, `UserID`, `Role`, and permissions
**Password Security**: bcrypt hashing with salt rounds
**File Security**: Structured upload paths with validation

### File Upload System
**Base64 Processing**: Images converted and stored with metadata
**Directory Structure**: `uploads/{category}/{tenantId}/{filename}`
**File Types**: Visitor photos, vehicle images, ID documents, QR codes
**Naming Convention**: `{timestamp}_{randomHash}.{extension}`

### Business Domain Model

#### **Comprehensive Meal Management System**
**Meal Registration Workflow**:
1. **Auto-Registration**: Students automatically registered based on meal settings
2. **Opt-out Window**: Students can opt-out during designated time periods
3. **Manual Registration**: Staff can manually register students for meals
4. **QR-based Registration**: Students can register via QR code during booking window
5. **QR-based Consumption**: Meal consumption tracked via QR code scanning

**Meal States & Transitions**:
- `registered` → Default state after auto/manual registration
- `opted_out` → Student opted out during allowed window
- `consumed` → Student consumed the meal (QR scanned)
- `cancelled` → Meal cancelled by staff or system

**Meal Settings Architecture**:
- **Day-wise Configuration**: Different settings for each day of the week
- **Meal Type Support**: Lunch and dinner with separate timings
- **Booking Windows**: Configurable registration start/end times
- **Serving Windows**: Configurable meal service start/end times
- **Tenant Isolation**: Each tenant has independent meal settings

#### **Mess Management System**
**Menu Management**:
- **Daily Menus**: Create and manage daily meal menus
- **Weekly Planning**: Comprehensive weekly menu planning
- **Vegetarian Options**: Support for veg/non-veg preferences
- **Special Requests**: Handle custom dietary requirements

**Operational Tracking**:
- **Registration Lists**: Real-time lists of students registered for meals
- **Consumption Tracking**: Track actual meal consumption vs registration
- **Queue Management**: Monitor meal queues and wait times
- **Analytics Dashboard**: Comprehensive reporting on meal patterns

#### **Enhanced Multi-Tenant Features**
**Linked Tenants System**:
- **Tenant Switching**: Users can access multiple tenants with single login
- **JWT Re-issuing**: Secure token refresh for tenant context switching
- **Primary Tenant**: Default tenant assignment for users
- **Access Control**: Fine-grained permissions per tenant relationship

#### **Traditional Visitor Management**
**Visitor Management**:
- **Registered Visitors**: Pre-registered with mobile OTP verification
- **Unregistered Visitors**: On-demand registration with basic details
- **Check-in/Check-out**: Complete visitor lifecycle tracking
- **Purposes**: Categorized visit reasons (delivery, meeting, etc.)

**Multi-Institution Support**:
- Educational institutions: Student and staff management with meal systems
- Residential complexes: Visitor and vehicle tracking
- Bus management: Route and schedule tracking

**Analytics**: Real-time dashboard with visit patterns, meal analytics, and operational statistics

### API Response Format
All endpoints return consistent structure via `utils/response.js`:
```json
{
  "responseCode": "S|E|F|X",
  "responseMessage": "Success message",
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

**Response Codes**:
- `S`: Success
- `E`: Error  
- `F`: Record already exists
- `X`: Mobile number already registered

### Error Handling
**Centralized**: `middleware/error.js` handles all application errors
**Categories**: Validation, authentication, authorization, database, file upload
**Logging**: Comprehensive error logging with tenant context
**User Messages**: Client-friendly error messages without sensitive details

### Environment Configuration
**Development Environment**:
```bash
NODE_ENV=development
PG_DB_HOST=localhost  # Use 'postgres' for Docker
PORT=3000
JWT_SECRET=supersecretjwtkey
SMS_ENABLED=false
FILE_CLEANUP_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3065

# Email Configuration (for automated reports)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourcompany.com

# Cron Jobs Configuration
ENABLE_CRON_JOBS=true
TIMEZONE=Asia/Kolkata

# Rate Limiting
ENABLE_RATE_LIMITING=true
```

**Docker Ports**:
- Application: `localhost:3333` (external) → `3333` (internal)
- PostgreSQL: `localhost:5433` (external) → `5432` (internal)

### API Testing Examples
```bash
# Authentication
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Visitor OTP
curl -X POST http://localhost:3333/api/visitors/send-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"mobile": "9876543210", "fname": "John Doe"}'

# Bulk CSV Upload
curl -X POST http://localhost:3333/api/bulk/students \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@students.csv"

# Meal Registration (Manual)
curl -X POST http://localhost:3333/api/meals/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"studentId": 1, "mealType": "lunch", "mealPreference": "veg"}'

# Meal Opt-out
curl -X PUT http://localhost:3333/api/meals/opt-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"studentId": 1, "mealType": "lunch", "mealDate": "2024-12-01"}'

# Trigger Manual Auto-Registration
curl -X POST http://localhost:3333/api/meals/auto-register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"mealType": "lunch", "mealDate": "2024-12-01"}'

# Get Meal Settings
curl -X GET http://localhost:3333/api/meal-settings \
  -H "Authorization: Bearer $JWT_TOKEN"

# Send Daily Email Report
curl -X POST http://localhost:3333/api/email-reports/send-daily-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"date": "2024-12-01"}'

# Get Logging Statistics
curl -X GET http://localhost:3333/api/logs/stats \
  -H "Authorization: Bearer $JWT_TOKEN"

# Read Today's Logs
curl -X GET "http://localhost:3333/api/logs/read?date=29-08-2025" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test Logging System
curl -X POST http://localhost:3333/api/logs/test \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Key Conventions
- **Database**: Always include TenantID in WHERE clauses
- **Models**: Use static methods, return consistent data structures
- **Services**: Handle business logic, coordinate multiple models
- **Controllers**: Keep thin, delegate to services
- **File Uploads**: Process as base64, organize by category and tenant
- **Authentication**: Validate JWT and extract tenant context
- **Validation**: Use express-validator with `middleware/validation.js` helpers
- **Response Format**: Use `ResponseFormatter` class from `utils/response.js`
- **Rate Limiting**: Apply appropriate rate limits based on endpoint sensitivity
- **Background Jobs**: Use cron jobs for automated tasks, ensure tenant isolation
- **Meal System**: Follow meal workflow states: `registered` → `opted_out`/`consumed` → `cancelled`
- **Logging**: All console output automatically saved to daily log files in `logs/year/month/dd-mm-yyyy.log`

### Development Guidelines
- All database operations must be tenant-scoped
- Use the standardized response format with `responseCode: "S|E|F|X"`
- File uploads should use the established directory structure
- Follow the existing error handling patterns in `middleware/error.js`
- Test multi-tenant scenarios when adding new features
- Use the middleware stack for cross-cutting concerns
- Docker setup includes health checks and automatic database initialization
- CSV templates available for bulk operations: `/api/{entity}/template`
- Background jobs must handle tenant isolation and error recovery
- Rate limiting should be applied based on endpoint sensitivity
- Meal system operations must follow the established workflow patterns
- File-based logging is active by default - all console output is automatically captured
- Use `/api/logs/*` endpoints for log management and monitoring

### Additional Endpoints & Features

#### **Comprehensive Meal Management System**
**Meal Registration & Consumption**: Complete student meal lifecycle with QR-based registration and consumption
**Automatic Registration**: Background cron jobs for automatic meal registration with opt-out capability
**Meal Settings**: Configurable meal timings and schedules per tenant and day of week
**Meal Preferences**: Support for vegetarian/non-vegetarian preferences
**Meal Opt-out**: Students can opt-out of meals with automatic refund handling
**Queue Management**: Real-time meal queue tracking and analytics

#### **Mess Management System**
**Menu Management**: Daily/weekly menu creation and management by mess staff
**Meal Tracking**: Real-time tracking of meal registrations and consumption
**Special Requests**: Handling of special dietary requirements and custom meal requests
**Analytics Dashboard**: Comprehensive mess analytics and reporting

#### **Multi-Tenant Enhancements**
**Linked Tenants**: Users can switch between multiple tenants with JWT re-issuing
**User Management**: Complete role-based user management system
**Tenant Settings**: Per-tenant configuration and customization

#### **Automation & Background Jobs**
**Cron Job System**: Automated background tasks using `node-cron`
**Email Reports**: Automated daily report generation and email delivery
**Meal Auto-Registration**: Scheduled automatic meal registration for active students

#### **Security & Performance**
**Rate Limiting**: Multi-tier rate limiting with tenant-aware restrictions
**Enhanced Security**: Helmet middleware for security headers
**File Processing**: Advanced image processing with Sharp

#### **Other Core Features**
**Analytics**: Comprehensive analytics via `/api/analytics` endpoints  
**FCM Integration**: Push notifications for mobile apps via `/api/fcm`
**File Management**: Secure file uploads with validation in `middleware/upload.js`
**Vehicle Management**: Vehicle tracking and management capabilities
**PDF Generation**: Dynamic PDF report generation using PDFMake

## Database Testing Scripts

### Overview
Two comprehensive SQL scripts for testing phase database management:
- `scripts/drop_all.sql` - Complete database cleanup
- `scripts/insert_fresh.sql` - Realistic dummy data insertion

### ⚠️ IMPORTANT WARNINGS
- **NEVER run these scripts in production environments**
- **Only use in development/testing environments**
- **Scripts will completely destroy existing data**
- **Always backup important data before running**

### Database Reset and Testing Flow
```bash
# Step 1: Complete database cleanup
docker-compose exec postgres psql -U postgres -d relygate -f /scripts/drop_all.sql

# Step 2: Recreate schema (run your schema creation scripts)
docker-compose exec postgres psql -U postgres -d relygate -f /scripts/rely_gate_postgres.sql

# Step 3: Insert fresh test data
docker-compose exec postgres psql -U postgres -d relygate -f /scripts/insert_fresh.sql

# Step 4: Verify data insertion
docker-compose exec postgres psql -U postgres -d relygate -c "SELECT COUNT(*) FROM Tenant;"
```

### Test Data Overview

#### **Multi-Tenant Setup (5 Tenants)**
1. **Greenwood International School** - Educational institute with students and staff
2. **Sunrise Residency Society** - Residential complex with flats and residents  
3. **TechCorp Solutions** - Corporate office environment
4. **City General Hospital** - Healthcare facility
5. **Metro Shopping Mall** - Commercial complex

#### **Infrastructure Data (25 Records)**
- **Blocks**: 5 different building blocks (A, B, C, Admin, Academic)
- **Floors**: 5 floors across different blocks
- **Flats/Rooms**: 15 units including classrooms, offices, and residential flats

#### **User Management (20 Records)**
- **Administrators**: System admins for each tenant
- **Security Guards**: Front desk and gate security personnel
- **Residents**: Registered flat owners and tenants
- **Staff Members**: Educational and corporate staff

#### **Visitor Classification (15 Records)**
- **Categories**: Staff, Students, Guests, Unregistered, Buses
- **Sub-categories**: Teaching Staff, Security Guards, Regular Students, etc.
- **Purposes**: Meeting, Delivery, Class Attendance, Maintenance, School Trip

#### **Visitor Management (15 Records)**
- **Pre-registered Visitors**: 5 visitors with complete profiles and photos
- **Visit History**: 10 actual visit records with check-in/check-out times
- **Current Status**: Mix of checked-in and checked-out visitors

#### **Specialized Systems (15 Records)**
- **Meal Management**: 5 student meal records (breakfast, lunch, dinner)
- **OTP System**: 5 OTP verification records for mobile authentication
- **FCM Notifications**: 5 Firebase device registrations for push notifications

### Testing Scenarios Enabled

#### **End-to-End Visitor Flow**
```bash
# Test complete visitor registration and check-in process
curl -X POST http://localhost:3333/api/visitors/register \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"mobile": "9876543230", "name": "Test Visitor"}'

# Test visitor check-in with existing registered visitor
curl -X POST http://localhost:3333/api/visitors/checkin \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"visitorRegNo": "GIS2024001"}'
```

#### **Multi-Tenant API Testing**
```bash
# Test tenant isolation (should only return data for specific tenant)
curl -X GET "http://localhost:3333/api/students?tenantId=1" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test cross-tenant access prevention
curl -X GET "http://localhost:3333/api/students?tenantId=999" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### **Filter and Search Testing**
```bash
# Test student filtering by course
curl -X GET "http://localhost:3333/api/students?course=Computer Science" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test staff filtering by designation
curl -X GET "http://localhost:3333/api/staff?designation=Teaching Staff" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test bus filtering by category
curl -X GET "http://localhost:3333/api/buses?category=School Bus" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### **Authentication and Authorization**
```bash
# Test login with seeded users
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin_gis", "password": "password123"}'

# Test role-based access control
curl -X GET "http://localhost:3333/api/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### **Analytics and Reporting**
```bash
# Test visitor analytics with real data
curl -X GET "http://localhost:3333/api/analytics/visitors?fromDate=2024-01-01&toDate=2024-12-31" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test purpose-wise analytics
curl -X GET "http://localhost:3333/api/analytics/purposes" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Data Relationships and Integrity

#### **Foreign Key Relationships Tested**
- `VisitorRegistration` → `Tenant` (multi-tenant isolation)
- `VisitorSubCategory` → `VisitorCategory` (classification hierarchy)
- `FlatMaster` → `BlockMaster` → `FloorMaster` (infrastructure hierarchy)
- `LoginUser` → `RoleMaster` (role-based access)
- `VisitorRegVisitHistory` → `VisitorRegistration` (visit tracking)

#### **Business Logic Validation**
- **Tenant Isolation**: All queries automatically scoped by TenantID
- **Check-in/Check-out Flow**: Proper time tracking and status management
- **OTP Verification**: Mobile number validation for visitor registration
- **Role Permissions**: Different access levels for Admin, Security, Residents
- **Meal Tracking**: Student meal check-in system with token generation

### Development Testing Workflow

#### **Initial Setup**
1. **Environment**: Ensure Docker development environment is running
2. **Backup**: Create backup if existing data needs preservation
3. **Reset**: Run drop script to clean database
4. **Schema**: Apply latest schema from `scripts/rely_gate_postgres.sql`
5. **Data**: Insert test data using `scripts/insert_fresh.sql`

#### **Feature Testing**
1. **API Endpoints**: Test all CRUD operations with realistic data
2. **Pagination**: Verify pagination works with 5+ records per entity
3. **Filtering**: Test search and filter functionality
4. **Authentication**: Verify JWT token generation and validation
5. **Multi-tenancy**: Confirm tenant isolation works correctly

#### **Integration Testing**
1. **Complete Flows**: Test end-to-end visitor registration and check-in
2. **Cross-module**: Test analytics data reflects actual visit records
3. **File Uploads**: Test photo and document upload functionality
4. **Notifications**: Test FCM push notification system
5. **Reporting**: Verify CSV export functionality

### Maintenance and Updates

#### **Adding New Test Data**
```sql
-- Add new tenant for testing
INSERT INTO Tenant (TenantName, TenantCode, ...) VALUES (...);

-- Add corresponding users and infrastructure
-- Maintain referential integrity and business logic
```

#### **Customizing Test Scenarios**
- Modify visitor purposes for specific testing needs
- Add more complex visitor flows (multi-day visits, recurring visitors)
- Create edge cases (expired registrations, blocked visitors)
- Test bulk upload scenarios with CSV data

#### **Performance Testing**
- Scale up data to test performance with larger datasets
- Create concurrent visitor scenarios
- Test database query optimization
- Validate caching and indexing strategies
- Test cron job performance under high tenant loads
- Validate rate limiting effectiveness during peak usage

## Background Jobs & Automation

### Meal Auto-Registration System
**Daily Workflow**:
1. **Job Initialization**: Server startup initializes cron jobs for all active tenants
2. **Schedule Parsing**: Each tenant's meal settings parsed for day-specific timings
3. **Automatic Trigger**: Jobs trigger at lunch/dinner booking start times
4. **Student Registration**: All active students automatically registered for meals
5. **Opt-out Period**: Students can opt-out during designated windows
6. **Consumption Tracking**: QR-based meal consumption during serving times

**Cron Job Commands**:
```bash
# Monitor active cron jobs
docker-compose exec app node -e "console.log(require('./jobs/mealCronJobs').getJobsStatus())"

# Manual trigger for testing
curl -X POST http://localhost:3333/api/meals/auto-register \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"mealType": "lunch"}'

# Restart all meal cron jobs
docker-compose restart app
```

### Email Reporting System
**Automated Daily Reports**:
- **Visitor Analytics**: Daily visitor statistics and patterns
- **Meal Reports**: Registration, opt-out, and consumption summaries
- **Security Reports**: Gate pass approvals and security incidents
- **Operational Metrics**: System health and performance indicators

**Report Configuration**:
```bash
# Add email recipients
curl -X POST http://localhost:3333/api/email-reports/recipients \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"recipientEmail": "admin@company.com", "recipientName": "Admin User"}'

# Trigger manual daily report
curl -X POST http://localhost:3333/api/email-reports/send-daily-report \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"date": "2024-12-01"}'
```

### Job Management Best Practices
**Development**:
- All cron jobs are tenant-aware and isolated
- Jobs include comprehensive error handling and retry logic
- Job status and execution logs are tracked and monitored
- Manual triggers available for testing and debugging

**Production Considerations**:
- Jobs run in Asia/Kolkata timezone by default
- Database transactions ensure data consistency
- Failed jobs are logged with detailed error information
- Job scheduling automatically adjusts for tenant settings changes

## Meal System Architecture

### Daily Meal Workflow
**Morning Setup**:
1. **Auto-Registration**: Cron job triggers at booking start time
2. **Student Notification**: Students notified of automatic registration
3. **Opt-out Window**: Students can opt-out during designated period
4. **Menu Display**: Daily menu displayed via mess management system

**Meal Service**:
1. **QR Generation**: Unique QR codes generated for registered students
2. **Queue Management**: Real-time queue tracking during serving hours
3. **Consumption Tracking**: QR scanning tracks actual meal consumption
4. **Analytics Update**: Real-time analytics updated with consumption data

**End-of-Day**:
1. **Report Generation**: Daily meal reports generated automatically
2. **Email Delivery**: Reports sent to designated recipients
3. **Data Archival**: Meal data archived for historical analysis
4. **Cleanup Tasks**: Temporary files and expired tokens cleaned up

### Meal Settings Management
**Configuration Hierarchy**:
```
Tenant Level
├── Global meal settings (enabled/disabled)
├── Weekly Schedule
│   ├── Monday Settings (lunch/dinner times)
│   ├── Tuesday Settings
│   └── ... (other days)
└── Operational Parameters
    ├── Booking windows
    ├── Serving windows
    └── Opt-out policies
```

**Key Endpoints**:
```bash
# Get current meal settings
GET /api/meal-settings

# Update meal settings for specific day
PUT /api/meal-settings/day/monday

# Get current meal status
GET /api/meal-settings/status

# Validate meal action (booking/checkin)
POST /api/meal-settings/validate
```

## Rate Limiting & Security

### Multi-Tier Rate Limiting
**Implementation Details**:
```javascript
// middleware/rateLimit.js
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP+tenant
  keyGenerator: (req) => `${ip}-${req.user?.tenantId || 'anonymous'}`
});
```

**Rate Limit Tiers**:
- **General API**: 100 requests/15min (tenant-aware)
- **Authentication**: 5 attempts/15min (IP-based)
- **OTP Requests**: 5 requests/5min (IP+mobile)
- **File Uploads**: 20 uploads/hour (IP+tenant)
- **Bulk Operations**: 5 operations/hour (IP+tenant)

### Security Enhancements
**Headers Applied via Helmet**:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

## File-Based Logging System

### Overview
**Comprehensive file-based logging system** that captures all console output and stores it in organized daily log files. The system automatically creates folder structures and files based on dates, ensuring easy log management and historical tracking.

### Directory Structure
```
logs/
├── 2025/
│   ├── august/
│   │   ├── 29-08-2025.log
│   │   ├── 30-08-2025.log
│   │   └── 31-08-2025.log
│   ├── september/
│   │   ├── 01-09-2025.log
│   │   └── 02-09-2025.log
│   └── ...
└── 2024/
    └── december/
        └── 31-12-2024.log
```

### Log Format
**Entry Structure**: `[TIMESTAMP] [LEVEL] MESSAGE`
**Timestamp Format**: `YYYY-MM-DD HH:mm:ss.SSS` (Asia/Kolkata timezone)
**Log Levels**: `INFO`, `ERROR`, `WARN`, `DEBUG`

**Example Log Entries**:
```
[2025-08-29 10:34:16.733] [INFO] 🚀 System running in development mode on port 9002
[2025-08-29 10:34:17.491] [INFO] Database connection established successfully  
[2025-08-29 10:34:18.792] [INFO] ✅ Meal cron jobs initialization completed successfully
[2025-08-29 10:32:57.099] [ERROR] ValidationError: The 'X-Forwarded-For' header is set...
```

### Automatic Features
1. **Daily File Rotation**: New log file created automatically each day
2. **Directory Creation**: Month and year directories created automatically
3. **Console Override**: All `console.log`, `console.error`, `console.warn`, `console.info` captured
4. **Timezone Aware**: Uses Asia/Kolkata timezone for consistent timestamps
5. **Object Serialization**: JSON objects and complex data structures properly formatted
6. **Error Stack Traces**: Complete error stack traces preserved in logs

### Logging API Endpoints
**Base URL**: `/api/logs` (Admin access required)

```bash
# Get logging system statistics
GET /api/logs/stats

# Read logs for specific date (DD-MM-YYYY format)
GET /api/logs/read?date=29-08-2025

# Get current log file information
GET /api/logs/current

# Test logging functionality
POST /api/logs/test

# Clean up old logs (keep last N days)
POST /api/logs/cleanup
{
  "daysToKeep": 30
}

# Check logging system health
GET /api/logs/health
```

### Usage Examples
```bash
# View today's logs
curl -X GET "http://localhost:3333/api/logs/read?date=29-08-2025" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Get logging statistics
curl -X GET "http://localhost:3333/api/logs/stats" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test logging system
curl -X POST "http://localhost:3333/api/logs/test" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Clean up logs older than 7 days
curl -X POST "http://localhost:3333/api/logs/cleanup" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"daysToKeep": 7}'
```

### Configuration & Environment
**Timezone Setting**:
```bash
# Set timezone in environment variables
TIMEZONE=Asia/Kolkata
```

**Log Directory**: `logs/` (created automatically in project root)

### Maintenance Features
1. **Automatic Cleanup**: Remove logs older than specified days
2. **Log Statistics**: Track total files, sizes, date ranges
3. **Health Monitoring**: Verify logging system operational status  
4. **Manual Log Reading**: API endpoint to read logs for any date
5. **Testing Tools**: Built-in endpoints to test logging functionality

### Implementation Details
**Logger Utility**: `utils/logger.js`
- **Console Override**: Intercepts all console methods
- **File Management**: Handles directory creation and file writing
- **Error Handling**: Robust error handling for file system operations
- **Memory Efficient**: Append-only writes, no memory buffering
- **Thread Safe**: Synchronous file operations prevent race conditions

**Integration**:
- **Early Initialization**: Logger starts before any other modules
- **Zero Configuration**: Works out-of-the-box with sensible defaults
- **Backward Compatible**: Existing console.log usage continues to work
- **Performance Impact**: Minimal overhead on application performance

## Advanced Features

### Linked Tenants System
**Multi-Tenant Access Flow**:
1. **Initial Login**: User authenticates with primary credentials
2. **Tenant Discovery**: System returns list of linked tenants
3. **Tenant Selection**: User selects target tenant from dropdown
4. **JWT Re-issue**: New JWT issued with selected tenant context
5. **Context Switch**: User interface updates to selected tenant

**Key Endpoints**:
```bash
# Get user's linked tenants
GET /api/linked-tenants/my-tenants

# Link user to new tenant
POST /api/linked-tenants/manage

# Verify tenant access
GET /api/linked-tenants/verify-access/:loginId/:tenantId
```

### File Processing System
**Enhanced Upload Pipeline**:
1. **Upload Validation**: File type, size, and security checks
2. **Image Processing**: Sharp-based optimization and resizing
3. **Tenant Organization**: Files organized by tenant and category
4. **Metadata Storage**: File metadata stored with audit trails
5. **Cleanup Jobs**: Automated cleanup of temporary and expired files

**Upload Directory Structure**:
```
uploads/
├── temp/                    # Temporary files
├── visitors/               # Visitor photos
├── registered_visitors/    # Pre-registered visitor photos
├── vehicles/              # Vehicle images
├── qr_codes/             # Generated QR codes
├── logos/                # Tenant logos
├── users/               # User profile images
├── approvers/           # Approver photos
└── reports/            # Generated reports
```
