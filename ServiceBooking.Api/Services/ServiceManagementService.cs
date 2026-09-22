using Microsoft.EntityFrameworkCore;
using ServiceBooking.Api.Data;
using ServiceBooking.Api.DTOs.Common;
using ServiceBooking.Api.DTOs.Services;
using ServiceBooking.Api.Exceptions;
using ServiceBooking.Api.Models;
using ServiceBooking.Api.Services.Interfaces;

namespace ServiceBooking.Api.Services;

public class ServiceManagementService : IServiceManagementService
{
    private readonly AppDbContext _context;

    public ServiceManagementService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ServiceDto>> GetServicesAsync(ServiceQueryParameters parameters, bool isAdmin)
    {
        var pageNumber = Math.Max(1, parameters.PageNumber);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 100);

        var query = _context.Services.AsNoTracking().AsQueryable();

        // Khách hàng chỉ xem dịch vụ đang hoạt động
        if (!isAdmin)
        {
            query = query.Where(s => s.IsActive);
        }
        else if (parameters.IsActive.HasValue)
        {
            query = query.Where(s => s.IsActive == parameters.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var searchTerm = parameters.Search.Trim().ToLower();
            query = query.Where(s => s.Name.ToLower().Contains(searchTerm));
        }

        var totalItems = await query.CountAsync();

        var items = await query
            .OrderBy(s => s.Name)
            .ThenBy(s => s.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new ServiceDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                DurationMinutes = s.DurationMinutes,
                Price = s.Price,
                IsActive = s.IsActive
            })
            .ToListAsync();

        return new PagedResult<ServiceDto>(items, totalItems, pageNumber, pageSize);
    }

    public async Task<ServiceDto> GetServiceByIdAsync(Guid id)
    {
        var service = await _context.Services
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service == null)
        {
            throw new NotFoundException($"Không tìm thấy dịch vụ với mã ID: {id}");
        }

        return MapToDto(service);
    }

    public async Task<ServiceDto> CreateServiceAsync(CreateServiceRequest request)
    {
        if (request.DurationMinutes <= 0)
        {
            throw new BadRequestException("Thời lượng dịch vụ phải lớn hơn 0 phút.");
        }
        if (request.Price < 0)
        {
            throw new BadRequestException("Giá dịch vụ không được âm.");
        }

        var service = new Service
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            IsActive = request.IsActive
        };

        await _context.Services.AddAsync(service);
        await _context.SaveChangesAsync();

        return MapToDto(service);
    }

    public async Task<ServiceDto> UpdateServiceAsync(Guid id, UpdateServiceRequest request)
    {
        if (request.DurationMinutes <= 0)
        {
            throw new BadRequestException("Thời lượng dịch vụ phải lớn hơn 0 phút.");
        }
        if (request.Price < 0)
        {
            throw new BadRequestException("Giá dịch vụ không được âm.");
        }

        var service = await _context.Services.FindAsync(id);

        if (service == null)
        {
            throw new NotFoundException($"Không tìm thấy dịch vụ với mã ID: {id} để cập nhật.");
        }

        service.Name = request.Name.Trim();
        service.Description = request.Description?.Trim();
        service.DurationMinutes = request.DurationMinutes;
        service.Price = request.Price;
        service.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return MapToDto(service);
    }

    private static ServiceDto MapToDto(Service service) => new()
    {
        Id = service.Id,
        Name = service.Name,
        Description = service.Description,
        DurationMinutes = service.DurationMinutes,
        Price = service.Price,
        IsActive = service.IsActive
    };
}
