using ServiceBooking.Api.DTOs.Auth;

namespace ServiceBooking.Api.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserDto> GetCurrentUserAsync(Guid userId);
}
