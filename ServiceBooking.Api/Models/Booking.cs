using ServiceBooking.Api.Common;

namespace ServiceBooking.Api.Models;

public class Booking
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string BookingCode { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public Guid ServiceId { get; set; }
    public Guid StaffId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = BookingStatus.Pending;
    public string? CustomerNote { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Customer { get; set; } = null!;
    public Service Service { get; set; } = null!;
    public Staff Staff { get; set; } = null!;
}
