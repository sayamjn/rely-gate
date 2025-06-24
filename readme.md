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

## BULK UPLOAD APIs
```
POST   /api/bulk/students                  - Upload student data
POST   /api/bulk/visitors                  - Upload visitor data
POST   /api/bulk/staff                     - Upload staff data
POST   /api/bulk/buses                     - Upload bus data
```

## RESPONSE FORMAT
All APIs return consistent response format:
```json
{
  "responseCode": "S|E",
  "responseMessage": "Success message or error description",
  "data": {}, // Response data (varies by endpoint)
  "count": 0, // Total count for list endpoints
  "pagination": {} // Pagination info for list endpoints
}
```

---