using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace AMS.Api.Middleware
{
    public class GlobalExceptionHandler
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
        {
            _next = next;
            _logger = logger;
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
            context.Response.ContentType = "application/json";

            var response = new
            {
                message = "An error occurred while processing your request.",
                error = exception.Message,
                timestamp = DateTime.UtcNow,
                path = context.Request.Path,
                method = context.Request.Method
            };

            switch (exception)
            {
                case ArgumentNullException:
                case ArgumentException:
                case InvalidOperationException:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response = new
                    {
                        message = "Invalid request data.",
                        error = exception.Message,
                        timestamp = DateTime.UtcNow,
                        path = context.Request.Path,
                        method = context.Request.Method
                    };
                    break;

                case UnauthorizedAccessException:
                    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    response = new
                    {
                        message = "Access denied.",
                        error = exception.Message,
                        timestamp = DateTime.UtcNow,
                        path = context.Request.Path,
                        method = context.Request.Method
                    };
                    break;

                case KeyNotFoundException:
                case FileNotFoundException:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    response = new
                    {
                        message = "Resource not found.",
                        error = exception.Message,
                        timestamp = DateTime.UtcNow,
                        path = context.Request.Path,
                        method = context.Request.Method
                    };
                    break;

                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    _logger.LogError(exception, "Unhandled exception occurred: {Message}", exception.Message);
                    break;
            }

            var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(jsonResponse);
        }
    }
} 