using Microsoft.EntityFrameworkCore;
using AMS.Api.Data;
using AMS.Api.Models;
using System.Data;
using Microsoft.Data.SqlClient;

namespace AMS.Api.Services
{
    public interface IDatabaseSchemaService
    {
        Task<DatabaseSchema> GetDatabaseSchemaAsync();
        Task<string> GetSchemaDescriptionForAIAsync();
    }

    public class DatabaseSchemaService : IDatabaseSchemaService
    {
        private readonly AMSContext _context;
        private readonly string _connectionString;

        public DatabaseSchemaService(AMSContext context, IConfiguration configuration)
        {
            _context = context;
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? 
                throw new InvalidOperationException("Connection string not found");
        }

        public async Task<DatabaseSchema> GetDatabaseSchemaAsync()
        {
            var schema = new DatabaseSchema();
            
            // Get table information
            var tables = await GetTablesAsync();
            
            foreach (var tableName in tables)
            {
                var tableInfo = new TableInfo
                {
                    TableName = tableName,
                    Description = GetTableDescription(tableName),
                    Columns = await GetColumnsAsync(tableName),
                    Relationships = await GetRelationshipsAsync(tableName)
                };
                schema.Tables.Add(tableInfo);
            }

            return schema;
        }

        public async Task<string> GetSchemaDescriptionForAIAsync()
        {
            var schema = await GetDatabaseSchemaAsync();
            var description = "Database Schema for Asset Management System (AMS):\n\n";

            foreach (var table in schema.Tables)
            {
                description += $"Table: {table.TableName}\n";
                description += $"Description: {table.Description}\n";
                description += "Columns:\n";

                foreach (var column in table.Columns)
                {
                    var keyInfo = "";
                    if (column.IsPrimaryKey) keyInfo += " [PRIMARY KEY]";
                    if (column.IsForeignKey) keyInfo += $" [FOREIGN KEY to {column.ReferencedTable}.{column.ReferencedColumn}]";
                    
                    description += $"  - {column.ColumnName} ({column.DataType}){keyInfo}" +
                                 $"{(column.IsNullable ? " [NULL]" : " [NOT NULL]")}\n";
                    
                    if (!string.IsNullOrEmpty(column.Description))
                        description += $"    Description: {column.Description}\n";
                }

                if (table.Relationships.Any())
                {
                    description += "Relationships:\n";
                    foreach (var rel in table.Relationships)
                    {
                        description += $"  - {rel.RelationshipType} with {rel.RelatedTable} " +
                                     $"({rel.ForeignKey} -> {rel.PrimaryKey})\n";
                    }
                }

                description += "\n";
            }

            description += "\nImportant Notes:\n";
            description += "- Use proper SQL Server syntax\n";
            description += "- Always use appropriate JOINs for related data\n";
            description += "- Be careful with data types and NULL values\n";
            description += "- Use parameterized queries to prevent SQL injection\n";
            description += "- Consider performance implications for large datasets\n";

            return description;
        }

        private async Task<List<string>> GetTablesAsync()
        {
            var tables = new List<string>();
            
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var command = new SqlCommand(@"
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE' 
                AND TABLE_SCHEMA = 'dbo'
                ORDER BY TABLE_NAME", connection);
            
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                tables.Add(reader.GetString("TABLE_NAME"));
            }
            
            return tables;
        }

        private async Task<List<ColumnInfo>> GetColumnsAsync(string tableName)
        {
            var columns = new List<ColumnInfo>();
            
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var command = new SqlCommand(@"
                SELECT 
                    c.COLUMN_NAME,
                    c.DATA_TYPE,
                    c.IS_NULLABLE,
                    c.CHARACTER_MAXIMUM_LENGTH,
                    c.NUMERIC_PRECISION,
                    c.NUMERIC_SCALE,
                    CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as IS_PRIMARY_KEY,
                    CASE WHEN fk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as IS_FOREIGN_KEY,
                    fk.REFERENCED_TABLE_NAME,
                    fk.REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS c
                LEFT JOIN (
                    SELECT ku.TABLE_NAME, ku.COLUMN_NAME
                    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                    INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                        ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                    WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                ) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
                LEFT JOIN (
                    SELECT 
                        ku.TABLE_NAME,
                        ku.COLUMN_NAME,
                        rc.REFERENCED_TABLE_NAME,
                        rc.REFERENCED_COLUMN_NAME
                    FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
                    INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                        ON rc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                ) fk ON c.TABLE_NAME = fk.TABLE_NAME AND c.COLUMN_NAME = fk.COLUMN_NAME
                WHERE c.TABLE_NAME = @tableName
                ORDER BY c.ORDINAL_POSITION", connection);
            
            command.Parameters.AddWithValue("@tableName", tableName);
            
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var dataType = reader.GetString("DATA_TYPE");
                if (!reader.IsDBNull("CHARACTER_MAXIMUM_LENGTH"))
                {
                    dataType += $"({reader.GetInt32("CHARACTER_MAXIMUM_LENGTH")})";
                }
                else if (!reader.IsDBNull("NUMERIC_PRECISION"))
                {
                    var precision = reader.GetByte("NUMERIC_PRECISION");
                    var scale = reader.GetByte("NUMERIC_SCALE");
                    dataType += $"({precision},{scale})";
                }

                var column = new ColumnInfo
                {
                    ColumnName = reader.GetString("COLUMN_NAME"),
                    DataType = dataType,
                    IsNullable = reader.GetString("IS_NULLABLE") == "YES",
                    IsPrimaryKey = reader.GetInt32("IS_PRIMARY_KEY") == 1,
                    IsForeignKey = reader.GetInt32("IS_FOREIGN_KEY") == 1,
                    ReferencedTable = reader.IsDBNull("REFERENCED_TABLE_NAME") ? null : reader.GetString("REFERENCED_TABLE_NAME"),
                    ReferencedColumn = reader.IsDBNull("REFERENCED_COLUMN_NAME") ? null : reader.GetString("REFERENCED_COLUMN_NAME"),
                    Description = GetColumnDescription(tableName, reader.GetString("COLUMN_NAME"))
                };
                
                columns.Add(column);
            }
            
            return columns;
        }

