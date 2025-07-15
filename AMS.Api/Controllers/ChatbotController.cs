using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AMS.Api.Models;
using AMS.Api.Services;
using System.Security.Claims;

namespace AMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatbotController : ControllerBase
    {
        private readonly IAIChatbotService _chatbotService;
        private readonly IDatabaseSchemaService _schemaService;
        private readonly ISqlQueryService _sqlQueryService;
        private readonly ILogger<ChatbotController> _logger;

        public ChatbotController(
            IAIChatbotService chatbotService,
            IDatabaseSchemaService schemaService,
            ISqlQueryService sqlQueryService,
            ILogger<ChatbotController> logger)
        {
            _chatbotService = chatbotService;
            _schemaService = schemaService;
            _sqlQueryService = sqlQueryService;
            _logger = logger;
        }

        /// <summary>
        /// Send a message to the AI chatbot
        /// </summary>
        [HttpPost("message")]
        public async Task<ActionResult<ChatbotResponse>> SendMessage([FromBody] ChatbotRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
                var response = await _chatbotService.ProcessMessageAsync(request, userId);

                if (!response.IsSuccessful)
                {
                    return BadRequest(response);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chatbot message from user {UserId}", 
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                
                return StatusCode(500, new ChatbotResponse
                {
                    Response = "I'm experiencing technical difficulties. Please try again later.",
                    IsSuccessful = false,
                    ErrorMessage = "Internal server error",
                    SessionId = request.SessionId ?? Guid.NewGuid().ToString()
                });
            }
        }

        /// <summary>
        /// Get database schema information
        /// </summary>
        [HttpGet("schema")]
        public async Task<ActionResult<DatabaseSchema>> GetDatabaseSchema()
        {
            try
            {
                var schema = await _schemaService.GetDatabaseSchemaAsync();
                return Ok(schema);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving database schema");
                return StatusCode(500, "Error retrieving database schema");
            }
        }

        /// <summary>
        /// Get formatted schema description for AI context
        /// </summary>
        [HttpGet("schema/description")]
        public async Task<ActionResult<string>> GetSchemaDescription()
        {
            try
            {
                var description = await _schemaService.GetSchemaDescriptionForAIAsync();
                return Ok(new { description });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving schema description");
                return StatusCode(500, "Error retrieving schema description");
            }
        }

        /// <summary>
        /// Execute a custom SQL query (for advanced users - with restrictions)
        /// </summary>
        [HttpPost("query")]
        [Authorize(Roles = "Admin,Manager")] // Restrict to authorized roles
        public async Task<ActionResult<SqlQueryResult>> ExecuteCustomQuery([FromBody] CustomQueryRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.SqlQuery))
                {
                    return BadRequest("SQL query is required");
                }

                var result = await _sqlQueryService.ExecuteQueryAsync(request.SqlQuery);
                
                // Log the query execution for audit purposes
                _logger.LogInformation("Custom SQL query executed by user {UserId}: {Query}", 
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value, request.SqlQuery);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing custom query");
                return StatusCode(500, new SqlQueryResult
                {
                    IsSuccessful = false,
                    ErrorMessage = "Error executing query",
                    ExecutedSql = request.SqlQuery
                });
            }
        }

        /// <summary>
        /// Validate a SQL query without executing it
        /// </summary>
        [HttpPost("validate-query")]
        public async Task<ActionResult<QueryValidationResult>> ValidateQuery([FromBody] QueryValidationRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.SqlQuery))
                {
                    return BadRequest("SQL query is required");
                }

                var isValid = await _sqlQueryService.ValidateQueryAsync(request.SqlQuery);
                
                return Ok(new QueryValidationResult
                {
                    IsValid = isValid,
                    Query = request.SqlQuery,
                    Message = isValid ? "Query is valid" : "Query validation failed"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating query");
                return StatusCode(500, new QueryValidationResult
                {
                    IsValid = false,
                    Query = request.SqlQuery,
                    Message = "Error during validation"
                });
            }
        }

        /// <summary>
        /// Get basic database statistics
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<Dictionary<string, object>>> GetDatabaseStats()
        {
            try
            {
                var sqlService = _sqlQueryService as SqlQueryService;
                if (sqlService == null)
                {
                    return StatusCode(500, "Service not available");
                }

                var stats = await sqlService.GetQueryStatisticsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving database statistics");
                return StatusCode(500, "Error retrieving database statistics");
            }
        }

        /// <summary>
        /// Get chatbot capabilities and help information
        /// </summary>
        [HttpGet("help")]
        public ActionResult<ChatbotHelp> GetHelp()
        {
            var help = new ChatbotHelp
            {
                Description = "AI-powered database assistant for the Asset Management System",
                Capabilities = new List<string>
                {
                    "Natural language database queries",
                    "Schema information retrieval",
                    "Data analysis and reporting",
                    "Asset information lookup",
                    "User and assignment queries",
                    "Maintenance record searches",
                    "Statistical analysis"
                },
                ExampleQueries = new List<string>
                {
                    "Show me all laptops",
                    "How many assets do we have?",
                    "List users with their assigned assets",
                    "Find assets that need maintenance",
                    "Show me Dell computers purchased this year",
                    "Count assets by category",
                    "Who has the most assets assigned?",
                    "What maintenance was done last month?"
                },
                SupportedOperations = new List<string>
                {
                    "SELECT queries only (read-only)",
                    "JOIN operations across related tables",
                    "Filtering by various criteria",
                    "Aggregation functions (COUNT, SUM, AVG)",
                    "Date range queries",
                    "Pattern matching searches"
                },
                Limitations = new List<string>
                {
                    "No data modification operations (INSERT, UPDATE, DELETE)",
                    "Limited to AMS database tables only",
                    "Query timeout of 30 seconds",
                    "Results limited to prevent excessive data transfer",
                    "Advanced SQL features may not be supported"
                }
            };

            return Ok(help);
        }

        /// <summary>
        /// Test endpoint to verify chatbot connectivity
        /// </summary>
        [HttpGet("health")]
        [AllowAnonymous]
        public ActionResult<object> HealthCheck()
        {
            return Ok(new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Version = "1.0.0",
                Features = new[] { "NLP Query Processing", "SQL Generation", "Schema Analysis", "Safety Validation" }
            });
        }
    }

    // Additional DTOs for the controller
    public class CustomQueryRequest
    {
        public string SqlQuery { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class QueryValidationRequest
    {
        public string SqlQuery { get; set; } = string.Empty;
    }

    public class QueryValidationResult
    {
        public bool IsValid { get; set; }
        public string Query { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class ChatbotHelp
    {
        public string Description { get; set; } = string.Empty;
        public List<string> Capabilities { get; set; } = new();
        public List<string> ExampleQueries { get; set; } = new();
        public List<string> SupportedOperations { get; set; } = new();
        public List<string> Limitations { get; set; } = new();
    }
}