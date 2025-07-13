using System.ComponentModel.DataAnnotations;

namespace AMS.Api.Models
{
    public class AssetHistory
    {
        public int Id { get; set; }
        
        public int AssetId { get; set; }
        
        public int? UserId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Action { get; set; } = string.Empty; // Assigned, Unassigned, Maintenance, Status Changed, etc.
        
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        [StringLength(100)]
        public string PreviousStatus { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string NewStatus { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string PreviousLocation { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string NewLocation { get; set; } = string.Empty;
        
        // Navigation properties
        public virtual Asset Asset { get; set; } = null!;
        public virtual User? User { get; set; }
    }
} 