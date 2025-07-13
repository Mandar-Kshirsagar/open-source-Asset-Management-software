namespace AMS.Api.DTOs
{
    public class DashboardStatsDto
    {
        public int TotalAssets { get; set; }
        public int AvailableAssets { get; set; }
        public int AssignedAssets { get; set; }
        public int MaintenanceAssets { get; set; }
        public List<AssetSummaryDto> RecentAssets { get; set; } = new();
    }

    public class AssetSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string AssetTag { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
    }
} 