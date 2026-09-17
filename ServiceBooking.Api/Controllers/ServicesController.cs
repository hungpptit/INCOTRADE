using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceBooking.Api.DTOs.Common;
using ServiceBooking.Api.DTOs.Services;
using ServiceBooking.Api.Services.Interfaces;

namespace ServiceBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly IServiceManagementService _serviceManagementService;

    public ServicesController(IServiceManagementService serviceManagementService)
    {
        _serviceManagementService = serviceManagementService;
    }

    /// <summary>
    /// Lấy danh sách dịch vụ có tìm kiếm và phân trang
    /// Customer / Guest: Chỉ thấy các dịch vụ IsActive = true
    /// Admin: Có thể thấy toàn bộ hoặc lọc IsActive
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<ServiceDto>>> GetServices([FromQuery] ServiceQueryParameters parameters)
    {
        var isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        var result = await _serviceManagementService.GetServicesAsync(parameters, isAdmin);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết một dịch vụ theo Id
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ServiceDto>> GetServiceById(Guid id)
    {
        var result = await _serviceManagementService.GetServiceByIdAsync(id);
        return Ok(result);
    }

    /// <summary>
    /// Thêm mới dịch vụ (Chỉ dành cho Admin)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ServiceDto>> CreateService([FromBody] CreateServiceRequest request)
    {
        var result = await _serviceManagementService.CreateServiceAsync(request);
        return CreatedAtAction(nameof(GetServiceById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Cập nhật dịch vụ hoặc Bật/Tắt IsActive (Chỉ dành cho Admin)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ServiceDto>> UpdateService(Guid id, [FromBody] UpdateServiceRequest request)
    {
        var result = await _serviceManagementService.UpdateServiceAsync(id, request);
        return Ok(result);
    }
}
