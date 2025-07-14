# Asset Management System - Architecture Documentation

## 🏗️ System Architecture

The Asset Management System follows a modern **three-tier architecture** with clear separation of concerns between the presentation layer (Angular frontend), business logic layer (.NET Core API), and data access layer (Entity Framework Core + SQL Server).

```
┌─────────────────────┐
│   Angular Frontend  │  ← Presentation Layer
│   (Port 4200)      │
└─────────┬───────────┘
          │ HTTP/HTTPS
          │ REST API calls
┌─────────▼───────────┐
│   ASP.NET Core API  │  ← Business Logic Layer
│   (Port 7001)      │
└─────────┬───────────┘
          │ Entity Framework
          │ Core (EF Core)
┌─────────▼───────────┐
│   SQL Server        │  ← Data Access Layer
│   LocalDB/Express   │
└─────────────────────┘
```

## 🎯 Core Components

### Backend API (AMS.Api)

#### **Technology Stack**
- **Framework**: ASP.NET Core 8.0
- **ORM**: Entity Framework Core 8.0
- **Database**: SQL Server (LocalDB for development)
- **Authentication**: JWT Bearer tokens
- **Documentation**: Swagger/OpenAPI
- **Mapping**: AutoMapper
- **Validation**: FluentValidation + DataAnnotations

#### **Project Structure**
```
AMS.Api/
├── Controllers/           # API endpoints
│   ├── AuthController.cs
│   ├── AssetsController.cs
│   ├── UsersController.cs
│   ├── MaintenanceController.cs
│   ├── ReportsController.cs
│   ├── AssetHistoryController.cs
│   └── ChatbotController.cs
├── Models/               # Entity models
│   ├── User.cs
│   ├── Asset.cs
│   ├── AssetHistory.cs
│   ├── MaintenanceRecord.cs
│   └── RefreshToken.cs
├── DTOs/                # Data Transfer Objects
├── Services/            # Business logic
├── Data/               # EF Core DbContext
├── Mapping/            # AutoMapper profiles
├── Middleware/         # Custom middleware
└── Migrations/         # EF Core migrations
```

#### **Key Features Implementation**

**1. Authentication & Authorization**
- JWT token-based authentication
- Role-based access control (Admin, Manager, User)
- Refresh token mechanism for session management
- Rate limiting on authentication endpoints (5 attempts per 15 minutes)

**2. Security Features**
- Global rate limiting (100 requests per minute)
- Input validation using DataAnnotations and FluentValidation
- Global exception handling middleware
- HTTPS redirection in production
- Secure JWT configuration with environment variables

**3. Performance Optimizations**
- Memory caching implementation
- Optimized database queries
- Efficient pagination
- Bundle analysis and optimization

### Frontend Application (ams-frontend)

#### **Technology Stack**
- **Framework**: Angular 20
- **UI Library**: Angular Material
- **State Management**: RxJS with reactive patterns
- **Language**: TypeScript
- **Styling**: SCSS with Angular Material themes
- **Build Tool**: Angular CLI with Webpack

#### **Project Structure**
```
ams-frontend/src/app/
├── components/          # Reusable UI components
├── pages/              # Feature pages/modules
├── services/           # API services and business logic
├── models/             # TypeScript interfaces
├── guards/             # Route guards for authentication
├── interceptors/       # HTTP interceptors
├── shared/             # Shared utilities and components
└── core/               # Core services and configurations
```

#### **Key Features Implementation**

**1. Authentication Flow**
- JWT token storage and management
- Automatic token refresh
- Route guards for protected pages
- Role-based UI rendering

**2. Reactive Data Management**
- RxJS observables for real-time updates
- Efficient state management patterns
- Optimistic UI updates

**3. User Experience**
- Responsive Material Design
- Loading states and error handling
- Form validation with real-time feedback
- Accessibility compliance

## 🗄️ Database Design

### **Entity Relationship Diagram**

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Users    │    │     Assets      │    │  AssetHistory   │
├─────────────┤    ├─────────────────┤    ├─────────────────┤
│ Id (PK)     │    │ Id (PK)         │    │ Id (PK)         │
│ Username    │◄──┐│ Name            │◄──┐│ AssetId (FK)    │
│ Email       │   ││ Category        │   ││ Action          │
│ PasswordHash│   ││ Brand           │   ││ Changes         │
│ Role        │   ││ SerialNumber    │   ││ UserId (FK)     │
│ CreatedAt   │   ││ AssignedUserId  │───┤│ Timestamp       │
└─────────────┘   ││ Status          │   │└─────────────────┘
                  ││ Location        │   │
                  ││ Condition       │   │
                  │└─────────────────┘   │
                  │                      │
                  │┌─────────────────────┐│
                  ││ MaintenanceRecords  ││
                  │├─────────────────────┤│
                  ││ Id (PK)             ││
                  ││ AssetId (FK)        │┘
                  ││ MaintenanceType     │
                  ││ Description         │
                  ││ Cost                │
                  ││ ScheduledDate       │
                  ││ CompletedDate       │
                  ││ Status              │
                  │└─────────────────────┘
                  │
                  └──── One-to-Many Relationships
