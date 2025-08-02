# 🔄 Tenant Switching Implementation Guide

## Overview
This document explains the complete JWT re-issuing approach for tenant switching in the RelyGate multi-tenant visitor management system.

## 🏗️ Architecture

### Current System (Before)
```
User Login → JWT{loginId, username, tenantId: 5, role} → All APIs use tenantId: 5
```

### New System (After)
```
User Login → JWT{loginId, username, tenantId: 5, role} → Primary tenant APIs
     ↓
Switch Tenant → JWT{loginId, username, tenantId: 8, role} → New tenant APIs
     ↓
Switch Back → JWT{loginId, username, tenantId: 5, role} → Original tenant APIs
```

## 📊 Database Schema

### LinkedTenants Table
```sql
CREATE TABLE linkedTenants (
    id SERIAL PRIMARY KEY,
    loginId VARCHAR(100) NOT NULL,          -- User ID
    tenantId INTEGER NOT NULL,              -- Linked tenant ID
    tenantName VARCHAR(200) NOT NULL,       -- Display name
    email VARCHAR(100),                     -- Contact info
    mobile VARCHAR(15),                     -- Contact info
    isPrimary BOOLEAN DEFAULT FALSE,        -- User's default tenant
    isActive BOOLEAN DEFAULT TRUE,          -- Soft delete
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔑 API Endpoints

### Authentication Endpoints

#### 1. Get My Linked Tenants
```http
GET /api/auth/my-linked-tenants
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "responseCode": "S",
  "responseMessage": "Linked tenants retrieved successfully",
  "data": [
    {
      "id": 1,
      "tenantId": 5,
      "tenantName": "Greenwood School",
      "isPrimary": true,
      "email": "admin@greenwood.edu",
      "mobile": "9876543210"
    },
    {
      "id": 2,
      "tenantId": 8,
      "tenantName": "Sunrise Residency",
      "isPrimary": false,
      "email": "admin@sunrise.com",
      "mobile": "9876543211"
    }
  ],
  "count": 2
}
```

#### 2. Switch Tenant (Core Feature)
```http
POST /api/auth/switch-tenant
Authorization: Bearer <current_jwt_token>
Content-Type: application/json

{
  "targetTenantId": 8
}
```

**Response:**
```json
{
  "responseCode": "S",
  "responseMessage": "Tenant switched successfully",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "tenantInfo": {
    "tenantId": 8,
    "tenantName": "Sunrise Residency",
    "tenantCode": "SRS"
  }
}
```

### LinkedTenants Management Endpoints

#### 3. Create Tenant Link
```http
POST /api/linked-tenants/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "loginId": "user123",
  "tenantId": 10,
  "tenantName": "New Hospital",
  "email": "contact@hospital.com",
  "mobile": "9876543299",
  "isPrimary": false
}
```

#### 4. Link/Unlink Management
```http
POST /api/linked-tenants/manage
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "loginId": "user123",
  "action": "link",
  "tenantId": 12,
  "tenantName": "Metro Mall",
  "email": "info@metro.com",
  "mobile": "9876543300"
}
```

#### 5. Get All Tenant Links (Admin)
```http
GET /api/linked-tenants/all?page=1&pageSize=20&loginId=user123
Authorization: Bearer <admin_jwt_token>
```

## 🖥️ Frontend Implementation

### React Example - Tenant Dropdown Component

```javascript
import React, { useState, useEffect } from 'react';

const TenantSwitcher = () => {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get current user's linked tenants
  useEffect(() => {
    fetchLinkedTenants();
  }, []);

  const fetchLinkedTenants = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/my-linked-tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.responseCode === 'S') {
        setAvailableTenants(result.data);
        const primary = result.data.find(t => t.isPrimary);
        if (primary) setCurrentTenant(primary);
      }
    } catch (error) {
      console.error('Error fetching linked tenants:', error);
    }
  };

  const switchTenant = async (targetTenantId) => {
    if (currentTenant?.tenantId === targetTenantId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetTenantId })
      });
      
      const result = await response.json();
      
      if (result.responseCode === 'S') {
        // Update stored token
        localStorage.setItem('authToken', result.token);
        
        // Update current tenant
        const newTenant = availableTenants.find(t => t.tenantId === targetTenantId);
        setCurrentTenant(newTenant);
        
        // Refresh page to load new tenant data
        window.location.reload();
        
        // Or trigger app-wide state refresh
        // window.dispatchEvent(new CustomEvent('tenantSwitched', { 
        //   detail: result.tenantInfo 
        // }));
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tenant-switcher">
      <select 
        value={currentTenant?.tenantId || ''} 
        onChange={(e) => switchTenant(parseInt(e.target.value))}
        disabled={loading}
      >
        {availableTenants.map(tenant => (
          <option key={tenant.tenantId} value={tenant.tenantId}>
            {tenant.tenantName} {tenant.isPrimary ? '(Primary)' : ''}
          </option>
        ))}
      </select>
      {loading && <span>Switching...</span>}
    </div>
  );
};

