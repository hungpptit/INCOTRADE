using System.ComponentModel.DataAnnotations;

namespace ServiceBooking.Api.DTOs.Schedules;

public class CreateWorkScheduleRequest
{
    [Required(ErrorMessage = "Ngày làm việc không được để trống.")]
    public DateOnly WorkDate { get; set; }

    [Required(ErrorMessage = "Thời gian bắt đầu ca không được để trống.")]
    public TimeSpan StartTime { get; set; }

    [Required(ErrorMessage = "Thời gian kết thúc ca không được để trống.")]
    public TimeSpan EndTime { get; set; }
}
