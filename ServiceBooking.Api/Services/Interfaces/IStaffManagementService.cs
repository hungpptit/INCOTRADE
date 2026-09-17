using ServiceBooking.Api.DTOs.Schedules;
using ServiceBooking.Api.DTOs.Staffs;

namespace ServiceBooking.Api.Services.Interfaces;

public interface IStaffManagementService
{
    Task<List<StaffDto>> GetStaffsAsync(StaffQueryParameters parameters, bool isAdmin);
    Task<StaffDto> GetStaffByIdAsync(Guid id);
    Task<StaffDto> CreateStaffAsync(CreateStaffRequest request);
    Task<StaffDto> UpdateStaffAsync(Guid id, UpdateStaffRequest request);
    Task<List<WorkScheduleDto>> GetStaffSchedulesAsync(Guid staffId, ScheduleQueryParameters parameters);
    Task<WorkScheduleDto> CreateWorkScheduleAsync(Guid staffId, CreateWorkScheduleRequest request);
}
