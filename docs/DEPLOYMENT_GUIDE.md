# Asset Management System - Deployment Guide

## 🌐 Deployment Overview

This guide covers deploying the Asset Management System to various hosting platforms with production-ready configurations.

## 🏗️ Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code reviewed and approved
- [ ] Security scan completed
- [ ] Performance testing completed
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations ready

### ✅ Infrastructure Requirements
- [ ] Database server provisioned
- [ ] SSL certificates obtained
- [ ] Domain name configured
- [ ] CDN setup (for frontend)
- [ ] Monitoring tools configured
- [ ] Backup strategy implemented

## 🏭 Production Environment Configuration

### Backend Configuration

#### **appsettings.Production.json**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=prod-sql-server;Database=AMS_Production;User Id=ams_user;Password=${DB_PASSWORD};TrustServerCertificate=true;MultipleActiveResultSets=true"
  },
  "JwtSettings": {
    "SecretKey": "${JWT_SECRET_KEY}",
    "Issuer": "AMS-API",
    "Audience": "AMS-Users",
    "ExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Error",
      "AMS.Api": "Information"
    }
  },
  "AllowedHosts": "yourdomain.com,www.yourdomain.com",
  "CORS": {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://www.yourdomain.com"
    ]
  },
  "RateLimiting": {
    "GlobalLimit": 1000,
    "AuthLimit": 10,
    "WindowMinutes": 15
  }
}
```

#### **Environment Variables**
```bash
# Required Production Variables
JWT_SECRET_KEY=your-super-secure-256-bit-secret-key-here
DB_PASSWORD=your-secure-database-password
ASPNETCORE_ENVIRONMENT=Production

# Optional Variables
ASPNETCORE_URLS=https://+:443;http://+:80
SSL_CERT_PATH=/app/certs/cert.pfx
SSL_CERT_PASSWORD=cert-password
```

### Frontend Configuration

#### **environment.prod.ts**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com',
  enableLogging: false,
  cacheTimeout: 300000, // 5 minutes
  retryAttempts: 3,
  retryDelay: 1000
};
```

## ☁️ Cloud Deployment Options

### Microsoft Azure

#### **Azure App Service + Azure SQL Database**

1. **Create Azure SQL Database:**
   ```bash
   # Create resource group
   az group create --name AMS-Production --location "East US"
   
   # Create SQL Server
   az sql server create \
     --name ams-sql-server \
     --resource-group AMS-Production \
     --location "East US" \
     --admin-user amsadmin \
     --admin-password "YourSecurePassword123!"
   
   # Create SQL Database
   az sql db create \
     --resource-group AMS-Production \
     --server ams-sql-server \
     --name AMS-Production \
     --service-objective S2
   ```

2. **Deploy Backend to App Service:**
   ```bash
   # Create App Service Plan
   az appservice plan create \
     --name AMS-Plan \
     --resource-group AMS-Production \
     --sku P1V2 \
     --is-linux
   
   # Create Web App
   az webapp create \
     --resource-group AMS-Production \
     --plan AMS-Plan \
     --name ams-api \
     --runtime "DOTNETCORE:8.0"
   
   # Configure app settings
   az webapp config appsettings set \
     --resource-group AMS-Production \
     --name ams-api \
     --settings @appsettings.json
   
   # Deploy application
   dotnet publish -c Release
   az webapp deployment source config-zip \
     --resource-group AMS-Production \
     --name ams-api \
     --src release.zip
   ```

3. **Deploy Frontend to Static Web Apps:**
   ```bash
   # Build for production
   npm run build:prod
   
   # Deploy to Azure Static Web Apps
   npx @azure/static-web-apps-cli deploy \
     --app-location "./dist/ams-frontend" \
     --api-location "" \
     --app-artifact-location ""
   ```

#### **Azure Configuration Example:**
```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
    - main

variables:
  buildConfiguration: 'Release'

stages:
- stage: Build
  jobs:
  - job: BuildBackend
    steps:
    - task: DotNetCoreCLI@2
      inputs:
        command: 'publish'
        publishWebProjects: true
        arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)'
    
  - job: BuildFrontend
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    - script: |
        npm install
        npm run build:prod
      workingDirectory: 'ams-frontend'

- stage: Deploy
  dependsOn: Build
  jobs:
  - deployment: DeployBackend
    environment: 'Production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'Azure-Subscription'
              appType: 'webApp'
              appName: 'ams-api'
              package: '$(Pipeline.Workspace)/**/*.zip'
```

### Amazon AWS

#### **Elastic Beanstalk + RDS**

