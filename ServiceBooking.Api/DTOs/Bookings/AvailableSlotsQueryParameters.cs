using System.ComponentModel.DataAnnotations;

namespace ServiceBooking.Api.DTOs.Bookings;

public class AvailableSlotsQueryParameters
{
    [Required(ErrorMessage = "Vui lòng chọn dịch vụ.")]
    public Guid ServiceId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn nhân viên.")]
    public Guid StaffId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn ngày.")]
    public DateOnly Date { get; set; }
}
