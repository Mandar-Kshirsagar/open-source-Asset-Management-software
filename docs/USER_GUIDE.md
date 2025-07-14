# Asset Management System - User Guide

## 🎯 Introduction

The Asset Management System (AMS) is a comprehensive web-based application designed to help organizations track, manage, and maintain their physical assets. This guide will walk you through all the features and functionality available to different user roles.

## 👥 User Roles

### **Admin**
- Full system access
- User management (create, edit, delete users)
- All asset management functions
- Access to all reports and analytics
- System configuration

### **Manager**
- Asset management (create, edit, assign assets)
- Maintenance scheduling and tracking
- Reports and analytics
- Limited user viewing (cannot manage users)

### **User**
- View assigned assets
- View asset history
- Request maintenance
- Basic reporting on assigned assets

## 🚀 Getting Started

### Logging In

1. **Navigate** to the AMS application in your web browser
2. **Enter** your username and password
3. **Click** "Sign In"

**Default Admin Credentials:**
- Username: `admin`
- Password: `Admin123!`

### Dashboard Overview

After logging in, you'll see the main dashboard with:

- **Asset Summary Cards**: Quick overview of total, available, assigned, and maintenance assets
- **Recent Activity**: Latest asset assignments and changes
- **Quick Actions**: Common tasks based on your role
- **Navigation Menu**: Access to all system features

## 📦 Asset Management

### Viewing Assets

1. **Click** "Assets" in the navigation menu
2. **Use filters** to find specific assets:
   - **Search**: Enter asset name, serial number, or brand
   - **Category**: Filter by asset type (Laptop, Desktop, etc.)
   - **Status**: Filter by availability status
   - **Location**: Filter by office location
   - **Assigned User**: Filter by who has the asset

### Asset Details

Click on any asset to view detailed information:

- **Basic Information**: Name, category, brand, model, serial number
- **Status**: Current availability (Available, Assigned, Maintenance, Retired)
- **Location**: Physical location of the asset
- **Assignment**: Who currently has the asset (if assigned)
- **Purchase Information**: Date and cost (if available)
- **History**: Complete timeline of asset changes and assignments
- **Maintenance Records**: Past and scheduled maintenance

### Creating New Assets (Admin/Manager)

1. **Click** "Add Asset" button
2. **Fill in required fields**:
   - **Asset Name**: Descriptive name for the asset
   - **Category**: Type of asset (select from dropdown)
   - **Brand**: Manufacturer
   - **Model**: Specific model (optional)
   - **Serial Number**: Unique identifier (required)
   - **Location**: Current physical location
   - **Condition**: Physical condition (Excellent, Good, Fair, Poor)
   - **Purchase Date**: When the asset was acquired (optional)
   - **Purchase Price**: Cost of the asset (optional)
3. **Click** "Save" to create the asset

### Editing Assets (Admin/Manager)

1. **Find the asset** using the search and filter options
2. **Click** on the asset to view details
3. **Click** "Edit Asset" button
4. **Update** the necessary fields
5. **Click** "Save Changes"

### Assigning Assets (Admin/Manager)

#### Option 1: From Asset Details
1. **Navigate** to the asset you want to assign
2. **Click** "Assign Asset" button
3. **Select** the user from the dropdown
4. **Click** "Assign"

#### Option 2: Bulk Assignment
1. **Go** to the Assets list
2. **Select** multiple available assets using checkboxes
3. **Click** "Bulk Actions" → "Assign Selected"
4. **Choose** users for each selected asset
5. **Click** "Assign All"

### Unassigning Assets (Admin/Manager)

1. **Find** the assigned asset
2. **Click** on the asset to view details
3. **Click** "Unassign Asset" button
4. **Confirm** the action

## 👨‍💼 User Management (Admin Only)

### Viewing Users

1. **Click** "Users" in the navigation menu
2. **View** the list of all system users
3. **Use search** to find specific users by name or email
4. **Filter** by role (Admin, Manager, User)

### Creating New Users

1. **Click** "Add User" button
2. **Fill in user information**:
   - **Username**: Unique username (3-50 characters)
   - **Email**: Valid email address
   - **Password**: Strong password (min 8 chars, mixed case, numbers, symbols)
   - **Role**: Select appropriate role
3. **Click** "Create User"

### Editing Users

1. **Find** the user in the users list
2. **Click** on the user to view details
3. **Click** "Edit User" button
4. **Update** necessary information
5. **Click** "Save Changes"

### Deactivating Users

1. **Navigate** to the user details
2. **Click** "Edit User"
3. **Uncheck** "Active" checkbox
4. **Click** "Save Changes"

## 🔧 Maintenance Management

### Viewing Maintenance Records

1. **Click** "Maintenance" in the navigation menu
2. **View** all maintenance records
3. **Filter** by:
   - Asset
   - Status (Scheduled, In Progress, Completed, Cancelled)
   - Date range
   - Maintenance type

### Scheduling Maintenance (Admin/Manager)

1. **Click** "Schedule Maintenance" button
2. **Select** the asset requiring maintenance
3. **Fill in maintenance details**:
   - **Maintenance Type**: Type of maintenance needed
   - **Description**: Detailed description of work required
   - **Scheduled Date**: When maintenance should occur
   - **Estimated Cost**: Expected cost (optional)
4. **Click** "Schedule"

### Updating Maintenance Status (Admin/Manager)

1. **Find** the maintenance record
2. **Click** on the record to view details
3. **Click** "Update Status"
4. **Change** status and update fields:
   - **Status**: Update to current status
   - **Completed Date**: When work was finished
   - **Actual Cost**: Final cost of maintenance
   - **Notes**: Additional comments