export default TenantSwitcher;
```

### Context Provider for Global Tenant State

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext();

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [availableTenants, setAvailableTenants] = useState([]);

  const switchTenant = async (tenantId) => {
    // Implementation from above
    // Update both currentTenant and localStorage token
  };

  useEffect(() => {
    // Load tenant info from JWT on app start
    loadCurrentTenant();
  }, []);

  return (
    <TenantContext.Provider value={{
      currentTenant,
      availableTenants,
      switchTenant
    }}>
      {children}
    </TenantContext.Provider>
  );
};
```

## 🧪 Testing the Implementation

### 1. Database Setup
```bash
# Create the linkedTenants table
docker-compose exec postgres psql -U postgres -d relygate -f /database/linkedTenants_schema.sql

# Insert sample data
docker-compose exec postgres psql -U postgres -d relygate -f /database/linkedTenants_sample_data.sql
```

### 2. API Testing with cURL

#### Get Linked Tenants
```bash
export JWT_TOKEN="your_jwt_token_here"

curl -X GET "http://localhost:3333/api/auth/my-linked-tenants" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### Switch Tenant
```bash
curl -X POST "http://localhost:3333/api/auth/switch-tenant" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetTenantId": 2}'
```

#### Test Data Isolation
```bash
# Before switch - Get visitors for original tenant
curl -X GET "http://localhost:3333/api/visitors/purposes" \
  -H "Authorization: Bearer $ORIGINAL_TOKEN"

# After switch - Get visitors for new tenant (should be different data)
curl -X GET "http://localhost:3333/api/visitors/purposes" \
  -H "Authorization: Bearer $NEW_TOKEN"
```

### 3. Frontend Testing Scenarios

1. **Login Flow**: User logs in and sees their primary tenant data
2. **Dropdown Population**: Tenant switcher shows all linked tenants
3. **Switch Action**: Selecting different tenant updates JWT and refreshes data
4. **Data Isolation**: Verify API responses show correct tenant data
5. **Persistence**: Refreshing page maintains selected tenant context

## 🔒 Security Considerations

### Access Control
- ✅ Users can only switch to tenants they're explicitly linked to
- ✅ JWT re-issuing validates access before generating new token
- ✅ Each JWT is properly scoped to a single tenant
- ✅ No cross-tenant data leakage (existing middleware handles this)

### Audit Trail
```sql
-- Track tenant switching events
CREATE TABLE tenantSwitchLog (
    id SERIAL PRIMARY KEY,
    loginId VARCHAR(100) NOT NULL,
    fromTenantId INTEGER,
    toTenantId INTEGER NOT NULL,
    switchedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    userAgent TEXT,
    ipAddress VARCHAR(45)
);
```

## 🚀 Deployment Steps

1. **Database Migration**: Run `linkedTenants_schema.sql`
2. **Sample Data**: Run `linkedTenants_sample_data.sql` (optional, for testing)
3. **Backend Deployment**: Deploy updated backend code
4. **Frontend Update**: Update frontend to include tenant switcher component
5. **User Training**: Inform users about new tenant switching capability

## 📱 Mobile App Integration

### React Native Example
```javascript
const switchTenant = async (targetTenantId) => {
  const token = await AsyncStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/api/auth/switch-tenant`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ targetTenantId })
  });

  const result = await response.json();
  if (result.responseCode === 'S') {
    await AsyncStorage.setItem('authToken', result.token);
    // Navigate to dashboard or refresh data
    navigation.navigate('Dashboard');
  }
};
```

## 🔧 Troubleshooting

### Common Issues

1. **403 Access Denied**: User not linked to target tenant
   - Solution: Add tenant link via `/api/linked-tenants/manage`

2. **JWT Invalid**: Token expired or malformed
   - Solution: Re-login to get fresh token

3. **No Data After Switch**: Frontend not updating
   - Solution: Ensure page refresh or state update after token change

4. **Primary Tenant Issues**: Cannot delete primary tenant
   - Solution: Set another tenant as primary first

### Debug Queries
```sql
-- Check user's linked tenants
SELECT * FROM linkedTenants WHERE loginId = 'your_login_id';

-- Verify tenant access
SELECT * FROM linkedTenants WHERE loginId = 'user' AND tenantId = 5 AND isActive = TRUE;

-- Check primary tenant
SELECT * FROM linkedTenants WHERE loginId = 'user' AND isPrimary = TRUE;
```

## 🎯 Benefits

1. **Seamless UX**: Users can switch tenants without re-login
2. **Secure**: Proper access control and JWT scoping
3. **Scalable**: Supports unlimited tenant relationships
4. **Maintainable**: No changes to existing API logic
5. **Flexible**: Easy to add/remove tenant access

## 📈 Future Enhancements

1. **Role-based Switching**: Different roles per tenant
2. **Session Management**: Track active tenant sessions
3. **Bulk User Management**: Admin tools for managing tenant links
4. **Audit Dashboard**: Visualize tenant switching patterns
5. **API Rate Limiting**: Per-tenant rate limiting

---

**The JWT re-issuing approach provides a clean, secure, and scalable solution for multi-tenant switching while maintaining the existing system architecture!** 🎉