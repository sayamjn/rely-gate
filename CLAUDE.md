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
**Visitor Management**:
- **Registered Visitors**: Pre-registered with mobile OTP verification
- **Unregistered Visitors**: On-demand registration with basic details
- **Check-in/Check-out**: Complete visitor lifecycle tracking
- **Purposes**: Categorized visit reasons (delivery, meeting, etc.)

**Multi-Institution Support**:
- Educational institutions: Student and staff management
- Residential complexes: Visitor and vehicle tracking
- Bus management: Route and schedule tracking

**Analytics**: Real-time dashboard with visit patterns and statistics

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
DB_HOST=localhost  # Use 'postgres' for Docker
PORT=3000
JWT_SECRET=supersecretjwtkey
SMS_ENABLED=false
FILE_CLEANUP_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3065
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

### Development Guidelines
- All database operations must be tenant-scoped
- Use the standardized response format with `responseCode: "S|E|F|X"`
- File uploads should use the established directory structure
- Follow the existing error handling patterns in `middleware/error.js`
- Test multi-tenant scenarios when adding new features
- Use the middleware stack for cross-cutting concerns
- Docker setup includes health checks and automatic database initialization
- CSV templates available for bulk operations: `/api/{entity}/template`

### Additional Endpoints & Features
**Meal Management**: Student meal flow with check-in/check-out tracking
**Analytics**: Comprehensive analytics via `/api/analytics` endpoints  
**FCM Integration**: Push notifications for mobile apps via `/api/fcm`
**File Management**: Secure file uploads with validation in `middleware/upload.js`
**Vehicle Management**: Vehicle tracking and management capabilities

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