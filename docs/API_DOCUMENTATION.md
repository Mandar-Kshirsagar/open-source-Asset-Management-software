# Asset Management System - API Documentation

## 🌐 Base URL
- **Development**: `https://localhost:7001/api`
- **Production**: `https://your-domain.com/api`

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow
1. **Login**: POST `/auth/login` with credentials
2. **Receive**: JWT access token (15 min) + refresh token (7 days)
3. **Use**: Include access token in Authorization header
4. **Refresh**: Use refresh token when access token expires

## 📋 Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes
- **General endpoints**: 100 requests per minute
- **Rate limit headers** included in response:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Reset time

## 🔑 Authentication Endpoints

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "abc123...",
    "expiresIn": 900,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "Admin",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid username or password",
  "data": null
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "string"
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
Content-Type: application/json

{
  "refreshToken": "string"
}
```

## 👥 User Management Endpoints

> **Note**: All user management endpoints require **Admin** role

### Get All Users
```http
GET /users
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (int, optional): Page number (default: 1)
- `pageSize` (int, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search by username or email
- `role` (string, optional): Filter by role (Admin, Manager, User)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "role": "Admin",
        "createdAt": "2024-01-01T00:00:00Z",
        "isActive": true
      }
    ],
    "totalCount": 25,
    "page": 1,
    "pageSize": 10,
    "totalPages": 3
  }
}
```

### Get User by ID
```http
GET /users/{id}
Authorization: Bearer <token>
```

### Create User
```http
POST /users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "string",        # Required, 3-50 characters, alphanumeric + underscore
  "email": "string",           # Required, valid email format
  "password": "string",        # Required, min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special
  "role": "string"            # Required, one of: Admin, Manager, User
}
```

**Validation Rules:**
- **Username**: 3-50 characters, alphanumeric and underscore only, must be unique
- **Email**: Valid email format, must be unique
- **Password**: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character
- **Role**: Must be one of: "Admin", "Manager", "User"

### Update User
```http
PUT /users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "role": "string",
  "isActive": true
}
```

### Delete User
```http
DELETE /users/{id}
Authorization: Bearer <token>
```

## 📦 Asset Management Endpoints

### Get All Assets
```http
GET /assets
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (int, optional): Page number (default: 1)
- `pageSize` (int, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search by name, serial number, or brand
- `category` (string, optional): Filter by category
- `status` (string, optional): Filter by status (Available, Assigned, Maintenance, Retired)
- `location` (string, optional): Filter by location
- `assignedUserId` (int, optional): Filter by assigned user ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Assets retrieved successfully",
  "data": {
    "assets": [
      {
        "id": 1,
        "name": "Dell Laptop XPS 13",
        "category": "Laptop",
        "brand": "Dell",
        "model": "XPS 13",
        "serialNumber": "DL123456789",
        "status": "Assigned",
        "location": "Office A",
        "condition": "Good",
        "purchaseDate": "2024-01-15T00:00:00Z",
        "purchasePrice": 1200.00,
        "assignedUserId": 5,
        "assignedUserName": "john.doe",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "totalCount": 150,
    "page": 1,
    "pageSize": 10,
    "totalPages": 15
  }
}
```

### Get Asset by ID
```http
GET /assets/{id}
Authorization: Bearer <token>
```

**Response includes full asset details plus assignment history:**
```json
{
  "success": true,
  "message": "Asset retrieved successfully",
  "data": {
    "id": 1,
    "name": "Dell Laptop XPS 13",
    "category": "Laptop",
    "brand": "Dell",
    "model": "XPS 13",
    "serialNumber": "DL123456789",
    "status": "Assigned",
    "location": "Office A",
    "condition": "Good",
    "purchaseDate": "2024-01-15T00:00:00Z",
    "purchasePrice": 1200.00,
    "assignedUserId": 5,
    "assignedUserName": "john.doe",
    "createdAt": "2024-01-01T00:00:00Z",
    "assignmentHistory": [
      {
        "id": 1,
        "action": "Assigned",
        "userId": 5,
        "userName": "john.doe",
        "timestamp": "2024-02-01T10:30:00Z",
        "changes": "Assigned to john.doe"
      }
    ]
  }
}
```

### Create Asset
```http
POST /assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",           # Required, 1-100 characters
  "category": "string",       # Required, 1-50 characters
  "brand": "string",          # Required, 1-50 characters
  "model": "string",          # Optional, max 50 characters
  "serialNumber": "string",   # Required, unique, 1-100 characters
  "location": "string",       # Required, 1-100 characters
  "condition": "string",      # Required, one of: Excellent, Good, Fair, Poor
  "purchaseDate": "2024-01-15T00:00:00Z",  # Optional
  "purchasePrice": 1200.00    # Optional, positive number
}
```

**Validation Rules:**
- **Name**: Required, 1-100 characters
- **Category**: Required, 1-50 characters  
- **Brand**: Required, 1-50 characters
- **SerialNumber**: Required, unique across all assets, 1-100 characters
- **Location**: Required, 1-100 characters
- **Condition**: Must be one of: "Excellent", "Good", "Fair", "Poor"
- **PurchasePrice**: If provided, must be positive number

### Update Asset
```http
PUT /assets/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "category": "string",
  "brand": "string",
  "model": "string",
  "location": "string",
  "condition": "string",
  "purchaseDate": "2024-01-15T00:00:00Z",
  "purchasePrice": 1200.00
}
```

### Delete Asset
```http
DELETE /assets/{id}
Authorization: Bearer <token>
```

### Assign Asset to User
```http
POST /assets/{id}/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 5
}
```

**Business Rules:**
- Asset must be in "Available" status
- User must exist and be active
- Asset can only be assigned to one user at a time

### Unassign Asset
```http
POST /assets/{id}/unassign
Authorization: Bearer <token>
```

### Get Asset Categories
```http
GET /assets/categories
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    "Laptop",
    "Desktop",
    "Monitor",
    "Phone",
    "Tablet",
    "Printer",
    "Other"
  ]
}
```

### Get Asset Locations
```http
GET /assets/locations
Authorization: Bearer <token>
```

## 📊 Asset History Endpoints

### Get Asset History
```http
GET /assets/{id}/history
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (int, optional): Page number (default: 1)
- `pageSize` (int, optional): Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Asset history retrieved successfully",
  "data": {
    "history": [
      {
        "id": 1,
        "action": "Created",
        "changes": "Asset created",
        "userId": 1,
        "userName": "admin",
        "timestamp": "2024-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "action": "Assigned",
        "changes": "Assigned to john.doe",
        "userId": 1,
        "userName": "admin",
        "timestamp": "2024-02-01T10:30:00Z"
      }
    ],
    "totalCount": 5,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

## 🔧 Maintenance Endpoints

### Get Maintenance Records
```http
GET /maintenance
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (int, optional): Page number
- `pageSize` (int, optional): Items per page
- `assetId` (int, optional): Filter by asset ID
- `status` (string, optional): Filter by status (Scheduled, InProgress, Completed, Cancelled)
- `maintenanceType` (string, optional): Filter by type

### Create Maintenance Record
```http
POST /maintenance
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetId": 1,
  "maintenanceType": "string",      # Required, 1-50 characters
  "description": "string",          # Required, 1-500 characters
  "scheduledDate": "2024-03-01T09:00:00Z",  # Required, future date
  "estimatedCost": 100.00          # Optional, positive number
}
```

### Update Maintenance Record
```http
PUT /maintenance/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Completed",
  "completedDate": "2024-03-01T14:30:00Z",
  "actualCost": 85.00,
  "notes": "Maintenance completed successfully"
}
```

## 📈 Reports Endpoints

### Get Asset Summary Report
```http
GET /reports/asset-summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Asset summary retrieved successfully",
  "data": {
    "totalAssets": 150,
    "availableAssets": 45,
    "assignedAssets": 90,
    "maintenanceAssets": 10,
    "retiredAssets": 5,
    "assetsByCategory": [
      {
        "category": "Laptop",
        "count": 60
      },
      {
        "category": "Desktop",
        "count": 40
      }
    ],
    "assetsByLocation": [
      {
        "location": "Office A",
        "count": 75
      },
      {
        "location": "Office B",
        "count": 50
      }
    ]
  }
}
```

### Get Maintenance Report
```http
GET /reports/maintenance
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (string, optional): Filter from date (ISO 8601)
- `endDate` (string, optional): Filter to date (ISO 8601)

