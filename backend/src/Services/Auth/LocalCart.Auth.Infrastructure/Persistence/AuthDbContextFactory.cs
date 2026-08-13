using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace LocalCart.Auth.Infrastructure.Persistence;

public sealed class AuthDbContextFactory : IDesignTimeDbContextFactory<AuthDbContext>
{
    public AuthDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AuthDbContext>()
            .UseNpgsql(
                "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres",
                npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "identity"))
            .Options;
        return new AuthDbContext(options);
    }
}
