using Microsoft.Data.SqlClient;
using AMS.Api.Models;
using System.Data;
using System.Text.RegularExpressions;
using System.Text.Json;

namespace AMS.Api.Services
{
    public interface ISqlQueryService
    {
        Task<SqlQueryResult> ExecuteQueryAsync(string sql);
        Task<bool> ValidateQueryAsync(string sql);
    }

    public class SqlQueryService : ISqlQueryService
    {
        private readonly string _connectionString;
        private readonly ILogger<SqlQueryService> _logger;
        private readonly List<string> _allowedTables;
        private readonly List<string> _forbiddenKeywords;

        public SqlQueryService(IConfiguration configuration, ILogger<SqlQueryService> logger)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? 
                throw new InvalidOperationException("Connection string not found");
            _logger = logger;
            
            // Define allowed tables to prevent access to system tables
            _allowedTables = new List<string>
            {
                "Assets", "Users", "AssetHistories", "MaintenanceRecords", "RefreshTokens"
            };

            // Define forbidden keywords to prevent malicious operations
            _forbiddenKeywords = new List<string>
            {
                "DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "CREATE", "EXEC", "EXECUTE",
                "SP_", "XP_", "OPENROWSET", "OPENDATASOURCE", "BULK", "SHUTDOWN", "RESTORE"
            };
        }

        public async Task<SqlQueryResult> ExecuteQueryAsync(string sql)
        {
            try
            {
                // Validate the SQL query before execution
                if (!await ValidateQueryAsync(sql))
                {
                    return new SqlQueryResult
                    {
                        IsSuccessful = false,
                        ErrorMessage = "Query validation failed. The query contains forbidden operations or references unauthorized tables.",
                        ExecutedSql = sql
                    };
                }

                var result = new SqlQueryResult { ExecutedSql = sql };
                var dataTable = new DataTable();

                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                // Set query timeout to prevent long-running queries
                using var command = new SqlCommand(sql, connection)
                {
                    CommandTimeout = 30 // 30 seconds timeout
                };

                using var adapter = new SqlDataAdapter(command);
                
                // Execute the query and fill the DataTable
                await Task.Run(() => adapter.Fill(dataTable));

                // Convert DataTable to a more usable format
                var rows = new List<Dictionary<string, object?>>();
                foreach (DataRow row in dataTable.Rows)
                {
                    var dict = new Dictionary<string, object?>();
                    foreach (DataColumn col in dataTable.Columns)
                    {
                        dict[col.ColumnName] = row[col] == DBNull.Value ? null : (object?)row[col];
                    }
                    rows.Add(dict);
                }

                result.Data = rows;
                result.RowCount = rows.Count;
                result.IsSuccessful = true;

                _logger.LogInformation("Successfully executed SQL query. Rows returned: {RowCount}", result.RowCount);
                return result;
            }
            catch (SqlException sqlEx)
            {
                _logger.LogError(sqlEx, "SQL error executing query: {Sql}", sql);
                return new SqlQueryResult
                {
                    IsSuccessful = false,
                    ErrorMessage = $"Database error: {sqlEx.Message}",
                    ExecutedSql = sql
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "General error executing query: {Sql}", sql);
                return new SqlQueryResult
                {
                    IsSuccessful = false,
                    ErrorMessage = $"An error occurred while executing the query: {ex.Message}",
                    ExecutedSql = sql
                };
            }
        }

