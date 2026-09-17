using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceBooking.Api.DTOs.Schedules;
using ServiceBooking.Api.DTOs.Staffs;
using ServiceBooking.Api.Services.Interfaces;

namespace ServiceBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StaffsController : ControllerBase
{
    private readonly IStaffManagementService _staffManagementService;

    public StaffsController(IStaffManagementService staffManagementService)
    {
        _staffManagementService = staffManagementService;
    }

    /// <summary>
    /// Lấy danh sách nhân viên
    /// Customer / Guest: Bắt buộc chỉ thấy nhân viên IsActive = true
    /// Admin: Có thể thấy toàn bộ hoặc lọc IsActive
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<StaffDto>>> GetStaffs([FromQuery] StaffQueryParameters parameters)
    {
        var isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        var result = await _staffManagementService.GetStaffsAsync(parameters, isAdmin);
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin chi tiết một nhân viên theo Id
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<StaffDto>> GetStaffById(Guid id)
    {
        var result = await _staffManagementService.GetStaffByIdAsync(id);
        return Ok(result);
    }

    /// <summary>
    /// Thêm mới nhân viên (Chỉ dành cho Admin)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StaffDto>> CreateStaff([FromBody] CreateStaffRequest request)
    {
        var result = await _staffManagementService.CreateStaffAsync(request);
        return CreatedAtAction(nameof(GetStaffById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Cập nhật thông tin hoặc Khóa/Mở nhân viên (Chỉ dành cho Admin)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StaffDto>> UpdateStaff(Guid id, [FromBody] UpdateStaffRequest request)
    {
        var result = await _staffManagementService.UpdateStaffAsync(id, request);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách ca làm việc của một nhân viên theo khoảng ngày
    /// </summary>
    [HttpGet("{id:guid}/schedules")]
    public async Task<ActionResult<List<WorkScheduleDto>>> GetStaffSchedules(Guid id, [FromQuery] ScheduleQueryParameters parameters)
    {
        var result = await _staffManagementService.GetStaffSchedulesAsync(id, parameters);
        return Ok(result);
    }

    /// <summary>
    /// Tạo ca làm việc mới cho nhân viên (Chỉ dành cho Admin)
    /// Kiểm tra: StartTime nhỏ hơn EndTime, không trùng ca làm việc trong ngày
    /// </summary>
    [HttpPost("{id:guid}/schedules")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<WorkScheduleDto>> CreateWorkSchedule(Guid id, [FromBody] CreateWorkScheduleRequest request)
    {
        var result = await _staffManagementService.CreateWorkScheduleAsync(id, request);
        return CreatedAtAction(nameof(GetStaffSchedules), new { id = result.StaffId }, result);
    }
}
