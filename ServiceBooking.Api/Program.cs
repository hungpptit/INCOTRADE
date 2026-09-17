using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ServiceBooking.Api.Data;
using ServiceBooking.Api.Middleware;
using ServiceBooking.Api.Services;
using ServiceBooking.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// ==========================================================
// 1. CẤU HÌNH DATABASE (PostgreSQL)
// ==========================================================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ==========================================================
// 2. ĐĂNG KÝ DEPENDENCY INJECTION CHO SERVICES
// ==========================================================
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// ==========================================================
// 3. CẤU HÌNH JWT AUTHENTICATION & AUTHORIZATION
// ==========================================================
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Cấu hình Jwt:Key không được để trống.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ServiceBooking.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ServiceBooking.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero // Triệt tiêu độ lệch 5 phút mặc định
    };
});

builder.Services.AddAuthorization();

// ==========================================================
// 4. CẤU HÌNH CORS (Đọc từ Configuration)
// ==========================================================
var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries)
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ==========================================================
// 5. CẤU HÌNH SWAGGER GEN KÈM NÚT AUTHORIZE BEARER
// ==========================================================
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Service Booking Management API",
        Version = "v1",
        Description = "API Quản lý đặt lịch dịch vụ (ASP.NET Core Web API, PostgreSQL, JWT Authentication)"
    });

    // Cấu hình Bearer Security Definition
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT token của bạn theo định dạng: Bearer {token}"
    });

    // Cấu hình Security Requirement
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ==========================================================
// 6. PIPELINE XỬ LÝ REQUEST
// ==========================================================
// Middleware bắt lỗi tập trung (bắt buộc đặt ở vị trí đầu tiên)
app.UseMiddleware<GlobalExceptionMiddleware>();

// Tự động Migration và Seed Data khi khởi chạy
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await context.Database.MigrateAsync();
    await DbInitializer.SeedDataAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Service Booking API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();

// Kích hoạt CORS trước Auth
app.UseCors("FrontendPolicy");

// Kích hoạt Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
