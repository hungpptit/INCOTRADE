using FluentAssertions;
using ServiceBooking.Api.Common;
using ServiceBooking.Api.Data;
using ServiceBooking.Api.DTOs.Bookings;
using ServiceBooking.Api.Exceptions;
using ServiceBooking.Api.Models;
using ServiceBooking.Api.Services;
using ServiceBooking.Tests.Helpers;
using Xunit;

namespace ServiceBooking.Tests.Services;

public class BookingServiceTests
{
    private readonly Guid _customerId1 = Guid.NewGuid();
    private readonly Guid _customerId2 = Guid.NewGuid();
    private readonly Guid _serviceId = Guid.NewGuid();
    private readonly Guid _staffId = Guid.NewGuid();

    private async Task<(BookingService service, DateOnly testDate)> SetupTestDataAsync(AppDbContext context, int durationMinutes = 30)
    {
        // 1. Thêm 2 Customer
        await context.Users.AddRangeAsync(
            new User
            {
                Id = _customerId1,
                FullName = "Nguyễn Văn Khách 1",
                Email = "customer1@test.com",
                PasswordHash = "hash1",
                Role = UserRoles.Customer
            },
            new User
            {
                Id = _customerId2,
                FullName = "Trần Thị Khách 2",
                Email = "customer2@test.com",
                PasswordHash = "hash2",
                Role = UserRoles.Customer
            }
        );

        // 2. Thêm Dịch vụ
        await context.Services.AddAsync(new Service
        {
            Id = _serviceId,
            Name = "Chăm sóc da mặt chuyên sâu",
            Description = "Dịch vụ thư giãn chăm sóc da mặt cao cấp",
            DurationMinutes = durationMinutes,
            Price = 350000,
            IsActive = true
        });

        // 3. Thêm Nhân viên
        await context.Staffs.AddAsync(new Staff
        {
            Id = _staffId,
            FullName = "Kỹ thuật viên Lê Thị C",
            Email = "staff.c@test.com",
            IsActive = true
        });

        // 4. Thêm Ca làm việc: Ngày mai (hoặc 2 ngày tới), ca sáng 08:00 - 12:00
        var testDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2));
        await context.WorkSchedules.AddAsync(new WorkSchedule
        {
            Id = Guid.NewGuid(),
            StaffId = _staffId,
            WorkDate = testDate,
            StartTime = new TimeSpan(8, 0, 0),
            EndTime = new TimeSpan(12, 0, 0)
        });

        await context.SaveChangesAsync();

        return (new BookingService(context), testDate);
    }

    #region 1. Tính toán thời gian kết thúc (EndTime Calculation)

    [Fact]
    public async Task CreateBookingAsync_ShouldCalculateEndTimeCorrectly()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, testDate) = await SetupTestDataAsync(context, durationMinutes: 45);

        var startTimeUtc = testDate.ToDateTime(new TimeOnly(9, 0, 0), DateTimeKind.Utc);
        var request = new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = startTimeUtc,
            CustomerNote = "Tính đúng EndTime"
        };

        // Act
        var result = await bookingService.CreateBookingAsync(_customerId1, request);

        // Assert
        result.Should().NotBeNull();
        result.StartTime.Should().Be(startTimeUtc);
        result.EndTime.Should().Be(startTimeUtc.AddMinutes(45));
        result.Status.Should().Be(BookingStatus.Pending);
    }

    #endregion

    #region 2. Kiểm tra thời gian đặt lịch

    [Fact]
    public async Task CreateBookingAsync_WhenStartTimeIsInThePast_ShouldThrowBadRequestException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, _) = await SetupTestDataAsync(context);

        var pastStartTime = DateTime.UtcNow.AddDays(-2);
        var request = new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = pastStartTime
        };

        // Act
        Func<Task> act = async () => await bookingService.CreateBookingAsync(_customerId1, request);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.WithMessage("*lớn hơn thời gian hiện tại*");
    }

    [Fact]
    public async Task CreateBookingAsync_WhenDateExceeds7DaysLimit_ShouldThrowBadRequestException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, _) = await SetupTestDataAsync(context);

        var futureBeyond7Days = DateTime.UtcNow.AddDays(15);
        var request = new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = futureBeyond7Days
        };

        // Act
        Func<Task> act = async () => await bookingService.CreateBookingAsync(_customerId1, request);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.WithMessage("*tối đa trong vòng 7 ngày tới*");
    }

    #endregion

    #region 3. Kiểm tra ca làm việc của nhân viên

    [Fact]
    public async Task CreateBookingAsync_WhenStartTimeIsOutsideStaffShift_ShouldThrowBadRequestException()
    {
        // Arrange (Thợ chỉ làm ca sáng 08:00 - 12:00)
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, testDate) = await SetupTestDataAsync(context);

        // Đặt lúc 15:00 (ngoài ca làm việc)
        var afternoonTime = testDate.ToDateTime(new TimeOnly(15, 0, 0), DateTimeKind.Utc);
        var request = new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = afternoonTime
        };

        // Act
        Func<Task> act = async () => await bookingService.CreateBookingAsync(_customerId1, request);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.WithMessage("*không nằm trong ca làm việc*");
    }

    #endregion

    #region 4. Kiểm tra chống trùng lịch (Overlap Check)

    [Fact]
    public async Task CreateBookingAsync_WhenSlotIsAlreadyBooked_ShouldThrowConflictException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, testDate) = await SetupTestDataAsync(context, durationMinutes: 30);

        var slotStart = testDate.ToDateTime(new TimeOnly(9, 0, 0), DateTimeKind.Utc);

        // Customer 1 đặt thành công khung giờ 09:00 - 09:30
        var request1 = new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart
        };
        await bookingService.CreateBookingAsync(_customerId1, request1);

        // Customer 2 cố tình gửi yêu cầu cùng khung giờ 09:00 - 09:30
        var request2 = new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart
        };

        // Act
        Func<Task> act = async () => await bookingService.CreateBookingAsync(_customerId2, request2);

        // Assert (Bắt buộc trả về Conflict 409)
        var ex = await act.Should().ThrowAsync<ConflictException>();
        ex.WithMessage("*vừa được khách hàng khác đặt trước*");
    }

    [Fact]
    public async Task CreateBookingAsync_WhenPartiallyOverlapping_ShouldThrowConflictException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, testDate) = await SetupTestDataAsync(context, durationMinutes: 30);

        // Đơn 1: 09:00 - 09:30
        var slotStart1 = testDate.ToDateTime(new TimeOnly(9, 0, 0), DateTimeKind.Utc);
        await bookingService.CreateBookingAsync(_customerId1, new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart1
        });

        // Đơn 2: 09:15 - 09:45 (Giao khoảng giờ: NewStart < ExistEnd AND NewEnd > ExistStart)
        var slotStart2 = testDate.ToDateTime(new TimeOnly(9, 15, 0), DateTimeKind.Utc);
        var request2 = new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart2
        };

        // Act
        Func<Task> act = async () => await bookingService.CreateBookingAsync(_customerId2, request2);

        // Assert
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateBookingAsync_WhenAdjacentBackToBack_ShouldSucceed()
    {
        // Arrange (Hai khung giờ liền kề: 09:00 - 09:30 và 09:30 - 10:00 -> Không trùng nhau)
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, testDate) = await SetupTestDataAsync(context, durationMinutes: 30);

        var slotStart1 = testDate.ToDateTime(new TimeOnly(9, 0, 0), DateTimeKind.Utc);
        var slotStart2 = testDate.ToDateTime(new TimeOnly(9, 30, 0), DateTimeKind.Utc);

        // Act
        var booking1 = await bookingService.CreateBookingAsync(_customerId1, new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart1
        });

        var booking2 = await bookingService.CreateBookingAsync(_customerId2, new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart2
        });

        // Assert
        booking1.Should().NotBeNull();
        booking2.Should().NotBeNull();
        booking1.EndTime.Should().Be(booking2.StartTime);
    }

    #endregion

    #region 5. Bảo mật dữ liệu cá nhân (Data Ownership)

    [Fact]
    public async Task GetBookingByIdAsync_WhenCustomerAccessesAnotherUsersBooking_ShouldThrowNotFoundException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, testDate) = await SetupTestDataAsync(context);

        var slotStart = testDate.ToDateTime(new TimeOnly(10, 0, 0), DateTimeKind.Utc);
        var booking = await bookingService.CreateBookingAsync(_customerId1, new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart
        });

        // Act: Customer 2 cố tình truy cập đơn của Customer 1
        Func<Task> act = async () => await bookingService.GetBookingByIdAsync(booking.Id, currentUserId: _customerId2, isAdmin: false);

        // Assert: Trả về NotFoundException (404) để bảo mật sự tồn tại của đơn
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetBookingByIdAsync_WhenAdminAccessesAnyBooking_ShouldReturnBooking()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, testDate) = await SetupTestDataAsync(context);

        var slotStart = testDate.ToDateTime(new TimeOnly(10, 0, 0), DateTimeKind.Utc);
        var booking = await bookingService.CreateBookingAsync(_customerId1, new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart
        });

        var adminId = Guid.NewGuid();

        // Act: Admin truy cập đơn của Customer 1
        var result = await bookingService.GetBookingByIdAsync(booking.Id, currentUserId: adminId, isAdmin: true);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(booking.Id);
    }

    #endregion

    #region 6. Kiểm tra quy trình chuyển trạng thái đơn

    [Fact]
    public async Task UpdateBookingStatusAsync_WhenPendingToCompletedDirectly_ShouldThrowBadRequestException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, testDate) = await SetupTestDataAsync(context);

        var slotStart = testDate.ToDateTime(new TimeOnly(10, 0, 0), DateTimeKind.Utc);
        var booking = await bookingService.CreateBookingAsync(_customerId1, new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart
        });

        // Act: Thử chuyển thẳng từ Pending sang Completed mà chưa qua Confirmed
        var request = new UpdateBookingStatusRequest { Status = BookingStatus.Completed };
        Func<Task> act = async () => await bookingService.UpdateBookingStatusAsync(booking.Id, request);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.WithMessage("*xác nhận (Confirmed) trước khi chuyển sang Hoàn thành*");
    }

    [Fact]
    public async Task UpdateBookingStatusAsync_WhenStatusIsCancelled_ShouldThrowBadRequestException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, testDate) = await SetupTestDataAsync(context);

        var slotStart = testDate.ToDateTime(new TimeOnly(10, 0, 0), DateTimeKind.Utc);
        var booking = await bookingService.CreateBookingAsync(_customerId1, new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart
        });

        // Act
        var request = new UpdateBookingStatusRequest { Status = BookingStatus.Cancelled };
        Func<Task> act = async () => await bookingService.UpdateBookingStatusAsync(booking.Id, request);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.WithMessage("*sử dụng chức năng Hủy đơn*");
    }

    #endregion

    #region 7. Quy tắc hủy lịch hẹn

    [Fact]
    public async Task CancelBookingAsync_WhenBookingIsCompleted_ShouldThrowBadRequestException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, testDate) = await SetupTestDataAsync(context);

        var slotStart = testDate.ToDateTime(new TimeOnly(11, 0, 0), DateTimeKind.Utc);
        var booking = await bookingService.CreateBookingAsync(_customerId1, new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart
        });

        // Duyệt đơn: Pending -> Confirmed -> Completed
        await bookingService.UpdateBookingStatusAsync(booking.Id, new UpdateBookingStatusRequest { Status = BookingStatus.Confirmed });
        await bookingService.UpdateBookingStatusAsync(booking.Id, new UpdateBookingStatusRequest { Status = BookingStatus.Completed });

        // Act: Khách hàng cố tình gửi yêu cầu hủy đơn đã Completed
        var cancelReq = new CancelBookingRequest { CancellationReason = "Bận việc đột xuất" };
        Func<Task> act = async () => await bookingService.CancelBookingAsync(booking.Id, _customerId1, isAdmin: false, cancelReq);

        // Assert (Bắt buộc chặn với BadRequestException)
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.WithMessage("*đã hoàn thành*");
    }

    [Fact]
    public async Task CancelBookingAsync_WhenBookingStartTimeIsInThePast_ShouldThrowBadRequestException()
    {
        // Arrange: Tạo trực tiếp đơn đã diễn ra trong quá khứ
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, _) = await SetupTestDataAsync(context);

        var pastBooking = new Booking
        {
            Id = Guid.NewGuid(),
            BookingCode = "BK-PAST-TEST",
            CustomerId = _customerId1,
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = DateTime.UtcNow.AddHours(-3),
            EndTime = DateTime.UtcNow.AddHours(-2),
            Status = BookingStatus.Confirmed,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };
        await context.Bookings.AddAsync(pastBooking);
        await context.SaveChangesAsync();

        // Act
        var cancelReq = new CancelBookingRequest { CancellationReason = "Tôi muốn hủy" };
        Func<Task> act = async () => await bookingService.CancelBookingAsync(pastBooking.Id, _customerId1, isAdmin: false, cancelReq);

        // Assert
        var ex = await act.Should().ThrowAsync<BadRequestException>();
        ex.WithMessage("*đã bắt đầu hoặc đã diễn ra trong quá khứ*");
    }

    [Fact]
    public async Task CancelBookingAsync_WhenValidPendingBooking_ShouldCancelSuccessfully()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateInMemoryDbContext();
        var (bookingService, testDate) = await SetupTestDataAsync(context);

        var slotStart = testDate.ToDateTime(new TimeOnly(11, 0, 0), DateTimeKind.Utc);
        var booking = await bookingService.CreateBookingAsync(_customerId1, new CreateBookingRequest
        {
            ServiceId = _serviceId,
            StaffId = _staffId,
            StartTime = slotStart
        });

        // Act
        var cancelReq = new CancelBookingRequest { CancellationReason = "Có lịch họp đột xuất tại công ty" };
        var cancelled = await bookingService.CancelBookingAsync(booking.Id, _customerId1, isAdmin: false, cancelReq);

        // Assert
        cancelled.Status.Should().Be(BookingStatus.Cancelled);
        cancelled.CancellationReason.Should().Be("Có lịch họp đột xuất tại công ty");
    }

    #endregion
}
