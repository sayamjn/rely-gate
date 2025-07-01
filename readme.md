# 🏢 Rely Gate - Multi-Tenant Visitor Management System

A comprehensive, multi-tenant management system built with Node.js, Express, and PostgreSQL. Features include visitor registration, gatepass management, student tracking, staff management, and bus monitoring with real-time check-in/check-out functionality.

## ✨ Features

- **Multi-tenant**
- **Visitor Management** 
- **Gatepass System**
- **Student Tracking**
- **Staff Management**
- **Bus Management**
- **Bulk Operations** 
- **Real-time Dashboard** 
- **SMS Integration** 
- **File Upload**
- **Export Functionality** 

## 🚀 Quick Start with Docker

```bash
# 1. Clone the repository
git https://github.com/sayamjn/rely-gate
cd rely-gate

# 2. Create environment file
cp .env.example .env
# Edit .env with your settings

# 3. Start the application
docker-compose up -d

# 4. Test the application
curl http://localhost:3000/health
```

## 📋 Prerequisites

- **Docker Desktop 4.0+**
- **Docker Compose 2.0+**
- **Git**
- **4GB RAM minimum**
- **10GB free disk space**

### Installation

```bash
# macOS
brew install --cask docker

# Windows
# Download from https://docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```bash
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=relygate

JWT_SECRET=supersecretjwtkey
JWT_EXPIRES_IN=24h

NODE_ENV=development

MAX_FILE_SIZE=50mb
UPLOAD_DIR=./uploads

# SMS Configuration (for OTP)
SMS_ENABLED=false
SMS_GATEWAY_URL=https://your-sms-gateway.com/api/send
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=RELYGAT

# Firebase Configuration (for push notifications)
FIREBASE_SERVER_KEY=your-firebase-server-key
FCM_SERVER_KEY=your-fcm-server-key

# API Configuration
API_URL=http://localhost:3000
BASE_URL=http://localhost:3000

FILE_CLEANUP_ENABLED=true
FILE_MAX_AGE_DAYS=30
MAX_FILE_SIZE=10485760


# File Upload Configuration
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,text/csv

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3065
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │────│   Express API   │────│   PostgreSQL    │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   File Storage  │
                       │   (Uploads)     │
                       └─────────────────┘
```

## 🐳 Docker Setup

### Development Environment

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Reset everything (including data)
docker-compose down -v
```

### Docker Files Structure

```
rely-gate/
├── Dockerfile                 # Application container
├── docker-compose.yml         # Multi-service setup
├── .dockerignore             # Files to exclude from build
├── .env                      # Environment variables
└── scripts/
    └── rely_gate_postgres.sql # Database initialization
```

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/login              - User authentication
POST   /api/auth/register           - User registration
GET    /api/auth/profile            - Get user profile
```

# API ENDPOINTS SUMMARY

## VISITOR MANAGEMENT APIs
```
GET    /api/visitors/purposes              - Get visitor purposes by category
GET    /api/visitors/subcategories         - Get visitor subcategories
GET    /api/visitors                       - List visitors (legacy)
POST   /api/visitors/list                  - List visitors with advanced filtering
GET    /api/visitors/pending-checkout      - Get visitors currently checked in
POST   /api/visitors/send-otp              - Send OTP for visitor registration
POST   /api/visitors/send-unregistered-otp - Send OTP for unregistered visitor
POST   /api/visitors/verify-otp            - Verify OTP and complete registration
PUT    /api/visitors/checkin               - Check-in registered visitor
PUT    /api/visitors/history/:id/checkout  - Check-out visitor
GET    /api/visitors/:id/history           - Get visitor history
GET    /api/visitors/export                - Export visitors data
GET    /api/visitors/template              - Download CSV template
```

## STUDENT MANAGEMENT APIs
```
GET    /api/students/purposes              - Get student purposes by category
GET    /api/students/purpose-categories    - Get purpose categories
GET    /api/students/subcategories         - Get student subcategories ✨ MISSING
GET    /api/students                       - List students (legacy)
POST   /api/students/list                  - List students with advanced filtering
GET    /api/students/pending-checkin       - Get students currently checked out
GET    /api/students/pending-checkout      - Get students currently checked in
GET    /api/students/:id/status            - Get student's current status
POST   /api/students/:id/checkout          - Check-out student
POST   /api/students/:id/checkin           - Check-in student
GET    /api/students/:id/history           - Get student visit history
GET    /api/students/export                - Export students data
GET    /api/students/template              - Download CSV template
```

## BUS MANAGEMENT APIs
```
GET    /api/buses/purposes                 - Get available purposes for buses
GET    /api/buses                          - List buses (legacy) ✨ MISSING
POST   /api/buses/list                     - List buses with filters
GET    /api/buses/pending-checkin          - Get buses currently checked out
GET    /api/buses/pending-checkout         - Get buses currently checked in ✨ MISSING
GET    /api/buses/:id/status               - Check bus current status
POST   /api/buses/:id/checkout             - Checkout bus with purpose
POST   /api/buses/:id/checkin              - Checkin bus
GET    /api/buses/:id/history              - Get bus visit history
GET    /api/buses/export                   - Export buses data
GET    /api/buses/template                 - Download CSV template
```

## STAFF MANAGEMENT APIs
```
GET    /api/staff/designations             - Get available designations
GET    /api/staff                          - List staff (legacy)
POST   /api/staff/list                     - List staff with advanced filtering
GET    /api/staff/pending-checkout         - Get staff currently checked in
GET    /api/staff/:id/status               - Get staff's current status
POST   /api/staff/:id/checkin              - Check-in staff member
POST   /api/staff/:id/checkout             - Check-out staff member
POST   /api/staff/register                 - Staff registration (OTP-based)
POST   /api/staff/verify-registration      - Verify OTP and complete registration
GET    /api/staff/:id/history              - Get staff visit history
GET    /api/staff/export                   - Export staff data to CSV
GET    /api/staff/template                 - Download CSV template
```

### Dashboard
```
GET    /api/dashboard/summary      - Get dashboard statistics
GET    /api/dashboard/visitor-details - Get visitor details
```

### Bulk Operations
```
POST   /api/bulk/visitors          - Upload visitor data via CSV
POST   /api/bulk/students          - Upload student data via CSV
POST   /api/bulk/staff             - Upload staff data via CSV
POST   /api/bulk/buses             - Upload bus data via CSV
```


### Response Format

All APIs return a consistent response format:

```json
{
  "responseCode": "S",
  "responseMessage": "Success",
  "data": {},
  "count": 10,
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalItems": 100
  }
}
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### API Testing with JWT
```bash
# 1. Login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# 2. Use token for authenticated requests
export JWT_TOKEN="your-jwt-token"

# 3. Test visitor endpoint
curl -X GET "http://localhost:3000/api/visitors/purposes" \
  -H "Authorization: Bearer $JWT_TOKEN"
```




### Environment-Specific Configurations

#### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
DB_SSL=false
```

#### Production
```bash
NODE_ENV=production
LOG_LEVEL=info
DB_SSL=true
# CORS_ORIGIN=https://yourdomain.com
```

## 🔧 Development

### Local Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with Docker
docker-compose up -d
```

### Database Management
```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d relygate

# Backup database
docker-compose exec postgres pg_dump -U postgres relygate > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres relygate < backup.sql
```



## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 📊 Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **File Processing**: Multer, Sharp
- **Containerization**: Docker, Docker Compose
- **Deployment**: Railway, Render, Fly.io
- **Development**: Nodemon, ESLint

---

**Built with ❤️ for Rely**