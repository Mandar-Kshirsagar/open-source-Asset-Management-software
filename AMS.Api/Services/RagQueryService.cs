using AMS.Api.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenAI_API;
using OpenAI_API.Chat;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AMS.Api.Services
{
    public class RagQueryService : IRagQueryService
    {
        private readonly IVectorDbService _vectorDbService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RagQueryService> _logger;
        private readonly OpenAIAPI _openAIClient;

        public RagQueryService(
            IVectorDbService vectorDbService,
            IConfiguration configuration,
            ILogger<RagQueryService> logger)
        {
            _vectorDbService = vectorDbService;
            _configuration = configuration;
            _logger = logger;
            _openAIClient = new OpenAIAPI(_configuration["OpenAI:ApiKey"]);
        }

        public async Task<ChatbotResponse> GetRagResponseAsync(string query, string sessionId)
        {
            try
            {
                // 1. Generate embedding for the query
                var queryEmbedding = await _openAIClient.Embeddings.GetEmbeddingsAsync(query, "text-embedding-3-small");

                // 2. Search for relevant documents
                var searchResults = await _vectorDbService.SearchAsync("assets", queryEmbedding);

                // 3. Construct the prompt
                var prompt = $"Based on the following information:\n\n---\n{string.Join("\n", searchResults)}\n---\n\nAnswer the question: {query}";

                // 4. Call the OpenAI API
                var chatRequest = new ChatRequest()
                {
                    Model = "gpt-4-turbo",
                    Messages = new ChatMessage[] {
                        new ChatMessage(ChatMessageRole.System, "You are a helpful AI assistant for an asset management system."),
                        new ChatMessage(ChatMessageRole.User, prompt)
                    },
                    MaxTokens = 150
                };
                var result = await _openAIClient.Chat.CreateChatCompletionAsync(chatRequest);

                var response = result.Choices.FirstOrDefault()?.Message.Content.Trim() ?? "I'm sorry, I couldn't find an answer to your question.";

                return new ChatbotResponse
                {
                    Response = response,
                    SessionId = sessionId,
                    IsSuccessful = true
                };
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error getting RAG response for query: {query}", query);
                return new ChatbotResponse
                {
                    Response = "I'm sorry, I encountered an error while processing your request.",
                    SessionId = sessionId,
                    IsSuccessful = false,
                    ErrorMessage = ex.Message
                };
            }
        }
    }
}
