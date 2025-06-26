# 🚀 Rely Gate - Complete Docker Deployment Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Pre-requisites](#pre-requisites)
3. [Project Setup](#project-setup)
4. [Dockerization Steps](#dockerization-steps)
5. [Local Development](#local-development)
6. [Testing Guide](#testing-guide)
7. [API Endpoints Documentation](#api-endpoints-documentation)
8. [Deployment Options](#deployment-options)
9. [Production Deployment](#production-deployment)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone <your-repo>
cd rely-gate

# 2. Create environment file
cp .env.example .env

# 3. Start with Docker
docker-compose up -d

# 4. Test the application
curl http://localhost:3000/health
```

---

## 📦 Pre-requisites

### System Requirements
- Docker Desktop 4.0+ 
- Docker Compose 2.0+
- Git
- Node.js 18+ (for local development)
- 4GB RAM minimum
- 10GB free disk space

### Installation Commands
```bash
# Install Docker Desktop (macOS)
brew install --cask docker

# Install Docker Desktop (Windows)
# Download from https://docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version
```

---

## 🔧 Project Setup

### 1. Environment Configuration

Create `.env` file:
```bash
# Application Settings
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000

# Database Configuration (Docker)
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=MySecurePassword123!
DB_NAME=relygate

# JWT Configuration
JWT_SECRET=supersecretjwtkey-change-in-production
JWT_EXPIRES_IN=24h

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,text/csv
FILE_CLEANUP_ENABLED=true
FILE_MAX_AGE_DAYS=30

# SMS Configuration
SMS_ENABLED=false
SMS_GATEWAY_URL=https://your-sms-gateway.com/api/send
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=RELYGAT

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 2. Docker Configuration Files

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Expose port
EXPOSE 3000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S relygate -u 1001
RUN chown -R relygate:nodejs /app
USER relygate

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/rely_gate_postgres.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"  # Using 5433 to avoid local PostgreSQL conflicts
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    environment:
      NODE_ENV: ${NODE_ENV}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      PORT: ${PORT}
      BASE_URL: ${BASE_URL}
      MAX_FILE_SIZE: ${MAX_FILE_SIZE}
      UPLOAD_DIR: ${UPLOAD_DIR}
    ports:
      - "${PORT}:${PORT}"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - app_uploads:/app/uploads
    restart: unless-stopped

volumes:
  postgres_data:
  app_uploads:
```

#### .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.env.local
.env.development.local
.env.test.local
.env.production.local
Dockerfile
docker-compose.yml
*.md
```

---

## 🐳 Dockerization Steps

### Step 1: Build and Start Services
```bash
# Clean any existing containers
docker-compose down -v
docker system prune -f

# Build and start services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f app
docker-compose logs -f postgres
```

### Step 2: Verify Database Setup
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d relygate

# Check tables
\dt

# Exit PostgreSQL
\q
```

### Step 3: Test Application Health
```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"OK","timestamp":"2025-06-25T...","uptime":...}
```

---

## 🧪 Local Development

### Development Workflow
```bash
# Start development environment
docker-compose up -d

# View real-time logs
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

# Backup database
docker-compose exec postgres pg_dump -U postgres relygate > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres relygate < backup.sql

# View database size
docker-compose exec postgres psql -U postgres -d relygate -c "SELECT pg_size_pretty(pg_database_size('relygate'));"
```

### Development Commands
```bash
# Install new dependencies
docker-compose exec app npm install <package-name>

# Run custom scripts
docker-compose exec app npm run <script-name>

# Access container shell
docker-compose exec app sh

# Copy files to container
docker cp local-file.txt rely-gate-app-1:/app/

# Copy files from container
docker cp rely-gate-app-1:/app/logs/ ./local-logs/
```

---

## 📊 Testing Guide

### 1. Health Check Testing
```bash
# Basic health check
curl -X GET http://localhost:3000/health

# Expected Response:
{
  "status": "OK",
  "timestamp": "2025-06-25T...",
  "uptime": 123.45,
  "environment": "development"
}
```

### 2. Authentication Testing
```bash
# Register new user (if endpoint exists)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123",
    "email": "test@example.com"
  }'

# Login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'

# Save the JWT token from response for other tests
export JWT_TOKEN="your-jwt-token-here"
```

### 3. Visitor Management Testing
```bash
# Get visitor purposes
curl -X GET "http://localhost:3000/api/visitors/purposes" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Send OTP for visitor registration
curl -X POST http://localhost:3000/api/visitors/send-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mobile": "9876543210",
    "fname": "John Doe"
  }'

# Verify OTP and complete registration
curl -X POST http://localhost:3000/api/visitors/verify-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mobile": "9876543210",
    "otp": "123456",
    "purposeId": 1,
    "purposeName": "Meeting"
  }'

# List visitors with filters
curl -X POST http://localhost:3000/api/visitors/list \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "page": 1,
    "pageSize": 20,
    "search": "John"
  }'

# Get pending checkouts
curl -X GET "http://localhost:3000/api/visitors/pending-checkout" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 4. Gatepass Testing
```bash
# Create gatepass
curl -X POST http://localhost:3000/api/gatepass \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "fname": "Jane Smith",
    "mobile": "9876543211",
    "visitDate": "2025-06-25",
    "purposeId": 1,
    "purposeName": "Delivery",
    "remark": "Package delivery"
  }'

# List gatepasses
curl -X POST http://localhost:3000/api/gatepass/list \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "page": 1,
    "pageSize": 10
  }'

# Approve gatepass (replace :id with actual gatepass ID)
curl -X PUT http://localhost:3000/api/gatepass/1/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{}'

# Check-in gatepass
curl -X POST http://localhost:3000/api/gatepass/1/checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{}'

# Check-out gatepass
curl -X POST http://localhost:3000/api/gatepass/1/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{}'
```

### 5. Dashboard Testing
```bash
# Get dashboard summary
curl -X GET "http://localhost:3000/api/dashboard/summary" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Get visitor details
curl -X GET "http://localhost:3000/api/dashboard/visitor-details" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 6. File Upload Testing
```bash
# Upload student data (CSV)
curl -X POST http://localhost:3000/api/bulk/students \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@students.csv"

# Upload visitor data (CSV)
curl -X POST http://localhost:3000/api/bulk/visitors \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@visitors.csv"

# Download CSV template
curl -X GET "http://localhost:3000/api/visitors/template" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o visitors_template.csv
```

---

## 🌐 API Endpoints Documentation

### Authentication Endpoints
```
POST   /api/auth/login              - User authentication
POST   /api/auth/register           - User registration
POST   /api/auth/logout             - User logout
GET    /api/auth/profile            - Get user profile
```

### Visitor Management APIs
```
GET    /api/visitors/purposes              - Get visitor purposes by category
GET    /api/visitors/subcategories         - Get visitor subcategories  
POST   /api/visitors/list                  - List visitors with advanced filtering
GET    /api/visitors/pending-checkout      - Get visitors currently checked in
POST   /api/visitors/send-otp              - Send OTP for visitor registration
POST   /api/visitors/send-unregistered-otp - Send OTP for unregistered visitor
POST   /api/visitors/verify-otp            - Verify OTP and complete registration
PUT    /api/visitors/checkin               - Check-in registered visitor
PUT    /api/visitors/history/:id/checkout  - Check-out visitor
GET    /api/visitors/:id/history           - Get visitor history
GET    /api/visitors/export                - Export visitors data to CSV
GET    /api/visitors/template              - Download CSV template
```

### Student Management APIs
```
GET    /api/students/purposes              - Get student purposes by category
GET    /api/students/purpose-categories    - Get purpose categories
POST   /api/students/list                  - List students with advanced filtering
GET    /api/students/pending-checkin       - Get students currently checked out
GET    /api/students/pending-checkout      - Get students currently checked in
GET    /api/students/:id/status            - Get student's current status
POST   /api/students/:id/checkout          - Check-out student
POST   /api/students/:id/checkin           - Check-in student
GET    /api/students/:id/history           - Get student visit history
GET    /api/students/export                - Export students data to CSV
GET    /api/students/template              - Download CSV template
```

### Bus Management APIs
```
GET    /api/buses/purposes                 - Get available purposes for buses
POST   /api/buses/list                     - List buses with filters
GET    /api/buses/pending-checkin          - Get buses currently checked out
GET    /api/buses/pending-checkout         - Get buses currently checked in
GET    /api/buses/:id/status               - Check bus current status
POST   /api/buses/:id/checkout             - Checkout bus with purpose
POST   /api/buses/:id/checkin              - Checkin bus
GET    /api/buses/:id/history              - Get bus visit history
GET    /api/buses/export                   - Export buses data to CSV
GET    /api/buses/template                 - Download CSV template
```

### Staff Management APIs
```
GET    /api/staff/designations             - Get available designations
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

### Gatepass Management APIs
```
POST   /api/gatepass                       - Create new gatepass
GET    /api/gatepass                       - List gatepasses (simple)
POST   /api/gatepass/list                  - List gatepasses with advanced filtering
PUT    /api/gatepass/:id/approve           - Approve gatepass
POST   /api/gatepass/:id/checkin           - Check-in gatepass (sets INTime)
POST   /api/gatepass/:id/checkout          - Check-out gatepass (sets OutTime)
GET    /api/gatepass/:id/status            - Get gatepass current status
GET    /api/gatepass/:id/history           - Get gatepass history
```

### Bulk Upload APIs
```
POST   /api/bulk/students                  - Upload student data via CSV
POST   /api/bulk/visitors                  - Upload visitor data via CSV
POST   /api/bulk/staff                     - Upload staff data via CSV
POST   /api/bulk/buses                     - Upload bus data via CSV
```

### Dashboard APIs
```
GET    /api/dashboard/summary              - Get dashboard summary statistics
GET    /api/dashboard/visitor-details      - Get visitor latest visit details
```

### Utility Endpoints
```
GET    /health                             - Application health check
GET    /api/health                         - API health check
GET    /api/status                         - Application status
```

### Response Format
All APIs return consistent response format:
```json
{
  "responseCode": "S|E",
  "responseMessage": "Success message or error description",
  "data": {}, 
  "count": 0, 
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalItems": 100
  }
}
```

---

## 🚀 Deployment Options

### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway create rely-gate

# Add PostgreSQL database
railway add postgresql

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set PORT=3000

# Deploy
railway up

# Check status
railway status
```

### Option 2: Render
1. Push code to GitHub
2. Connect repository to Render
3. Create PostgreSQL database
4. Deploy web service with Docker

### Option 3: Fly.io
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly launch --no-deploy

# Create PostgreSQL
fly postgres create --name rely-gate-db

# Attach database
fly postgres attach rely-gate-db

# Set secrets
fly secrets set JWT_SECRET=$(openssl rand -base64 32)

# Deploy
fly deploy
```

---

## 🏭 Production Deployment

### 1. Production Environment Variables
```bash
# Production .env
NODE_ENV=production
PORT=3000
DB_SSL=true
JWT_SECRET=super-secure-random-key-here
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
```

### 2. Docker Production Build
```bash
# Build production image
docker build -t rely-gate:prod .

# Tag for registry
docker tag rely-gate:prod your-registry/rely-gate:latest

# Push to registry
docker push your-registry/rely-gate:latest
```

### 3. Production docker-compose.yml
```yaml
services:
  app:
    image: your-registry/rely-gate:latest
    restart: always
    environment:
      NODE_ENV: production
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "80:3000"
    depends_on:
      - postgres
```

### 4. CI/CD with GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Build and deploy
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      run: |
        npm install -g @railway/cli
        railway login --token $RAILWAY_TOKEN
        railway up
```

---

## 📊 Monitoring & Maintenance

### Health Monitoring
```bash
# Application health
curl http://localhost:3000/health

# Database health
docker-compose exec postgres pg_isready -U postgres -d relygate

# Container health
docker-compose ps
docker stats
```

### Log Management
```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f postgres

# Save logs to file
docker-compose logs app > app.log

# Follow logs with timestamp
docker-compose logs -f -t app
```

### Database Maintenance
```bash
# Database backup
docker-compose exec postgres pg_dump -U postgres relygate > backup_$(date +%Y%m%d).sql

# Database restore
docker-compose exec -T postgres psql -U postgres relygate < backup_20250625.sql

# Check database size
docker-compose exec postgres psql -U postgres -d relygate -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables 
  WHERE schemaname = 'public' 
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Performance Monitoring
```bash
# Container resource usage
docker stats rely-gate-app-1 rely-gate-postgres-1

# Database performance
docker-compose exec postgres psql -U postgres -d relygate -c "
  SELECT query, calls, total_time, mean_time 
  FROM pg_stat_statements 
  ORDER BY total_time DESC 
  LIMIT 10;
"
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
```bash
# Error: Port 5432 is already in use
# Solution: Change port in docker-compose.yml
ports:
  - "5433:5432"  # Use different external port
```

#### 2. Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d relygate -c "SELECT 1;"
```

#### 3. Application Won't Start
```bash
# Check application logs
docker-compose logs app

# Check if environment variables are set
docker-compose exec app env | grep DB_

# Restart application
docker-compose restart app
```

#### 4. File Upload Issues
```bash
# Check uploads directory permissions
docker-compose exec app ls -la uploads/

# Check file size limits
docker-compose exec app cat /proc/sys/fs/file-max
```

#### 5. Out of Memory
```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Debug Commands
```bash
# Access application container
docker-compose exec app sh

# Check network connectivity
docker-compose exec app ping postgres

# View environment variables
docker-compose exec app printenv

# Check file system
docker-compose exec app df -h

# Test database from app container
docker-compose exec app node -e "
  const { Pool } = require('pg');
  const pool = new Pool({
    host: 'postgres',
    port: 5432,
    database: 'relygate',
    user: 'postgres',
    password: process.env.DB_PASSWORD
  });
  pool.query('SELECT NOW()', (err, res) => {
    console.log(err || res.rows[0]);
    process.exit();
  });
"
```

---

## 📈 Performance Optimization

### 1. Database Optimization
```sql
-- Add indexes for better query performance
CREATE INDEX idx_visitors_tenant_mobile ON visitors(tenantid, mobile);
CREATE INDEX idx_gatepass_visit_date ON gatepass(visitdate);
CREATE INDEX idx_students_tenant_status ON students(tenantid, statusid);

-- Update table statistics
ANALYZE;
```

### 2. Application Optimization
```bash
# Enable gzip compression in Express
# Add to your app configuration:
app.use(compression());

# Cache static files
app.use(express.static('public', { maxAge: '1y' }));
```

### 3. Docker Optimization
```dockerfile
# Multi-stage build for smaller image
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["npm", "start"]
```

---

This completes your comprehensive Docker deployment guide! Each section provides step-by-step instructions with copy-paste commands for easy implementation.