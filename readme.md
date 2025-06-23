// ===================================
// API SUMMARY AND DOCUMENTATION
// ===================================

/*

API ENDPOINTS SUMMARY:

VISITOR MANAGEMENT APIs:
========================
GET    /api/visitors/purposes              - Get visitor purposes by category
GET    /api/visitors/subcategories         - Get visitor subcategories
POST   /api/visitors/list                  - List visitors with advanced filtering ✨ NEW
GET    /api/visitors/pending-checkout      - Get visitors currently checked in ✨ NEW
POST   /api/visitors/send-otp              - Send OTP for visitor registration
POST   /api/visitors/send-unregistered-otp - Send OTP for unregistered visitor
POST   /api/visitors/verify-otp            - Verify OTP and complete registration
PUT    /api/visitors/checkin               - Check-in registered visitor
PUT    /api/visitors/history/:id/checkout  - Check-out visitor
GET    /api/visitors/:id/history           - Get visitor history
GET    /api/visitors/export                - Export visitors data ✨ NEW
GET    /api/visitors/template              - Download CSV template ✨ NEW

BUS MANAGEMENT APIs:
===================
POST   /api/buses/list                     - List buses with filters
GET    /api/buses/purposes                 - Get available purposes for buses
GET    /api/buses/:id/status               - Check bus current status
POST   /api/buses/:id/checkout             - Checkout bus with purpose
POST   /api/buses/:id/checkin              - Checkin bus
GET    /api/buses/:id/history              - Get bus visit history
GET    /api/buses/export                   - Export buses data ✨ NEW
GET    /api/buses/template                 - Download CSV template ✨ NEW

STAFF MANAGEMENT APIs:
=====================
GET    /api/staff/pending-checkout         - Get staff currently checked in
GET    /api/staff                          - List staff (legacy)
GET    /api/staff/designations             - Get available designations
GET    /api/staff/:id/status               - Get staff's current status
POST   /api/staff/:id/checkin              - Check-in staff member
POST   /api/staff/:id/checkout             - Check-out staff member
POST   /api/staff/register                 - Staff registration (OTP-based)
POST   /api/staff/verify-registration      - Verify OTP and complete registration
GET    /api/staff/:id/history              - Get staff visit history
GET    /api/staff/export                   - Export staff data to CSV
GET    /api/staff/template                 - Download CSV template

BULK UPLOAD APIs:
================
POST   /api/bulk/students                  - Upload student data
POST   /api/bulk/visitors                  - Upload visitor data
POST   /api/bulk/staff                     - Upload staff data
POST   /api/bulk/buses                     - Upload bus data ✨ NEW
GET    /api/bulk/operation/:id/status      - Get bulk operation status ✨ NEW

KEY FEATURES ADDED:
==================
✨ Advanced filtering for all entities (visitor, staff, bus)
✨ Bulk operations (check-in/check-out multiple records)
✨ Export functionality for all entities with CSV format
✨ Enhanced bulk upload with detailed validation and error reporting
✨ Template download for proper CSV format
✨ Status tracking for bulk operations
✨ Comprehensive error handling and validation
✨ Consistent response formats across all APIs

BULK OPERATIONS FEATURES:
========================
• Bulk check-in/check-out with detailed results
• Status validation (prevents duplicate operations)
• Detailed success/failure reporting
• Transaction safety with rollback capabilities
• Progress tracking for large operations

EXPORT FEATURES:
===============
• CSV export with customizable filters
• Date range filtering
• Status-based filtering (CHECKED_IN, AVAILABLE)
• Category/subcategory filtering
• Proper CSV formatting with quote escaping
• Custom headers and field mapping

*/