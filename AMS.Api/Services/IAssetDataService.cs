using System.Collections.Generic;
using System.Threading.Tasks;

namespace AMS.Api.Services
{
    public interface IAssetDataService
    {
        Task<IEnumerable<AssetDocument>> PrepareAssetDocumentsAsync();
        Task GenerateEmbeddingsAndStoreAsync(IEnumerable<AssetDocument> documents);
    }

    public class AssetDocument
    {
        public required string Id { get; set; }
        public required string Text { get; set; }
        public required Dictionary<string, object> Metadata { get; set; }
    }
}
