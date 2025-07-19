using AMS.Api.Models;
using System.Text.RegularExpressions;
using System.Text.Json;

namespace AMS.Api.Services
{
    public interface IAIChatbotService
    {
        Task<ChatbotResponse> ProcessMessageAsync(ChatbotRequest request, string userId);
    }

    public class AIChatbotService : IAIChatbotService
    {
        private readonly IDatabaseSchemaService _schemaService;
        private readonly ISqlQueryService _sqlQueryService;
        private readonly ILogger<AIChatbotService> _logger;
        private readonly Dictionary<string, List<string>> _conversationHistory;

        public AIChatbotService(
            IDatabaseSchemaService schemaService, 
            ISqlQueryService sqlQueryService,
            ILogger<AIChatbotService> logger)
        {
            _schemaService = schemaService;
            _sqlQueryService = sqlQueryService;
            _logger = logger;
            _conversationHistory = new Dictionary<string, List<string>>();
        }

        public async Task<ChatbotResponse> ProcessMessageAsync(ChatbotRequest request, string userId)
        {
            try
            {
                var sessionId = request.SessionId ?? Guid.NewGuid().ToString();
                
                // Add to conversation history
                if (!_conversationHistory.ContainsKey(sessionId))
                    _conversationHistory[sessionId] = new List<string>();
                
                _conversationHistory[sessionId].Add($"User: {request.Message}");

                // Analyze the request to determine intent
                var intent = AnalyzeIntent(request.Message);
                
                switch (intent.Type)
                {
                    case IntentType.DataQuery:
                        return await HandleDataQueryAsync(request.Message, sessionId, intent);
                    
                    case IntentType.SchemaInquiry:
                        return await HandleSchemaInquiryAsync(request.Message, sessionId);
                    
                    case IntentType.Help:
                        return HandleHelpRequest(sessionId);
                    
                    case IntentType.Greeting:
                        return HandleGreeting(sessionId);
                    
                    default:
                        return new ChatbotResponse
                        {
                            Response = "I'm sorry, I didn't understand your request. Could you please rephrase it? " +
                                     "I can help you query the asset management database, provide schema information, or answer questions about the data.",
                            SessionId = sessionId,
                            IsSuccessful = false
                        };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chatbot message: {Message}", request.Message);
                return new ChatbotResponse
                {
                    Response = "I encountered an error while processing your request. Please try again.",
                    SessionId = request.SessionId ?? Guid.NewGuid().ToString(),
                    IsSuccessful = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        private async Task<ChatbotResponse> HandleDataQueryAsync(string message, string sessionId, QueryIntent intent)
        {
            try
            {
                // Generate SQL query based on the natural language request
                var sqlQuery = await GenerateSqlQueryAsync(message, intent);
                
                if (string.IsNullOrEmpty(sqlQuery))
                {
                    return new ChatbotResponse
                    {
                        Response = "I couldn't generate a SQL query from your request. Could you please be more specific? " +
                                 "For example: 'Show me all laptops' or 'List users with their assigned assets'",
                        SessionId = sessionId,
                        IsSuccessful = false
                    };
                }

                // Execute the SQL query
                var queryResult = await _sqlQueryService.ExecuteQueryAsync(sqlQuery);
                
                if (!queryResult.IsSuccessful)
                {
                    return new ChatbotResponse
                    {
                        Response = $"I generated a query but there was an error executing it: {queryResult.ErrorMessage}",
                        GeneratedSql = sqlQuery,
                        SessionId = sessionId,
                        IsSuccessful = false,
                        ErrorMessage = queryResult.ErrorMessage
                    };
                }

                // Generate natural language response
                var naturalLanguageResponse = GenerateNaturalLanguageResponse(intent, queryResult);
                
                var response = new ChatbotResponse
                {
                    Response = naturalLanguageResponse,
                    GeneratedSql = sqlQuery,
                    QueryResult = queryResult.Data,
                    SessionId = sessionId,
                    IsSuccessful = true
                };

                _conversationHistory[sessionId].Add($"AI: {naturalLanguageResponse}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling data query: {Message}", message);
                return new ChatbotResponse
                {
                    Response = "I encountered an error while processing your data query. Please try again with a simpler request.",
                    SessionId = sessionId,
                    IsSuccessful = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        private async Task<ChatbotResponse> HandleSchemaInquiryAsync(string message, string sessionId)
        {
            var schema = await _schemaService.GetDatabaseSchemaAsync();
            var responseBuilder = new System.Text.StringBuilder();

            responseBuilder.AppendLine("Our Asset Management System database contains the following key tables:");

            foreach (var table in schema.Tables)
            {
                responseBuilder.AppendLine($"- **{table.TableName}**: {table.Description}");
                if (table.Columns.Any())
                {
                    responseBuilder.AppendLine("  It contains information such as:");
                    foreach (var column in table.Columns.Take(3)) // List first 3 columns
                    {
                        responseBuilder.AppendLine($"    • {column.ColumnName} ({column.DataType})");
                    }
                    if (table.Columns.Count > 3)
                    {
                        responseBuilder.AppendLine($"    ... and {table.Columns.Count - 3} more fields.");
                    }
                }
            }

            responseBuilder.AppendLine(Environment.NewLine + "What specific information are you looking for?");
            
            return new ChatbotResponse
            {
                Response = responseBuilder.ToString(),
                SessionId = sessionId,
                IsSuccessful = true
            };
        }

        private ChatbotResponse HandleHelpRequest(string sessionId)
        {
            var helpText = @"I'm here to help you query the Asset Management System database. Here's what I can do:

**Data Queries:**
- ""Show me all assets""
- ""List users and their assigned assets""
- ""Find laptops that are available""
- ""Show maintenance records for asset TAG123""
- ""Count assets by category""

**Schema Information:**
- ""What tables are in the database?""
- ""Describe the assets table""
- ""Show me the database structure""

**Examples of what you can ask:**
- ""How many assets do we have?""
- ""Who has the most assets assigned?""
- ""What maintenance was done last month?""
- ""Show me all Dell computers""
- ""Find assets purchased after 2023""

Just ask your question in natural language, and I'll generate and execute the appropriate SQL query for you!";

            return new ChatbotResponse
            {
                Response = helpText,
                SessionId = sessionId,
                IsSuccessful = true
            };
        }

        private ChatbotResponse HandleGreeting(string sessionId)
        {
            var greeting = "Hello! I'm your AI assistant for the Asset Management System database. " +
                          "I can help you find information about assets, users, maintenance records, and more. " +
                          "Just ask me a question in plain English, and I'll query the database for you. " +
                          "Type 'help' if you'd like to see examples of what I can do!";

            return new ChatbotResponse
            {
                Response = greeting,
                SessionId = sessionId,
                IsSuccessful = true
            };
        }

        private QueryIntent AnalyzeIntent(string message)
        {
            var lowerMessage = message.ToLower().Trim();
            
            // Greeting patterns
            if (Regex.IsMatch(lowerMessage, @"\b(hi|hello|hey|good morning|good afternoon)\b"))
            {
                return new QueryIntent { Type = IntentType.Greeting };
            }

            // Help patterns
            if (Regex.IsMatch(lowerMessage, @"\b(help|what can you do|commands|examples)\b"))
            {
                return new QueryIntent { Type = IntentType.Help };
            }

            // Schema inquiry patterns
            if (Regex.IsMatch(lowerMessage, @"\b(schema|structure|tables|database|describe|columns)\b"))
            {
                return new QueryIntent { Type = IntentType.SchemaInquiry };
            }

            // Data query patterns - extract entities and operations
            var intent = new QueryIntent { Type = IntentType.DataQuery };
            
            // Extract table/entity references
            if (Regex.IsMatch(lowerMessage, @"\b(asset|assets|equipment)\b"))
                intent.Tables.Add("Assets");
            if (Regex.IsMatch(lowerMessage, @"\b(user|users|person|people|employee)\b"))
                intent.Tables.Add("Users");
            if (Regex.IsMatch(lowerMessage, @"\b(maintenance|repair|service)\b"))
                intent.Tables.Add("MaintenanceRecords");
            if (Regex.IsMatch(lowerMessage, @"\b(history|historical|changes)\b"))
                intent.Tables.Add("AssetHistories");

            // Extract operations
            if (Regex.IsMatch(lowerMessage, @"\b(show|list|display|get|find|search)\b"))
                intent.Operation = "SELECT";
            if (Regex.IsMatch(lowerMessage, @"\b(count|how many|number of)\b"))
                intent.Operation = "COUNT";
            if (Regex.IsMatch(lowerMessage, @"\b(sum|total|add up)\b"))
                intent.Operation = "SUM";
            if (Regex.IsMatch(lowerMessage, @"\b(average|avg|mean)\b"))
                intent.Operation = "AVG";

            // Extract filters and conditions
            ExtractFilters(lowerMessage, intent);

            return intent;
        }

        private void ExtractFilters(string message, QueryIntent intent)
        {
            // Brand filters
            var brandMatch = Regex.Match(message, @"\b(dell|hp|lenovo|apple|microsoft|acer|asus)\b", RegexOptions.IgnoreCase);
            if (brandMatch.Success)
                intent.Filters["Brand"] = brandMatch.Value;

            // Category filters
            var categoryMatch = Regex.Match(message, @"\b(laptop|desktop|monitor|printer|server|phone|tablet)\b", RegexOptions.IgnoreCase);
            if (categoryMatch.Success)
                intent.Filters["Category"] = categoryMatch.Value;

            // Status filters
            var statusMatch = Regex.Match(message, @"\b(available|in use|maintenance|disposed)\b", RegexOptions.IgnoreCase);
            if (statusMatch.Success)
                intent.Filters["Status"] = statusMatch.Value;

            // Asset tag filter
            var tagMatch = Regex.Match(message, @"\b([A-Z]+\d+|\d+[A-Z]+)\b");
            if (tagMatch.Success)
                intent.Filters["AssetTag"] = tagMatch.Value;

            // Date filters
            var dateMatch = Regex.Match(message, @"\b(last month|this month|last year|this year|2023|2024)\b");
            if (dateMatch.Success)
                intent.Filters["DateRange"] = dateMatch.Value;
        }

        private async Task<string> GenerateSqlQueryAsync(string message, QueryIntent intent)
        {
            var sql = "";
            
            try
            {
                if (intent.Operation == "COUNT")
                {
                    sql = GenerateCountQuery(intent);
                }
                else if (intent.Operation == "SUM" || intent.Operation == "AVG")
                {
                    sql = GenerateAggregateQuery(intent);
                }
                else
                {
                    sql = GenerateSelectQuery(intent);
                }

                // Validate the generated SQL
                if (!await _sqlQueryService.ValidateQueryAsync(sql))
                {
                    _logger.LogWarning("Generated invalid SQL: {Sql}", sql);
                    return "";
                }

                return sql;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating SQL query for intent: {Intent}", JsonSerializer.Serialize(intent));
                return "";
            }
        }

        private string GenerateSelectQuery(QueryIntent intent)
        {
            var sql = "SELECT ";
            var joins = new List<string>();
            var whereConditions = new List<string>();

            if (intent.Tables.Contains("Assets") && intent.Tables.Contains("Users"))
            {
                sql += "a.*, u.Username, u.Email ";
                sql += "FROM Assets a LEFT JOIN Users u ON a.AssignedToUserId = u.Id ";
            }
            else if (intent.Tables.Contains("Assets"))
            {
                sql += "* FROM Assets a ";
            }
            else if (intent.Tables.Contains("Users"))
            {
                sql += "* FROM Users u ";
            }
            else if (intent.Tables.Contains("MaintenanceRecords"))
            {
                sql += "mr.*, a.Name as AssetName, a.AssetTag ";
                sql += "FROM MaintenanceRecords mr JOIN Assets a ON mr.AssetId = a.Id ";
            }
            else
            {
                sql += "* FROM Assets a "; // Default to assets
            }

            // Add filters
            AddWhereConditions(intent, whereConditions);

            if (whereConditions.Any())
            {
                sql += "WHERE " + string.Join(" AND ", whereConditions);
            }

            sql += " ORDER BY ";
            if (intent.Tables.Contains("Assets"))
                sql += "a.CreatedAt DESC";
            else if (intent.Tables.Contains("MaintenanceRecords"))
                sql += "mr.ScheduledDate DESC";
            else
                sql += "Id DESC";

            return sql;
        }

        private string GenerateCountQuery(QueryIntent intent)
        {
            var sql = "SELECT COUNT(*) as Count FROM ";
            var whereConditions = new List<string>();

            if (intent.Tables.Contains("Assets"))
            {
                sql += "Assets a ";
            }
            else if (intent.Tables.Contains("Users"))
            {
                sql += "Users u ";
            }
            else
            {
                sql += "Assets a "; // Default
            }

            AddWhereConditions(intent, whereConditions);

            if (whereConditions.Any())
            {
                sql += "WHERE " + string.Join(" AND ", whereConditions);
            }

            return sql;
        }

        private string GenerateAggregateQuery(QueryIntent intent)
        {
            var sql = $"SELECT {intent.Operation}(PurchasePrice) as Result FROM Assets a ";
            var whereConditions = new List<string>();

            AddWhereConditions(intent, whereConditions);

            if (whereConditions.Any())
            {
                sql += "WHERE " + string.Join(" AND ", whereConditions);
            }

            return sql;
        }

        private void AddWhereConditions(QueryIntent intent, List<string> whereConditions)
        {
            foreach (var filter in intent.Filters)
            {
                switch (filter.Key)
                {
                    case "Brand":
                        whereConditions.Add($"a.Brand LIKE '%{filter.Value}%'");
                        break;
                    case "Category":
                        whereConditions.Add($"a.Category LIKE '%{filter.Value}%'");
                        break;
                    case "Status":
                        whereConditions.Add($"a.Status = '{filter.Value}'");
                        break;
                    case "AssetTag":
                        whereConditions.Add($"a.AssetTag = '{filter.Value}'");
                        break;
                    case "DateRange":
                        if (filter.Value.Contains("last month"))
                            whereConditions.Add("a.CreatedAt >= DATEADD(month, -1, GETDATE())");
                        else if (filter.Value.Contains("this year"))
                            whereConditions.Add("YEAR(a.CreatedAt) = YEAR(GETDATE())");
                        break;
                }
            }
        }

        private string GenerateNaturalLanguageResponse(QueryIntent intent, SqlQueryResult queryResult)
        {
            if (queryResult.Data == null || !queryResult.Data.Any())
            {
                return "The query executed successfully but returned no results.";
            }

            var data = queryResult.Data;

            if (intent.Operation == "COUNT")
            {
                var count = data?.FirstOrDefault()?.GetValueOrDefault("Count", 0) ?? 0;
                var entityName = intent.Tables.Any() ? intent.Tables.First() : "records";
                return $"There are {count} {entityName.ToLower()} matching your criteria.";
            }

            if (intent.Operation == "SUM" || intent.Operation == "AVG")
            {
                var result = data?.FirstOrDefault()?.Values.FirstOrDefault();
                var operation = intent.Operation == "SUM" ? "total" : "average";
                var entityName = intent.Tables.Any() ? intent.Tables.First() : "value";
                return $"The {operation} {entityName.ToLower()} is {result:C}.";
            }

            // For SELECT queries, summarize the results
            var responseBuilder = new System.Text.StringBuilder();

            if (queryResult.RowCount == 1)
            {
                var record = data?.First();
                if (record == null) return "The query executed successfully but returned no results.";
                responseBuilder.AppendLine("Here is the record I found:");
                
                // Attempt to make a more human-readable sentence for a single record
                if (intent.Tables.Contains("Assets"))
                {
                    var name = record.GetValueOrDefault("Name", "an asset");
                    var status = record.GetValueOrDefault("Status", "unknown");
                    var location = record.GetValueOrDefault("Location", "unknown");
                    responseBuilder.AppendLine($"It's {name} with status {status} located at {location}.");
                }
                else if (intent.Tables.Contains("Users"))
                {
                    var firstName = record.GetValueOrDefault("FirstName", "a user");
                    var lastName = record.GetValueOrDefault("LastName", "");
                    var email = record.GetValueOrDefault("Email", "");
                    responseBuilder.AppendLine($"It's {firstName} {lastName} with email {email}.");
                }
                else if (intent.Tables.Contains("MaintenanceRecords"))
                {
                    var title = record.GetValueOrDefault("Title", "a maintenance record");
                    var assetName = record.GetValueOrDefault("AssetName", "an asset");
                    var scheduledDate = record.GetValueOrDefault("ScheduledDate", "");
                    responseBuilder.AppendLine($"It's a maintenance record for {assetName} titled '{title}' scheduled on {scheduledDate}.");
                }
                else if (intent.Tables.Contains("AssetHistories"))
                {
                    var action = record.GetValueOrDefault("Action", "an action");
                    var assetName = record.GetValueOrDefault("AssetName", "an asset");
                    var timestamp = record.GetValueOrDefault("Timestamp", "");
                    responseBuilder.AppendLine($"An action '{action}' was performed on {assetName} at {timestamp}.");
                }
                else
                {
                    foreach (var kvp in record)
                    {
                        responseBuilder.AppendLine($"- {kvp.Key}: {kvp.Value}");
                    }
                }
            }
            else
            {
                responseBuilder.AppendLine($"I found {queryResult.RowCount} records. Here's a summary of a few:");
                foreach (var record in data.Take(3))
                {
                    responseBuilder.AppendLine("-");
                    // Attempt to make a more human-readable sentence for multiple records
                    if (intent.Tables.Contains("Assets"))
                    {
                        var name = record.GetValueOrDefault("Name", "an asset");
                        var status = record.GetValueOrDefault("Status", "unknown");
                        responseBuilder.AppendLine($"  {name} (Status: {status})");
                    }
                    else if (intent.Tables.Contains("Users"))
                    {
                        var firstName = record.GetValueOrDefault("FirstName", "a user");
                        var lastName = record.GetValueOrDefault("LastName", "");
                        responseBuilder.AppendLine($"  {firstName} {lastName}");
                    }
                    else if (intent.Tables.Contains("MaintenanceRecords"))
                    {
                        var title = record.GetValueOrDefault("Title", "a maintenance record");
                        var assetName = record.GetValueOrDefault("AssetName", "an asset");
                        responseBuilder.AppendLine($"  Maintenance for {assetName}: '{title}'");
                    }
                    else if (intent.Tables.Contains("AssetHistories"))
                    {
                        var action = record.GetValueOrDefault("Action", "an action");
                        var assetName = record.GetValueOrDefault("AssetName", "an asset");
                        responseBuilder.AppendLine($"  Action '{action}' on {assetName}");
                    }
                    else
                    {
                        foreach (var kvp in record)
                        {
                            responseBuilder.AppendLine($"  {kvp.Key}: {kvp.Value}");
                        }
                    }
                }
                if (queryResult.RowCount > 3)
                {
                    responseBuilder.AppendLine($"... and {queryResult.RowCount - 3} more records. Please ask if you need more details.");
                }
            }

            return responseBuilder.ToString();
        }
    }

    public class QueryIntent
    {
        public IntentType Type { get; set; }
        public List<string> Tables { get; set; } = new();
        public string Operation { get; set; } = "SELECT";
        public Dictionary<string, string> Filters { get; set; } = new();
    }

    public enum IntentType
    {
        DataQuery,
        SchemaInquiry,
        Help,
        Greeting,
        Unknown
    }
}