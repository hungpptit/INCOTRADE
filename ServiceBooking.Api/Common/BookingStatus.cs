namespace ServiceBooking.Api.Common;

public static class BookingStatus
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    public static readonly string[] AllStatuses = { Pending, Confirmed, Completed, Cancelled };
}
