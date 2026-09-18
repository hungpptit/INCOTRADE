using System.ComponentModel.DataAnnotations;

namespace ServiceBooking.Api.DTOs.Bookings;

public class MyBookingQueryParameters
{
    public DateOnly? Date { get; set; }
    public string? Status { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "PageNumber phải lớn hơn hoặc bằng 1.")]
    public int PageNumber { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "PageSize phải từ 1 đến 100.")]
    public int PageSize { get; set; } = 10;

    /// <summary>
    /// Tiêu chí sắp xếp: "Newest" (mới đặt - mặc định), "StartTimeAsc" (ngày hẹn sớm nhất), "StartTimeDesc" (ngày hẹn muộn nhất)
    /// </summary>
    public string? SortBy { get; set; } = "Newest";
}
