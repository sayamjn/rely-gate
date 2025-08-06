Student Meal Management API Endpoints
Meal Settings Management
GET /api/meal-settings
Get meal timing settings for the tenant

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal settings retrieved successfully",
  "data": {
    "mealSettingId": 1,
    "tenantId": 1,
    "lunchBookingStartTime": "10:00:00",
    "lunchBookingEndTime": "12:00:00",
    "lunchStartTime": "13:00:00",
    "lunchEndTime": "15:00:00",
    "dinnerBookingStartTime": "16:00:00",
    "dinnerBookingEndTime": "18:00:00",
    "dinnerStartTime": "19:00:00",
    "dinnerEndTime": "21:00:00"
  }
}
PUT /api/meal-settings
Update meal timing settings (booking and serving windows)

// Request
{
  "lunchBookingStartTime": "10:00",
  "lunchBookingEndTime": "12:00",
  "lunchStartTime": "13:00",
  "lunchEndTime": "15:00",
  "dinnerBookingStartTime": "16:00",
  "dinnerBookingEndTime": "18:00",
  "dinnerStartTime": "19:00",
  "dinnerEndTime": "21:00"
}

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal settings updated successfully",
  "data": {
    "mealSettingId": 1,
    "tenantId": 1,
    "lunchBookingStartTime": "10:00:00",
    "lunchBookingEndTime": "12:00:00",
    "lunchStartTime": "13:00:00",
    "lunchEndTime": "15:00:00",
    "dinnerBookingStartTime": "16:00:00",
    "dinnerBookingEndTime": "18:00:00",
    "dinnerStartTime": "19:00:00",
    "dinnerEndTime": "21:00:00",
    "updatedDate": "2025-08-04T10:30:00Z"
  }
}
GET /api/meal-settings/status
Get current meal status and active windows

// Response
{
  "responseCode": "S",
  "responseMessage": "Current meal status retrieved",
  "data": {
    "currentTime": "11:30:00",
    "currentMealType": "lunch",
    "currentWindow": "booking",
    "isBookingOpen": true,
    "isServingOpen": false,
    "nextWindow": {
      "type": "serving",
      "mealType": "lunch",
      "startsAt": "13:00:00"
    }
  }
}
POST /api/meal-settings/validate
Validate if meal action is allowed at current time

// Request
{
  "actionType": "booking",
  "mealType": "lunch"
}

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal action validation completed",
  "data": {
    "isAllowed": true,
    "message": "Lunch booking window is open",
    "windowEndsAt": "12:00:00"
  }
}
GET /api/meal-settings/default
Get default meal timing settings

// Response
{
  "responseCode": "S",
  "responseMessage": "Default meal settings retrieved",
  "data": {
    "lunchBookingStartTime": "10:00",
    "lunchBookingEndTime": "12:00",
    "lunchStartTime": "13:00",
    "lunchEndTime": "15:00",
    "dinnerBookingStartTime": "16:00",
    "dinnerBookingEndTime": "18:00",
    "dinnerStartTime": "19:00",
    "dinnerEndTime": "21:00"
  }
}
POST /api/meal-settings/reset
Reset meal settings to default values

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal settings reset to default successfully",
  "data": {
    "mealSettingId": 1,
    "tenantId": 1,
    "lunchBookingStartTime": "10:00:00",
    "lunchBookingEndTime": "12:00:00",
    "lunchStartTime": "13:00:00",
    "lunchEndTime": "15:00:00",
    "dinnerBookingStartTime": "16:00:00",
    "dinnerBookingEndTime": "18:00:00",
    "dinnerStartTime": "19:00:00",
    "dinnerEndTime": "21:00:00"
  }
}
Meal Registration (Phase 1 - Booking Window)
POST /api/meal/register
Register student for meal during booking window

// Request
{
  "studentId": 123,
  "mealType": "lunch",
  "isSpecial": false,
  "specialRemarks": ""
}

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal registered successfully",
  "data": {
    "mealId": 456,
    "tokenNumber": 25,
    "mealType": "lunch",
    "mealDate": "2025-08-04",
    "mealTime": "2025-08-04T11:30:00Z",
    "isSpecial": false,
    "student": {
      "id": 123,
      "name": "John Doe",
      "regNo": "STU001",
      "mobile": "9876543210",
      "course": "Computer Science",
      "hostel": "Block A"
    }
  }
}
POST /api/meal/register-qr
Register student for meal via QR code scan

