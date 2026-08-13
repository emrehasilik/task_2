using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LocalCart.Auth.Infrastructure.Persistence;

public sealed partial class DatabaseInitializer(AuthDbContext dbContext, ILogger<DatabaseInitializer> logger)
{
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        LogApplyingMigrations(logger);
        await dbContext.Database.MigrateAsync(cancellationToken).ConfigureAwait(false);
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Applying Auth database migrations")]
    private static partial void LogApplyingMigrations(ILogger logger);
}
