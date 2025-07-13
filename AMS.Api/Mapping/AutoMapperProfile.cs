using AutoMapper;
using AMS.Api.Models;
using AMS.Api.DTOs;

namespace AMS.Api.Mapping
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            // User mappings
            CreateMap<User, UserDto>();
            CreateMap<CreateUserDto, User>();
            CreateMap<UpdateUserDto, User>();

            // Asset mappings
            CreateMap<Asset, AssetDto>();
            CreateMap<CreateAssetDto, Asset>();
            CreateMap<UpdateAssetDto, Asset>();

            // AssetHistory mappings
            CreateMap<AssetHistory, AssetHistoryDto>();
            CreateMap<CreateAssetHistoryDto, AssetHistory>();

            // MaintenanceRecord mappings
            CreateMap<MaintenanceRecord, MaintenanceRecordDto>();
            CreateMap<CreateMaintenanceRecordDto, MaintenanceRecord>();
            CreateMap<UpdateMaintenanceRecordDto, MaintenanceRecord>();
        }
    }
} 