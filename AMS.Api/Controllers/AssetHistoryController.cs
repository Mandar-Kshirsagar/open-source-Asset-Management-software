using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AMS.Api.Data;
using AMS.Api.Models;
using AMS.Api.DTOs;

namespace AMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssetHistoryController : ControllerBase
    {
        private readonly AMSContext _context;

        public AssetHistoryController(AMSContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AssetHistoryDto>>> GetAssetHistory([FromQuery] int? assetId, [FromQuery] int? userId)
        {
            var query = _context.AssetHistories
                .Include(h => h.User)
                .AsQueryable();

            if (assetId.HasValue)
                query = query.Where(h => h.AssetId == assetId.Value);

            if (userId.HasValue)
                query = query.Where(h => h.UserId == userId.Value);

            var history = await query
                .OrderByDescending(h => h.Timestamp)
                .Select(h => new AssetHistoryDto
                {
                    Id = h.Id,
                    AssetId = h.AssetId,
                    UserId = h.UserId,
                    Action = h.Action,
                    Description = h.Description,
                    Timestamp = h.Timestamp,
                    PreviousStatus = h.PreviousStatus,
                    NewStatus = h.NewStatus,
                    PreviousLocation = h.PreviousLocation,
                    NewLocation = h.NewLocation,
                    User = h.User != null ? new UserDto
                    {
                        Id = h.User.Id,
                        FirstName = h.User.FirstName,
                        LastName = h.User.LastName,
                        Email = h.User.Email,
                        Role = h.User.Role
                    } : null
                })
                .ToListAsync();

            return Ok(history);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AssetHistoryDto>> GetAssetHistoryById(int id)
        {
            var history = await _context.AssetHistories
                .Include(h => h.User)
                .FirstOrDefaultAsync(h => h.Id == id);

            if (history == null)
                return NotFound();

            var dto = new AssetHistoryDto
            {
                Id = history.Id,
                AssetId = history.AssetId,
                UserId = history.UserId,
                Action = history.Action,
                Description = history.Description,
                Timestamp = history.Timestamp,
                PreviousStatus = history.PreviousStatus,
                NewStatus = history.NewStatus,
                PreviousLocation = history.PreviousLocation,
                NewLocation = history.NewLocation,
                User = history.User != null ? new UserDto
                {
                    Id = history.User.Id,
                    FirstName = history.User.FirstName,
                    LastName = history.User.LastName,
                    Email = history.User.Email,
                    Role = history.User.Role
                } : null
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<AssetHistoryDto>> CreateAssetHistory(CreateAssetHistoryDto dto)
        {
            var history = new AssetHistory
            {
                AssetId = dto.AssetId,
                UserId = dto.UserId,
                Action = dto.Action,
                Description = dto.Description,
                Timestamp = DateTime.UtcNow,
                PreviousStatus = dto.PreviousStatus ?? string.Empty,
                NewStatus = dto.NewStatus ?? string.Empty,
                PreviousLocation = dto.PreviousLocation ?? string.Empty,
                NewLocation = dto.NewLocation ?? string.Empty
            };

            _context.AssetHistories.Add(history);
            await _context.SaveChangesAsync();

            var result = new AssetHistoryDto
            {
                Id = history.Id,
                AssetId = history.AssetId,
                UserId = history.UserId,
                Action = history.Action,
                Description = history.Description,
                Timestamp = history.Timestamp,
                PreviousStatus = history.PreviousStatus,
                NewStatus = history.NewStatus,
                PreviousLocation = history.PreviousLocation,
                NewLocation = history.NewLocation
            };

            return CreatedAtAction(nameof(GetAssetHistoryById), new { id = history.Id }, result);
        }

        [HttpGet("asset/{assetId}")]
        public async Task<ActionResult<IEnumerable<AssetHistoryDto>>> GetAssetHistoryByAsset(int assetId)
        {
            var history = await _context.AssetHistories
                .Include(h => h.User)
                .Where(h => h.AssetId == assetId)
                .OrderByDescending(h => h.Timestamp)
                .Select(h => new AssetHistoryDto
                {
                    Id = h.Id,
                    AssetId = h.AssetId,
                    UserId = h.UserId,
                    Action = h.Action,
                    Description = h.Description,
                    Timestamp = h.Timestamp,
                    PreviousStatus = h.PreviousStatus,
                    NewStatus = h.NewStatus,
                    PreviousLocation = h.PreviousLocation,
                    NewLocation = h.NewLocation,
                    User = h.User != null ? new UserDto
                    {
                        Id = h.User.Id,
                        FirstName = h.User.FirstName,
                        LastName = h.User.LastName,
                        Email = h.User.Email,
                        Role = h.User.Role
                    } : null
                })
                .ToListAsync();

            return Ok(history);
        }
    }
} 