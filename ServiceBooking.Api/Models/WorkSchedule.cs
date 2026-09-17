namespace ServiceBooking.Api.Models;

public class WorkSchedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StaffId { get; set; }
    public DateOnly WorkDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    // Navigation property
    public Staff Staff { get; set; } = null!;
}
