using Microsoft.EntityFrameworkCore;
using ServiceBooking.Api.Data;
using ServiceBooking.Api.DTOs.Schedules;
using ServiceBooking.Api.DTOs.Staffs;
using ServiceBooking.Api.Exceptions;
using ServiceBooking.Api.Models;
using ServiceBooking.Api.Services.Interfaces;

namespace ServiceBooking.Api.Services;

public class StaffManagementService : IStaffManagementService
{
    private readonly AppDbContext _context;

    public StaffManagementService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<StaffDto>> GetStaffsAsync(StaffQueryParameters parameters, bool isAdmin)
    {
        var query = _context.Staffs.AsNoTracking().AsQueryable();

        // 1. Phân quyền xem IsActive:
        // Khách hàng (hoặc chưa đăng nhập): BẮT BUỘC chỉ xem nhân viên đang hoạt động (IsActive = true)
        // Admin: Được xem toàn bộ, hoặc lọc theo IsActive nếu truyền tham số
        if (!isAdmin)
        {
            query = query.Where(s => s.IsActive);
        }
        else if (parameters.IsActive.HasValue)
        {
            query = query.Where(s => s.IsActive == parameters.IsActive.Value);
        }

        // 2. Tìm kiếm theo họ tên hoặc email
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var searchTerm = parameters.Search.Trim().ToLower();
            query = query.Where(s => s.FullName.ToLower().Contains(searchTerm) || s.Email.ToLower().Contains(searchTerm));
        }

        return await query
            .OrderBy(s => s.FullName)
            .ThenBy(s => s.Id)
            .Select(s => new StaffDto
            {
                Id = s.Id,
                FullName = s.FullName,
                Email = s.Email,
                IsActive = s.IsActive
            })
            .ToListAsync();
    }

    public async Task<StaffDto> GetStaffByIdAsync(Guid id)
    {
        var staff = await _context.Staffs
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (staff == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã ID: {id}");
        }

        return new StaffDto
        {
            Id = staff.Id,
            FullName = staff.FullName,
            Email = staff.Email,
            IsActive = staff.IsActive
        };
    }

    public async Task<StaffDto> CreateStaffAsync(CreateStaffRequest request)
    {
        var emailNormalized = request.Email.Trim().ToLower();
        var isEmailTaken = await _context.Staffs.AnyAsync(s => s.Email.ToLower() == emailNormalized);

        if (isEmailTaken)
        {
            throw new ConflictException("Email nhân viên đã tồn tại trên hệ thống.");
        }

        var staff = new Staff
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = emailNormalized,
            IsActive = request.IsActive
        };

        await _context.Staffs.AddAsync(staff);
        await _context.SaveChangesAsync();

        return new StaffDto
        {
            Id = staff.Id,
            FullName = staff.FullName,
            Email = staff.Email,
            IsActive = staff.IsActive
        };
    }

    public async Task<StaffDto> UpdateStaffAsync(Guid id, UpdateStaffRequest request)
    {
        var staff = await _context.Staffs.FindAsync(id);

        if (staff == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã ID: {id} để cập nhật.");
        }

        var emailNormalized = request.Email.Trim().ToLower();
        var isEmailTaken = await _context.Staffs.AnyAsync(s => s.Id != id && s.Email.ToLower() == emailNormalized);

        if (isEmailTaken)
        {
            throw new ConflictException("Email nhân viên đã được sử dụng bởi nhân viên khác.");
        }

        staff.FullName = request.FullName.Trim();
        staff.Email = emailNormalized;
        staff.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return new StaffDto
        {
            Id = staff.Id,
            FullName = staff.FullName,
            Email = staff.Email,
            IsActive = staff.IsActive
        };
    }

    public async Task<List<WorkScheduleDto>> GetStaffSchedulesAsync(Guid staffId, ScheduleQueryParameters parameters)
    {
        // 1. Kiểm tra nhân viên có tồn tại không -> Nếu không trả về 404 Not Found
        var staff = await _context.Staffs.AsNoTracking().FirstOrDefaultAsync(s => s.Id == staffId);
        if (staff == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã ID: {staffId}");
        }

        var query = _context.WorkSchedules
            .AsNoTracking()
            .Where(ws => ws.StaffId == staffId);

        // 2. Lọc theo khoảng ngày nếu có truyền
        if (parameters.FromDate.HasValue)
        {
            query = query.Where(ws => ws.WorkDate >= parameters.FromDate.Value);
        }
        else
        {
            // Mặc định lấy từ ngày hôm nay trở đi
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            query = query.Where(ws => ws.WorkDate >= today);
        }

        if (parameters.ToDate.HasValue)
        {
            query = query.Where(ws => ws.WorkDate <= parameters.ToDate.Value);
        }

        return await query
            .OrderBy(ws => ws.WorkDate)
            .ThenBy(ws => ws.StartTime)
            .Select(ws => new WorkScheduleDto
            {
                Id = ws.Id,
                StaffId = ws.StaffId,
                StaffName = staff.FullName,
                WorkDate = ws.WorkDate,
                StartTime = ws.StartTime,
                EndTime = ws.EndTime
            })
            .ToListAsync();
    }

    public async Task<WorkScheduleDto> CreateWorkScheduleAsync(Guid staffId, CreateWorkScheduleRequest request)
    {
        // 1. Kiểm tra nhân viên có tồn tại không
        var staff = await _context.Staffs.FindAsync(staffId);
        if (staff == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã ID: {staffId}");
        }

        // 2. Không cho phép tạo lịch cho nhân viên đang bị khóa (Inactive)
        if (!staff.IsActive)
        {
            throw new BadRequestException("Không thể tạo lịch làm việc cho nhân viên đang ngừng hoạt động.");
        }

        // 3. Kiểm tra StartTime < EndTime
        if (request.StartTime >= request.EndTime)
        {
            throw new BadRequestException("Thời gian bắt đầu ca làm việc phải nhỏ hơn thời gian kết thúc.");
        }

        // 4. Kiểm tra ngày làm việc không được ở quá khứ
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.WorkDate < today)
        {
            throw new BadRequestException("Không thể tạo ca làm việc trong quá khứ.");
        }

        // 5. Kiểm tra chống trùng ca làm việc (Shift Overlap Check) trực tiếp tại Database:
        // Hai ca trùng nhau khi: NewStart < ExistingEnd AND NewEnd > ExistingStart
        var isOverlapping = await _context.WorkSchedules
            .AnyAsync(ws => ws.StaffId == staffId 
                         && ws.WorkDate == request.WorkDate 
                         && request.StartTime < ws.EndTime 
                         && request.EndTime > ws.StartTime);

        if (isOverlapping)
        {
            throw new ConflictException($"Ca làm việc ({request.StartTime:hh\\:mm} - {request.EndTime:hh\\:mm}) bị trùng với ca làm việc đã tồn tại của nhân viên trong ngày {request.WorkDate:yyyy-MM-dd}.");
        }

        var schedule = new WorkSchedule
        {
            Id = Guid.NewGuid(),
            StaffId = staffId,
            WorkDate = request.WorkDate,
            StartTime = request.StartTime,
            EndTime = request.EndTime
        };

        await _context.WorkSchedules.AddAsync(schedule);
        await _context.SaveChangesAsync();

        return new WorkScheduleDto
        {
            Id = schedule.Id,
            StaffId = schedule.StaffId,
            StaffName = staff.FullName,
            WorkDate = schedule.WorkDate,
            StartTime = schedule.StartTime,
            EndTime = schedule.EndTime
        };
    }
}
