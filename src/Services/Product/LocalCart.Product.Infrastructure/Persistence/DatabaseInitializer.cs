using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LocalCart.Product.Infrastructure.Persistence;

public sealed partial class DatabaseInitializer(ProductDbContext dbContext, ILogger<DatabaseInitializer> logger)
{
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        LogApplyingMigrations(logger);
        await dbContext.Database.MigrateAsync(cancellationToken).ConfigureAwait(false);
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Applying Product database migrations")]
    private static partial void LogApplyingMigrations(ILogger logger);
}
