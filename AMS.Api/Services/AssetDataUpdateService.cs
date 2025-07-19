using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AMS.Api.Services
{
    public class AssetDataUpdateService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AssetDataUpdateService> _logger;

        public AssetDataUpdateService(IServiceProvider serviceProvider, ILogger<AssetDataUpdateService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Asset data update service is running.");
                using (var scope = _serviceProvider.CreateScope())
                {
                    var assetDataService = scope.ServiceProvider.GetRequiredService<IAssetDataService>();
                    try
                    {
                        var documents = await assetDataService.PrepareAssetDocumentsAsync();
                        await assetDataService.GenerateEmbeddingsAndStoreAsync(documents);
                        _logger.LogInformation("Asset data and embeddings updated successfully.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error updating asset data and embeddings.");
                    }
                }
                await Task.Delay(TimeSpan.FromDays(1), stoppingToken); // Update once a day
            }
        }
    }
}
