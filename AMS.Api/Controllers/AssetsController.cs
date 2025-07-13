using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AMS.Api.Services;
using AMS.Api.DTOs;

namespace AMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AssetsController : ControllerBase
    {
        private readonly AssetService _assetService;

        public AssetsController(AssetService assetService)
        {
            _assetService = assetService;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponseDto<AssetDto>>> GetAllAssets([FromQuery] AssetFilterDto? filter)
        {
            try
            {
                var assets = await _assetService.GetAllAssetsAsync(filter);
                return Ok(assets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving assets", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AssetDto>> GetAsset(int id)
        {
            try
            {
                var asset = await _assetService.GetAssetByIdAsync(id);
                if (asset == null)
                {
                    return NotFound(new { message = "Asset not found" });
                }

                return Ok(asset);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the asset", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<AssetDto>> CreateAsset([FromBody] CreateAssetDto createAssetDto)
        {
            try
            {
                var asset = await _assetService.CreateAssetAsync(createAssetDto);
                return CreatedAtAction(nameof(GetAsset), new { id = asset.Id }, asset);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the asset", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<AssetDto>> UpdateAsset(int id, [FromBody] UpdateAssetDto updateAssetDto)
        {
            try
            {
                var asset = await _assetService.UpdateAssetAsync(id, updateAssetDto);
                if (asset == null)
                {
                    return NotFound(new { message = "Asset not found" });
                }

                return Ok(asset);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the asset", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteAsset(int id)
        {
            try
            {
                var result = await _assetService.DeleteAssetAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Asset not found" });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the asset", error = ex.Message });
            }
        }

        [HttpPost("{id}/assign")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult> AssignAsset(int id, [FromBody] int userId)
        {
            try
            {
                var result = await _assetService.AssignAssetAsync(id, userId);
                if (!result)
                {
                    return NotFound(new { message = "Asset or user not found" });
                }

                return Ok(new { message = "Asset assigned successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while assigning the asset", error = ex.Message });
            }
        }

        [HttpPost("{id}/unassign")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult> UnassignAsset(int id)
        {
            try
            {
                var result = await _assetService.UnassignAssetAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Asset not found" });
                }

                return Ok(new { message = "Asset unassigned successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while unassigning the asset", error = ex.Message });
            }
        }

        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetAssetCategories()
        {
            try
            {
                var categories = await _assetService.GetAssetCategoriesAsync();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving categories", error = ex.Message });
            }
        }

        [HttpGet("locations")]
        public async Task<ActionResult<IEnumerable<string>>> GetAssetLocations()
        {
            try
            {
                var locations = await _assetService.GetAssetLocationsAsync();
                return Ok(locations);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving locations", error = ex.Message });
            }
        }

        [HttpGet("dashboard-stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
        {
            try
            {
                var stats = await _assetService.GetDashboardStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving dashboard stats", error = ex.Message });
            }
        }
    }
} 