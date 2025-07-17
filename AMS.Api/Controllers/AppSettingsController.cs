using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AMS.Api.Services;
using AMS.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.IO;
using Microsoft.AspNetCore.Hosting;

namespace AMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // Only Admins can manage app settings
    public class AppSettingsController : ControllerBase
    {
        private readonly AppSettingService _appSettingService;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<AppSettingsController> _logger;

        public AppSettingsController(AppSettingService appSettingService, IWebHostEnvironment env, ILogger<AppSettingsController> logger)
        {
            _appSettingService = appSettingService;
            _env = env;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous] // Allow anyone to read settings like company name/logo
        public async Task<ActionResult<Dictionary<string, string>>> GetAllSettings()
        {
            try
            {
                var settings = await _appSettingService.GetAllSettingsAsync();
                return Ok(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all app settings");
                return StatusCode(500, new ProblemDetails { Status = 500, Title = "Internal Server Error", Detail = ex.Message });
            }
        }

        [HttpPut]
        public async Task<ActionResult> UpdateSettings([FromBody] Dictionary<string, string> settings)
        {
            try
            {
                await _appSettingService.UpdateSettingsAsync(settings);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating app settings");
                return StatusCode(500, new ProblemDetails { Status = 500, Title = "Internal Server Error", Detail = ex.Message });
            }
        }

        [HttpPost("upload-logo")]
        public async Task<ActionResult<string>> UploadLogo(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest("No file uploaded.");
                }

                var uploadsFolder = Path.Combine(_env.WebRootPath, "images");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generate a unique file name to prevent conflicts
                var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                var logoUrl = $"/images/{uniqueFileName}";
                await _appSettingService.UpdateSettingAsync("CompanyLogoUrl", logoUrl);

                return Ok(logoUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading company logo");
                return StatusCode(500, new ProblemDetails { Status = 500, Title = "Internal Server Error", Detail = ex.Message });
            }
        }
    }
}