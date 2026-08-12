using LocalCart.Product.Application.Abstractions.Time;

namespace LocalCart.Product.Infrastructure.Time;

internal sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