1. **Create RDS Database:**
   ```bash
   # Create RDS instance
   aws rds create-db-instance \
     --db-instance-identifier ams-production \
     --db-instance-class db.t3.medium \
     --engine sqlserver-ex \
     --master-username amsadmin \
     --master-user-password YourSecurePassword123! \
     --allocated-storage 100 \
     --vpc-security-group-ids sg-xxxxxxxx
   ```

2. **Deploy to Elastic Beanstalk:**
   ```bash
   # Initialize EB application
   eb init ams-api --platform "64bit Amazon Linux 2 v2.2.0 running .NET Core"
   
   # Create environment
   eb create production-env
   
   # Set environment variables
   eb setenv JWT_SECRET_KEY=your-secret-key
   eb setenv DB_PASSWORD=your-db-password
   
   # Deploy
   dotnet publish -c Release
   eb deploy
   ```

3. **Deploy Frontend to S3 + CloudFront:**
   ```bash
   # Build application
   npm run build:prod
   
   # Sync to S3
   aws s3 sync ./dist/ams-frontend s3://ams-frontend-bucket --delete
   
   # Invalidate CloudFront cache
   aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/*"
   ```

## 🐳 Docker Deployment

### Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  ams-api:
    build:
      context: ./AMS.Api
      dockerfile: Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - DB_PASSWORD=${DB_PASSWORD}
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - ams-db
    networks:
      - ams-network
    restart: unless-stopped
    volumes:
      - ./certs:/app/certs:ro

  ams-frontend:
    build:
      context: ./ams-frontend
      dockerfile: Dockerfile.prod
    ports:
      - "8080:80"
    networks:
      - ams-network
    restart: unless-stopped

  ams-db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - SA_PASSWORD=${DB_PASSWORD}
      - ACCEPT_EULA=Y
    ports:
      - "1433:1433"
    volumes:
      - ams_data:/var/opt/mssql
    networks:
      - ams-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - ams-api
      - ams-frontend
    networks:
      - ams-network
    restart: unless-stopped

volumes:
  ams_data:

networks:
  ams-network:
    driver: bridge
```

### Dockerfile for API

```dockerfile
# AMS.Api/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["AMS.Api.csproj", "."]
RUN dotnet restore "AMS.Api.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "AMS.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AMS.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

ENTRYPOINT ["dotnet", "AMS.Api.dll"]
```

### Dockerfile for Frontend

```dockerfile
# ams-frontend/Dockerfile.prod
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=build /app/dist/ams-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔒 SSL/TLS Configuration

### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream api {
        server ams-api:80;
    }

    upstream frontend {
        server ams-frontend:80;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Configuration
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API routes
        location /api/ {
            proxy_pass http://api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Handle Angular routing
            try_files $uri $uri/ /index.html;
        }
    }
}
```

## 📊 Database Migration in Production

### Automated Migration Script

```bash
#!/bin/bash
# deploy-db.sh

# Set variables
DB_SERVER="your-production-server"
DB_NAME="AMS_Production"
BACKUP_PATH="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Starting database deployment..."

# Create backup
echo "Creating backup..."
dotnet ef database update --connection "Server=$DB_SERVER;Database=${DB_NAME}_Backup_$TIMESTAMP;..."

# Apply migrations
echo "Applying migrations..."
dotnet ef database update --connection "Server=$DB_SERVER;Database=$DB_NAME;..."

if [ $? -eq 0 ]; then
    echo "Database deployment successful!"
else
    echo "Database deployment failed! Check logs."
    exit 1
fi
```

### Manual Migration Steps

```bash
# 1. Create production migration
dotnet ef migrations add ProductionMigration_v1.0

# 2. Generate SQL script for review
dotnet ef migrations script --output migration.sql

# 3. Review the script before applying

# 4. Apply to production (with backup)
dotnet ef database update --connection "YourProductionConnectionString"
```

## 🚀 Zero-Downtime Deployment

### Blue-Green Deployment Strategy

```bash
#!/bin/bash
# blue-green-deploy.sh

CURRENT_ENV="blue"
NEW_ENV="green"

# Deploy to inactive environment
echo "Deploying to $NEW_ENV environment..."
docker-compose -f docker-compose.$NEW_ENV.yml up -d

# Health check
echo "Performing health checks..."
for i in {1..30}; do
    if curl -f http://localhost:8081/api/health; then
        echo "Health check passed!"
        break
    fi
    sleep 10
done

# Switch traffic
echo "Switching traffic to $NEW_ENV..."
docker-compose -f docker-compose.load-balancer.yml exec nginx nginx -s reload

