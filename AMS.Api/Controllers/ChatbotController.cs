using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using AMS.Api.Data;
using AMS.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace AMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatbotController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly AMSContext _context;

        public ChatbotController(IHttpClientFactory httpClientFactory, IConfiguration configuration, AMSContext context)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _context = context;
        }

        public class ChatRequest
        {
            public string Message { get; set; } = string.Empty;
        }

        public class ChatResponse
        {
            public string Response { get; set; } = string.Empty;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ChatRequest request)
        {
            var apiKey = _configuration["OpenAI:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                return StatusCode(500, new { error = "OpenAI API key is not configured." });
            }

            // Dynamic knowledge: parse question and fetch relevant data
            string dataPrompt = string.Empty;
            string lowerMsg = request.Message.ToLower();

            if (lowerMsg.Contains("asset"))
            {
                var assets = await _context.Assets.Include(a => a.AssignedToUser).Take(5).ToListAsync();
                dataPrompt = "Sample assets: " + string.Join("; ", assets.Select(a => $"{a.Name} (Tag: {a.AssetTag}, Status: {a.Status}, Assigned: {(a.AssignedToUser != null ? a.AssignedToUser.FirstName + " " + a.AssignedToUser.LastName : "None")})"));
            }
            else if (lowerMsg.Contains("user"))
            {
                var users = await _context.Users.Take(5).ToListAsync();
                dataPrompt = "Sample users: " + string.Join("; ", users.Select(u => $"{u.FirstName} {u.LastName} (Username: {u.Username}, Role: {u.Role}, Active: {u.IsActive})"));
            }
            else if (lowerMsg.Contains("maintenance"))
            {
                var maint = await _context.MaintenanceRecords.Include(m => m.Asset).OrderByDescending(m => m.ScheduledDate).Take(5).ToListAsync();
                dataPrompt = "Recent maintenance: " + string.Join("; ", maint.Select(m => $"{m.Title} for {m.Asset.Name} on {m.ScheduledDate:yyyy-MM-dd} (Status: {m.Status})"));
            }
            else if (lowerMsg.Contains("history") || lowerMsg.Contains("activity"))
            {
                var history = await _context.AssetHistories.Include(h => h.Asset).Include(h => h.User).OrderByDescending(h => h.Timestamp).Take(5).ToListAsync();
                dataPrompt = "Recent activity: " + string.Join("; ", history.Select(h => $"{h.Action} on {h.Asset.Name} by {(h.User != null ? h.User.FirstName + " " + h.User.LastName : "System")} at {h.Timestamp:yyyy-MM-dd HH:mm}"));
            }
            else
            {
                // Default: provide a summary of the system
                int assetCount = await _context.Assets.CountAsync();
                int userCount = await _context.Users.CountAsync();
                int maintCount = await _context.MaintenanceRecords.CountAsync();
                dataPrompt = $"System summary: {assetCount} assets, {userCount} users, {maintCount} maintenance records.";
            }

            // DEBUG: Return the dataPrompt for troubleshooting
            if (request.Message.Trim().ToLower() == "debug-dataprompt")
            {
                return Ok(new { dataPrompt });
            }

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var openAiRequest = new
            {
                model = "gpt-3.5-turbo",
                messages = new[]
                {
                    new { role = "system", content = "You are a helpful assistant for the Asset Management System. Provide concise, accurate answers based on the provided data. If you're not sure, say 'I don't have that information yet.' Be friendly and professional." },
                    new { role = "user", content = dataPrompt + "\nUser question: " + request.Message }
                },
                max_tokens = 256,
                temperature = 0.7
            };

            var content = new StringContent(JsonSerializer.Serialize(openAiRequest), Encoding.UTF8, "application/json");
            try
            {
                var response = await httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
                var responseString = await response.Content.ReadAsStringAsync();
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, new { error = responseString });
                }
                using var doc = JsonDocument.Parse(responseString);
                var chatContent = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                return Ok(new ChatResponse { Response = chatContent ?? "No response from AI." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}