        public async Task<bool> ValidateQueryAsync(string sql)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(sql))
                    return false;

                var upperSql = sql.ToUpperInvariant();

                // Check for forbidden keywords
                foreach (var keyword in _forbiddenKeywords)
                {
                    if (upperSql.Contains(keyword))
                    {
                        _logger.LogWarning("Query contains forbidden keyword: {Keyword}", keyword);
                        return false;
                    }
                }

                // Ensure query starts with SELECT (read-only operations)
                if (!upperSql.TrimStart().StartsWith("SELECT"))
                {
                    _logger.LogWarning("Query must start with SELECT. Query: {Sql}", sql);
                    return false;
                }

                // Check that all referenced tables are in the allowed list
                if (!ValidateTableReferences(sql))
                {
                    _logger.LogWarning("Query references unauthorized tables");
                    return false;
                }

                // Additional safety checks
                if (ContainsSuspiciousPatterns(upperSql))
                {
                    _logger.LogWarning("Query contains suspicious patterns");
                    return false;
                }

                // Check for basic SQL injection patterns
                if (ContainsSqlInjectionPatterns(upperSql))
                {
                    _logger.LogWarning("Query contains potential SQL injection patterns");
                    return false;
                }

                // Test query syntax by preparing it (without executing)
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();
                
                using var command = new SqlCommand(sql, connection);
                try
                {
                    await command.PrepareAsync();
                }
                catch (SqlException)
                {
                    _logger.LogWarning("Query failed syntax validation: {Sql}", sql);
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating query: {Sql}", sql);
                return false;
            }
        }

        private bool ValidateTableReferences(string sql)
        {
            // Extract table names from the SQL query
            var tablePattern = @"\b(?:FROM|JOIN)\s+(\w+)";
            var matches = Regex.Matches(sql, tablePattern, RegexOptions.IgnoreCase);

            foreach (Match match in matches)
            {
                var tableName = match.Groups[1].Value;
                if (!_allowedTables.Contains(tableName, StringComparer.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Unauthorized table reference: {TableName}", tableName);
                    return false;
                }
            }

            return true;
        }

        private bool ContainsSuspiciousPatterns(string upperSql)
        {
            var suspiciousPatterns = new[]
            {
                @";\s*--",           // SQL injection comment patterns
                @";\s*/\*",          // SQL injection comment patterns
                @"UNION\s+SELECT",   // Union-based injection
                @"@@VERSION",        // System variable access
                @"@@SERVERNAME",     // System variable access
                @"INFORMATION_SCHEMA\.(?!TABLES|COLUMNS)", // Restricted schema access
                @"SYS\.",            // System table access
                @"MASTER\.",         // Master database access
                @"MSDB\.",           // MSDB database access
                @"TEMPDB\.",         // TempDB database access
                @"--\s*",            // Comment patterns at end
                @"/\*.*\*/",         // Block comments
                @"WAITFOR\s+DELAY",  // Time delays
                @"BENCHMARK\s*\(",   // Benchmark functions
                @"SLEEP\s*\(",       // Sleep functions
            };

            foreach (var pattern in suspiciousPatterns)
            {
                if (Regex.IsMatch(upperSql, pattern, RegexOptions.IgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }

        private bool ContainsSqlInjectionPatterns(string upperSql)
        {
            var injectionPatterns = new[]
            {
                @"'\s*OR\s+'1'\s*=\s*'1",      // Classic OR injection
                @"'\s*OR\s+1\s*=\s*1",         // Numeric OR injection
                @"'\s*UNION\s+SELECT",         // Union injection
                @"'\s*;\s*DROP\s+TABLE",       // Drop table injection
                @"'\s*;\s*DELETE\s+FROM",      // Delete injection
                @"'\s*;\s*INSERT\s+INTO",      // Insert injection
                @"'\s*;\s*UPDATE\s+",          // Update injection
                @"CHAR\s*\(\s*\d+\s*\)",       // CHAR function abuse
                @"ASCII\s*\(\s*",              // ASCII function abuse
                @"SUBSTRING\s*\(\s*",          // Substring function abuse for blind injection
                @"CONVERT\s*\(\s*",            // Convert function abuse
                @"CAST\s*\(\s*",               // Cast function abuse
                @"EXEC\s*\(\s*",               // Dynamic SQL execution
                @"SP_EXECUTESQL",              // Dynamic SQL execution
            };

            foreach (var pattern in injectionPatterns)
            {
                if (Regex.IsMatch(upperSql, pattern, RegexOptions.IgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }

        // Additional method to get safe query statistics
        public async Task<Dictionary<string, object>> GetQueryStatisticsAsync()
        {
            try
            {
                var stats = new Dictionary<string, object>();
                
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                // Get basic table counts for each allowed table
                foreach (var table in _allowedTables)
                {
                    try
                    {
                        var countQuery = $"SELECT COUNT(*) FROM {table}";
                        using var command = new SqlCommand(countQuery, connection);
                        var count = await command.ExecuteScalarAsync();
                        stats[$"{table}Count"] = count ?? 0;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not get count for table: {Table}", table);
                        stats[$"{table}Count"] = "Error";
                    }
                }

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting query statistics");
                return new Dictionary<string, object> { { "Error", ex.Message } };
            }
        }

        // Method to safely format query results for display
        public string FormatQueryResultForDisplay(SqlQueryResult result, int maxRows = 50)
        {
            if (!result.IsSuccessful)
            {
                return $"Query failed: {result.ErrorMessage}";
            }

            if (result.Data == null || result.RowCount == 0)
            {
                return "No results found.";
            }

            try
            {
                var data = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(JsonSerializer.Serialize(result.Data));
                if (data == null || !data.Any())
                {
                    return "No results found.";
                }

                var output = $"Query returned {result.RowCount} rows:\n\n";
                
                // Get column names from first row
                var firstRow = data.First();
                var columns = firstRow.Keys.ToList();
                
                // Create header
                output += string.Join(" | ", columns.Select(c => c.PadRight(15))) + "\n";
                output += string.Join("-|-", columns.Select(c => new string('-', 15))) + "\n";
                
                // Add data rows (limited to maxRows)
                var rowsToShow = Math.Min(data.Count, maxRows);
                for (int i = 0; i < rowsToShow; i++)
                {
                    var row = data[i];
                    var values = columns.Select(col => 
                    {
                        var value = row.GetValueOrDefault(col, "NULL");
                        var stringValue = value?.ToString() ?? "NULL";
                        return stringValue.Length > 15 ? stringValue.Substring(0, 12) + "..." : stringValue;
                    });
                    output += string.Join(" | ", values.Select(v => v.PadRight(15))) + "\n";
                }

                if (data.Count > maxRows)
                {
                    output += $"\n... and {data.Count - maxRows} more rows";
                }

                return output;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error formatting query result for display");
                return $"Error formatting results: {ex.Message}";
            }
        }
    }
}