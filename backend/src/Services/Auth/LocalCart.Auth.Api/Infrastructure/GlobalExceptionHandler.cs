using System.Diagnostics;
using FluentValidation;
using LocalCart.Auth.Application.Common.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace LocalCart.Auth.Api.Infrastructure;

internal sealed partial class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, title) = exception switch
        {
            ValidationException => (StatusCodes.Status400BadRequest, "Validation failed"),
            AuthenticationException => (StatusCodes.Status401Unauthorized, "Authentication failed"),
            NotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
            ConflictException => (StatusCodes.Status409Conflict, "Conflict"),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
        };

        if (status >= 500)
        {
            LogUnhandledException(logger, httpContext.TraceIdentifier, exception);
        }
        else
        {
            LogExpectedException(logger, exception.GetType().Name, exception.Message);
        }

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = status == StatusCodes.Status500InternalServerError ? null : exception.Message,
            Instance = httpContext.Request.Path,
            Type = $"https://httpstatuses.com/{status}"
        };
        problem.Extensions["traceId"] = Activity.Current?.Id ?? httpContext.TraceIdentifier;

        if (exception is ValidationException validationException)
        {
            problem.Extensions["errors"] = validationException.Errors
                .GroupBy(error => error.PropertyName)
                .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).Distinct().ToArray());
        }

        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken).ConfigureAwait(false);
        return true;
    }

    [LoggerMessage(1001, LogLevel.Error, "Unhandled exception. TraceId: {TraceId}")]
    private static partial void LogUnhandledException(ILogger logger, string traceId, Exception exception);

    [LoggerMessage(1002, LogLevel.Warning, "Request failed with {ExceptionType}: {Message}")]
    private static partial void LogExpectedException(ILogger logger, string exceptionType, string message);
}
