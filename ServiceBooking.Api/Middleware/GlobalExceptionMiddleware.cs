using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using ServiceBooking.Api.Exceptions;

namespace ServiceBooking.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        int statusCode;
        string title;
        string detail;

        switch (exception)
        {
            case AppException appEx:
                statusCode = appEx.StatusCode;
                title = GetTitleForStatusCode(statusCode);
                detail = appEx.Message;
                _logger.LogWarning(exception, "AppException caught: [{StatusCode}] {Message}", statusCode, appEx.Message);
                break;

            case KeyNotFoundException:
                statusCode = (int)HttpStatusCode.NotFound;
                title = "Not Found";
                detail = exception.Message;
                _logger.LogWarning(exception, "Resource not found: {Message}", exception.Message);
                break;

            case UnauthorizedAccessException:
                statusCode = (int)HttpStatusCode.Unauthorized;
                title = "Unauthorized";
                detail = "Bạn không có quyền thực hiện hành động này.";
                _logger.LogWarning(exception, "Unauthorized access attempt: {Message}", exception.Message);
                break;

            default:
                statusCode = (int)HttpStatusCode.InternalServerError;
                title = "Internal Server Error";
                // Che giấu chi tiết lỗi ở Production để đảm bảo an toàn bảo mật
                detail = _env.IsDevelopment()
                    ? exception.Message
                    : "Đã có lỗi hệ thống xảy ra, vui lòng thử lại sau.";
                _logger.LogError(exception, "Unhandled exception occurred: {Message}", exception.Message);
                break;
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }

    private static string GetTitleForStatusCode(int statusCode) => statusCode switch
    {
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        409 => "Conflict",
        _ => "An error occurred"
    };
}
