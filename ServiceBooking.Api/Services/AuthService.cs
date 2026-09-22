using Microsoft.EntityFrameworkCore;
using ServiceBooking.Api.Data;
using ServiceBooking.Api.DTOs.Auth;
using ServiceBooking.Api.Exceptions;
using ServiceBooking.Api.Services.Interfaces;

namespace ServiceBooking.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthService(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    // Dummy hash chống timing attack
    private static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword("Dummy@123456");

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLower();

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        var passwordHashToVerify = user?.PasswordHash ?? DummyHash;
        var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, passwordHashToVerify);

        if (user == null || !isPasswordValid)
        {
            throw new BadRequestException("Email hoặc mật khẩu không chính xác.");
        }

        var token = _jwtService.GenerateToken(user);

        return new LoginResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role
            }
        };
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new NotFoundException("Không tìm thấy thông tin người dùng.");
        }

        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }
}
