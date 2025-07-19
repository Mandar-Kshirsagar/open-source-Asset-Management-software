using Qdrant.Client;
using Qdrant.Client.Grpc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AMS.Api.Services
{
    public class VectorDbService : IVectorDbService
    {
        private readonly QdrantClient _client;
        private readonly ILogger<VectorDbService> _logger;

        public VectorDbService(IConfiguration configuration, ILogger<VectorDbService> logger)
        {
            var qdrantUrl = configuration["Qdrant:Url"];
            _client = new QdrantClient(qdrantUrl);
            _logger = logger;
        }

        public async Task CreateCollectionAsync(string collectionName, uint vectorSize)
        {
            try
            {
                var collectionsResponse = await _client.GetCollectionsAsync();
                if (collectionsResponse.Collections.All(c => c.Name != collectionName))
                {
                    await _client.CreateCollectionAsync(collectionName, new VectorParams { Size = vectorSize, Distance = Distance.Cosine });
                    _logger.LogInformation("Collection {collectionName} created.", collectionName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating collection {collectionName}", collectionName);
                throw;
            }
        }

        public async Task UpsertPointsAsync(string collectionName, IEnumerable<VectorRecord> records)
        {
            try
            {
                var points = records.Select(r =>
                {
                    var point = new PointStruct
                    {
                        Id = new PointId { Uuid = r.Id },
                        Vectors = r.Vector.ToArray(),
                    };
                    foreach (var (key, value) in r.Payload)
                    {
                        point.Payload[key] = Value.For(value.ToString());
                    }
                    return point;
                });

                await _client.UpsertPointsAsync(collectionName, points);
                _logger.LogInformation("Upserted {count} points to {collectionName}", points.Count(), collectionName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upserting points to {collectionName}", collectionName);
                throw;
            }
        }

        public async Task<IEnumerable<string>> SearchAsync(string collectionName, IEnumerable<float> vector, uint limit = 5)
        {
            try
            {
                var searchResult = await _client.SearchPointsAsync(
                    collectionName: collectionName,
                    vector: vector.ToArray(),
                    limit: limit
                );

                return searchResult.Select(p => p.Payload["text"].StringValue);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching in {collectionName}", collectionName);
                throw;
            }
        }
    }
}
