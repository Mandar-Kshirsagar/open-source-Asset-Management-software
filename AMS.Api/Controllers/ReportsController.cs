using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using AMS.Api.Data;
using AMS.Api.DTOs;
using AMS.Api.Models;

namespace AMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly AMSContext _context;

        public ReportsController(AMSContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<object>> GetDashboardStats()
        {
            try
            {
                var totalAssets = await _context.Assets.CountAsync();
                var totalUsers = await _context.Users.CountAsync();
                var assignedAssets = await _context.Assets.CountAsync(a => a.Status == AssetStatus.Assigned);
                var availableAssets = await _context.Assets.CountAsync(a => a.Status == AssetStatus.Available);
                var maintenanceAssets = await _context.Assets.CountAsync(a => a.Status == AssetStatus.Maintenance);
                var retiredAssets = await _context.Assets.CountAsync(a => a.Status == AssetStatus.Retired);

                var totalValue = await _context.Assets.SumAsync(a => a.PurchasePrice);
                var upcomingMaintenance = await _context.MaintenanceRecords
                    .CountAsync(m => m.ScheduledDate <= DateTime.UtcNow.AddDays(30) && 
                                   m.Status != "Completed" && m.Status != "Cancelled");

                var recentActivity = await _context.AssetHistories
                    .Include(h => h.Asset)
                    .Include(h => h.User)
                    .OrderByDescending(h => h.Timestamp)
                    .Take(10)
                    .Select(h => new
                    {
                        h.Id,
                        h.Action,
                        h.Description,
                        h.Timestamp,
                        AssetName = h.Asset.Name,
                        UserName = h.User != null ? $"{h.User.FirstName} {h.User.LastName}" : "System"
                    })
                    .ToListAsync();

                return Ok(new
                {
                    totalAssets,
                    totalUsers,
                    assignedAssets,
                    availableAssets,
                    maintenanceAssets,
                    retiredAssets,
                    totalValue,
                    upcomingMaintenance,
                    recentActivity
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating dashboard stats", error = ex.Message });
            }
        }

        [HttpGet("assets-by-category")]
        public async Task<ActionResult<IEnumerable<object>>> GetAssetsByCategory()
        {
            try
            {
                var assetsByCategory = await _context.Assets
                    .GroupBy(a => a.Category)
                    .Select(g => new
                    {
                        Category = g.Key,
                        Count = g.Count(),
                        TotalValue = g.Sum(a => a.PurchasePrice),
                        AssignedCount = g.Count(a => a.Status == AMS.Api.Models.AssetStatus.Assigned),
                        AvailableCount = g.Count(a => a.Status == AMS.Api.Models.AssetStatus.Available),
                        MaintenanceCount = g.Count(a => a.Status == AMS.Api.Models.AssetStatus.Maintenance)
                    })
                    .OrderByDescending(x => x.Count)
                    .ToListAsync();

                return Ok(assetsByCategory);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating category report", error = ex.Message });
            }
        }

        [HttpGet("assets-by-location")]
        public async Task<ActionResult<IEnumerable<object>>> GetAssetsByLocation()
        {
            try
            {
                var assetsByLocation = await _context.Assets
                    .GroupBy(a => a.Location)
                    .Select(g => new
                    {
                        Location = g.Key,
                        Count = g.Count(),
                        TotalValue = g.Sum(a => a.PurchasePrice),
                        AssignedCount = g.Count(a => a.Status == AMS.Api.Models.AssetStatus.Assigned),
                        AvailableCount = g.Count(a => a.Status == AMS.Api.Models.AssetStatus.Available),
                        MaintenanceCount = g.Count(a => a.Status == AMS.Api.Models.AssetStatus.Maintenance)
                    })
                    .OrderByDescending(x => x.Count)
                    .ToListAsync();

                return Ok(assetsByLocation);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating location report", error = ex.Message });
            }
        }

        [HttpGet("maintenance-summary")]
        public async Task<ActionResult<object>> GetMaintenanceSummary([FromQuery] int days = 30)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddDays(-days);
                var endDate = DateTime.UtcNow.AddDays(days);

                var maintenanceSummary = await _context.MaintenanceRecords
                    .Where(m => m.ScheduledDate >= startDate && m.ScheduledDate <= endDate)
                    .GroupBy(m => m.Type)
                    .Select(g => new
                    {
                        Type = g.Key,
                        TotalScheduled = g.Count(m => m.Status == "Scheduled"),
                        TotalInProgress = g.Count(m => m.Status == "In Progress"),
                        TotalCompleted = g.Count(m => m.Status == "Completed"),
                        TotalCancelled = g.Count(m => m.Status == "Cancelled"),
                        TotalCost = g.Where(m => m.Cost.HasValue).Sum(m => m.Cost!.Value)
                    })
                    .ToListAsync();

                var upcomingMaintenance = await _context.MaintenanceRecords
                    .Include(m => m.Asset)
                    .Include(m => m.AssignedToUser)
                    .Where(m => m.ScheduledDate >= DateTime.UtcNow && 
                               m.ScheduledDate <= DateTime.UtcNow.AddDays(30) &&
                               m.Status != "Completed" && m.Status != "Cancelled")
                    .OrderBy(m => m.ScheduledDate)
                    .Select(m => new
                    {
                        m.Id,
                        m.Title,
                        m.Type,
                        m.ScheduledDate,
                        m.Status,
                        AssetName = m.Asset.Name,
                        AssignedTo = m.AssignedToUser != null ? $"{m.AssignedToUser.FirstName} {m.AssignedToUser.LastName}" : "Unassigned"
                    })
                    .ToListAsync();

                return Ok(new
                {
                    maintenanceSummary,
                    upcomingMaintenance
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating maintenance summary", error = ex.Message });
            }
        }

        [HttpGet("user-assignments")]
        public async Task<ActionResult<IEnumerable<object>>> GetUserAssignments()
        {
            try
            {
                var userAssignments = await _context.Users
                    .Select(u => new
                    {
                        UserId = u.Id,
                        UserName = $"{u.FirstName} {u.LastName}",
                        u.Email,
                        u.Role,
                        AssignedAssetsCount = u.AssignedAssets.Count,
                        AssignedAssetsValue = u.AssignedAssets.Sum(a => a.PurchasePrice),
                        AssignedAssets = u.AssignedAssets.Select(a => new
                        {
                            a.Id,
                            a.Name,
                            a.AssetTag,
                            a.Category,
                            a.Status,
                            a.PurchasePrice
                        }).ToList()
                    })
                    .Where(u => u.AssignedAssetsCount > 0)
                    .OrderByDescending(u => u.AssignedAssetsCount)
                    .ToListAsync();

                return Ok(userAssignments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating user assignments report", error = ex.Message });
            }
        }

        [HttpGet("asset-value-trend")]
        public async Task<ActionResult<IEnumerable<object>>> GetAssetValueTrend([FromQuery] int months = 12)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddMonths(-months);
                
                var monthlyValues = await _context.Assets
                    .Where(a => a.PurchaseDate >= startDate)
                    .GroupBy(a => new { Year = a.PurchaseDate.Year, Month = a.PurchaseDate.Month })
                    .Select(g => new
                    {
                        Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        AssetCount = g.Count(),
                        TotalValue = g.Sum(a => a.PurchasePrice),
                        AverageValue = g.Average(a => a.PurchasePrice)
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Month)
                    .ToListAsync();

                return Ok(monthlyValues);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating asset value trend", error = ex.Message });
            }
        }

        [HttpGet("activity-log")]
        public async Task<ActionResult<IEnumerable<object>>> GetActivityLog([FromQuery] int days = 30, [FromQuery] string? action = null)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddDays(-days);
                
                var query = _context.AssetHistories
                    .Include(h => h.Asset)
                    .Include(h => h.User)
                    .Where(h => h.Timestamp >= startDate);

                if (!string.IsNullOrEmpty(action))
                {
                    query = query.Where(h => h.Action == action);
                }

                var activityLog = await query
                    .OrderByDescending(h => h.Timestamp)
                    .Select(h => new
                    {
                        h.Id,
                        h.Action,
                        h.Description,
                        h.Timestamp,
                        AssetName = h.Asset.Name,
                        AssetTag = h.Asset.AssetTag,
                        UserName = h.User != null ? $"{h.User.FirstName} {h.User.LastName}" : "System",
                        h.PreviousStatus,
                        h.NewStatus,
                        h.PreviousLocation,
                        h.NewLocation
                    })
                    .ToListAsync();

                return Ok(activityLog);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating activity log", error = ex.Message });
            }
        }
    }
} 