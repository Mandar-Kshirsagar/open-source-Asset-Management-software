using Microsoft.EntityFrameworkCore;
using AMS.Api.Data;
using AMS.Api.Models;
using AMS.Api.DTOs;
using AutoMapper;

namespace AMS.Api.Services
{
    public class AssetService
    {
        private readonly AMSContext _context;
        private readonly IMapper _mapper;

        public AssetService(AMSContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<AssetDto>> GetAllAssetsAsync(AssetFilterDto? filter = null)
        {
            var query = _context.Assets
                .Include(a => a.AssignedToUser)
                .AsQueryable();

            if (filter != null)
            {
                if (!string.IsNullOrEmpty(filter.SearchTerm))
                {
                    query = query.Where(a => 
                        a.Name.Contains(filter.SearchTerm) || 
                        a.AssetTag.Contains(filter.SearchTerm) || 
                        a.SerialNumber.Contains(filter.SearchTerm) ||
                        a.Description.Contains(filter.SearchTerm));
                }

                if (!string.IsNullOrEmpty(filter.Category))
                {
                    query = query.Where(a => a.Category == filter.Category);
                }

                if (!string.IsNullOrEmpty(filter.Status))
                {
                    query = query.Where(a => a.Status == filter.Status);
                }

                if (!string.IsNullOrEmpty(filter.Location))
                {
                    query = query.Where(a => a.Location.Contains(filter.Location));
                }

                if (filter.AssignedToUserId.HasValue)
                {
                    query = query.Where(a => a.AssignedToUserId == filter.AssignedToUserId);
                }
            }

            var assets = await query
                .Skip((filter?.Page - 1 ?? 0) * (filter?.PageSize ?? 10))
                .Take(filter?.PageSize ?? 10)
                .ToListAsync();

            return _mapper.Map<IEnumerable<AssetDto>>(assets);
        }

        public async Task<AssetDto?> GetAssetByIdAsync(int id)
        {
            var asset = await _context.Assets
                .Include(a => a.AssignedToUser)
                .FirstOrDefaultAsync(a => a.Id == id);

            return asset != null ? _mapper.Map<AssetDto>(asset) : null;
        }

        public async Task<AssetDto> CreateAssetAsync(CreateAssetDto createAssetDto)
        {
            // Check if asset tag already exists
            if (await _context.Assets.AnyAsync(a => a.AssetTag == createAssetDto.AssetTag))
            {
                throw new InvalidOperationException("Asset tag already exists");
            }

            var asset = new Asset
            {
                Name = createAssetDto.Name,
                Description = createAssetDto.Description,
                AssetTag = createAssetDto.AssetTag,
                Category = createAssetDto.Category,
                Brand = createAssetDto.Brand,
                Model = createAssetDto.Model,
                SerialNumber = createAssetDto.SerialNumber,
                PurchasePrice = createAssetDto.PurchasePrice,
                PurchaseDate = createAssetDto.PurchaseDate,
                WarrantyExpiryDate = createAssetDto.WarrantyExpiryDate,
                Location = createAssetDto.Location,
                Condition = createAssetDto.Condition,
                Status = "Available",
                CreatedAt = DateTime.UtcNow
            };

            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();

            return _mapper.Map<AssetDto>(asset);
        }

        public async Task<AssetDto?> UpdateAssetAsync(int id, UpdateAssetDto updateAssetDto)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
            {
                return null;
            }

            asset.Name = updateAssetDto.Name;
            asset.Description = updateAssetDto.Description;
            asset.Category = updateAssetDto.Category;
            asset.Brand = updateAssetDto.Brand;
            asset.Model = updateAssetDto.Model;
            asset.SerialNumber = updateAssetDto.SerialNumber;
            asset.PurchasePrice = updateAssetDto.PurchasePrice;
            asset.PurchaseDate = updateAssetDto.PurchaseDate;
            asset.WarrantyExpiryDate = updateAssetDto.WarrantyExpiryDate;
            asset.Status = updateAssetDto.Status;
            asset.Location = updateAssetDto.Location;
            asset.Condition = updateAssetDto.Condition;
            asset.AssignedToUserId = updateAssetDto.AssignedToUserId;
            asset.LastUpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(asset).Reference(a => a.AssignedToUser).LoadAsync();

            return _mapper.Map<AssetDto>(asset);
        }

        public async Task<bool> DeleteAssetAsync(int id)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
            {
                return false;
            }

            _context.Assets.Remove(asset);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> AssignAssetAsync(int assetId, int userId)
        {
            var asset = await _context.Assets.FindAsync(assetId);
            var user = await _context.Users.FindAsync(userId);

            if (asset == null || user == null)
            {
                return false;
            }

            if (asset.Status != "Available")
            {
                throw new InvalidOperationException("Asset is not available for assignment");
            }

            var previousStatus = asset.Status;
            var previousLocation = asset.Location;

            asset.AssignedToUserId = userId;
            asset.Status = "Assigned";
            asset.LastUpdatedAt = DateTime.UtcNow;

            // Create history record
            var history = new AssetHistory
            {
                AssetId = assetId,
                UserId = userId,
                Action = "Assigned",
                Description = $"Asset assigned to {user.FirstName} {user.LastName}",
                PreviousStatus = previousStatus,
                NewStatus = asset.Status,
                PreviousLocation = previousLocation,
                NewLocation = asset.Location,
                Timestamp = DateTime.UtcNow
            };

            _context.AssetHistories.Add(history);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UnassignAssetAsync(int assetId)
        {
            var asset = await _context.Assets.FindAsync(assetId);
            if (asset == null)
            {
                return false;
            }

            var previousStatus = asset.Status;
            var previousLocation = asset.Location;
            var assignedUser = asset.AssignedToUserId;

            asset.AssignedToUserId = null;
            asset.Status = "Available";
            asset.LastUpdatedAt = DateTime.UtcNow;

            // Create history record
            var history = new AssetHistory
            {
                AssetId = assetId,
                UserId = assignedUser,
                Action = "Unassigned",
                Description = "Asset unassigned from user",
                PreviousStatus = previousStatus,
                NewStatus = asset.Status,
                PreviousLocation = previousLocation,
                NewLocation = asset.Location,
                Timestamp = DateTime.UtcNow
            };

            _context.AssetHistories.Add(history);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<string>> GetAssetCategoriesAsync()
        {
            return await _context.Assets
                .Select(a => a.Category)
                .Distinct()
                .ToListAsync();
        }

        public async Task<IEnumerable<string>> GetAssetLocationsAsync()
        {
            return await _context.Assets
                .Select(a => a.Location)
                .Distinct()
                .ToListAsync();
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
        {
            var totalAssets = await _context.Assets.CountAsync();
            var availableAssets = await _context.Assets.CountAsync(a => a.Status == "Available");
            var assignedAssets = await _context.Assets.CountAsync(a => a.Status == "Assigned");
            var maintenanceAssets = await _context.Assets.CountAsync(a => a.Status == "Maintenance");

            var recentAssets = await _context.Assets
                .OrderByDescending(a => a.CreatedAt)
                .Take(6)
                .Select(a => new AssetSummaryDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    AssetTag = a.AssetTag,
                    Category = a.Category,
                    Status = a.Status,
                    Location = a.Location
                })
                .ToListAsync();

            return new DashboardStatsDto
            {
                TotalAssets = totalAssets,
                AvailableAssets = availableAssets,
                AssignedAssets = assignedAssets,
                MaintenanceAssets = maintenanceAssets,
                RecentAssets = recentAssets
            };
        }
    }
} 