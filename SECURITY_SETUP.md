# Security Setup Guide

## 🔐 Critical Security Configuration

### 1. JWT Secret Key Configuration

**IMPORTANT**: The JWT secret key in `appsettings.json` is a placeholder. You MUST replace it with a strong, randomly generated key.

#### Option A: Environment Variable (Recommended)
```bash
# Set environment variable
setx JWT_SECRET_KEY "your-super-secure-256-bit-key-here"
```

Then update `Program.cs` to read from environment:
```csharp
var key = Encoding.ASCII.GetBytes(Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? jwtSettings["SecretKey"]!);
```

#### Option B: Generate a Strong Key
```bash
# Using PowerShell to generate a secure key
$bytes = New-Object Byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### 2. Database Connection String

For production, use environment variables for database connection:
```bash
setx DB_CONNECTION_STRING "Server=your-server;Database=AMS_DB;User Id=your-user;Password=your-password;TrustServerCertificate=True"
```

### 3. HTTPS Configuration

In production, ensure HTTPS is enabled:
- The code now automatically enables HTTPS redirection in production
- Configure SSL certificates for your hosting environment
- Update CORS settings to include your production domain

## 🚨 Security Checklist

- [ ] Replace JWT secret key with strong key
- [ ] Use environment variables for sensitive configuration
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up proper database authentication
- [ ] Implement rate limiting (recommended)
- [ ] Set up logging and monitoring
- [ ] Regular security updates

## 🔧 Development Setup

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQL Server LocalDB or SQL Server Express

### Quick Start
1. Clone the repository
2. Update JWT secret key in `appsettings.json`
3. Run database migrations: `dotnet ef database update`
4. Start backend: `dotnet run` (runs on https://localhost:7001)
5. Start frontend: `npm start` (runs on http://localhost:4200)

### Default Admin Credentials
- Username: `admin`
- Password: `Admin123!`

**IMPORTANT**: Change these credentials in production!

## 📝 Environment Variables

Create a `.env` file or set environment variables:

```bash
# JWT Configuration
JWT_SECRET_KEY=your-super-secure-key-here
JWT_ISSUER=AMS_API
JWT_AUDIENCE=AMS_Client
JWT_EXPIRATION_MINUTES=60

# Database
DB_CONNECTION_STRING=your-connection-string

# CORS
ALLOWED_ORIGINS=http://localhost:4200,https://yourdomain.com
```

## 🛡️ Additional Security Recommendations

1. **Input Validation**: Implement FluentValidation for all DTOs
2. **Rate Limiting**: Add rate limiting middleware
3. **Audit Logging**: Implement comprehensive audit trails
4. **Password Policy**: Enforce strong password requirements
5. **Session Management**: Implement proper session handling
6. **API Versioning**: Add API versioning for future compatibility
7. **Health Checks**: Implement health check endpoints
8. **Monitoring**: Set up application monitoring and alerting

## 🧪 Testing Security

1. **Penetration Testing**: Regular security assessments
2. **Dependency Scanning**: Scan for vulnerable packages
3. **Code Analysis**: Use static code analysis tools
4. **Security Headers**: Implement security headers middleware

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [ASP.NET Core Security](https://docs.microsoft.com/en-us/aspnet/core/security/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/) 