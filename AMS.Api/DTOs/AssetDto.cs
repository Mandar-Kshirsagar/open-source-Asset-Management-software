using System.ComponentModel.DataAnnotations;
using AMS.Api.Models;

namespace AMS.Api.DTOs
{
    public class AssetDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string AssetTag { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public decimal PurchasePrice { get; set; }
        public DateTime PurchaseDate { get; set; }
        public DateTime? WarrantyExpiryDate { get; set; }
        public AssetStatus Status { get; set; }
        public string Location { get; set; } = string.Empty;
        public string Condition { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUpdatedAt { get; set; }
        public int? AssignedToUserId { get; set; }
        public UserDto? AssignedToUser { get; set; }
    }

    public class CreateAssetDto
    {
        [Required(ErrorMessage = "Asset name is required")]
        [StringLength(100, ErrorMessage = "Asset name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string Description { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Asset tag is required")]
        [StringLength(50, ErrorMessage = "Asset tag cannot exceed 50 characters")]
        [RegularExpression(@"^[A-Z0-9]+$", ErrorMessage = "Asset tag must contain only uppercase letters and numbers")]
        public string AssetTag { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Category is required")]
        [StringLength(100, ErrorMessage = "Category cannot exceed 100 characters")]
        public string Category { get; set; } = string.Empty;
        
        [StringLength(100, ErrorMessage = "Brand cannot exceed 100 characters")]
        public string Brand { get; set; } = string.Empty;
        
        [StringLength(100, ErrorMessage = "Model cannot exceed 100 characters")]
        public string Model { get; set; } = string.Empty;
        
        [StringLength(50, ErrorMessage = "Serial number cannot exceed 50 characters")]
        public string SerialNumber { get; set; } = string.Empty;
        
        [Range(0, double.MaxValue, ErrorMessage = "Purchase price must be a positive number")]
        public decimal PurchasePrice { get; set; }
        
        [Required(ErrorMessage = "Purchase date is required")]
        public DateTime PurchaseDate { get; set; }
        
        public DateTime? WarrantyExpiryDate { get; set; }
        
        [StringLength(100, ErrorMessage = "Location cannot exceed 100 characters")]
        public string Location { get; set; } = string.Empty;
        
        [StringLength(50, ErrorMessage = "Condition cannot exceed 50 characters")]
        public string Condition { get; set; } = "Good";
    }

    public class UpdateAssetDto
    {
        [Required(ErrorMessage = "Asset name is required")]
        [StringLength(100, ErrorMessage = "Asset name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string Description { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Category is required")]
        [StringLength(100, ErrorMessage = "Category cannot exceed 100 characters")]
        public string Category { get; set; } = string.Empty;
        
        [StringLength(100, ErrorMessage = "Brand cannot exceed 100 characters")]
        public string Brand { get; set; } = string.Empty;
        
        [StringLength(100, ErrorMessage = "Model cannot exceed 100 characters")]
        public string Model { get; set; } = string.Empty;
        
        [StringLength(50, ErrorMessage = "Serial number cannot exceed 50 characters")]
        public string SerialNumber { get; set; } = string.Empty;
        
        [Range(0, double.MaxValue, ErrorMessage = "Purchase price must be a positive number")]
        public decimal PurchasePrice { get; set; }
        
        [Required(ErrorMessage = "Purchase date is required")]
        public DateTime PurchaseDate { get; set; }
        
        public DateTime? WarrantyExpiryDate { get; set; }
        
        public AssetStatus Status { get; set; }
        
        [StringLength(100, ErrorMessage = "Location cannot exceed 100 characters")]
        public string Location { get; set; } = string.Empty;
        
        [StringLength(50, ErrorMessage = "Condition cannot exceed 50 characters")]
        public string Condition { get; set; } = string.Empty;
        
        public int? AssignedToUserId { get; set; }
    }

    public class AssetFilterDto
    {
        [StringLength(100, ErrorMessage = "Search term cannot exceed 100 characters")]
        public string? SearchTerm { get; set; }
        
        [StringLength(100, ErrorMessage = "Category cannot exceed 100 characters")]
        public string? Category { get; set; }
        
        [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters")]
        public string? Status { get; set; }
        
        [StringLength(100, ErrorMessage = "Location cannot exceed 100 characters")]
        public string? Location { get; set; }
        
        public int? AssignedToUserId { get; set; }
        
        [Range(1, int.MaxValue, ErrorMessage = "Page must be a positive number")]
        public int Page { get; set; } = 1;
        
        [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
        public int PageSize { get; set; } = 10;
    }

    public class PaginatedResponseDto<T>
    {
        public IEnumerable<T> Data { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
} 