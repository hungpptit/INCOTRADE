using ServiceBooking.Api.DTOs.Common;
using ServiceBooking.Api.DTOs.Services;

namespace ServiceBooking.Api.Services.Interfaces;

public interface IServiceManagementService
{
    Task<PagedResult<ServiceDto>> GetServicesAsync(ServiceQueryParameters parameters, bool isAdmin);
    Task<ServiceDto> GetServiceByIdAsync(Guid id);
    Task<ServiceDto> CreateServiceAsync(CreateServiceRequest request);
    Task<ServiceDto> UpdateServiceAsync(Guid id, UpdateServiceRequest request);
}
