namespace ServiceBooking.Api.DTOs.Bookings;

public class BookingQueryParameters
{
    public DateOnly? Date { get; set; }
    public string? Status { get; set; }
    public Guid? StaffId { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
