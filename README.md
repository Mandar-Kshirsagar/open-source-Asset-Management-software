# Asset Management System (AMS)

A comprehensive Asset Management System built with ASP.NET Core 8 API and Angular 20 frontend.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **Asset Management**: Complete CRUD operations for assets with assignment tracking
- **User Management**: Admin-only user management functionality
- **Asset History**: Track all changes and assignments to assets
- **Maintenance Records**: Schedule and track maintenance activities
- **Modern UI**: Angular Material design with responsive layout
- **Real-time Updates**: Reactive data management with RxJS

## Technology Stack

### Backend
- **ASP.NET Core 8**: Modern web framework
- **Entity Framework Core**: ORM for database operations
- **SQL Server**: Database (LocalDB for development)
- **JWT Authentication**: Secure token-based authentication
- **AutoMapper**: Object mapping between models and DTOs
- **Swagger**: API documentation

### Frontend
- **Angular 20**: Modern frontend framework
- **Angular Material**: UI component library
- **RxJS**: Reactive programming
- **TypeScript**: Type-safe JavaScript

## Prerequisites

- .NET 8 SDK
- Node.js 18+ and npm
- SQL Server LocalDB (included with Visual Studio)
- Visual Studio 2022 or VS Code

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AMS
```

### 2. Backend Setup

1. **Navigate to the API project**:
   ```bash
   cd AMS.Api
   ```

2. **Restore NuGet packages**:
   ```bash
   dotnet restore
   ```

3. **Update database** (creates the database and applies migrations):
   ```bash
   dotnet ef database update
   ```

4. **Run the API**:
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:7001`

### 3. Frontend Setup

1. **Navigate to the frontend project**:
   ```bash
   cd ams-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:4200`

## Default Credentials

The system comes with a default admin user:

- **Username**: `admin`
- **Password**: `Admin123!`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Assets
- `GET /api/assets` - Get all assets (with optional filtering)
- `GET /api/assets/{id}` - Get asset by ID
- `POST /api/assets` - Create new asset
- `PUT /api/assets/{id}` - Update asset
- `DELETE /api/assets/{id}` - Delete asset
- `POST /api/assets/{id}/assign` - Assign asset to user
- `POST /api/assets/{id}/unassign` - Unassign asset
- `GET /api/assets/categories` - Get asset categories
- `GET /api/assets/locations` - Get asset locations

## Database Schema

### Users
- User authentication and profile information
- Role-based access control (Admin, Manager, User)

### Assets
- Asset information including name, category, brand, model
- Status tracking (Available, Assigned, Maintenance, Retired)
- Assignment to users
- Location and condition tracking

### AssetHistory
- Complete audit trail of asset changes
- Assignment/unassignment history
- Status change tracking

### MaintenanceRecords
- Scheduled and completed maintenance
- Cost tracking
- Maintenance type classification

## Development

### Adding New Features

1. **Backend**: Add models, DTOs, services, and controllers
2. **Frontend**: Add components, services, and routing
3. **Database**: Create migrations for schema changes

### Code Structure

```
AMS/
├── AMS.Api/                 # Backend API
│   ├── Controllers/         # API endpoints
│   ├── Data/               # Database context
│   ├── DTOs/               # Data transfer objects
│   ├── Models/             # Entity models
│   ├── Services/           # Business logic
│   └── Mapping/            # AutoMapper profiles
├── ams-frontend/           # Frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ # Reusable components
│   │   │   ├── models/     # TypeScript interfaces
│   │   │   ├── pages/      # Page components
│   │   │   ├── services/   # API services
│   │   │   └── guards/     # Route guards
│   │   └── environments/   # Environment configuration
└── README.md
```

## Deployment

### Backend Deployment
1. Build the application: `dotnet publish -c Release`
2. Deploy to your hosting platform (Azure, AWS, etc.)
3. Configure connection strings and environment variables

### Frontend Deployment
1. Build the application: `ng build --configuration production`
2. Deploy the `dist` folder to your web server
3. Update the API URL in environment configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository. 