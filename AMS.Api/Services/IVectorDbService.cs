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
        public string Id { get; set; }
        public IEnumerable<float> Vector { get; set; }
        public Dictionary<string, object> Payload { get; set; }
    }
}
