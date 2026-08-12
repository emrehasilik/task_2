using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace LocalCart.Product.Api.Health;

internal sealed class RedisHealthCheck(IConnectionMultiplexer connection) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await connection.GetDatabase().PingAsync().WaitAsync(cancellationToken);
            return HealthCheckResult.Healthy("Redis is reachable.");
        }
        catch (Exception exception) when (exception is RedisException or TimeoutException)
        {
            return HealthCheckResult.Unhealthy("Redis is unreachable.", exception);
        }
    }
}
