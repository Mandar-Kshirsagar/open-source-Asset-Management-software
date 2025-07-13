using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AMS.Api.Data;
using AMS.Api.Models;
using AMS.Api.DTOs;

namespace AMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MaintenanceController : ControllerBase
    {
        private readonly AMSContext _context;

        public MaintenanceController(AMSContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaintenanceRecordDto>>> GetMaintenanceRecords(
            [FromQuery] int? assetId, 
            [FromQuery] string? status,
            [FromQuery] string? type)
        {
            var query = _context.MaintenanceRecords
                .Include(m => m.AssignedToUser)
                .AsQueryable();

            if (assetId.HasValue)
                query = query.Where(m => m.AssetId == assetId.Value);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(m => m.Status == status);

            if (!string.IsNullOrEmpty(type))
                query = query.Where(m => m.Type == type);

            var records = await query
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => new MaintenanceRecordDto
                {
                    Id = m.Id,
                    AssetId = m.AssetId,
                    AssignedToUserId = m.AssignedToUserId,
                    Type = m.Type,
                    Title = m.Title,
                    Description = m.Description,
                    ScheduledDate = m.ScheduledDate,
                    CompletedDate = m.CompletedDate,
                    Status = m.Status,
                    Notes = m.Notes,
                    Cost = m.Cost,
                    PerformedBy = m.PerformedBy,
                    CreatedAt = m.CreatedAt,
                    LastUpdatedAt = m.LastUpdatedAt,
                    AssignedToUser = m.AssignedToUser != null ? new UserDto
                    {
                        Id = m.AssignedToUser.Id,
                        FirstName = m.AssignedToUser.FirstName,
                        LastName = m.AssignedToUser.LastName,
                        Email = m.AssignedToUser.Email,
                        Role = m.AssignedToUser.Role
                    } : null
                })
                .ToListAsync();

            return Ok(records);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceRecordDto>> GetMaintenanceRecordById(int id)
        {
            var record = await _context.MaintenanceRecords
                .Include(m => m.AssignedToUser)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (record == null)
                return NotFound();

            var dto = new MaintenanceRecordDto
            {
                Id = record.Id,
                AssetId = record.AssetId,
                AssignedToUserId = record.AssignedToUserId,
                Type = record.Type,
                Title = record.Title,
                Description = record.Description,
                ScheduledDate = record.ScheduledDate,
                CompletedDate = record.CompletedDate,
                Status = record.Status,
                Notes = record.Notes,
                Cost = record.Cost,
                PerformedBy = record.PerformedBy,
                CreatedAt = record.CreatedAt,
                LastUpdatedAt = record.LastUpdatedAt,
                AssignedToUser = record.AssignedToUser != null ? new UserDto
                {
                    Id = record.AssignedToUser.Id,
                    FirstName = record.AssignedToUser.FirstName,
                    LastName = record.AssignedToUser.LastName,
                    Email = record.AssignedToUser.Email,
                    Role = record.AssignedToUser.Role
                } : null
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<MaintenanceRecordDto>> CreateMaintenanceRecord(CreateMaintenanceRecordDto dto)
        {
            var record = new MaintenanceRecord
            {
                AssetId = dto.AssetId,
                AssignedToUserId = dto.AssignedToUserId,
                Type = dto.Type,
                Title = dto.Title,
                Description = dto.Description,
                ScheduledDate = dto.ScheduledDate,
                Status = "Scheduled",
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.MaintenanceRecords.Add(record);
            await _context.SaveChangesAsync();

            var result = new MaintenanceRecordDto
            {
                Id = record.Id,
                AssetId = record.AssetId,
                AssignedToUserId = record.AssignedToUserId,
                Type = record.Type,
                Title = record.Title,
                Description = record.Description,
                ScheduledDate = record.ScheduledDate,
                Status = record.Status,
                Notes = record.Notes,
                CreatedAt = record.CreatedAt
            };

            return CreatedAtAction(nameof(GetMaintenanceRecordById), new { id = record.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<MaintenanceRecordDto>> UpdateMaintenanceRecord(int id, UpdateMaintenanceRecordDto dto)
        {
            var record = await _context.MaintenanceRecords.FindAsync(id);
            if (record == null)
                return NotFound();

            record.AssignedToUserId = dto.AssignedToUserId;
            record.Type = dto.Type;
            record.Title = dto.Title;
            record.Description = dto.Description;
            record.ScheduledDate = dto.ScheduledDate;
            record.CompletedDate = dto.CompletedDate;
            record.Status = dto.Status;
            record.Notes = dto.Notes;
            record.Cost = dto.Cost;
            record.PerformedBy = dto.PerformedBy;
            record.LastUpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var result = new MaintenanceRecordDto
            {
                Id = record.Id,
                AssetId = record.AssetId,
                AssignedToUserId = record.AssignedToUserId,
                Type = record.Type,
                Title = record.Title,
                Description = record.Description,
                ScheduledDate = record.ScheduledDate,
                CompletedDate = record.CompletedDate,
                Status = record.Status,
                Notes = record.Notes,
                Cost = record.Cost,
                PerformedBy = record.PerformedBy,
                CreatedAt = record.CreatedAt,
                LastUpdatedAt = record.LastUpdatedAt
            };

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteMaintenanceRecord(int id)
        {
            var record = await _context.MaintenanceRecords.FindAsync(id);
            if (record == null)
                return NotFound();

            _context.MaintenanceRecords.Remove(record);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("asset/{assetId}")]
        public async Task<ActionResult<IEnumerable<MaintenanceRecordDto>>> GetMaintenanceRecordsByAsset(int assetId)
        {
            var records = await _context.MaintenanceRecords
                .Include(m => m.AssignedToUser)
                .Where(m => m.AssetId == assetId)
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => new MaintenanceRecordDto
                {
                    Id = m.Id,
                    AssetId = m.AssetId,
                    AssignedToUserId = m.AssignedToUserId,
                    Type = m.Type,
                    Title = m.Title,
                    Description = m.Description,
                    ScheduledDate = m.ScheduledDate,
                    CompletedDate = m.CompletedDate,
                    Status = m.Status,
                    Notes = m.Notes,
                    Cost = m.Cost,
                    PerformedBy = m.PerformedBy,
                    CreatedAt = m.CreatedAt,
                    LastUpdatedAt = m.LastUpdatedAt,
                    AssignedToUser = m.AssignedToUser != null ? new UserDto
                    {
                        Id = m.AssignedToUser.Id,
                        FirstName = m.AssignedToUser.FirstName,
                        LastName = m.AssignedToUser.LastName,
                        Email = m.AssignedToUser.Email,
                        Role = m.AssignedToUser.Role
                    } : null
                })
                .ToListAsync();

            return Ok(records);
        }

        [HttpGet("upcoming")]
        public async Task<ActionResult<IEnumerable<MaintenanceRecordDto>>> GetUpcomingMaintenance([FromQuery] int days = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(days);
            
            var records = await _context.MaintenanceRecords
                .Include(m => m.AssignedToUser)
                .Where(m => m.ScheduledDate <= cutoffDate && m.Status != "Completed" && m.Status != "Cancelled")
                .OrderBy(m => m.ScheduledDate)
                .Select(m => new MaintenanceRecordDto
                {
                    Id = m.Id,
                    AssetId = m.AssetId,
                    AssignedToUserId = m.AssignedToUserId,
                    Type = m.Type,
                    Title = m.Title,
                    Description = m.Description,
                    ScheduledDate = m.ScheduledDate,
                    CompletedDate = m.CompletedDate,
                    Status = m.Status,
                    Notes = m.Notes,
                    Cost = m.Cost,
                    PerformedBy = m.PerformedBy,
                    CreatedAt = m.CreatedAt,
                    LastUpdatedAt = m.LastUpdatedAt,
                    AssignedToUser = m.AssignedToUser != null ? new UserDto
                    {
                        Id = m.AssignedToUser.Id,
                        FirstName = m.AssignedToUser.FirstName,
                        LastName = m.AssignedToUser.LastName,
                        Email = m.AssignedToUser.Email,
                        Role = m.AssignedToUser.Role
                    } : null
                })
                .ToListAsync();

            return Ok(records);
        }
    }
} 