#pragma warning disable CA1848
using System.Security.Authentication;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using RetroMessenger.Domain.Common;

namespace RetroMessenger.Api.Middleware;

public sealed class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, code, title) = exception switch
        {
            DomainException => (
                StatusCodes.Status400BadRequest,
                "DOMAIN_VALIDATION_FAILED",
                exception.Message),
            KeyNotFoundException => (
                StatusCodes.Status404NotFound,
                "RESOURCE_NOT_FOUND",
                exception.Message),
            AuthenticationException => (
                StatusCodes.Status401Unauthorized,
                "AUTHENTICATION_FAILED",
                "Authentication failed."),
            UnauthorizedAccessException => (
                StatusCodes.Status403Forbidden,
                "ACCESS_DENIED",
                exception.Message),
            _ => (
                StatusCodes.Status500InternalServerError,
                "UNEXPECTED_ERROR",
                "An unexpected error occurred.")
        };

        if (status >= 500)
        {
            logger.LogError(
                exception,
                "Unhandled request error. TraceId: {TraceId}",
                httpContext.TraceIdentifier);
        }

        httpContext.Response.StatusCode = status;

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Type = $"https://errors.retromessenger.local/{code.ToLowerInvariant()}",
            Instance = httpContext.Request.Path
        };

        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = httpContext.TraceIdentifier;

        return await problemDetailsService.TryWriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = httpContext,
                ProblemDetails = problem,
                Exception = exception
            });
    }
}
