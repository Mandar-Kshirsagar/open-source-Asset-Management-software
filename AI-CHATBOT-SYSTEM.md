# AI-Powered SQL Chatbot System for Asset Management System

## Overview

This document describes the comprehensive AI-powered chatbot system that has been implemented for the Asset Management System (AMS). The system allows users to interact with the SQL Server database using natural language queries, with the AI automatically generating and executing SQL queries, then providing human-readable responses.

## System Architecture

### Backend Components

#### 1. Models (`AMS.Api/Models/ChatbotModels.cs`)
- **ChatbotRequest**: Represents user input with message and session ID
- **ChatbotResponse**: Contains AI response, generated SQL, query results, and status
- **DatabaseSchema**: Complete database schema information with tables, columns, and relationships
- **SqlQueryResult**: Results from SQL query execution with success status and data

#### 2. Database Schema Service (`AMS.Api/Services/DatabaseSchemaService.cs`)
- **Purpose**: Extracts and provides database schema information to the AI
- **Key Features**:
  - Automatically discovers table structures, columns, and relationships
  - Provides human-readable schema descriptions for AI context
  - Includes column descriptions and relationship mappings
  - Supports both programmatic access and AI-friendly text format

#### 3. AI Chatbot Service (`AMS.Api/Services/AIChatbotService.cs`)
- **Purpose**: Interprets natural language and generates SQL queries
- **Key Features**:
  - Natural Language Processing for intent recognition
  - SQL query generation based on user requests
  - Support for multiple query types (SELECT, COUNT, aggregations)
  - Context-aware responses with conversation history
  - Built-in help and greeting handling

#### 4. SQL Query Service (`AMS.Api/Services/SqlQueryService.cs`)
- **Purpose**: Safely executes SQL queries with comprehensive security measures
- **Security Features**:
  - Whitelist of allowed tables only
  - Blacklist of forbidden SQL keywords (DROP, DELETE, INSERT, etc.)
  - SQL injection pattern detection
  - Query syntax validation before execution
  - 30-second query timeout protection
  - Read-only operations only (SELECT statements)

#### 5. Chatbot Controller (`AMS.Api/Controllers/ChatbotController.cs`)
- **Endpoints**:
  - `POST /api/chatbot/message` - Send messages to AI
  - `GET /api/chatbot/schema` - Get database schema information
  - `GET /api/chatbot/help` - Get chatbot capabilities and examples
  - `POST /api/chatbot/query` - Execute custom SQL (Admin/Manager only)
  - `POST /api/chatbot/validate-query` - Validate SQL without executing
  - `GET /api/chatbot/stats` - Get database statistics
  - `GET /api/chatbot/health` - Health check endpoint

### Frontend Components

#### 1. Chatbot Service (`ams-frontend/src/app/services/chatbot.service.ts`)
- **Purpose**: Angular service for communicating with the chatbot API
- **Features**:
  - Reactive message handling with RxJS observables
  - Session management and conversation history
  - Chat history export and download functionality
  - Query result formatting for display
  - Error handling and retry logic

#### 2. Chatbot Widget Component (`ams-frontend/src/app/components/chatbot-widget.component.ts`)
- **Purpose**: Interactive chat interface with floating widget design
- **Features**:
  - Draggable chat window
  - Real-time message display
  - SQL query and result visualization
  - Context menu with help, export, and clear options
  - Responsive design for mobile and desktop
  - Visual indicators for loading, errors, and SQL generation

## Key Features

### 1. Natural Language Processing
- **Intent Recognition**: Identifies user intent (data query, schema inquiry, help, greeting)
- **Entity Extraction**: Extracts table references, operations, and filters from user input
- **Context Awareness**: Maintains conversation context and session history

### 2. SQL Query Generation
The AI can generate queries for various scenarios:

**Basic Queries**:
- "Show me all assets" → `SELECT * FROM Assets`
- "List all users" → `SELECT * FROM Users`

**Filtered Queries**:
- "Find Dell laptops" → `SELECT * FROM Assets WHERE Brand LIKE '%Dell%' AND Category LIKE '%laptop%'`
- "Show available assets" → `SELECT * FROM Assets WHERE Status = 'Available'`

**Aggregation Queries**:
- "How many assets do we have?" → `SELECT COUNT(*) FROM Assets`
- "Total value of assets" → `SELECT SUM(PurchasePrice) FROM Assets`

**Join Queries**:
- "Show users and their assets" → `SELECT a.*, u.Username FROM Assets a LEFT JOIN Users u ON a.AssignedToUserId = u.Id`

### 3. Security Measures
- **Table Whitelist**: Only AMS tables (Assets, Users, AssetHistories, MaintenanceRecords, RefreshTokens) are accessible
- **Operation Restriction**: Only SELECT queries are allowed
- **SQL Injection Protection**: Multiple layers of pattern detection and prevention
- **Query Validation**: Syntax checking before execution
- **Timeout Protection**: Prevents long-running queries
- **Audit Logging**: All queries are logged for security auditing

### 4. User Experience Features
- **Real-time Chat Interface**: Instant responses with loading indicators
- **SQL Transparency**: Shows generated SQL queries to users
- **Result Formatting**: Displays query results in readable table format
- **Error Handling**: Clear error messages and suggestions
- **Help System**: Built-in help with examples and capabilities
- **Export Functionality**: Download chat history for record keeping

## Database Schema Coverage

The system provides comprehensive coverage of the AMS database:

