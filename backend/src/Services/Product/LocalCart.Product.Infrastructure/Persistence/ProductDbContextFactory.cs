using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace LocalCart.Product.Infrastructure.Persistence;

public sealed class ProductDbContextFactory : IDesignTimeDbContextFactory<ProductDbContext>
{
    public ProductDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<ProductDbContext>()
            .UseNpgsql(
                "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres",
                npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "catalog"))
            .Options;
        return new ProductDbContext(options);
    }
}
