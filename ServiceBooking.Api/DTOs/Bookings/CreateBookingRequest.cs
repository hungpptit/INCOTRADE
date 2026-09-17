using System.ComponentModel.DataAnnotations;

namespace ServiceBooking.Api.DTOs.Bookings;

public class CreateBookingRequest
{
    [Required(ErrorMessage = "Vui lòng chọn dịch vụ.")]
    public Guid ServiceId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn nhân viên.")]
    public Guid StaffId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn thời gian bắt đầu.")]
    public DateTime StartTime { get; set; }

    [MaxLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự.")]
    public string? CustomerNote { get; set; }
}
