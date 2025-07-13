# 🚀 AMS Startup Guide

## Quick Start

### Option 1: Windows Batch File (Recommended)
1. **Double-click** `start-ams.bat`
2. The script will automatically:
   - Check prerequisites (.NET 8, Node.js, npm)
   - Install dependencies
   - Apply database migrations
   - Start both backend and frontend
   - Open the application in your browser

### Option 2: PowerShell Script
1. **Right-click** `start-ams.ps1` and select "Run with PowerShell"
2. Or open PowerShell and run: `.\start-ams.ps1`

## What the Scripts Do

### Prerequisites Check
- ✅ .NET 8 SDK
- ✅ Node.js 18+
- ✅ npm

### Backend Setup
- 📦 Restore NuGet packages
- 🗄️ Apply database migrations
- 🔧 Start API server (https://localhost:7001)

### Frontend Setup
- 📦 Install npm packages
- 🌐 Start development server (http://localhost:4200)

## Manual Startup (if scripts don't work)

### Backend
```bash
cd AMS.Api
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend
```bash
cd ams-frontend
npm install
npm start
```

## Access Points

- **Frontend Application**: http://localhost:4200
- **Backend API**: https://localhost:7001
- **API Documentation**: https://localhost:7001/swagger

## Default Login

- **Username**: `admin`
- **Password**: `Admin123!`

## Troubleshooting

### Script Won't Run
- Make sure you have .NET 8 SDK installed
- Make sure you have Node.js 18+ installed
- Try running as Administrator

### Database Errors
- The script automatically applies migrations
- If you see database errors, try running manually:
  ```bash
  cd AMS.Api
  dotnet ef database update
  ```

### Port Already in Use
- Close any existing instances of the application
- Check if ports 7001 or 4200 are already in use
- Kill processes using these ports

### Frontend Won't Start
- Make sure you're in the `ams-frontend` directory
- Try deleting `node_modules` and running `npm install` again

## Stopping the Application

- **Close the command windows** that opened when you ran the script
- Or press `Ctrl+C` in each terminal window

## Security Note

⚠️ **Important**: Before using in production, change the default admin password and JWT secret key! 