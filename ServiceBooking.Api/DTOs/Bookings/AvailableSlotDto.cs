namespace ServiceBooking.Api.DTOs.Bookings;

public class AvailableSlotDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string FormattedTime { get; set; } = string.Empty;
}
