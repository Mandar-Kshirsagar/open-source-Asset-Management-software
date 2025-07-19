using AMS.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AMS.Api.Services
{
    public class AssetDataService : IAssetDataService
    {
        private readonly AMSContext _context;
        private readonly IVectorDbService _vectorDbService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AssetDataService> _logger;

        public AssetDataService(
            AMSContext context,
            IVectorDbService vectorDbService,
            IConfiguration configuration,
            ILogger<AssetDataService> logger)
        {
            _context = context;
            _vectorDbService = vectorDbService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<IEnumerable<AssetDocument>> PrepareAssetDocumentsAsync()
        {
            var assets = await _context.Assets
                .Include(a => a.AssignedToUser)
                .Include(a => a.MaintenanceRecords)
                .ToListAsync();

            var documents = assets.Select(asset =>
            {
                var assignedTo = asset.AssignedToUser != null ? $"assigned to {asset.AssignedToUser.FirstName} {asset.AssignedToUser.LastName}" : "is available";
                var maintenanceStatus = asset.MaintenanceRecords.Any() ? $"has {asset.MaintenanceRecords.Count} maintenance records" : "has no maintenance records";
                var text = $"{asset.Name} ({asset.Category}), {assignedTo} in {asset.Location}. It was purchased on {asset.PurchaseDate:MMM yyyy} and {maintenanceStatus}.";

                return new AssetDocument
                {
                    Id = asset.Id.ToString(),
                    Text = text,
                    Metadata = new Dictionary<string, object>
                    {
                        { "assetId", asset.Id },
                        { "category", asset.Category },
                        { "status", asset.Status.ToString() },
                        { "location", asset.Location }
                    }
                };
            });

            return documents;
        }

        public async Task GenerateEmbeddingsAndStoreAsync(IEnumerable<AssetDocument> documents)
        {
            var apiKey = _configuration["OpenAI:ApiKey"];
            var openAIClient = new OpenAI_API.OpenAIAPI(apiKey);
            const string collectionName = "assets";
            const int vectorSize = 1536; // text-embedding-3-small

            await _vectorDbService.CreateCollectionAsync(collectionName, vectorSize);

            var vectorRecords = new List<VectorRecord>();
            foreach (var doc in documents)
            {
                try
                {
                    var embedding = await openAIClient.Embeddings.GetEmbeddingsAsync(doc.Text); // Remove model argument
                    vectorRecords.Add(new VectorRecord
                    {
                        Id = doc.Id,
                        Vector = embedding,
                        Payload = new Dictionary<string, object> { { "text", doc.Text } }
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error generating embedding for document {documentId}", doc.Id);
                }
            }

            await _vectorDbService.UpsertPointsAsync(collectionName, vectorRecords);
        }
    }
}
