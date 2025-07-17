 🔄 Complete QR Check-In/Check-Out Flow & API 
  Documentation

  Flow Overview:

  1. Generate QR → 2. Scan QR → 3. Get Action Prompt → 4.
  Execute Action

  ---
  Step 1: Generate QR Code for Student

  API: POST /api/students/:studentId/generate-qr

  Request:
  curl -X POST
  "http://localhost:3000/api/students/136/generate-qr" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json"

  Response:
  {
    "responseCode": "S",
    "responseMessage": "QR code generated successfully",
    "data": {
      "studentId": 136,
      "qrData": {
        "tenantid": 1001,
        "mainid": "STU1001175248607649476",
        "type": "stu",
        "rtype": "checkin-checkout"
      },
      "qrImage":
  "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "qrFilePath":
  "/uploads/qr_codes/student_qr_136_1642234567890.png",
      "student": {
        "name": "Sayam",
        "regNo": "STU1001175248607649476",
        "mobile": "1212121213"
      }
    }
  }

  ---
  Step 2: Scan QR Code

  API: POST /api/students/scan-qr

  Request Data (what gets posted after scanning):
  curl -X POST "http://localhost:3000/api/students/scan-qr"
   \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "qrData": 
  "{\"tenantid\":1001,\"mainid\":\"STU1001175248607649476\"
  ,\"type\":\"stu\",\"rtype\":\"checkin-checkout\"}"
    }'

  Response:
  {
    "responseCode": "S",
    "responseMessage": "QR scan processed successfully",
    "data": {
      "studentId": 136,
      "tenantId": 1001,
      "nextAction": "checkout",
      "currentStatus": "AVAILABLE",
      "visitorRegId": 136,
      "visitorRegNo": "STU1001175248607649476",
      "student": {
        "name": "Sayam",
        "regNo": "STU1001175248607649476",
        "mobile": "1212121213",
        "course": "Hostel10",
        "hostel": "N/A"
      },
      "actionPrompt": "Student is currently available. Do 
  you want to check out?"
    }
  }

  ---
  Step 3A: Execute Check-Out (if nextAction = "checkout")

  API: POST /api/students/qr-checkout

  Request:
  curl -X POST
  "http://localhost:3000/api/students/qr-checkout" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "studentId": 136,
      "tenantId": 1001,
      "purposeId": 5,
      "purposeName": "Library Visit"
    }'

  Response:
  {
    "responseCode": "S",
    "responseMessage": "Student checked out successfully",
    "data": {
      "studentId": 136,
      "studentName": "Sayam",
      "action": "CHECKOUT",
      "checkOutTime": "15/07/2025 02:30 PM",
      "purpose": "Library Visit",
      "historyId": 123
    }
  }

  ---
  Step 3B: Execute Check-In (if nextAction = "checkin")

  API: POST /api/students/qr-checkin

  Request:
  curl -X POST
  "http://localhost:3000/api/students/qr-checkin" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "studentId": 136,
      "tenantId": 1001
    }'

  Response:
  {
    "responseCode": "S",
    "responseMessage": "Student checked in successfully",
    "data": {
      "studentId": 136,
      "studentName": "Sayam",
      "action": "CHECKIN",
      "checkInTime": "15/07/2025 04:45 PM",
      "duration": "2h 15m",
      "historyId": 123
    }
  }

  ---
  🔄 Complete Flow Examples

  Scenario 1: Student Available → Check Out

  1. Scan QR → nextAction: "checkout"
  2. UI shows: "Student is currently available. Do you want
   to check out?"
  3. User confirms → Call POST /api/students/qr-checkout

  Scenario 2: Student Checked Out → Check In

  1. Scan QR → nextAction: "checkin"
  2. UI shows: "Student is currently checked out. Do you
  want to check in?"
  3. User confirms → Call POST /api/students/qr-checkin

  ---
  📱 QR Code Content

  The QR code contains a JSON string:
  {
    "tenantid": 1001,
    "mainid": "STU1001175248607649476",
    "type": "stu",
    "rtype": "checkin-checkout"
  }

  ---
  🧪 Complete Testing Script

  #!/bin/bash

  # Set your JWT token
  JWT_TOKEN="YOUR_JWT_TOKEN_HERE"
  BASE_URL="http://localhost:3000"

  echo "=== QR Code Feature Testing ==="

  # 1. Generate QR for student
  echo "1. Generating QR for student 136..."
  curl -X POST "$BASE_URL/api/students/136/generate-qr" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" | jq '.'

  echo -e "\n2. Scanning QR code..."
  # 2. Scan QR code
  curl -X POST "$BASE_URL/api/students/scan-qr" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "qrData": 
  "{\"tenantid\":1001,\"mainid\":\"STU1001175248607649476\"
  ,\"type\":\"stu\",\"rtype\":\"checkin-checkout\"}"
    }' | jq '.'

  echo -e "\n3. Executing check-out..."
  # 3. Check out student
  curl -X POST "$BASE_URL/api/students/qr-checkout" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "studentId": 136,
      "tenantId": 1001,
      "purposeId": 5,
      "purposeName": "Library Visit"
    }' | jq '.'

  echo -e "\n4. Scanning QR again (should show check-in 
  option)..."
  # 4. Scan again to see check-in option
  curl -X POST "$BASE_URL/api/students/scan-qr" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "qrData": 
  "{\"tenantid\":1001,\"mainid\":\"STU1001175248607649476\"
  ,\"type\":\"stu\",\"rtype\":\"checkin-checkout\"}"
    }' | jq '.'

  echo -e "\n5. Executing check-in..."
  # 5. Check in student
  curl -X POST "$BASE_URL/api/students/qr-checkin" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "studentId": 136,
      "tenantId": 1001
    }' | jq '.'

  echo -e "\n=== Testing Complete ==="

  ---
  📋 Error Handling

  Invalid QR Code:

  {
    "responseCode": "E",
    "responseMessage": "Invalid QR code format"
  }

  Student Not Found:

  {
    "responseCode": "E",
    "responseMessage": "Student not found"
  }

  Wrong Tenant:

  {
    "responseCode": "E",
    "responseMessage": "Access denied for this tenant"
  }

  Non-Student QR:

  {
    "responseCode": "E",
    "responseMessage": "QR code is not for a student"
  }

  ---
  🔑 Key Points

  1. QR Data: Always contains JSON string with tenantid,
  mainid (VisitorRegNo), type, rtype
  2. Smart Logic: System automatically determines check-in
  vs check-out based on current status
  3. Security: All requests validate tenant access and JWT
  authentication
  4. Flexible: Supports both predefined purposes and custom
   purpose names
  5. Consistent: Uses existing response format patterns
  throughout the system

  This implementation provides a complete, secure, and
  user-friendly QR-based check-in/check-out system for
  students.

╭──────────────────────────────────────────────────────────────╮
│ >                                                            │
╰──────────────────────────────────────────────────────────────╯
  ⏵⏵ auto-accept edits on              ⧉ In student.service.js
  (shift+tab to cycle)                     Context left until 
                                           auto-compact: 14%