# Stop old environment
echo "Stopping $CURRENT_ENV environment..."
docker-compose -f docker-compose.$CURRENT_ENV.yml down

echo "Deployment complete!"
```

## 📈 Monitoring and Logging

### Application Insights (Azure)

```csharp
// Program.cs
builder.Services.AddApplicationInsightsTelemetry();

// Custom telemetry
public class AssetService
{
    private readonly TelemetryClient _telemetryClient;

    public async Task<Asset> CreateAssetAsync(CreateAssetDto dto)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            // Business logic
            var asset = await CreateAssetInternalAsync(dto);
            
            _telemetryClient.TrackEvent("AssetCreated", 
                new Dictionary<string, string> 
                {
                    ["AssetId"] = asset.Id.ToString(),
                    ["Category"] = asset.Category
                });
                
            return asset;
        }
        catch (Exception ex)
        {
            _telemetryClient.TrackException(ex);
            throw;
        }
        finally
        {
            _telemetryClient.TrackDependency("Database", "CreateAsset", 
                DateTime.UtcNow.Subtract(stopwatch.Elapsed), stopwatch.Elapsed, true);
        }
    }
}
```

### Serilog Configuration

```csharp
// Program.cs
builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .WriteTo.Console()
        .WriteTo.File("logs/ams-.txt", rollingInterval: RollingInterval.Day)
        .WriteTo.ApplicationInsights(TelemetryConfiguration.Active, TelemetryConverter.Traces)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithEnvironmentUserName();
});
```

## 🔧 Production Optimization

### Database Performance

```sql
-- Create indexes for common queries
CREATE INDEX IX_Assets_Status ON Assets(Status);
CREATE INDEX IX_Assets_Category ON Assets(Category);
CREATE INDEX IX_Assets_AssignedUserId ON Assets(AssignedUserId);
CREATE INDEX IX_AssetHistory_AssetId_Timestamp ON AssetHistory(AssetId, Timestamp);

-- Update statistics
UPDATE STATISTICS Assets;
UPDATE STATISTICS AssetHistory;
```

### API Performance

```csharp
// Add response caching
builder.Services.AddResponseCaching();
app.UseResponseCaching();

// Add compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
});
```

## 🚨 Rollback Procedures

### Application Rollback

```bash
#!/bin/bash
# rollback.sh

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "Usage: ./rollback.sh <previous-version>"
    exit 1
fi

echo "Rolling back to version $PREVIOUS_VERSION..."

# Rollback API
docker tag ams-api:$PREVIOUS_VERSION ams-api:latest
docker-compose restart ams-api

# Rollback Frontend
docker tag ams-frontend:$PREVIOUS_VERSION ams-frontend:latest
docker-compose restart ams-frontend

echo "Rollback complete!"
```

### Database Rollback

```bash
# Restore from backup
dotnet ef database update <PreviousMigration> --connection "ProductionConnectionString"

# Or restore from SQL backup
sqlcmd -S server -Q "RESTORE DATABASE AMS_Production FROM DISK = 'backup_path'"
```

## ✅ Post-Deployment Verification

### Health Check Endpoints

```csharp
// Add health checks
builder.Services.AddHealthChecks()
    .AddSqlServer(connectionString)
    .AddCheck<AssetServiceHealthCheck>("asset-service");

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

### Smoke Tests

```bash
#!/bin/bash
# smoke-tests.sh

API_URL="https://yourdomain.com/api"
FRONTEND_URL="https://yourdomain.com"

echo "Running smoke tests..."

# Test API health
if ! curl -f "$API_URL/health"; then
    echo "API health check failed!"
    exit 1
fi

# Test frontend
if ! curl -f "$FRONTEND_URL"; then
    echo "Frontend check failed!"
    exit 1
fi

# Test authentication
if ! curl -X POST -f "$API_URL/auth/login" -d '{"username":"admin","password":"Admin123!"}'; then
    echo "Authentication test failed!"
    exit 1
fi

echo "All smoke tests passed!"
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backup created
- [ ] Health checks configured
- [ ] Monitoring setup verified
- [ ] Load balancer configured
- [ ] CDN configured (if applicable)

### During Deployment
- [ ] Deploy to staging first
- [ ] Run automated tests
- [ ] Perform manual testing
- [ ] Monitor performance metrics
- [ ] Verify all integrations working

### Post-Deployment
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify backup procedures
- [ ] Update documentation
- [ ] Notify stakeholders

This deployment guide ensures a robust, secure, and scalable production deployment of the Asset Management System.