// Request
{
  "qrData": {
    "student_id": "123",
    "tenant_id": "1",
    "meal_type": "lunch"
  },
  "isSpecial": false,
  "specialRemarks": ""
}

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal registered successfully via QR",
  "data": {
    "mealId": 456,
    "tokenNumber": 25,
    "mealType": "lunch",
    "mealDate": "2025-08-04",
    "student": {
      "id": 123,
      "name": "John Doe",
      "regNo": "STU001"
    }
  }
}
GET /api/meal/registration-status/:mealType
Get current registration status for meal type

// Response
{
  "responseCode": "S",
  "responseMessage": "Registration status retrieved",
  "data": {
    "mealType": "lunch",
    "isBookingOpen": true,
    "message": "Lunch booking window is open",
    "totalRegistrations": 45,
    "date": "2025-08-04"
  }
}
PUT /api/meal/registration/:mealId
Update meal registration (special requests)

// Request
{
  "isSpecial": true,
  "specialRemarks": "No spicy food"
}

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal registration updated successfully",
  "data": {
    "mealId": 456,
    "tokenNumber": 25,
    "studentName": "John Doe",
    "mealType": "lunch",
    "isSpecial": true,
    "specialRemarks": "No spicy food"
  }
}
DELETE /api/meal/registration/:mealId
Cancel meal registration during booking window

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal registration cancelled successfully",
  "data": {
    "mealId": 456,
    "tokenNumber": 25,
    "studentName": "John Doe",
    "mealType": "lunch"
  }
}
GET /api/meal/student-registrations/:studentId
Get student's meal registrations for today

// Response
{
  "responseCode": "S",
  "responseMessage": "Student meal registrations retrieved",
  "data": {
    "studentId": 123,
    "date": "2025-08-04",
    "registrations": [
      {
        "mealId": 456,
        "mealType": "lunch",
        "tokenNumber": 25,
        "status": "registered",
        "isSpecial": false,
        "isConsumed": false,
        "registrationTime": "2025-08-04T11:30:00Z"
      }
    ]
  }
}
GET /api/meal/registrations/:mealType
Get all registrations for a meal type

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal registrations retrieved",
  "data": {
    "mealType": "lunch",
    "date": "2025-08-04",
    "totalRegistrations": 45,
    "registrations": [
      {
        "mealId": 456,
        "studentId": 123,
        "studentName": "John Doe",
        "studentRegNo": "STU001",
        "mobile": "9876543210",
        "course": "Computer Science",
        "hostel": "Block A",
        "tokenNumber": 25,
        "registrationTime": "2025-08-04T11:30:00Z",
        "isSpecial": false,
        "status": "registered"
      }
    ]
  }
}
Meal Consumption (Phase 2 - Serving Window)
POST /api/meal/consume/:mealId
Mark meal as consumed during serving window

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal consumed successfully",
  "data": {
    "mealId": 456,
    "tokenNumber": 25,
    "studentName": "John Doe",
    "mealType": "lunch",
    "consumedTime": "2025-08-04T13:30:00Z"
  }
}
POST /api/meal/consume-qr
Consume meal via QR code scan during serving

// Request
{
  "qrData": {
    "student_id": "123",
    "tenant_id": "1",
    "meal_type": "lunch"
  }
}

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal consumed successfully via QR",
  "data": {
    "mealId": 456,
    "tokenNumber": 25,
    "studentName": "John Doe",
    "mealType": "lunch",
    "consumedTime": "2025-08-04T13:30:00Z",
    "student": {
      "id": 123,
      "name": "John Doe",
      "regNo": "STU001",
      "mobile": "9876543210",
      "course": "Computer Science",
      "hostel": "Block A"
    },
    "wasSpecial": false
  }
}
GET /api/meal/serving-status/:mealType
Get current serving status and statistics

