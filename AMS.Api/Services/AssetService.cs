using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using AMS.Api.Data;
using AMS.Api.Models;
using AMS.Api.DTOs;
using AutoMapper;
using AMS.Api.Exceptions;

namespace AMS.Api.Services
{
    public class AssetService
    {
        private readonly AMSContext _context;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;

        public AssetService(AMSContext context, IMapper mapper, IMemoryCache cache)
        {
            _context = context;
            _mapper = mapper;
            _cache = cache;
        }

        public async Task<PaginatedResponseDto<AssetDto>> GetAllAssetsAsync(AssetFilterDto? filter = null)
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
                    if (Enum.TryParse<AssetStatus>(filter.Status, true, out var statusEnum))
                    {
                        query = query.Where(a => a.Status == statusEnum);
                    }
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

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var page = filter?.Page ?? 1;
            var pageSize = filter?.PageSize ?? 10;
            var skip = (page - 1) * pageSize;

            var assets = await query
                .OrderBy(a => a.Name)
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            var assetDtos = _mapper.Map<IEnumerable<AssetDto>>(assets);

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return new PaginatedResponseDto<AssetDto>
            {
                Data = assetDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPreviousPage = page > 1
            };
        }

        public async Task<AssetDto?> GetAssetByIdAsync(int id)
        {
            var asset = await _context.Assets
                .Include(a => a.AssignedToUser)
                .FirstOrDefaultAsync(a => a.Id == id);

            return asset != null ? _mapper.Map<AssetDto>(asset) : throw new NotFoundException(nameof(Asset), id);
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
                Status = AssetStatus.Available,
                CreatedAt = DateTime.UtcNow
            };

            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();

            // Invalidate cache when new asset is created
            _cache.Remove("AssetCategories");
            _cache.Remove("AssetLocations");

            return _mapper.Map<AssetDto>(asset);
        }

        public async Task<AssetDto?> UpdateAssetAsync(int id, UpdateAssetDto updateAssetDto)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
            {
                throw new NotFoundException(nameof(Asset), id);
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

            // Invalidate cache when asset is updated
            _cache.Remove("AssetCategories");
            _cache.Remove("AssetLocations");

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

            // Invalidate cache when asset is deleted
            _cache.Remove("AssetCategories");
            _cache.Remove("AssetLocations");

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

            if (asset.Status != AssetStatus.Available)
            {
                throw new InvalidOperationException("Asset is not available for assignment");
            }

            var previousStatus = asset.Status;
            var previousLocation = asset.Location;

            asset.AssignedToUserId = userId;
            asset.Status = AssetStatus.Assigned;
            asset.LastUpdatedAt = DateTime.UtcNow;

            // Create history record
            var history = new AssetHistory
            {
                AssetId = assetId,
                UserId = userId,
                Action = "Assigned",
                Description = $"Asset assigned to {user.FirstName} {user.LastName}",
                PreviousStatus = previousStatus.ToString(),
                NewStatus = asset.Status.ToString(),
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
            asset.Status = AssetStatus.Available;
            asset.LastUpdatedAt = DateTime.UtcNow;

            // Create history record
            var history = new AssetHistory
            {
                AssetId = assetId,
                UserId = assignedUser,
                Action = "Unassigned",
                Description = "Asset unassigned from user",
                PreviousStatus = previousStatus.ToString(),
                NewStatus = asset.Status.ToString(),
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
            const string cacheKey = "AssetCategories";
            
            if (_cache.TryGetValue(cacheKey, out IEnumerable<string>? cachedCategories))
            {
                return cachedCategories!;
            }

            var categories = await _context.Assets
                .Select(a => a.Category)
                .Distinct()
                .ToListAsync();

            if (!categories.Any())
            {
                categories = new List<string> { "Electronics", "Furniture", "Vehicles", "Machinery", "Other" };
            }

            // Cache for 30 minutes
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromMinutes(30));

            _cache.Set(cacheKey, categories, cacheOptions);

            return categories;
        }

        public async Task<IEnumerable<string>> GetAssetLocationsAsync()
        {
            const string cacheKey = "AssetLocations";
            
            if (_cache.TryGetValue(cacheKey, out IEnumerable<string>? cachedLocations))
            {
                return cachedLocations!;
            }

            var locations = await _context.Assets
                .Select(a => a.Location)
                .Distinct()
                .ToListAsync();

            if (!locations.Any())
            {
                locations = new List<string> { "Main Office", "Warehouse A", "Remote Site", "Branch B", "Storage" };
            }

            // Cache for 30 minutes
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromMinutes(30));

            _cache.Set(cacheKey, locations, cacheOptions);

            return locations;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
        {
            var totalAssets = await _context.Assets.CountAsync();
            var availableAssets = await _context.Assets.CountAsync(a => a.Status == AssetStatus.Available);
            var assignedAssets = await _context.Assets.CountAsync(a => a.Status == AssetStatus.Assigned);
            var maintenanceAssets = await _context.Assets.CountAsync(a => a.Status == AssetStatus.Maintenance);

            var recentAssets = await _context.Assets
                .OrderByDescending(a => a.CreatedAt)
                .Take(6)
                .Select(a => new AssetSummaryDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    AssetTag = a.AssetTag,
                    Category = a.Category,
                    Status = a.Status.ToString(),
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