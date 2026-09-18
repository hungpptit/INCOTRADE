using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ServiceBooking.Api.DTOs.Bookings;
using ServiceBooking.Api.DTOs.Common;
using ServiceBooking.Api.Exceptions;
using ServiceBooking.Api.Services.Interfaces;

namespace ServiceBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    /// <summary>
    /// Tính toán các khung giờ còn trống của nhân viên cho dịch vụ cụ thể
    /// </summary>
    [HttpGet("available-slots")]
    [EnableRateLimiting("BookingRatePolicy")]
    public async Task<ActionResult<List<AvailableSlotDto>>> GetAvailableSlots([FromQuery] AvailableSlotsQueryParameters parameters)
    {
        var result = await _bookingService.GetAvailableSlotsAsync(parameters);
        return Ok(result);
    }

    /// <summary>
    /// Đặt lịch dịch vụ mới (Chỉ dành cho Khách hàng đã đăng nhập)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Customer")]
    [EnableRateLimiting("BookingRatePolicy")]
    public async Task<ActionResult<BookingDto>> CreateBooking([FromBody] CreateBookingRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new BadRequestException("Phiên đăng nhập không hợp lệ.");

        var customerId = Guid.Parse(userIdStr);
        var result = await _bookingService.CreateBookingAsync(customerId, request);

        return CreatedAtAction(nameof(GetBookingById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Xem danh sách lịch hẹn của chính khách hàng (Chỉ dành cho Khách hàng)
    /// </summary>
    [HttpGet("my-bookings")]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<PagedResult<BookingDto>>> GetMyBookings([FromQuery] MyBookingQueryParameters parameters)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new BadRequestException("Phiên đăng nhập không hợp lệ.");

        var customerId = Guid.Parse(userIdStr);
        var result = await _bookingService.GetMyBookingsAsync(customerId, parameters);

        return Ok(result);
    }

    /// <summary>
    /// Quản lý toàn bộ danh sách lịch hẹn (Chỉ dành cho Admin)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<BookingDto>>> GetBookings([FromQuery] BookingQueryParameters parameters)
    {
        var result = await _bookingService.GetBookingsAsync(parameters);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết một đơn đặt lịch theo ID (Khách hàng chỉ xem được đơn của chính mình)
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<BookingDto>> GetBookingById(Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new BadRequestException("Phiên đăng nhập không hợp lệ.");

        var currentUserId = Guid.Parse(userIdStr);
        var isAdmin = User.IsInRole("Admin");

        var result = await _bookingService.GetBookingByIdAsync(id, currentUserId, isAdmin);
        return Ok(result);
    }

    /// <summary>
    /// Cập nhật trạng thái đơn đặt lịch (Chỉ dành cho Admin: Confirmed, Completed, Cancelled)
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BookingDto>> UpdateBookingStatus(Guid id, [FromBody] UpdateBookingStatusRequest request)
    {
        var result = await _bookingService.UpdateBookingStatusAsync(id, request);
        return Ok(result);
    }

    /// <summary>
    /// Hủy đơn đặt lịch kèm lý do (Khách hàng chỉ được hủy đơn của mình; Chặn đơn đã bắt đầu hoặc hoàn thành)
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    public async Task<ActionResult<BookingDto>> CancelBooking(Guid id, [FromBody] CancelBookingRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new BadRequestException("Phiên đăng nhập không hợp lệ.");

        var currentUserId = Guid.Parse(userIdStr);
        var isAdmin = User.IsInRole("Admin");

        var result = await _bookingService.CancelBookingAsync(id, currentUserId, isAdmin, request);
        return Ok(result);
    }
}
