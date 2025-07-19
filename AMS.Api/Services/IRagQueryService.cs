using AMS.Api.Models;
using System.Threading.Tasks;

namespace AMS.Api.Services
{
    public interface IRagQueryService
    {
        Task<ChatbotResponse> GetRagResponseAsync(string query, string sessionId);
    }
}
