using Microsoft.EntityFrameworkCore;
using AMS.Api.Models;

namespace AMS.Api.Data
{
    public class AMSContext : DbContext
    {
        public AMSContext(DbContextOptions<AMSContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Asset> Assets { get; set; }
        public DbSet<AssetHistory> AssetHistories { get; set; }
        public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<AppSetting> AppSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Asset configuration
            modelBuilder.Entity<Asset>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.AssetTag).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Category).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PurchasePrice).HasPrecision(18, 2);
                entity.HasIndex(e => e.AssetTag).IsUnique();
                entity.HasIndex(e => e.SerialNumber);

                entity.Property(e => e.Status)
                    .HasConversion<string>()
                    .HasMaxLength(50);
                
                entity.HasOne(e => e.AssignedToUser)
                    .WithMany(e => e.AssignedAssets)
                    .HasForeignKey(e => e.AssignedToUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // AssetHistory configuration
            modelBuilder.Entity<AssetHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Timestamp).IsRequired();
                
                entity.HasOne(e => e.Asset)
                    .WithMany(e => e.AssetHistories)
                    .HasForeignKey(e => e.AssetId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.User)
                    .WithMany(e => e.AssetHistories)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // MaintenanceRecord configuration
            modelBuilder.Entity<MaintenanceRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Cost).HasPrecision(18, 2);
                
                entity.HasOne(e => e.Asset)
                    .WithMany(e => e.MaintenanceRecords)
                    .HasForeignKey(e => e.AssetId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.AssignedToUser)
                    .WithMany()
                    .HasForeignKey(e => e.AssignedToUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // RefreshToken configuration
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
                entity.Property(e => e.ExpiryDate).IsRequired();
                entity.HasIndex(e => e.Token).IsUnique();
                
                entity.HasOne(e => e.User)
                    .WithMany(e => e.RefreshTokens)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Seed data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed admin user
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@ams.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                FirstName = "System",
                LastName = "Administrator",
                Role = "Admin",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            });

            // Seed sample assets
            modelBuilder.Entity<Asset>().HasData(
                new Asset
                {
                    Id = 1,
                    Name = "Dell Latitude 5520",
                    Description = "Business laptop for office use",
                    AssetTag = "LAP001",
                    Category = "Laptop",
                    Brand = "Dell",
                    Model = "Latitude 5520",
                    SerialNumber = "DL123456789",
                    PurchasePrice = 1299.99m,
                    PurchaseDate = DateTime.UtcNow.AddMonths(-6),
                    Status = AssetStatus.Available,
                    Location = "IT Department",
                    Condition = "Excellent",
                    CreatedAt = DateTime.UtcNow
                },
                new Asset
                {
                    Id = 2,
                    Name = "HP LaserJet Pro M404n",
                    Description = "Network printer for office printing",
                    AssetTag = "PRN001",
                    Category = "Printer",
                    Brand = "HP",
                    Model = "LaserJet Pro M404n",
                    SerialNumber = "HP987654321",
                    PurchasePrice = 299.99m,
                    PurchaseDate = DateTime.UtcNow.AddMonths(-3),
                    Status = AssetStatus.Available,
                    Location = "Print Room",
                    Condition = "Good",
                    CreatedAt = DateTime.UtcNow
                }
            );

            // Seed application settings
            modelBuilder.Entity<AppSetting>().HasData(
                new AppSetting { Key = "CompanyName", Value = "Asset Management System" },
                new AppSetting { Key = "CompanyLogoUrl", Value = "/images/default_logo.png" }, // Default logo path
                new AppSetting { Key = "DefaultTheme", Value = "light" },
                new AppSetting { Key = "DefaultLanguage", Value = "en-US" }
            );
        }
    }
} 