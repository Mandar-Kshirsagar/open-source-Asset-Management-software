using System.ComponentModel.DataAnnotations;

namespace AMS.Api.Models
{
    public class AppSetting
    {
        [Key]
        [StringLength(100)]
        public string Key { get; set; } = string.Empty;

        [StringLength(1000)]
        public string Value { get; set; } = string.Empty;
    }
}