## ❌ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": [                    # Optional, for validation errors
    {
      "field": "username",
      "message": "Username is required"
    }
  ]
}
```

### HTTP Status Codes

| Code | Description | When Used |
|------|-------------|-----------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions for the operation |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate key violations, business rule conflicts |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server errors |

## 🔍 Common Use Cases

### 1. Asset Assignment Workflow
```bash
# 1. Get available assets
GET /assets?status=Available

# 2. Get users for assignment
GET /users?role=User

# 3. Assign asset to user
POST /assets/123/assign
{
  "userId": 456
}

# 4. Verify assignment
GET /assets/123
```

### 2. Maintenance Scheduling
```bash
# 1. Create maintenance record
POST /maintenance
{
  "assetId": 123,
  "maintenanceType": "Software Update",
  "description": "Update operating system",
  "scheduledDate": "2024-03-01T09:00:00Z"
}

# 2. Update when completed
PUT /maintenance/789
{
  "status": "Completed",
  "completedDate": "2024-03-01T14:30:00Z",
  "notes": "OS updated successfully"
}
```

### 3. User Management
```bash
# 1. Create new user
POST /users
{
  "username": "newuser",
  "email": "newuser@company.com",
  "password": "SecurePass123!",
  "role": "User"
}

# 2. Get user's assigned assets
GET /assets?assignedUserId=123
```

## 🚀 Best Practices

1. **Always check response status** before processing data
2. **Handle rate limiting** by implementing retry logic with exponential backoff
3. **Store refresh tokens securely** and implement automatic token refresh
4. **Validate data client-side** before sending to API
5. **Use pagination** for large datasets to improve performance
6. **Implement proper error handling** for all API calls
7. **Cache frequently accessed data** like categories and locations