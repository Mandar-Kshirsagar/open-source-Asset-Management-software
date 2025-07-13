using System.ComponentModel.DataAnnotations;

namespace AMS.Api.Models
{
    public class MaintenanceRecord
    {
        public int Id { get; set; }
        
        public int AssetId { get; set; }
        
        public int? AssignedToUserId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Type { get; set; } = string.Empty; // Preventive, Corrective, Emergency
        
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        public DateTime ScheduledDate { get; set; }
        
        public DateTime? CompletedDate { get; set; }
        
        public string Status { get; set; } = "Scheduled"; // Scheduled, In Progress, Completed, Cancelled
        
        [StringLength(500)]
        public string? Notes { get; set; }
        
        public decimal? Cost { get; set; }
        
        [StringLength(100)]
        public string? PerformedBy { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? LastUpdatedAt { get; set; }
        
        // Navigation properties
        public virtual Asset Asset { get; set; } = null!;
        public virtual User? AssignedToUser { get; set; }
    }
} 