namespace ServiceBooking.Api.Exceptions;

public class BadRequestException : AppException
{
    public BadRequestException(string message) : base(message, 400)
    {
    }
}
