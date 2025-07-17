# EPOCH TIME TESTING ROADMAP - VISITOR MODULE

## Overview
This document provides a comprehensive roadmap for testing epoch time functionality in the visitor module of the Rely Gate system. All time-related operations have been converted to use Unix epoch timestamps consistently across the entire visitor feature.

## Prerequisites

### 1. Database Setup
```bash
# Start Docker environment
docker-compose up -d

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d relygate

# Run schema creation
\i /scripts/rely_gate_postgres.sql

# Insert epoch time test data
\i /scripts/visitor_epoch_test_data.sql
```

### 2. Application Setup
```bash
# Install dependencies
npm install

# Start application
npm start

# Verify application is running
curl http://localhost:3000/health
```

## Test Data Structure

### Epoch Time Fields
- **INTimeTxt**: Epoch timestamp as TEXT (e.g., "1704067200")
- **OutTimeTxt**: Epoch timestamp as TEXT (e.g., "1704070800" or NULL)
- **INTime**: Actual TIMESTAMP for database operations
- **OutTime**: Actual TIMESTAMP for database operations

### Test Data Includes
- **3 Registered Visitors** with different registration dates
- **4 Unregistered Visitors** with various check-in/out states
- **5 Visit History Records** covering different time periods
- **Current Time References** for real-time testing

## Phase 1: Basic Endpoint Testing

### 1.1 Authentication Setup
```bash
# Get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_gis","password":"password123","tenantid":"1"}'

# Extract token for subsequent requests
export JWT_TOKEN="your-token-here"
```

### 1.2 Visitor Creation (Epoch Time)
```bash
# Create unregistered visitor with epoch timestamps
curl -X POST http://localhost:3000/api/visitors/create-unregistered \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "fname": "Test User",
    "mobile": "9876543999",
    "flatName": "Test-101",
    "visitorCatId": 2,
    "visitorSubCatId": 4,
    "visitPurpose": "Testing",
    "totalVisitor": 1
  }'
```

### 1.3 Visitor Registration (Epoch Time)
```bash
# Register visitor with epoch timestamps
curl -X POST http://localhost:3000/api/visitors/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "vistorName": "Registered Test",
    "mobile": "9876543998",
    "email": "test@example.com",
    "visitorCatId": 2,
    "visitorSubCatId": 4,
    "flatName": "Test-102",
    "vehicleNo": "MH12TEST"
  }'
```

## Phase 2: Epoch Time Filtering

### 2.1 Date Range Filtering
```bash
# Current epoch timestamp
CURRENT_EPOCH=$(date +%s)

# 24 hours ago
DAY_AGO_EPOCH=$((CURRENT_EPOCH - 86400))

# 7 days ago
WEEK_AGO_EPOCH=$((CURRENT_EPOCH - 604800))

# Test filtering with epoch timestamps
curl -X GET "http://localhost:3000/api/visitors?fromDate=$WEEK_AGO_EPOCH&toDate=$CURRENT_EPOCH" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 2.2 Visit History Filtering
```bash
# Get visit history with epoch date range
curl -X GET "http://localhost:3000/api/visitors/visit-history?fromDate=$DAY_AGO_EPOCH&toDate=$CURRENT_EPOCH&page=1&pageSize=20" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 2.3 Unregistered Visitors Filtering
```bash
# Filter unregistered visitors by epoch date
curl -X GET "http://localhost:3000/api/visitors/unregistered-list?from=$DAY_AGO_EPOCH&to=$CURRENT_EPOCH&page=1&pageSize=20" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Phase 3: Check-in/Check-out Operations

### 3.1 Visitor Check-in
```bash
# Check-in registered visitor (returns epoch timestamps)
curl -X POST http://localhost:3000/api/visitors/checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "visitorRegId": 1,
    "associatedFlat": "A-101",
    "associatedBlock": "Block A"
  }'
```

### 3.2 Visitor Check-out
```bash
# Check-out visitor (updates epoch timestamps)
curl -X POST http://localhost:3000/api/visitors/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "visitorId": 1,
    "type": "unregistered"
  }'
```

### 3.3 Pending Checkout List
```bash
# Get visitors pending checkout (shows epoch timestamps)
curl -X GET "http://localhost:3000/api/visitors/pending-checkout" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Phase 4: Analytics and Reporting

### 4.1 Dashboard Analytics
```bash
# Get dashboard analytics with epoch time calculations
curl -X GET "http://localhost:3000/api/analytics/dashboard" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 4.2 Visitor Frequency Analytics
```bash
# Get visitor frequency (duration calculations in epoch)
curl -X GET "http://localhost:3000/api/analytics/visitor-frequency?days=30" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 4.3 Peak Hours Analytics
```bash
# Get peak hours (epoch time-based calculations)
curl -X GET "http://localhost:3000/api/analytics/peak-hours?days=7" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Phase 5: Advanced Testing

### 5.1 OTP Verification
```bash
# Send OTP (epoch timestamp tracking)
curl -X POST http://localhost:3000/api/visitors/send-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mobile": "9876543997",
    "fname": "OTP Test User"
  }'
