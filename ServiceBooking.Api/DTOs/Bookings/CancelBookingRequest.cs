using System.ComponentModel.DataAnnotations;

namespace ServiceBooking.Api.DTOs.Bookings;

public class CancelBookingRequest
{
    [Required(ErrorMessage = "Lý do hủy đặt lịch không được để trống.")]
    [MinLength(3, ErrorMessage = "Lý do hủy phải có ít nhất 3 ký tự.")]
    [MaxLength(500, ErrorMessage = "Lý do hủy không được vượt quá 500 ký tự.")]
    public string CancellationReason { get; set; } = string.Empty;
}
