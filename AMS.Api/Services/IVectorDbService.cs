using System.Collections.Generic;
using System.Threading.Tasks;

namespace AMS.Api.Services
{
    public interface IVectorDbService
    {
        Task CreateCollectionAsync(string collectionName, uint vectorSize);
        Task UpsertPointsAsync(string collectionName, IEnumerable<VectorRecord> records);
        Task<IEnumerable<string>> SearchAsync(string collectionName, IEnumerable<float> vector, uint limit = 5);
    }

    public class VectorRecord
    {
        public required string Id { get; set; }
        public required IEnumerable<float> Vector { get; set; }
        public required Dictionary<string, object> Payload { get; set; }
    }
}
