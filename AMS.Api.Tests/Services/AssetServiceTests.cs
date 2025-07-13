using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using AMS.Api.Data;
using AMS.Api.Services;
using AMS.Api.Models;
using AMS.Api.DTOs;
using AutoMapper;

namespace AMS.Api.Tests.Services
{
    public class AssetServiceTests
    {
        private readonly DbContextOptions<AMSContext> _options;
        private readonly Mock<IMapper> _mockMapper;
        private readonly IMemoryCache _cache;

        public AssetServiceTests()
        {
            _options = new DbContextOptionsBuilder<AMSContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _mockMapper = new Mock<IMapper>();
            _cache = new MemoryCache(new MemoryCacheOptions());
        }

        [Fact]
        public async Task GetAllAssetsAsync_WithNoFilter_ShouldReturnAllAssets()
        {
            // Arrange
            using var context = new AMSContext(_options);
            var service = new AssetService(context, _mockMapper.Object, _cache);

            // Add test data
            var assets = new List<Asset>
            {
                new Asset { Name = "Test Asset 1", AssetTag = "TAG001", Category = "Test", Status = "Available" },
                new Asset { Name = "Test Asset 2", AssetTag = "TAG002", Category = "Test", Status = "Available" }
            };

            context.Assets.AddRange(assets);
            await context.SaveChangesAsync();

            var assetDtos = assets.Select(a => new AssetDto { Id = a.Id, Name = a.Name, AssetTag = a.AssetTag });
            _mockMapper.Setup(m => m.Map<IEnumerable<AssetDto>>(It.IsAny<IEnumerable<Asset>>()))
                .Returns(assetDtos);

            // Act
            var result = await service.GetAllAssetsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Data.Should().HaveCount(2);
            result.TotalCount.Should().Be(2);
        }

        [Fact]
        public async Task GetAllAssetsAsync_WithSearchFilter_ShouldReturnFilteredAssets()
        {
            // Arrange
            using var context = new AMSContext(_options);
            var service = new AssetService(context, _mockMapper.Object, _cache);

            // Add test data
            var assets = new List<Asset>
            {
                new Asset { Name = "Laptop Dell", AssetTag = "LAP001", Category = "Laptop", Status = "Available" },
                new Asset { Name = "Printer HP", AssetTag = "PRN001", Category = "Printer", Status = "Available" },
                new Asset { Name = "Monitor LG", AssetTag = "MON001", Category = "Monitor", Status = "Available" }
            };

            context.Assets.AddRange(assets);
            await context.SaveChangesAsync();

            var filter = new AssetFilterDto { SearchTerm = "Laptop" };
            var filteredDtos = new List<AssetDto> { new AssetDto { Id = assets[0].Id, Name = "Laptop Dell" } };
            _mockMapper.Setup(m => m.Map<IEnumerable<AssetDto>>(It.IsAny<IEnumerable<Asset>>()))
                .Returns(filteredDtos);

            // Act
            var result = await service.GetAllAssetsAsync(filter);

            // Assert
            result.Should().NotBeNull();
            result.Data.Should().HaveCount(1);
            result.TotalCount.Should().Be(1);
        }

        [Fact]
        public async Task CreateAssetAsync_WithValidData_ShouldCreateAsset()
        {
            // Arrange
            using var context = new AMSContext(_options);
            var service = new AssetService(context, _mockMapper.Object, _cache);

            var createDto = new CreateAssetDto
            {
                Name = "Test Asset",
                AssetTag = "TAG001",
                Category = "Test",
                PurchasePrice = 100.00m,
                PurchaseDate = DateTime.UtcNow
            };

            var asset = new Asset { Id = 1, Name = "Test Asset", AssetTag = "TAG001" };
            var assetDto = new AssetDto { Id = 1, Name = "Test Asset", AssetTag = "TAG001" };

            _mockMapper.Setup(m => m.Map<AssetDto>(It.IsAny<Asset>()))
                .Returns(assetDto);

            // Act
            var result = await service.CreateAssetAsync(createDto);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be("Test Asset");
            result.AssetTag.Should().Be("TAG001");

            // Verify asset was saved to database
            var savedAsset = await context.Assets.FirstOrDefaultAsync(a => a.AssetTag == "TAG001");
            savedAsset.Should().NotBeNull();
        }

        [Fact]
        public async Task CreateAssetAsync_WithDuplicateAssetTag_ShouldThrowException()
        {
            // Arrange
            using var context = new AMSContext(_options);
            var service = new AssetService(context, _mockMapper.Object, _cache);

            // Add existing asset
            var existingAsset = new Asset { Name = "Existing Asset", AssetTag = "TAG001", Category = "Test" };
            context.Assets.Add(existingAsset);
            await context.SaveChangesAsync();

            var createDto = new CreateAssetDto
            {
                Name = "New Asset",
                AssetTag = "TAG001", // Duplicate tag
                Category = "Test",
                PurchasePrice = 100.00m,
                PurchaseDate = DateTime.UtcNow
            };

            // Act & Assert
            await service.Invoking(s => s.CreateAssetAsync(createDto))
                .Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Asset tag already exists");
        }

        [Fact]
        public async Task GetAssetCategoriesAsync_ShouldReturnCachedCategories()
        {
            // Arrange
            using var context = new AMSContext(_options);
            var service = new AssetService(context, _mockMapper.Object, _cache);

            // Add test data
            var assets = new List<Asset>
            {
                new Asset { Name = "Asset 1", AssetTag = "TAG001", Category = "Laptop", Status = "Available" },
                new Asset { Name = "Asset 2", AssetTag = "TAG002", Category = "Printer", Status = "Available" },
                new Asset { Name = "Asset 3", AssetTag = "TAG003", Category = "Laptop", Status = "Available" }
            };

            context.Assets.AddRange(assets);
            await context.SaveChangesAsync();

            // Act
            var result1 = await service.GetAssetCategoriesAsync();
            var result2 = await service.GetAssetCategoriesAsync(); // Should use cache

            // Assert
            result1.Should().HaveCount(2);
            result1.Should().Contain("Laptop");
            result1.Should().Contain("Printer");
            result2.Should().BeEquivalentTo(result1); // Same result from cache
        }
    }
} 