```

### 5.2 Security Code Verification
```bash
# Verify security code (epoch timestamp validation)
curl -X POST http://localhost:3000/api/visitors/verify-security-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "securityCode": "123456"
  }'
```

### 5.3 CSV Export
```bash
# Export CSV with epoch timestamps
curl -X GET "http://localhost:3000/api/visitors/export-csv?fromDate=$WEEK_AGO_EPOCH&toDate=$CURRENT_EPOCH" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o visitors_export.csv
```

## Phase 6: Validation Tests

### 6.1 Epoch Timestamp Validation
```bash
# Verify epoch timestamps are properly formatted
curl -X GET "http://localhost:3000/api/visitors/1" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | jq '.data.INTimeTxt | tonumber | strftime("%Y-%m-%d %H:%M:%S")'
```

### 6.2 Database Verification
```sql
-- Connect to database
docker-compose exec postgres psql -U postgres -d relygate

-- Check epoch timestamp format
SELECT 
    VistorName,
    INTimeTxt,
    CASE 
        WHEN INTimeTxt ~ '^[0-9]+$' THEN 'VALID_EPOCH'
        ELSE 'INVALID_EPOCH'
    END as epoch_validation,
    TO_TIMESTAMP(INTimeTxt::BIGINT) as converted_timestamp
FROM VisitorRegVisitHistory 
WHERE TenantID = 1 
LIMIT 5;
```

### 6.3 Duration Calculations
```sql
-- Test epoch duration calculations
SELECT 
    VistorName,
    INTimeTxt::BIGINT as checkin_epoch,
    OutTimeTxt::BIGINT as checkout_epoch,
    CASE 
        WHEN OutTimeTxt IS NOT NULL 
        THEN (OutTimeTxt::BIGINT - INTimeTxt::BIGINT) / 3600.0 
        ELSE NULL 
    END as duration_hours
FROM VisitorRegVisitHistory 
WHERE TenantID = 1 AND OutTimeTxt IS NOT NULL;
```

## Phase 7: Performance Testing

### 7.1 Load Testing
```bash
# Test concurrent epoch timestamp operations
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/visitors/create-unregistered \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "{\"fname\":\"Load Test $i\",\"mobile\":\"987654300$i\",\"flatName\":\"Load-$i\",\"visitorCatId\":2,\"visitorSubCatId\":4,\"visitPurpose\":\"Load Test\"}" &
done
wait
```

### 7.2 Date Range Performance
```bash
# Test large date range queries
MONTH_AGO_EPOCH=$((CURRENT_EPOCH - 2592000))
time curl -X GET "http://localhost:3000/api/visitors?fromDate=$MONTH_AGO_EPOCH&toDate=$CURRENT_EPOCH&pageSize=100" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Expected Results

### Success Indicators
1. **Epoch Timestamps**: All time fields return epoch timestamps as strings
2. **Filtering**: Date range filtering works with epoch timestamps
3. **Calculations**: Duration calculations are accurate
4. **Consistency**: All endpoints return consistent epoch time format
5. **Performance**: No significant performance degradation

### Validation Checks
- INTimeTxt and OutTimeTxt contain valid epoch timestamps
- Date filtering works correctly with epoch values
- Analytics show correct time-based calculations
- CSV exports contain epoch timestamps
- Database stores both timestamp and epoch values correctly

## Troubleshooting

### Common Issues
1. **Invalid Epoch Format**: Check that timestamps are numeric strings
2. **Timezone Issues**: Ensure all epoch timestamps are in UTC
3. **Null Values**: Handle NULL epoch timestamps correctly
4. **Type Conversion**: Verify epoch strings convert to valid dates

### Debug Commands
```bash
# Check application logs
docker-compose logs -f app

# Verify database schema
docker-compose exec postgres psql -U postgres -d relygate -c "\d+ VisitorMaster"

# Check epoch conversion
echo "Current epoch: $(date +%s)"
echo "Human readable: $(date -d @$(date +%s))"
```

## Rollback Plan

### Emergency Rollback
If epoch time implementation fails:
1. Restore from backup
2. Revert model changes
3. Update API responses to use ISO8601
4. Re-test all endpoints

### Backup Commands
```bash
# Create backup before testing
docker-compose exec postgres pg_dump -U postgres relygate > backup_before_epoch_test.sql

# Restore if needed
docker-compose exec -T postgres psql -U postgres relygate < backup_before_epoch_test.sql
```

## Success Metrics

### Completion Criteria
- [ ] All visitor endpoints return epoch timestamps
- [ ] Date filtering works with epoch values
- [ ] Analytics calculations are accurate
- [ ] CSV exports contain epoch timestamps
- [ ] Performance is acceptable
- [ ] Database integrity maintained

### Post-Implementation
1. Update API documentation
2. Train users on epoch timestamp format
3. Monitor system performance
4. Collect feedback from testing
5. Plan rollout to other modules

---

**Note**: This roadmap covers comprehensive testing of epoch time functionality in the visitor module. Execute tests in sequence and document any issues encountered for future reference.