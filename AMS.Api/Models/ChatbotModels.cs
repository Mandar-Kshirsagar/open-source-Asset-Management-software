using System.ComponentModel.DataAnnotations;

namespace AMS.Api.Models
{
    public class ChatbotRequest
    {
        [Required]
        public string Message { get; set; } = string.Empty;
        public string? SessionId { get; set; }
    }

    public class ChatbotResponse
    {
        public string Response { get; set; } = string.Empty;
        public string? GeneratedSql { get; set; }
        public object? QueryResult { get; set; }
        public bool IsSuccessful { get; set; } = true;
        public string? ErrorMessage { get; set; }
        public string SessionId { get; set; } = string.Empty;
    }

    public class DatabaseSchema
    {
        public List<TableInfo> Tables { get; set; } = new();
    }

    public class TableInfo
    {
        public string TableName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<ColumnInfo> Columns { get; set; } = new();
        public List<RelationshipInfo> Relationships { get; set; } = new();
    }

    public class ColumnInfo
    {
        public string ColumnName { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
        public bool IsNullable { get; set; }
        public bool IsPrimaryKey { get; set; }
        public bool IsForeignKey { get; set; }
        public string? ReferencedTable { get; set; }
        public string? ReferencedColumn { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class RelationshipInfo
    {
        public string RelationshipType { get; set; } = string.Empty; // OneToMany, ManyToOne, etc.
        public string RelatedTable { get; set; } = string.Empty;
        public string ForeignKey { get; set; } = string.Empty;
        public string PrimaryKey { get; set; } = string.Empty;
    }

    public class SqlQueryResult
    {
        public bool IsSuccessful { get; set; } = true;
        public string? ErrorMessage { get; set; }
        public List<Dictionary<string, object?>>? Data { get; set; }
        public int RowCount { get; set; }
        public string ExecutedSql { get; set; } = string.Empty;
    }
}