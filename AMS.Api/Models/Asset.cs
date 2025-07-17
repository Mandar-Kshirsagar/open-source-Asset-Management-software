using System.ComponentModel.DataAnnotations;

namespace AMS.Api.Models
{
    public enum AssetStatus
    {
        Available,
        Assigned,
        Maintenance,
        Retired
    }

    public class Asset
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string AssetTag { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string Category { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string Brand { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string Model { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string SerialNumber { get; set; } = string.Empty;
        
        public decimal PurchasePrice { get; set; }
        
        public DateTime PurchaseDate { get; set; }
        
        public DateTime? WarrantyExpiryDate { get; set; }
        
        public AssetStatus Status { get; set; } = AssetStatus.Available;
        
        public string Location { get; set; } = string.Empty;
        
        public string Condition { get; set; } = "Good"; // Excellent, Good, Fair, Poor
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? LastUpdatedAt { get; set; }
        
        // Foreign keys
        public int? AssignedToUserId { get; set; }
        
        // Navigation properties
        public virtual User? AssignedToUser { get; set; }
        public virtual ICollection<AssetHistory> AssetHistories { get; set; } = new List<AssetHistory>();
        public virtual ICollection<MaintenanceRecord> MaintenanceRecords { get; set; } = new List<MaintenanceRecord>();
    }
} 