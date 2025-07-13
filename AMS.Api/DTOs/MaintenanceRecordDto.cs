namespace AMS.Api.DTOs
{
    public class MaintenanceRecordDto
    {
        public int Id { get; set; }
        public int AssetId { get; set; }
        public int? AssignedToUserId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public decimal? Cost { get; set; }
        public string? PerformedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUpdatedAt { get; set; }
        public UserDto? AssignedToUser { get; set; }
    }

    public class CreateMaintenanceRecordDto
    {
        public int AssetId { get; set; }
        public int? AssignedToUserId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateMaintenanceRecordDto
    {
        public int? AssignedToUserId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public decimal? Cost { get; set; }
        public string? PerformedBy { get; set; }
    }
} 