```

### **Table Specifications**

#### **Users Table**
- **Purpose**: Store user accounts with role-based access
- **Key Fields**: Username (unique), Email (unique), Role (Admin/Manager/User)
- **Security**: Passwords hashed using BCrypt

#### **Assets Table**
- **Purpose**: Core asset information and status tracking
- **Key Fields**: SerialNumber (unique), Status (Available/Assigned/Maintenance/Retired)
- **Business Rules**: Assets can only be assigned to one user at a time

#### **AssetHistory Table**
- **Purpose**: Complete audit trail of all asset changes
- **Key Fields**: Action type, JSON changes, timestamp
- **Data Retention**: Permanent historical record

#### **MaintenanceRecords Table**
- **Purpose**: Track scheduled and completed maintenance
- **Key Fields**: MaintenanceType, Cost, Status
- **Business Rules**: Scheduled maintenance automatically updates asset status

## 🔐 Security Architecture

### **Authentication Flow**
1. User submits credentials to `/api/auth/login`
2. API validates credentials against database
3. JWT access token (15 min expiry) and refresh token (7 days) generated
4. Client stores tokens securely
5. Access token included in Authorization header for API calls
6. Automatic refresh using refresh token when access token expires

### **Authorization Levels**
- **Admin**: Full system access, user management
- **Manager**: Asset management, reports, maintenance
- **User**: View assigned assets, limited asset operations

### **Security Measures**
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention via parameterized queries
- XSS protection with proper output encoding
- CSRF protection for state-changing operations
- HTTPS enforcement in production

## 🚀 Deployment Architecture

### **Development Environment**
- **Backend**: IIS Express / Kestrel (localhost:7001)
- **Frontend**: Angular Dev Server (localhost:4200)
- **Database**: SQL Server LocalDB
- **Proxy**: Angular proxy configuration for API calls

### **Production Architecture**
```
[Load Balancer] → [Reverse Proxy] → [API Instances]
                      ↓
              [Static File Server] → [Angular App]
                      ↓
                 [Database Server]
```

### **Recommended Deployment Stack**
- **API Hosting**: Azure App Service / AWS Elastic Beanstalk
- **Frontend Hosting**: Azure Static Web Apps / AWS S3 + CloudFront
- **Database**: Azure SQL Database / AWS RDS
- **Reverse Proxy**: Azure Application Gateway / AWS Application Load Balancer

## 📊 Performance Considerations

### **Backend Optimizations**
- Entity Framework query optimization
- Memory caching for frequently accessed data
- Pagination for large datasets
- Database indexing on frequently queried fields
- Connection pooling for database efficiency

### **Frontend Optimizations**
- Lazy loading for feature modules
- OnPush change detection strategy
- Bundle optimization and code splitting
- Service worker for caching (if implemented)
- Virtual scrolling for large lists

## 🔄 Data Flow

### **Typical Asset Management Flow**
1. **Asset Creation**: Admin creates asset → Stored in database → History record created
2. **Asset Assignment**: Manager assigns to user → Asset status updated → Assignment history logged
3. **Maintenance Scheduling**: Maintenance record created → Asset status updated to "Maintenance"
4. **Maintenance Completion**: Record updated → Asset status returned to "Available"
5. **Reporting**: Aggregated data pulled from multiple tables → Formatted for display

### **Real-time Updates**
- Frontend polls API for updates (configurable interval)
- Reactive forms provide immediate validation feedback
- Optimistic UI updates improve perceived performance

## 🧪 Testing Strategy

### **Backend Testing**
- Unit tests for business logic in Services layer
- Integration tests for Controllers and Database
- API endpoint testing with proper authorization

### **Frontend Testing**
- Unit tests for components and services
- Integration tests for user workflows
- E2E testing for critical user journeys

## 📈 Scalability Considerations

### **Horizontal Scaling**
- Stateless API design enables multiple instance deployment
- Database connection pooling supports increased load
- Frontend can be served from CDN for global distribution

### **Vertical Scaling**
- Database performance tuning with proper indexing
- Memory cache optimization for frequently accessed data
- Query optimization for complex reporting functions

This architecture provides a solid foundation for a production-ready asset management system with room for future enhancements and scaling.