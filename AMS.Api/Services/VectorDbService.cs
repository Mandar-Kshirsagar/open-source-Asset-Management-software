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
            var qdrantUrl = configuration["Qdrant:Url"] ?? "localhost";
            // Extract host and port from the URL
            var uri = new Uri(qdrantUrl);
            var host = uri.Host;
            var port = uri.Port;
            _client = new QdrantClient(host, port);
            _logger = logger;
        }

        public async Task CreateCollectionAsync(string collectionName, uint vectorSize)
        {
            try
            {
                // Just try to create the collection; if it already exists, catch and log the exception
                await _client.CreateCollectionAsync(collectionName, new VectorParams { Size = vectorSize, Distance = Distance.Cosine });
                _logger.LogInformation("Collection {collectionName} created or already exists.", collectionName);
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
                        point.Payload[key] = value.ToString(); // Remove Value.For
                    }
                    return point;
                }).ToList();

                await _client.UpsertAsync(collectionName, points); // Use UpsertAsync
                _logger.LogInformation("Upserted {count} points to {collectionName}", points.Count, collectionName);
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
                var searchResult = await _client.SearchAsync(
                    collectionName,
                    vector.ToArray(),
                    limit: (ulong)limit // Fix: cast to ulong
                );

                return searchResult.Select(p => p.Payload["text"].ToString());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching in {collectionName}", collectionName);
                throw;
            }
        }
    }
}
