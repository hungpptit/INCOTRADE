using System.ComponentModel.DataAnnotations;

namespace ServiceBooking.Api.DTOs.Bookings;

public class UpdateBookingStatusRequest
{
    [Required(ErrorMessage = "Trạng thái cập nhật không được để trống.")]
    public string Status { get; set; } = string.Empty;
}