        private async Task<List<RelationshipInfo>> GetRelationshipsAsync(string tableName)
        {
            var relationships = new List<RelationshipInfo>();
            
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            var command = new SqlCommand(@"
                SELECT 
                    rc.CONSTRAINT_NAME,
                    kcu.COLUMN_NAME as FOREIGN_KEY_COLUMN,
                    rc.REFERENCED_TABLE_NAME,
                    rcu.COLUMN_NAME as REFERENCED_COLUMN
                FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
                INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                    ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE rcu
                    ON rc.UNIQUE_CONSTRAINT_NAME = rcu.CONSTRAINT_NAME
                WHERE kcu.TABLE_NAME = @tableName", connection);
            
            command.Parameters.AddWithValue("@tableName", tableName);
            
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var relationship = new RelationshipInfo
                {
                    RelationshipType = "ManyToOne",
                    RelatedTable = reader.GetString("REFERENCED_TABLE_NAME"),
                    ForeignKey = reader.GetString("FOREIGN_KEY_COLUMN"),
                    PrimaryKey = reader.GetString("REFERENCED_COLUMN")
                };
                
                relationships.Add(relationship);
            }
            
            return relationships;
        }

        private string GetTableDescription(string tableName)
        {
            return tableName.ToLower() switch
            {
                "users" => "Manages all user accounts, including their roles (Admin, Manager, User), contact information, and login history.",
                "assets" => "Stores comprehensive details about all physical and digital assets, such as laptops, monitors, and software licenses. It tracks their status (e.g., Available, Assigned, Maintenance), location, and financial information.",
                "assethistories" => "Logs every significant event and change related to an asset, including assignments, unassignments, status changes, and location transfers.",
                "maintenancerecords" => "Keeps track of all maintenance activities performed on assets, including scheduled maintenance, repairs, and service dates.",
                "refreshtokens" => "Used internally for secure user authentication, managing long-lived sessions.",
                _ => $"Information about {tableName} table."
            };
        }

        private string GetColumnDescription(string tableName, string columnName)
        {
            var key = $"{tableName.ToLower()}.{columnName.ToLower()}";
            
            return key switch
            {
                "assets.id" => "Unique identifier for each asset.",
                "assets.name" => "The common name of the asset (e.g., 'Dell Latitude Laptop').",
                "assets.assettag" => "A unique, internal tag used to identify the asset within the system (e.g., 'LAPTOP001').",
                "assets.category" => "The type or classification of the asset (e.g., 'Laptop', 'Monitor', 'Software').",
                "assets.status" => "The current operational status of the asset (e.g., 'Available', 'Assigned', 'Maintenance', 'Retired').",
                "assets.location" => "The physical or logical location where the asset is currently situated.",
                "assets.assignedtouserid" => "The ID of the user to whom the asset is currently assigned.",
                "assets.purchaseprice" => "The original cost of the asset at the time of purchase.",
                "users.id" => "Unique identifier for each user.",
                "users.username" => "The unique username used for logging into the system.",
                "users.email" => "The primary email address of the user.",
                "users.firstname" => "The first name of the user.",
                "users.lastname" => "The last name of the user.",
                "users.role" => "The role of the user within the system (e.g., 'Admin', 'Manager', 'User').",
                "maintenancerecords.id" => "Unique identifier for each maintenance record.",
                "maintenancerecords.assetid" => "The ID of the asset on which maintenance was performed.",
                "maintenancerecords.maintenancetype" => "The type of maintenance performed (e.g., 'Preventive', 'Repair', 'Upgrade').",
                "maintenancerecords.cost" => "The cost associated with the maintenance activity.",
                "assethistories.id" => "Unique identifier for each asset history record.",
                "assethistories.assetid" => "The ID of the asset to which this history record pertains.",
                "assethistories.action" => "The type of action recorded (e.g., 'Assigned', 'Unassigned', 'Status Change').",
                "assethistories.timestamp" => "The date and time when the action occurred.",
                _ => ""
            };
        }
    }
}