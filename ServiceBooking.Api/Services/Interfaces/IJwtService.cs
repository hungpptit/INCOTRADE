using ServiceBooking.Api.Models;

namespace ServiceBooking.Api.Services.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
}
