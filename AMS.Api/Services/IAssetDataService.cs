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
        public string Id { get; set; }
        public string Text { get; set; }
        public Dictionary<string, object> Metadata { get; set; }
    }
}
