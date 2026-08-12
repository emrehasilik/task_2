using LocalCart.Product.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace LocalCart.Product.Api.Health;

internal sealed class ProductDatabaseHealthCheck(ProductDbContext dbContext) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default) =>
        await dbContext.Database.CanConnectAsync(cancellationToken)
            ? HealthCheckResult.Healthy("Product database is reachable.")
            : HealthCheckResult.Unhealthy("Product database is unreachable.");
}
