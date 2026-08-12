using LocalCart.Product.Application.Abstractions.Persistence;
using LocalCart.Product.Application.Common.Exceptions;
using LocalCart.Product.Domain.Categories;
using LocalCart.Product.Domain.Products;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using ProductEntity = LocalCart.Product.Domain.Products.Product;

namespace LocalCart.Product.Infrastructure.Persistence;

public sealed class ProductDbContext(DbContextOptions<ProductDbContext> options)
    : DbContext(options), IUnitOfWork
{
    public DbSet<ProductEntity> Products => Set<ProductEntity>();
    public DbSet<Category> Categories => Set<Category>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await base.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            throw new ConflictException("A product with the same unique value already exists.", exception);
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("catalog");
        modelBuilder.HasPostgresExtension("pg_trgm");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ProductDbContext).Assembly);
    }
}
