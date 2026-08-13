using LocalCart.Product.Application.Abstractions.Persistence;
using LocalCart.Product.Domain.Products;
using Microsoft.EntityFrameworkCore;
using ProductEntity = LocalCart.Product.Domain.Products.Product;

namespace LocalCart.Product.Infrastructure.Persistence;

internal sealed class ProductWriteRepository(ProductDbContext dbContext) : IProductWriteRepository
{
    public Task<ProductEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.Products.SingleOrDefaultAsync(product => product.Id == id, cancellationToken);

    public Task<string?> GetCategoryNameAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.Categories.AsNoTracking()
            .Where(category => category.Id == id && category.IsActive)
            .Select(category => category.Name)
            .SingleOrDefaultAsync(cancellationToken);

    public Task<bool> SlugExistsAsync(string slug, Guid? excludedProductId, CancellationToken cancellationToken) =>
        dbContext.Products.AsNoTracking().AnyAsync(
            product => product.Slug == slug && (!excludedProductId.HasValue || product.Id != excludedProductId),
            cancellationToken);

    public Task AddAsync(ProductEntity product, CancellationToken cancellationToken) =>
        dbContext.Products.AddAsync(product, cancellationToken).AsTask();
}