// Response
{
  "responseCode": "S",
  "responseMessage": "Serving status retrieved",
  "data": {
    "mealType": "lunch",
    "isServingOpen": true,
    "message": "Lunch serving window is open",
    "statistics": {
      "totalRegistered": 45,
      "totalConsumed": 32,
      "totalWasted": 13,
      "consumptionRate": 71.11,
      "specialMeals": 5,
      "pendingConsumption": 13
    },
    "date": "2025-08-04"
  }
}
GET /api/meal/pending/:mealType
Get pending meals for consumption

// Response
{
  "responseCode": "S",
  "responseMessage": "Pending meals retrieved",
  "data": {
    "mealType": "lunch",
    "date": "2025-08-04",
    "totalPending": 13,
    "meals": [
      {
        "mealId": 456,
        "studentId": 123,
        "studentName": "John Doe",
        "studentRegNo": "STU001",
        "mobile": "9876543210",
        "course": "Computer Science",
        "hostel": "Block A",
        "tokenNumber": 25,
        "registrationTime": "2025-08-04T11:30:00Z",
        "isSpecial": false,
        "status": "registered"
      }
    ]
  }
}
GET /api/meal/consumed/:mealType
Get consumed meals for today

// Response
{
  "responseCode": "S",
  "responseMessage": "Consumed meals retrieved",
  "data": {
    "mealType": "lunch",
    "date": "2025-08-04",
    "totalConsumed": 32,
    "meals": [
      {
        "mealId": 456,
        "studentId": 123,
        "studentName": "John Doe",
        "studentRegNo": "STU001",
        "mobile": "9876543210",
        "course": "Computer Science",
        "hostel": "Block A",
        "tokenNumber": 25,
        "registrationTime": "2025-08-04T11:30:00Z",
        "consumedTime": "2025-08-04T13:30:00Z",
        "isSpecial": false,
        "status": "consumed"
      }
    ]
  }
}
GET /api/meal/queue/:mealType
Get real-time meal queue with status

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal queue retrieved",
  "data": {
    "mealType": "lunch",
    "date": "2025-08-04",
    "isServingOpen": true,
    "servingMessage": "Lunch serving window is open",
    "statistics": {
      "totalRegistered": 45,
      "totalConsumed": 32,
      "totalWasted": 13,
      "consumptionRate": 71.11,
      "pendingConsumption": 13
    },
    "pending": [...],
    "consumed": [...],
    "totalInQueue": 45
  }
}
POST /api/meal/validate-consumption
Validate if student can consume meal

// Request
{
  "studentId": 123,
  "mealType": "lunch"
}

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal consumption validation passed",
  "data": {
    "canConsume": true,
    "mealId": 456,
    "tokenNumber": 25,
    "studentName": "John Doe",
    "isSpecial": false
  }
}
Student Meal Tracking
POST /api/meal/checkin
Quick meal check-in (legacy single-phase system)

// Request
{
  "studentId": 123,
  "confirmed": true
}

// Response
{
  "responseCode": "S",
  "responseMessage": "Lunch confirmed successfully!",
  "data": {
    "mealType": "lunch",
    "tokenNumber": 25,
    "studentName": "John Doe",
    "mealTime": "2025-08-04T13:30:00Z",
    "mealDate": "2025-08-04",
    "status": "confirmed"
  }
}
GET /api/meal/history/:studentId
Get student's meal history

// Query Parameters: ?limit=10
// Response
{
  "responseCode": "S",
  "data": [
    {
      "mealId": 456,
      "studentId": 123,
      "studentRegNo": "STU001",
      "studentName": "John Doe",
      "mobile": "9876543210",
      "course": "Computer Science",
      "hostel": "Block A",
      "mealType": "lunch",
      "mealDate": "2025-08-04",
      "mealTime": "2025-08-04T13:30:00Z",
      "tokenNumber": 25,
      "status": "consumed",
      "createdDate": "2025-08-04T11:30:00Z"
    }
  ],
  "count": 1
}
GET /api/meal/current-queue
Get current meal queue for active meal type