### Tables Supported:
1. **Assets**: Asset information, categories, status, assignments
2. **Users**: User accounts, roles, and profile information
3. **AssetHistories**: Historical changes and asset movements
4. **MaintenanceRecords**: Maintenance activities and schedules
5. **RefreshTokens**: Authentication token management

### Relationship Understanding:
- Asset-to-User assignments
- Asset-to-Maintenance record associations
- Asset-to-History tracking
- User roles and permissions

## Example Use Cases

### 1. Asset Management Queries
```
User: "How many laptops do we have?"
AI: Generates: SELECT COUNT(*) FROM Assets WHERE Category LIKE '%laptop%'
Response: "I found 15 records matching your criteria."

User: "Show me all Dell computers purchased this year"
AI: Generates: SELECT * FROM Assets WHERE Brand LIKE '%Dell%' AND Category LIKE '%computer%' AND YEAR(CreatedAt) = YEAR(GETDATE())
Response: Shows formatted table with results
```

### 2. User and Assignment Queries
```
User: "Who has the most assets assigned?"
AI: Generates complex JOIN with GROUP BY to find top assignees
Response: Shows user names and asset counts

User: "List unassigned assets"
AI: Generates: SELECT * FROM Assets WHERE AssignedToUserId IS NULL
Response: Shows available assets for assignment
```

### 3. Maintenance and History Queries
```
User: "What maintenance was done last month?"
AI: Generates: SELECT mr.*, a.Name FROM MaintenanceRecords mr JOIN Assets a ON mr.AssetId = a.Id WHERE mr.ScheduledDate >= DATEADD(month, -1, GETDATE())
Response: Shows maintenance activities with asset names

User: "Show recent asset changes"
AI: Generates: SELECT ah.*, a.Name, u.Username FROM AssetHistories ah JOIN Assets a ON ah.AssetId = a.Id LEFT JOIN Users u ON ah.UserId = u.Id ORDER BY ah.Timestamp DESC
Response: Shows recent asset history with user information
```

## Installation and Setup

### Backend Setup

1. **Service Registration** (Already completed in `Program.cs`):
```csharp
// Chatbot Services
builder.Services.AddScoped<IDatabaseSchemaService, DatabaseSchemaService>();
builder.Services.AddScoped<ISqlQueryService, SqlQueryService>();
builder.Services.AddScoped<IAIChatbotService, AIChatbotService>();
```

2. **Database Configuration**: Ensure SQL Server connection string is properly configured in `appsettings.json`

3. **Authentication**: The chatbot requires JWT authentication for access

### Frontend Setup

1. **Service Integration**: The ChatbotService is automatically available through dependency injection

2. **Component Usage**: The chatbot widget can be added to any component:
```html
<app-chatbot-widget></app-chatbot-widget>
```

3. **Environment Configuration**: Ensure API URLs are correctly configured in environment files

## API Documentation

### Authentication
All endpoints require JWT authentication except for the health check endpoint.

### Rate Limiting
The chatbot API is subject to the global rate limiting configured in the application (100 requests per minute per user).

### Error Handling
All endpoints return structured error responses with appropriate HTTP status codes and error messages.

## Security Considerations

### 1. Data Access Control
- Users can only access data they have permission to view
- Role-based restrictions for advanced features (custom SQL execution)
- Session-based conversation tracking

### 2. SQL Injection Prevention
- Multiple layers of input validation
- Parameter-based query construction where possible
- Pattern matching for malicious SQL constructs
- Query syntax validation before execution

### 3. Resource Protection
- Query timeout limits to prevent resource exhaustion
- Result set size limitations
- Connection pooling and proper disposal

### 4. Audit and Monitoring
- All SQL queries are logged with user identification
- Error tracking and monitoring
- Performance metrics collection

## Performance Optimizations

### 1. Caching
- Database schema information is cached for performance
- Query validation results can be cached for repeated patterns

### 2. Connection Management
- Efficient connection pooling
- Proper resource disposal
- Async/await patterns for non-blocking operations

### 3. Query Optimization
- Generated queries use appropriate indexing strategies
- Result limiting to prevent excessive data transfer
- Efficient JOIN strategies for related data

## Future Enhancements

### 1. Advanced AI Integration
- Integration with OpenAI GPT-4 or similar models for more sophisticated NLP
- Machine learning for query optimization suggestions
- Personalized responses based on user patterns

### 2. Enhanced Analytics
- Query performance analytics
- User interaction patterns
- Popular query suggestions

### 3. Extended Functionality
- Report generation capabilities
- Data visualization integration
- Scheduled query execution
- Email notifications for query results

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure JWT token is valid and not expired
2. **SQL Generation Failures**: Check that the natural language query contains recognizable entities
3. **Query Execution Errors**: Verify database connectivity and table permissions
4. **Frontend Connection Issues**: Check API URL configuration in environment files

### Debugging

1. **Backend Logging**: Check application logs for detailed error information
2. **SQL Query Logging**: Generated SQL queries are logged for debugging
3. **Frontend Console**: Browser console shows detailed error information
4. **Health Check**: Use `/api/chatbot/health` endpoint to verify system status

## Conclusion

The AI-powered SQL chatbot system provides a comprehensive solution for natural language database querying in the Asset Management System. It combines advanced NLP capabilities with robust security measures to create a user-friendly interface for data access while maintaining enterprise-level security and performance standards.

The system is designed to be extensible and can be enhanced with additional AI capabilities, more sophisticated query generation, and advanced analytics features as requirements evolve.