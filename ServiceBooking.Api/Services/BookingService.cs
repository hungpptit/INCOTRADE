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

    public BookingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AvailableSlotDto>> GetAvailableSlotsAsync(AvailableSlotsQueryParameters parameters)
    {
        // 1. Kiểm tra dịch vụ tồn tại và đang hoạt động
        var service = await _context.Services.AsNoTracking().FirstOrDefaultAsync(s => s.Id == parameters.ServiceId);
        if (service == null)
        {
            throw new NotFoundException($"Không tìm thấy dịch vụ với mã ID: {parameters.ServiceId}");
        }
        if (!service.IsActive)
        {
            throw new BadRequestException("Dịch vụ này hiện đang tạm ngưng phục vụ.");
        }

        // 2. Kiểm tra nhân viên tồn tại và đang hoạt động
        var staff = await _context.Staffs.AsNoTracking().FirstOrDefaultAsync(s => s.Id == parameters.StaffId);
        if (staff == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã ID: {parameters.StaffId}");
        }
        if (!staff.IsActive)
        {
            throw new BadRequestException("Nhân viên này hiện đang ngừng hoạt động.");
        }

        // 3. Lấy danh sách ca làm việc của thợ trong ngày
        var shifts = await _context.WorkSchedules
            .AsNoTracking()
            .Where(ws => ws.StaffId == parameters.StaffId && ws.WorkDate == parameters.Date)
            .OrderBy(ws => ws.StartTime)
            .ToListAsync();

        if (!shifts.Any())
        {
            return new List<AvailableSlotDto>();
        }

        // 4. Lấy các booking chưa bị hủy của thợ trong ngày (tính theo UTC)
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

        // 5. Chia ca làm việc thành các slot giờ bằng thời lượng dịch vụ
        foreach (var shift in shifts)
        {
            var currentSlotStart = shift.StartTime;

            while (currentSlotStart + duration <= shift.EndTime)
            {
                var currentSlotEnd = currentSlotStart + duration;

                var slotStartUtc = parameters.Date.ToDateTime(TimeOnly.FromTimeSpan(currentSlotStart), DateTimeKind.Utc);
                var slotEndUtc = parameters.Date.ToDateTime(TimeOnly.FromTimeSpan(currentSlotEnd), DateTimeKind.Utc);

                // Loại bỏ slot giờ trong quá khứ nếu là ngày hôm nay (TC1)
                if (slotStartUtc > nowUtc)
                {
                    // Kiểm tra xem slot có giao thoa với booking đã có hay không:
                    // Slot trùng khi: slotStart < existingEnd AND slotEnd > existingStart
                    var hasConflict = existingBookings.Any(b => slotStartUtc < b.EndTime && slotEndUtc > b.StartTime);

                    if (!hasConflict)
                    {
                        availableSlots.Add(new AvailableSlotDto
                        {
                            StartTime = slotStartUtc,
                            EndTime = slotEndUtc,
                            FormattedTime = $"{currentSlotStart:hh\\:mm} - {currentSlotEnd:hh\\:mm}"
                        });
                    }
                }

                currentSlotStart = currentSlotEnd;
            }
        }

        return availableSlots;
    }

    public async Task<BookingDto> CreateBookingAsync(Guid customerId, CreateBookingRequest request)
    {
        // 1. Kiểm tra khách hàng tồn tại
        var customer = await _context.Users.FindAsync(customerId);
        if (customer == null)
        {
            throw new NotFoundException("Không tìm thấy thông tin khách hàng.");
        }

        // 2. Chuẩn hóa thời gian sang UTC và kiểm tra không đặt trong quá khứ (TC1)
        var startTimeUtc = DateTime.SpecifyKind(request.StartTime, DateTimeKind.Utc);
        if (startTimeUtc <= DateTime.UtcNow)
        {
            throw new BadRequestException("Thời gian đặt lịch phải lớn hơn thời gian hiện tại.");
        }

        // 3. Kiểm tra dịch vụ tồn tại và đang active
        var service = await _context.Services.FindAsync(request.ServiceId);
        if (service == null)
        {
            throw new NotFoundException($"Không tìm thấy dịch vụ với mã ID: {request.ServiceId}");
        }
        if (!service.IsActive)
        {
            throw new BadRequestException("Không thể đặt dịch vụ đang bị khóa.");
        }

        // 4. Backend tự động tính EndTime = StartTime + DurationMinutes
        var endTimeUtc = startTimeUtc.AddMinutes(service.DurationMinutes);

        // 5. Kiểm tra nhân viên tồn tại và đang active
        var staff = await _context.Staffs.FindAsync(request.StaffId);
        if (staff == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã ID: {request.StaffId}");
        }
        if (!staff.IsActive)
        {
            throw new BadRequestException("Không thể đặt lịch với nhân viên đang bị khóa.");
        }

        // 6. Kiểm tra booking phải nằm hoàn toàn trong ca làm việc của thợ (TC2)
        var bookingDate = DateOnly.FromDateTime(startTimeUtc);
        var bookingStartTime = TimeOnly.FromDateTime(startTimeUtc).ToTimeSpan();
        var bookingEndTime = TimeOnly.FromDateTime(endTimeUtc).ToTimeSpan();

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

        // 7. Xử lý Race Condition & Overlap Check (Mục 12 cộng điểm & TC3):
        // Dùng Database Transaction kết hợp Row-Lock trên bảng Staffs để tuần tự hóa các request cùng mili-giây
        using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);

        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT \"Id\" FROM \"Staffs\" WHERE \"Id\" = {request.StaffId} FOR UPDATE");

        // Kiểm tra chống trùng lịch: NewStart < ExistingEnd AND NewEnd > ExistingStart
        var isConflict = await _context.Bookings
            .AnyAsync(b => b.StaffId == request.StaffId 
                        && b.Status != BookingStatus.Cancelled
                        && startTimeUtc < b.EndTime 
                        && endTimeUtc > b.StartTime);

        if (isConflict)
        {
            throw new ConflictException("Khung giờ này vừa được khách hàng khác đặt trước. Vui lòng chọn khung giờ khác.");
        }

        // Tạo mã BookingCode duy nhất (VD: BK20260918-7249)
        var datePrefix = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomSuffix = Random.Shared.Next(1000, 9999);
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
        await transaction.CommitAsync();

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

    public async Task<PagedResult<BookingDto>> GetMyBookingsAsync(Guid customerId, MyBookingQueryParameters parameters)
    {
        var pageNumber = Math.Max(1, parameters.PageNumber);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 100);

        // Bảo vệ quyền hạn (TC4): Bắt buộc chỉ truy vấn booking của chính CustomerId lấy từ token JWT
        var query = _context.Bookings
            .AsNoTracking()
            .Include(b => b.Customer)
            .Include(b => b.Service)
            .Include(b => b.Staff)
            .Where(b => b.CustomerId == customerId);

        if (!string.IsNullOrWhiteSpace(parameters.Status))
        {
            query = query.Where(b => b.Status == parameters.Status.Trim());
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

        // 1. Lọc theo ngày
        if (parameters.Date.HasValue)
        {
            var dayStartUtc = parameters.Date.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var dayEndUtc = parameters.Date.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(b => b.StartTime < dayEndUtc && b.EndTime > dayStartUtc);
        }

        // 2. Lọc theo trạng thái
        if (!string.IsNullOrWhiteSpace(parameters.Status))
        {
            query = query.Where(b => b.Status == parameters.Status.Trim());
        }

        // 3. Lọc theo nhân viên
        if (parameters.StaffId.HasValue)
        {
            query = query.Where(b => b.StaffId == parameters.StaffId.Value);
        }

        // 4. Tìm kiếm theo mã booking, tên khách, email khách hoặc tên dịch vụ
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

        // Khách hàng chỉ xem được đơn của chính mình (TC4)
        if (!isAdmin && booking.CustomerId != currentUserId)
        {
            throw new NotFoundException($"Không tìm thấy đơn đặt lịch với mã ID: {id}");
        }

        return new BookingDto
        {
            Id = booking.Id,
            BookingCode = booking.BookingCode,
            CustomerId = booking.CustomerId,
            CustomerName = booking.Customer.FullName,
            CustomerEmail = booking.Customer.Email,
            ServiceId = booking.ServiceId,
            ServiceName = booking.Service.Name,
            ServicePrice = booking.Service.Price,
            DurationMinutes = booking.Service.DurationMinutes,
            StaffId = booking.StaffId,
            StaffName = booking.Staff.FullName,
            StartTime = booking.StartTime,
            EndTime = booking.EndTime,
            Status = booking.Status,
            CustomerNote = booking.CustomerNote,
            CancellationReason = booking.CancellationReason,
            CreatedAt = booking.CreatedAt
        };
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

        // Kiểm tra luồng trạng thái (State Transition Rules):
        // 1. Không thay đổi đơn đã hoàn thành (Completed)
        if (booking.Status == BookingStatus.Completed)
        {
            throw new BadRequestException("Không thể thay đổi trạng thái của đơn đặt lịch đã hoàn thành.");
        }

        // 2. Không thay đổi đơn đã bị hủy (Cancelled)
        if (booking.Status == BookingStatus.Cancelled)
        {
            throw new BadRequestException("Không thể thay đổi trạng thái của đơn đặt lịch đã bị hủy.");
        }

        // 3. Đơn Pending không thể nhảy thẳng lên Completed mà phải qua Confirmed
        if (booking.Status == BookingStatus.Pending && newStatus == BookingStatus.Completed)
        {
            throw new BadRequestException("Đơn đặt lịch cần được xác nhận (Confirmed) trước khi chuyển sang Hoàn thành (Completed).");
        }

        booking.Status = newStatus;
        await _context.SaveChangesAsync();

        return new BookingDto
        {
            Id = booking.Id,
            BookingCode = booking.BookingCode,
            CustomerId = booking.CustomerId,
            CustomerName = booking.Customer.FullName,
            CustomerEmail = booking.Customer.Email,
            ServiceId = booking.ServiceId,
            ServiceName = booking.Service.Name,
            ServicePrice = booking.Service.Price,
            DurationMinutes = booking.Service.DurationMinutes,
            StaffId = booking.StaffId,
            StaffName = booking.Staff.FullName,
            StartTime = booking.StartTime,
            EndTime = booking.EndTime,
            Status = booking.Status,
            CustomerNote = booking.CustomerNote,
            CancellationReason = booking.CancellationReason,
            CreatedAt = booking.CreatedAt
        };
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

        // 1. Kiểm tra quyền sở hữu (Customer chỉ được hủy đơn của mình)
        if (!isAdmin && booking.CustomerId != currentUserId)
        {
            throw new NotFoundException($"Không tìm thấy đơn đặt lịch với mã ID: {id}");
        }

        // 2. Không hủy đơn đã bị hủy trước đó
        if (booking.Status == BookingStatus.Cancelled)
        {
            throw new BadRequestException("Đơn đặt lịch này đã được hủy trước đó.");
        }

        // 3. Không hủy đơn đã hoàn thành (TC6)
        if (booking.Status == BookingStatus.Completed)
        {
            throw new BadRequestException("Không thể hủy đơn đặt lịch đã hoàn thành.");
        }

        // 4. Không hủy đơn đã bắt đầu hoặc đã diễn ra trong quá khứ
        if (booking.StartTime <= DateTime.UtcNow)
        {
            throw new BadRequestException("Không thể hủy đơn đặt lịch đã bắt đầu hoặc đã diễn ra trong quá khứ.");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancellationReason = request.CancellationReason.Trim();

        await _context.SaveChangesAsync();

        return new BookingDto
        {
            Id = booking.Id,
            BookingCode = booking.BookingCode,
            CustomerId = booking.CustomerId,
            CustomerName = booking.Customer.FullName,
            CustomerEmail = booking.Customer.Email,
            ServiceId = booking.ServiceId,
            ServiceName = booking.Service.Name,
            ServicePrice = booking.Service.Price,
            DurationMinutes = booking.Service.DurationMinutes,
            StaffId = booking.StaffId,
            StaffName = booking.Staff.FullName,
            StartTime = booking.StartTime,
            EndTime = booking.EndTime,
            Status = booking.Status,
            CustomerNote = booking.CustomerNote,
            CancellationReason = booking.CancellationReason,
            CreatedAt = booking.CreatedAt
        };
    }
}
