using System.Data;
using Microsoft.EntityFrameworkCore;
using ServiceBooking.Api.Common;
using ServiceBooking.Api.Data;
using ServiceBooking.Api.DTOs.Bookings;
using ServiceBooking.Api.DTOs.Common;
using ServiceBooking.Api.Exceptions;
using ServiceBooking.Api.Models;
using ServiceBooking.Api.Services.Interfaces;

namespace ServiceBooking.Api.Services;

public class BookingService : IBookingService
{
    private readonly AppDbContext _context;

    private static readonly TimeSpan LunchStart = new(12, 30, 0);
    private static readonly TimeSpan LunchEnd = new(13, 30, 0);
    private const int MaxAdvanceBookingDays = 7;

    public BookingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AvailableSlotDto>> GetAvailableSlotsAsync(AvailableSlotsQueryParameters parameters)
    {
        var service = await _context.Services.AsNoTracking().FirstOrDefaultAsync(s => s.Id == parameters.ServiceId);
        if (service == null)
        {
            throw new NotFoundException($"Không tìm thấy dịch vụ với mã ID: {parameters.ServiceId}");
        }
        if (!service.IsActive)
        {
            throw new BadRequestException("Dịch vụ này hiện đang tạm ngưng phục vụ.");
        }

        var staff = await _context.Staffs.AsNoTracking().FirstOrDefaultAsync(s => s.Id == parameters.StaffId);
        if (staff == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã ID: {parameters.StaffId}");
        }
        if (!staff.IsActive)
        {
            throw new BadRequestException("Nhân viên này hiện đang ngừng hoạt động.");
        }

        var todayUtc = DateOnly.FromDateTime(DateTime.UtcNow);
        var maxAllowedDate = todayUtc.AddDays(MaxAdvanceBookingDays - 1);
        if (parameters.Date > maxAllowedDate)
        {
            throw new BadRequestException($"Hệ thống chỉ mở lịch đặt trước tối đa trong vòng {MaxAdvanceBookingDays} ngày tới.");
        }

        var shifts = await _context.WorkSchedules
            .AsNoTracking()
            .Where(ws => ws.StaffId == parameters.StaffId && ws.WorkDate == parameters.Date)
            .OrderBy(ws => ws.StartTime)
            .ToListAsync();

        if (!shifts.Any())
        {
            return new List<AvailableSlotDto>();
        }

        var dayStartUtc = parameters.Date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dayEndUtc = parameters.Date.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var existingBookings = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.StaffId == parameters.StaffId 
                     && b.Status != BookingStatus.Cancelled
                     && b.StartTime < dayEndUtc 
                     && b.EndTime > dayStartUtc)
            .ToListAsync();

        var availableSlots = new List<AvailableSlotDto>();
        var duration = TimeSpan.FromMinutes(service.DurationMinutes);
        var nowUtc = DateTime.UtcNow;

        foreach (var shift in shifts)
        {
            var currentSlotStart = shift.StartTime;

            while (currentSlotStart + duration <= shift.EndTime)
            {
                var currentSlotEnd = currentSlotStart + duration;

                // Bỏ qua giờ nghỉ trưa
                if (IsOverlappingLunch(currentSlotStart, currentSlotEnd))
                {
                    currentSlotStart = currentSlotEnd;
                    continue;
                }

                var slotStartUtc = parameters.Date.ToDateTime(TimeOnly.FromTimeSpan(currentSlotStart), DateTimeKind.Utc);
                var slotEndUtc = parameters.Date.ToDateTime(TimeOnly.FromTimeSpan(currentSlotEnd), DateTimeKind.Utc);

                if (slotStartUtc > nowUtc)
                {
                    var hasConflict = existingBookings.Any(b => slotStartUtc < b.EndTime && slotEndUtc > b.StartTime);

                    availableSlots.Add(new AvailableSlotDto
                    {
                        StartTime = slotStartUtc,
                        EndTime = slotEndUtc,
                        FormattedTime = $"{currentSlotStart:hh\\:mm} - {currentSlotEnd:hh\\:mm}",
                        IsAvailable = !hasConflict
                    });
                }

                currentSlotStart = currentSlotEnd;
            }
        }