// Response
{
  "responseCode": "S",
  "data": {
    "mealType": "lunch",
    "queue": [
      {
        "mealId": 456,
        "studentId": 123,
        "studentName": "John Doe",
        "tokenNumber": 25,
        "mealTime": "2025-08-04T13:30:00Z",
        "status": "confirmed"
      }
    ],
    "totalStudents": 45,
    "currentDate": "2025-08-04"
  }
}
POST /api/meal/cancel/:mealId
Cancel meal entry

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal entry cancelled successfully",
  "data": {
    "mealId": 456,
    "tokenNumber": 25
  }
}
Meal Analytics & Reports
GET /api/meal/statistics
Get meal statistics for date range

// Query Parameters: ?fromDate=2025-08-01&toDate=2025-08-04
// Response
{
  "responseCode": "S",
  "data": {
    "dateRange": {
      "fromDate": "01/08/2025",
      "toDate": "04/08/2025"
    },
    "statistics": {
      "2025-08-04": {
        "lunch": {
          "studentCount": 45,
          "maxToken": 45
        },
        "dinner": {
          "studentCount": 38,
          "maxToken": 38
        }
      }
    },
    "totalDays": 1
  }
}
GET /api/meal/analytics/:mealType
Get detailed meal analytics with consumption rates

// Query Parameters: ?fromDate=2025-08-01&toDate=2025-08-04
// Response
{
  "responseCode": "S",
  "responseMessage": "Meal analytics retrieved",
  "data": [
    {
      "mealDate": "2025-08-04",
      "mealType": "lunch",
      "totalRegistrations": 45,
      "totalConsumed": 32,
      "totalWasted": 13,
      "specialMeals": 5,
      "consumptionRate": 71.11
    }
  ]
}
GET /api/meal/daily-report
Get daily meal report with all statistics

// Query Parameters: ?date=2025-08-04
// Response
{
  "responseCode": "S",
  "responseMessage": "Daily meal report retrieved",
  "data": {
    "date": "2025-08-04",
    "summary": {
      "totalRegistrations": 83,
      "totalConsumed": 65,
      "totalWasted": 18,
      "overallConsumptionRate": 78.31
    },
    "mealBreakdown": {
      "lunch": {
        "registered": 45,
        "consumed": 32,
        "wasted": 13,
        "consumptionRate": 71.11,
        "specialMeals": 5
      },
      "dinner": {
        "registered": 38,
        "consumed": 33,
        "wasted": 5,
        "consumptionRate": 86.84,
        "specialMeals": 3
      }
    }
  }
}
GET /api/meal/waste-report
Get meal waste analysis report

// Query Parameters: ?fromDate=2025-08-01&toDate=2025-08-04
// Response
{
  "responseCode": "S",
  "responseMessage": "Meal waste report retrieved",
  "data": {
    "dateRange": {
      "fromDate": "01/08/2025",
      "toDate": "04/08/2025"
    },
    "wasteAnalysis": {
      "totalRegistrations": 332,
      "totalConsumed": 267,
      "totalWasted": 65,
      "wastePercentage": 19.58,
      "dailyBreakdown": [
        {
          "date": "2025-08-04",
          "lunch": { "registered": 45, "consumed": 32, "wasted": 13 },
          "dinner": { "registered": 38, "consumed": 33, "wasted": 5 },
          "dailyWasteRate": 21.69
        }
      ]
    }
  }
}
QR Code Management
POST /api/meal/generate-qr/:studentId/:mealType
Generate meal QR code for student

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal QR code generated successfully",
  "data": {
    "qrData": {
      "student_id": "123",
      "tenant_id": "1",
      "meal_type": "lunch",
      "timestamp": 1691145600000,
      "expires_at": 1691232000000
    },
    "qrImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "qrBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "qrString": "{\"student_id\":\"123\",\"tenant_id\":\"1\",\"meal_type\":\"lunch\"}",
    "phase": "unified",
    "mealType": "lunch",
    "studentInfo": {
      "id": "123",
      "name": "John Doe",
      "regNo": "STU001",
      "mobile": "9876543210",
      "course": "Computer Science",
      "hostel": "Block A"
    },
    "validUntil": "2025-08-05T00:00:00Z"
  }
}
POST /api/meal/generate-registration-qr
Generate QR for meal registration

