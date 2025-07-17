using Microsoft.EntityFrameworkCore;
using AMS.Api.Data;
using AMS.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AMS.Api.Services
{
    public class AppSettingService
    {
        private readonly AMSContext _context;

        public AppSettingService(AMSContext context)
        {
            _context = context;
        }

        public async Task<Dictionary<string, string>> GetAllSettingsAsync()
        {
            var settings = await _context.AppSettings.ToDictionaryAsync(s => s.Key, s => s.Value);

            // Ensure default settings exist if the table is empty
            if (!settings.Any())
            {
                var defaultSettings = new List<AppSetting>
                {
                    new AppSetting { Key = "CompanyName", Value = "Asset Management System" },
                    new AppSetting { Key = "CompanyLogoUrl", Value = "/images/default_logo.png" },
                    new AppSetting { Key = "DefaultTheme", Value = "light" },
                    new AppSetting { Key = "DefaultLanguage", Value = "en-US" }
                };
                _context.AppSettings.AddRange(defaultSettings);
                await _context.SaveChangesAsync();
                settings = defaultSettings.ToDictionary(s => s.Key, s => s.Value);
            }

            return settings;
        }

        public async Task<string?> GetSettingAsync(string key)
        {
            var setting = await _context.AppSettings.FindAsync(key);
            return setting?.Value;
        }

        public async Task<AppSetting> UpdateSettingAsync(string key, string value)
        {
            var setting = await _context.AppSettings.FindAsync(key);
            if (setting == null)
            {
                setting = new AppSetting { Key = key, Value = value };
                _context.Entry(setting).State = EntityState.Added;
            }
            else
            {
                setting.Value = value;
                _context.Entry(setting).State = EntityState.Modified;
            }
            return setting;
        }

        public async Task UpdateSettingsAsync(Dictionary<string, string> settings)
        {
            foreach (var setting in settings)
            {
                await UpdateSettingAsync(setting.Key, setting.Value);
            }
            await _context.SaveChangesAsync();
        }
    }
}