5. **Click** "Save Updates"

### Requesting Maintenance (All Users)

1. **Navigate** to your assigned asset
2. **Click** "Request Maintenance"
3. **Describe** the issue or maintenance needed
4. **Submit** the request

## 📊 Reports and Analytics

### Asset Summary Report

**Access**: Dashboard or Reports → Asset Summary

**Information Included**:
- Total number of assets
- Assets by status (Available, Assigned, Maintenance, Retired)
- Assets by category
- Assets by location
- Asset utilization rates

### Asset History Report

1. **Go** to Reports → Asset History
2. **Select** date range
3. **Filter** by asset, user, or action type
4. **Generate** report to see:
   - All asset changes and assignments
   - User activity
   - Status change patterns

### Maintenance Report

1. **Go** to Reports → Maintenance
2. **Select** date range
3. **Filter** by status or asset type
4. **View** maintenance metrics:
   - Scheduled vs completed maintenance
   - Average maintenance costs
   - Most frequently maintained assets
   - Maintenance trends

### User Activity Report (Admin/Manager)

1. **Go** to Reports → User Activity
2. **Select** date range and users
3. **View** user activity including:
   - Asset assignments received
   - Maintenance requests submitted
   - Login frequency

## 🔍 Search and Filtering

### Global Search
- **Use** the search bar at the top of any page
- **Search** across assets, users, and maintenance records
- **Get** instant results as you type

### Advanced Filtering
- **Multiple Filters**: Combine multiple filter criteria
- **Date Ranges**: Filter by specific time periods
- **Custom Queries**: Use advanced search operators

### Quick Filters
- **My Assets**: View only assets assigned to you
- **Available Assets**: Show only unassigned assets
- **Overdue Maintenance**: Assets with overdue maintenance
- **Recent Changes**: Recently modified assets

## 📱 Mobile Usage

The AMS is fully responsive and works on mobile devices:

### Mobile Navigation
- **Tap** the menu icon (☰) to access navigation
- **Swipe** left/right on tables to scroll
- **Tap and hold** for context menus

### Mobile-Specific Features
- **QR Code Scanning**: Scan asset QR codes for quick access
- **Location Services**: Automatic location detection
- **Offline Mode**: Basic functionality when offline

## ⚙️ Settings and Preferences

### Personal Settings
1. **Click** your username in the top-right corner
2. **Select** "Settings"
3. **Update** your preferences:
   - **Email notifications**
   - **Dashboard layout**
   - **Default views**
   - **Time zone**

### Changing Password
1. **Go** to Settings → Security
2. **Enter** current password
3. **Enter** new password (must meet requirements)
4. **Confirm** new password
5. **Click** "Update Password"

## 🚨 Troubleshooting

### Common Issues

#### **Can't Log In**
- Verify username and password are correct
- Check if Caps Lock is on
- Contact admin if account is locked

#### **Can't See Assets**
- Check if you have appropriate permissions
- Verify filters aren't hiding assets
- Contact admin if you need access to specific assets

#### **Performance Issues**
- Try refreshing the page
- Clear browser cache
- Check internet connection
- Contact support if issues persist

#### **Error Messages**
- Read the error message carefully
- Try the action again
- Take a screenshot if error persists
- Contact support with error details

### Getting Help

#### **In-App Help**
- **Click** the "?" icon for context-sensitive help
- **View** tooltips by hovering over fields
- **Access** the help center from the main menu

#### **Contact Support**
- **Email**: support@yourcompany.com
- **Phone**: Your support number
- **Help Desk**: Internal ticket system

## 📋 Best Practices

### For Asset Management
- **Regular Updates**: Keep asset information current
- **Accurate Serial Numbers**: Always verify serial numbers
- **Prompt Reporting**: Report issues immediately
- **Documentation**: Include photos and detailed descriptions

### For Security
- **Strong Passwords**: Use complex, unique passwords
- **Regular Logout**: Always log out when finished
- **Access Control**: Only access what you need
- **Incident Reporting**: Report security concerns immediately

### For Efficiency
- **Use Filters**: Narrow down large lists quickly
- **Batch Operations**: Use bulk actions when possible
- **Keyboard Shortcuts**: Learn common shortcuts
- **Regular Maintenance**: Schedule preventive maintenance

## 🔄 Workflow Examples

### New Employee Asset Assignment
1. **HR creates** new user account
2. **Manager identifies** required assets
3. **Manager assigns** assets to new user
4. **System sends** notification to user
5. **User confirms** receipt of assets

### Asset Maintenance Cycle
1. **System identifies** asset due for maintenance
2. **Manager schedules** maintenance
3. **Asset status** changes to "Maintenance"
4. **Maintenance completed** and recorded
5. **Asset returns** to "Available" status

### Asset Retirement Process
1. **Asset identified** for retirement
2. **Manager updates** status to "Retired"
3. **Asset history** preserved for records
4. **Physical asset** removed from service
5. **Disposal documented** per company policy

## 📞 Support and Training

### Training Resources
- **Video Tutorials**: Available in the help center
- **User Manual**: Downloadable PDF version
- **Webinars**: Regular training sessions
- **Documentation**: Searchable knowledge base

### Support Channels
- **Email Support**: Detailed issues and questions
- **Live Chat**: Quick questions during business hours
- **Phone Support**: Urgent issues requiring immediate attention
- **Community Forum**: User discussions and tips

This user guide provides comprehensive information for using the Asset Management System effectively. For additional help or specific questions not covered here, please contact your system administrator or support team.