// Request
{
  "studentData": {
    "studentId": 123,
    "name": "John Doe",
    "regNo": "STU001"
  },
  "mealType": "lunch",
  "tenantId": 1
}

// Response
{
  "responseCode": "S",
  "responseMessage": "Registration QR generated successfully",
  "data": {
    "qrData": {
      "student_id": "123",
      "tenant_id": "1",
      "meal_type": "lunch",
      "action": "register",
      "timestamp": 1691145600000
    },
    "qrImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "phase": "registration",
    "mealType": "lunch"
  }
}
POST /api/meal/generate-consumption-qr
Generate QR for meal consumption

// Request
{
  "studentData": {
    "studentId": 123,
    "name": "John Doe",
    "regNo": "STU001"
  },
  "mealType": "lunch",
  "tenantId": 1
}

// Response
{
  "responseCode": "S",
  "responseMessage": "Consumption QR generated successfully",
  "data": {
    "qrData": {
      "student_id": "123",
      "tenant_id": "1",
      "meal_type": "lunch",
      "action": "consume",
      "timestamp": 1691145600000
    },
    "qrImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "phase": "consumption",
    "mealType": "lunch"
  }
}
POST /api/meal/validate-qr
Validate meal QR code data

// Request
{
  "qrString": "{\"student_id\":\"123\",\"tenant_id\":\"1\",\"meal_type\":\"lunch\"}"
}

// Response
{
  "responseCode": "S",
  "responseMessage": "QR code validated successfully",
  "data": {
    "valid": true,
    "qrData": {
      "student_id": "123",
      "tenant_id": "1",
      "meal_type": "lunch",
      "timestamp": 1691145600000
    }
  }
}
Utility & Configuration
GET /api/meal/current-meal-type
Get current active meal type based on time

// Response
{
  "responseCode": "S",
  "responseMessage": "Current meal type retrieved",
  "data": {
    "currentMealType": "lunch",
    "currentTime": "13:30:00",
    "isActive": true
  }
}
GET /api/meal/meal-windows
Get all meal timing windows for today

// Response
{
  "responseCode": "S",
  "responseMessage": "Meal windows retrieved",
  "data": {
    "date": "2025-08-04",
    "windows": {
      "lunch": {
        "bookingWindow": {
          "start": "10:00:00",
          "end": "12:00:00",
          "isActive": false
        },
        "servingWindow": {
          "start": "13:00:00",
          "end": "15:00:00",
          "isActive": true
        }
      },
      "dinner": {
        "bookingWindow": {
          "start": "16:00:00",
          "end": "18:00:00",
          "isActive": false
        },
        "servingWindow": {
          "start": "19:00:00",
          "end": "21:00:00",
          "isActive": false
        }
      }
    }
  }
}
POST /api/meal/check-window/:actionType/:mealType
Check if specific action is allowed

// URL: /api/meal/check-window/booking/lunch
// Response
{
  "responseCode": "S",
  "responseMessage": "Window check completed",
  "data": {
    "actionType": "booking",
    "mealType": "lunch",
    "isAllowed": false,
    "message": "Lunch booking closed at 12:00:00",
    "currentTime": "13:30:00"
  }
}
GET /api/meal/tenant-settings
Get tenant-specific meal configurations

// Response
{
  "responseCode": "S",
  "responseMessage": "Tenant meal settings retrieved",
  "data": {
    "tenantId": 1,
    "mealSettings": {
      "lunchBookingStartTime": "10:00:00",
      "lunchBookingEndTime": "12:00:00",
      "lunchStartTime": "13:00:00",
      "lunchEndTime": "15:00:00",
      "dinnerBookingStartTime": "16:00:00",
      "dinnerBookingEndTime": "18:00:00",
      "dinnerStartTime": "19:00:00",
      "dinnerEndTime": "21:00:00"
    },
    "features": {
      "specialMealsEnabled": true,
      "qrCodeEnabled": true,
      "wasteTrackingEnabled": true
    }
  }
}
Total: 32 endpoints with complete request/response payloads for comprehensive meal management system.