        return availableSlots;
    }

    public async Task<BookingDto> CreateBookingAsync(Guid customerId, CreateBookingRequest request)
    {
        var customer = await _context.Users.FindAsync(customerId);
        if (customer == null)
        {
            throw new NotFoundException("Không tìm thấy thông tin khách hàng.");
        }

        var startTimeUtc = DateTime.SpecifyKind(request.StartTime, DateTimeKind.Utc);
        if (startTimeUtc <= DateTime.UtcNow)
        {
            throw new BadRequestException("Thời gian đặt lịch phải lớn hơn thời gian hiện tại.");
        }

        var service = await _context.Services.FindAsync(request.ServiceId);
        if (service == null)
        {
            throw new NotFoundException($"Không tìm thấy dịch vụ với mã ID: {request.ServiceId}");
        }
        if (!service.IsActive)
        {
            throw new BadRequestException("Không thể đặt dịch vụ đang bị khóa.");
        }

        var endTimeUtc = startTimeUtc.AddMinutes(service.DurationMinutes);

        var staff = await _context.Staffs.FindAsync(request.StaffId);
        if (staff == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã ID: {request.StaffId}");
        }
        if (!staff.IsActive)
        {
            throw new BadRequestException("Không thể đặt lịch với nhân viên đang bị khóa.");
        }

        var bookingDate = DateOnly.FromDateTime(startTimeUtc);
        var todayBookingDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var maxBookingDate = todayBookingDate.AddDays(MaxAdvanceBookingDays - 1);
        if (bookingDate > maxBookingDate)
        {
            throw new BadRequestException($"Hệ thống chỉ mở lịch đặt trước tối đa trong vòng {MaxAdvanceBookingDays} ngày tới.");
        }

        // Bỏ qua giờ nghỉ trưa
        var bookingStartTime = TimeOnly.FromDateTime(startTimeUtc).ToTimeSpan();
        var bookingEndTime = TimeOnly.FromDateTime(endTimeUtc).ToTimeSpan();

        if (IsOverlappingLunch(bookingStartTime, bookingEndTime))
        {
            throw new BadRequestException("Khung giờ bạn chọn rơi vào thời gian nghỉ trưa (12:30 - 13:30) của cửa hàng.");
        }

        // Kiểm tra ca làm việc
        var isWithinShift = await _context.WorkSchedules
            .AsNoTracking()
            .AnyAsync(ws => ws.StaffId == request.StaffId 
                         && ws.WorkDate == bookingDate 
                         && ws.StartTime <= bookingStartTime 
                         && ws.EndTime >= bookingEndTime);

        if (!isWithinShift)
        {
            throw new BadRequestException("Thời gian đặt lịch không nằm trong ca làm việc của nhân viên trong ngày này.");
        }

        // Khóa dòng chống race condition
        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaction = null;
        if (_context.Database.IsRelational())
        {
            transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        }

        try
        {
            if (transaction != null)
            {
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"SELECT \"Id\" FROM \"Staffs\" WHERE \"Id\" = {request.StaffId} FOR UPDATE");
            }

            // Kiểm tra trùng lịch
            var isConflict = await _context.Bookings
                .AnyAsync(b => b.StaffId == request.StaffId 
                            && b.Status != BookingStatus.Cancelled
                            && startTimeUtc < b.EndTime 
                            && endTimeUtc > b.StartTime);

            if (isConflict)
            {
                throw new ConflictException("Khung giờ này vừa được khách hàng khác đặt trước. Vui lòng chọn khung giờ khác.");
            }

            // Sinh mã booking duy nhất
            var datePrefix = DateTime.UtcNow.ToString("yyyyMMdd");
            var randomSuffix = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
            var bookingCode = $"BK{datePrefix}-{randomSuffix}";

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                BookingCode = bookingCode,
                CustomerId = customerId,
                ServiceId = request.ServiceId,
                StaffId = request.StaffId,
                StartTime = startTimeUtc,
                EndTime = endTimeUtc,
                Status = BookingStatus.Pending,
                CustomerNote = request.CustomerNote?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            await _context.Bookings.AddAsync(booking);
            await _context.SaveChangesAsync();
            
            if (transaction != null)
            {
                await transaction.CommitAsync();
            }

            return new BookingDto
            {
                Id = booking.Id,
                BookingCode = booking.BookingCode,
                CustomerId = customer.Id,
                CustomerName = customer.FullName,
                CustomerEmail = customer.Email,
                ServiceId = service.Id,
                ServiceName = service.Name,
                ServicePrice = service.Price,
                DurationMinutes = service.DurationMinutes,
                StaffId = staff.Id,
                StaffName = staff.FullName,
                StartTime = booking.StartTime,
                EndTime = booking.EndTime,
                Status = booking.Status,
                CustomerNote = booking.CustomerNote,
                CancellationReason = booking.CancellationReason,
                CreatedAt = booking.CreatedAt
            };
        }
        finally
        {
            if (transaction != null)
            {
                await transaction.DisposeAsync();
            }
        }
    }

    public async Task<PagedResult<BookingDto>> GetMyBookingsAsync(Guid customerId, MyBookingQueryParameters parameters)
    {
        var pageNumber = Math.Max(1, parameters.PageNumber);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 100);

        var query = _context.Bookings
            .AsNoTracking()
            .Include(b => b.Customer)
            .Include(b => b.Service)
            .Include(b => b.Staff)
            .Where(b => b.CustomerId == customerId);

        if (parameters.Date.HasValue)
        {
            var dayStartUtc = parameters.Date.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var dayEndUtc = parameters.Date.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(b => b.StartTime < dayEndUtc && b.EndTime > dayStartUtc);
        }

        if (!string.IsNullOrWhiteSpace(parameters.Status))
        {
            query = query.Where(b => b.Status == parameters.Status.Trim());
        }

        var totalItems = await query.CountAsync();

        query = parameters.SortBy?.ToLowerInvariant() switch
        {
            "starttimeasc" => query.OrderBy(b => b.StartTime).ThenBy(b => b.Id),
            "starttimedesc" => query.OrderByDescending(b => b.StartTime).ThenBy(b => b.Id),
            _ => query.OrderByDescending(b => b.CreatedAt).ThenBy(b => b.Id)
        };

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BookingDto
            {
                Id = b.Id,
                BookingCode = b.BookingCode,
                CustomerId = b.CustomerId,
                CustomerName = b.Customer.FullName,
                CustomerEmail = b.Customer.Email,
                ServiceId = b.ServiceId,
                ServiceName = b.Service.Name,
                ServicePrice = b.Service.Price,
                DurationMinutes = b.Service.DurationMinutes,
                StaffId = b.StaffId,
                StaffName = b.Staff.FullName,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Status = b.Status,
                CustomerNote = b.CustomerNote,
                CancellationReason = b.CancellationReason,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<BookingDto>(items, totalItems, pageNumber, pageSize);
    }

    public async Task<PagedResult<BookingDto>> GetBookingsAsync(BookingQueryParameters parameters)
    {
        var pageNumber = Math.Max(1, parameters.PageNumber);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 100);

        var query = _context.Bookings
            .AsNoTracking()
            .Include(b => b.Customer)
            .Include(b => b.Service)
            .Include(b => b.Staff)
            .AsQueryable();

        if (parameters.Date.HasValue)
        {
            var dayStartUtc = parameters.Date.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var dayEndUtc = parameters.Date.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(b => b.StartTime < dayEndUtc && b.EndTime > dayStartUtc);
        }

        if (!string.IsNullOrWhiteSpace(parameters.Status))
        {
            query = query.Where(b => b.Status == parameters.Status.Trim());
        }

        if (parameters.StaffId.HasValue)
        {
            query = query.Where(b => b.StaffId == parameters.StaffId.Value);
        }

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var term = parameters.Search.Trim().ToLower();
            query = query.Where(b => b.BookingCode.ToLower().Contains(term)
                                  || b.Customer.FullName.ToLower().Contains(term)
                                  || b.Customer.Email.ToLower().Contains(term)
                                  || b.Service.Name.ToLower().Contains(term));
        }

        var totalItems = await query.CountAsync();

        var items = await query
            .OrderByDescending(b => b.StartTime)
            .ThenBy(b => b.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BookingDto
            {
                Id = b.Id,
                BookingCode = b.BookingCode,
                CustomerId = b.CustomerId,
                CustomerName = b.Customer.FullName,
                CustomerEmail = b.Customer.Email,
                ServiceId = b.ServiceId,
                ServiceName = b.Service.Name,
                ServicePrice = b.Service.Price,
                DurationMinutes = b.Service.DurationMinutes,
                StaffId = b.StaffId,
                StaffName = b.Staff.FullName,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Status = b.Status,
                CustomerNote = b.CustomerNote,
                CancellationReason = b.CancellationReason,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<BookingDto>(items, totalItems, pageNumber, pageSize);
    }

    public async Task<BookingDto> GetBookingByIdAsync(Guid id, Guid currentUserId, bool isAdmin)
    {
        var booking = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.Customer)
            .Include(b => b.Service)
            .Include(b => b.Staff)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
        {
            throw new NotFoundException($"Không tìm thấy đơn đặt lịch với mã ID: {id}");
        }

        // Khách hàng chỉ có quyền xem đơn của chính mình
        if (!isAdmin && booking.CustomerId != currentUserId)
        {
            throw new NotFoundException($"Không tìm thấy đơn đặt lịch với mã ID: {id}");
        }

        return MapToDto(booking);
    }

    public async Task<BookingDto> UpdateBookingStatusAsync(Guid id, UpdateBookingStatusRequest request)
    {
        var booking = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Service)
            .Include(b => b.Staff)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
        {
            throw new NotFoundException($"Không tìm thấy đơn đặt lịch với mã ID: {id}");
        }

        var newStatus = request.Status.Trim();
        if (!BookingStatus.AllStatuses.Contains(newStatus))
        {
            throw new BadRequestException($"Trạng thái '{newStatus}' không hợp lệ. Các trạng thái được phép: Pending, Confirmed, Completed, Cancelled.");
        }

        if (booking.Status == BookingStatus.Completed)
        {
            throw new BadRequestException("Không thể thay đổi trạng thái của đơn đặt lịch đã hoàn thành.");
        }

        if (booking.Status == BookingStatus.Cancelled)
        {
            throw new BadRequestException("Không thể thay đổi trạng thái của đơn đặt lịch đã bị hủy.");
        }

        if (newStatus == BookingStatus.Cancelled)
        {
            throw new BadRequestException("Không thể chuyển sang trạng thái Hủy đơn tại đây. Vui lòng sử dụng chức năng Hủy đơn để cung cấp lý do hủy.");
        }

        if (booking.Status == BookingStatus.Pending && newStatus == BookingStatus.Completed)
        {
            throw new BadRequestException("Đơn đặt lịch cần được xác nhận (Confirmed) trước khi chuyển sang Hoàn thành (Completed).");
        }

        booking.Status = newStatus;
        await _context.SaveChangesAsync();

        return MapToDto(booking);
    }

    public async Task<BookingDto> CancelBookingAsync(Guid id, Guid currentUserId, bool isAdmin, CancelBookingRequest request)
    {
        var booking = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Service)
            .Include(b => b.Staff)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
        {
            throw new NotFoundException($"Không tìm thấy đơn đặt lịch với mã ID: {id}");
        }

        if (!isAdmin && booking.CustomerId != currentUserId)
        {
            throw new NotFoundException($"Không tìm thấy đơn đặt lịch với mã ID: {id}");
        }

        if (booking.Status == BookingStatus.Cancelled)
        {
            throw new BadRequestException("Đơn đặt lịch này đã được hủy trước đó.");
        }

        if (booking.Status == BookingStatus.Completed)
        {
            throw new BadRequestException("Không thể hủy đơn đặt lịch đã hoàn thành.");
        }

        if (booking.StartTime <= DateTime.UtcNow)
        {
            throw new BadRequestException("Không thể hủy đơn đặt lịch đã bắt đầu hoặc đã diễn ra trong quá khứ.");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancellationReason = request.CancellationReason?.Trim() ?? string.Empty;

        await _context.SaveChangesAsync();

        return MapToDto(booking);
    }

    private static BookingDto MapToDto(Booking booking) => new()
    {
        Id = booking.Id,
        BookingCode = booking.BookingCode,
        CustomerId = booking.CustomerId,
        CustomerName = booking.Customer?.FullName ?? string.Empty,
        CustomerEmail = booking.Customer?.Email ?? string.Empty,
        ServiceId = booking.ServiceId,
        ServiceName = booking.Service?.Name ?? string.Empty,
        ServicePrice = booking.Service?.Price ?? 0,
        DurationMinutes = booking.Service?.DurationMinutes ?? 0,
        StaffId = booking.StaffId,
        StaffName = booking.Staff?.FullName ?? string.Empty,
        StartTime = booking.StartTime,
        EndTime = booking.EndTime,
        Status = booking.Status,
        CustomerNote = booking.CustomerNote,
        CancellationReason = booking.CancellationReason,
        CreatedAt = booking.CreatedAt
    };

    private static bool IsOverlappingLunch(TimeSpan start, TimeSpan end) =>
        start < LunchEnd && end > LunchStart;
}
