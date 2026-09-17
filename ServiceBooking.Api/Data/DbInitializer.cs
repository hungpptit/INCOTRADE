using Microsoft.EntityFrameworkCore;
using ServiceBooking.Api.Common;
using ServiceBooking.Api.Models;

namespace ServiceBooking.Api.Data;

public static class DbInitializer
{
    public static async Task SeedDataAsync(AppDbContext context)
    {
        // Kiểm tra nếu đã có dữ liệu thì không seed lại
        if (await context.Users.AnyAsync())
        {
            return;
        }

        // ==========================================================
        // 1. SEED USERS (1 Admin, 2 Customer) - Mật khẩu: Demo@123456
        // ==========================================================
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123456");

        var adminUser = new User
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            FullName = "Quản Trị Viên",
            Email = "admin@booking.com",
            PasswordHash = passwordHash,
            Role = UserRoles.Admin
        };

        var customer1 = new User
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            FullName = "Nguyễn Văn Khách",
            Email = "customer1@gmail.com",
            PasswordHash = passwordHash,
            Role = UserRoles.Customer
        };

        var customer2 = new User
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            FullName = "Trần Thị Hoa",
            Email = "customer2@gmail.com",
            PasswordHash = passwordHash,
            Role = UserRoles.Customer
        };

        await context.Users.AddRangeAsync(adminUser, customer1, customer2);

        // ==========================================================
        // 2. SEED STAFFS (2 nhân viên hoạt động)
        // ==========================================================
        var staff1 = new Staff
        {
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FullName = "Nguyễn Văn A",
            Email = "staff1@booking.com",
            IsActive = true
        };

        var staff2 = new Staff
        {
            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            FullName = "Trần Thị B",
            Email = "staff2@booking.com",
            IsActive = true
        };

        await context.Staffs.AddRangeAsync(staff1, staff2);

        // ==========================================================
        // 3. SEED SERVICES (5 dịch vụ theo đúng thuộc tính đề bài)
        // ==========================================================
        var service1 = new Service
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Name = "Cắt tóc nam tiêu chuẩn",
            Description = "Cắt và tạo kiểu tóc nam chuyên nghiệp, tư vấn mẫu tóc phù hợp khuôn mặt.",
            DurationMinutes = 30,
            Price = 100000,
            IsActive = true
        };

        var service2 = new Service
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            Name = "Cạo râu & Massage mặt",
            Description = "Cạo râu bọt ấm, đắp khăn nóng và massage thư giãn da mặt.",
            DurationMinutes = 30,
            Price = 80000,
            IsActive = true
        };

        var service3 = new Service
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            Name = "Combo Cắt gội thư giãn",
            Description = "Combo cắt tóc, gội đầu dưỡng sinh bấm huyệt cổ vai gáy.",
            DurationMinutes = 60,
            Price = 200000,
            IsActive = true
        };

        var service4 = new Service
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
            Name = "Nhuộm tóc thời trang",
            Description = "Nhuộm màu thời trang với thuốc nhuộm thảo dược bảo vệ tóc.",
            DurationMinutes = 90,
            Price = 450000,
            IsActive = true
        };

        var service5 = new Service
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000005"),
            Name = "Chăm sóc da chuyên sâu",
            Description = "Làm sạch sâu, tẩy tế bào chết và đắp mặt nạ thảo mộc dưỡng ẩm.",
            DurationMinutes = 60,
            Price = 350000,
            IsActive = true
        };

        await context.Services.AddRangeAsync(service1, service2, service3, service4, service5);

        // ==========================================================
        // 4. SEED WORK SCHEDULES (Lịch 7 ngày tính ĐỘNG từ thời điểm chạy)
        // ==========================================================
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var workSchedules = new List<WorkSchedule>();

        for (int i = 0; i < 7; i++)
        {
            var workDate = today.AddDays(i);

            // Ca sáng: 08:30 - 12:30 | Ca chiều: 13:30 - 17:30
            // Cho Staff 1
            workSchedules.Add(new WorkSchedule
            {
                Id = Guid.NewGuid(),
                StaffId = staff1.Id,
                WorkDate = workDate,
                StartTime = new TimeSpan(8, 30, 0),
                EndTime = new TimeSpan(12, 30, 0)
            });
            workSchedules.Add(new WorkSchedule
            {
                Id = Guid.NewGuid(),
                StaffId = staff1.Id,
                WorkDate = workDate,
                StartTime = new TimeSpan(13, 30, 0),
                EndTime = new TimeSpan(17, 30, 0)
            });

            // Cho Staff 2
            workSchedules.Add(new WorkSchedule
            {
                Id = Guid.NewGuid(),
                StaffId = staff2.Id,
                WorkDate = workDate,
                StartTime = new TimeSpan(8, 30, 0),
                EndTime = new TimeSpan(12, 30, 0)
            });
            workSchedules.Add(new WorkSchedule
            {
                Id = Guid.NewGuid(),
                StaffId = staff2.Id,
                WorkDate = workDate,
                StartTime = new TimeSpan(13, 30, 0),
                EndTime = new TimeSpan(17, 30, 0)
            });
        }

        await context.WorkSchedules.AddRangeAsync(workSchedules);

        // ==========================================================
        // 5. SEED BOOKINGS (10 booking đủ trạng thái, tính ĐỘNG theo ngày chạy)
        // ==========================================================
        var baseDate = DateTime.UtcNow.Date;

        var bookings = new List<Booking>
        {
            // --- ĐÃ HOÀN THÀNH (Hôm qua) ---
            new()
            {
                Id = Guid.NewGuid(),
                BookingCode = "BK" + baseDate.AddDays(-1).ToString("yyyyMMdd") + "01",
                CustomerId = customer1.Id,
                ServiceId = service1.Id, // 30 mins
                StaffId = staff1.Id,
                StartTime = DateTime.SpecifyKind(baseDate.AddDays(-1).AddHours(9), DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(baseDate.AddDays(-1).AddHours(9).AddMinutes(30), DateTimeKind.Utc),
                Status = BookingStatus.Completed,
                CustomerNote = "Cắt ngắn gọn gàng",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new()
            {
                Id = Guid.NewGuid(),
                BookingCode = "BK" + baseDate.AddDays(-1).ToString("yyyyMMdd") + "02",
                CustomerId = customer2.Id,
                ServiceId = service3.Id, // 60 mins
                StaffId = staff2.Id,
                StartTime = DateTime.SpecifyKind(baseDate.AddDays(-1).AddHours(14), DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(baseDate.AddDays(-1).AddHours(15), DateTimeKind.Utc),
                Status = BookingStatus.Completed,
                CustomerNote = "Gội nước ấm nhẹ nhàng",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },

            // --- ĐÃ HỦY (Hôm qua & tương lai, có kèm lý do hủy) ---
            new()
            {
                Id = Guid.NewGuid(),
                BookingCode = "BK" + baseDate.AddDays(-1).ToString("yyyyMMdd") + "03",
                CustomerId = customer1.Id,
                ServiceId = service2.Id, // 30 mins
                StaffId = staff2.Id,
                StartTime = DateTime.SpecifyKind(baseDate.AddDays(-1).AddHours(10), DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(baseDate.AddDays(-1).AddHours(10).AddMinutes(30), DateTimeKind.Utc),
                Status = BookingStatus.Cancelled,
                CustomerNote = null,
                CancellationReason = "Khách bận việc đột xuất không thể tới đúng hẹn.",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new()
            {
                Id = Guid.NewGuid(),
                BookingCode = "BK" + baseDate.AddDays(3).ToString("yyyyMMdd") + "04",
                CustomerId = customer2.Id,
                ServiceId = service1.Id, // 30 mins
                StaffId = staff1.Id,
                StartTime = DateTime.SpecifyKind(baseDate.AddDays(3).AddHours(10), DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(baseDate.AddDays(3).AddHours(10).AddMinutes(30), DateTimeKind.Utc),
                Status = BookingStatus.Cancelled,
                CustomerNote = "Đổi kế hoạch đi công tác",
                CancellationReason = "Trùng lịch họp công ty, hẹn lại dịp sau.",
                CreatedAt = DateTime.UtcNow.AddHours(-3)
            },

            // --- ĐÃ XÁC NHẬN (Hôm nay & ngày tới) ---
            new()
            {
                Id = Guid.NewGuid(),
                BookingCode = "BK" + baseDate.ToString("yyyyMMdd") + "05",
                CustomerId = customer1.Id,
                ServiceId = service1.Id, // 30 mins
                StaffId = staff1.Id,
                StartTime = DateTime.SpecifyKind(baseDate.AddHours(9), DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(baseDate.AddHours(9).AddMinutes(30), DateTimeKind.Utc),
                Status = BookingStatus.Confirmed,
                CustomerNote = "Đến sớm 5 phút",
                CreatedAt = DateTime.UtcNow.AddHours(-5)
            },
            new()
            {
                Id = Guid.NewGuid(),
                BookingCode = "BK" + baseDate.ToString("yyyyMMdd") + "06",
                CustomerId = customer2.Id,
                ServiceId = service3.Id, // 60 mins
                StaffId = staff1.Id,
                StartTime = DateTime.SpecifyKind(baseDate.AddHours(10), DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(baseDate.AddHours(11), DateTimeKind.Utc),
                Status = BookingStatus.Confirmed,
                CustomerNote = "Yêu cầu thợ A làm",
                CreatedAt = DateTime.UtcNow.AddHours(-4)
            },
            new()
            {
                Id = Guid.NewGuid(),
                BookingCode = "BK" + baseDate.AddDays(2).ToString("yyyyMMdd") + "07",
                CustomerId = customer1.Id,
                ServiceId = service5.Id, // 60 mins
                StaffId = staff2.Id,
                StartTime = DateTime.SpecifyKind(baseDate.AddDays(2).AddHours(14), DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(baseDate.AddDays(2).AddHours(15), DateTimeKind.Utc),
                Status = BookingStatus.Confirmed,
                CustomerNote = "Chăm sóc da trước tiệc cưới",
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            },

            // --- ĐANG CHỜ DUYỆT (PENDING) ---
            new()
            {
                Id = Guid.NewGuid(),
                BookingCode = "BK" + baseDate.AddDays(1).ToString("yyyyMMdd") + "08",
                CustomerId = customer1.Id,
                ServiceId = service3.Id, // 60 mins
                StaffId = staff1.Id,
                StartTime = DateTime.SpecifyKind(baseDate.AddDays(1).AddHours(9), DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(baseDate.AddDays(1).AddHours(10), DateTimeKind.Utc),
                Status = BookingStatus.Pending,
                CustomerNote = "Đặt lịch cắt gội đầu ngày",
                CreatedAt = DateTime.UtcNow.AddHours(-1)
            },
            new()
            {
                Id = Guid.NewGuid(),
                BookingCode = "BK" + baseDate.AddDays(1).ToString("yyyyMMdd") + "09",
                CustomerId = customer2.Id,
                ServiceId = service4.Id, // 90 mins
                StaffId = staff2.Id,
                StartTime = DateTime.SpecifyKind(baseDate.AddDays(1).AddHours(14), DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(baseDate.AddDays(1).AddHours(15).AddMinutes(30), DateTimeKind.Utc),
                Status = BookingStatus.Pending,
                CustomerNote = "Tư vấn màu nâu khói",
                CreatedAt = DateTime.UtcNow.AddMinutes(-40)
            },
            new()
            {
                Id = Guid.NewGuid(),
                BookingCode = "BK" + baseDate.AddDays(2).ToString("yyyyMMdd") + "10",
                CustomerId = customer2.Id,
                ServiceId = service2.Id, // 30 mins
                StaffId = staff1.Id,
                StartTime = DateTime.SpecifyKind(baseDate.AddDays(2).AddHours(15), DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(baseDate.AddDays(2).AddHours(15).AddMinutes(30), DateTimeKind.Utc),
                Status = BookingStatus.Pending,
                CustomerNote = null,
                CreatedAt = DateTime.UtcNow.AddMinutes(-10)
            }
        };

        await context.Bookings.AddRangeAsync(bookings);

        // Lưu toàn bộ dữ liệu vào database
        await context.SaveChangesAsync();
    }
}
