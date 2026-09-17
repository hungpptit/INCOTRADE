namespace ServiceBooking.Api.DTOs.Schedules;

public class ScheduleQueryParameters
{
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
}
