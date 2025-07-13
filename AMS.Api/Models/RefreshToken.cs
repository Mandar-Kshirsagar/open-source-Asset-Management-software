using System.ComponentModel.DataAnnotations;

namespace AMS.Api.Models
{
    public class RefreshToken
    {
        public int Id { get; set; }
        
        [Required]
        public string Token { get; set; } = string.Empty;
        
        [Required]
        public DateTime ExpiryDate { get; set; }
        
        public bool IsRevoked { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? RevokedAt { get; set; }
        
        public string? RevokedBy { get; set; }
        
        // Foreign key
        public int UserId { get; set; }
        
        // Navigation property
        public virtual User User { get; set; } = null!;
    }
} 