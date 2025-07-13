using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace AMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatbotController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public ChatbotController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
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

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var openAiRequest = new
            {
                model = "gpt-3.5-turbo",
                messages = new[]
                {
                    new { role = "system", content = "You are an assistant for the Asset Management System. Answer questions and help users with information from the system." },
                    new { role = "user", content = request.Message }
                },
                max_tokens = 256
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