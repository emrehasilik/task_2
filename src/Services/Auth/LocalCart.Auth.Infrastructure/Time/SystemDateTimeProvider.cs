using LocalCart.Auth.Application.Abstractions.Time;

namespace LocalCart.Auth.Infrastructure.Time;

internal sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
