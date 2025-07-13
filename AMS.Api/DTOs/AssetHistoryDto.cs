namespace AMS.Api.DTOs
{
    public class AssetHistoryDto
    {
        public int Id { get; set; }
        public int AssetId { get; set; }
        public int? UserId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string PreviousStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public string PreviousLocation { get; set; } = string.Empty;
        public string NewLocation { get; set; } = string.Empty;
        public UserDto? User { get; set; }
    }

    public class CreateAssetHistoryDto
    {
        public int AssetId { get; set; }
        public int? UserId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? PreviousStatus { get; set; }
        public string? NewStatus { get; set; }
        public string? PreviousLocation { get; set; }
        public string? NewLocation { get; set; }
    }
} 