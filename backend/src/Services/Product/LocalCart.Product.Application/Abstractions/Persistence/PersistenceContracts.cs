using LocalCart.Product.Application.Products;
using LocalCart.Product.Application.Products.Queries.GetProducts;
using LocalCart.Product.Domain.Products;
using ProductEntity = LocalCart.Product.Domain.Products.Product;

namespace LocalCart.Product.Application.Abstractions.Persistence;

public interface IProductWriteRepository
{
    Task<ProductEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<string?> GetCategoryNameAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> SlugExistsAsync(string slug, Guid? excludedProductId, CancellationToken cancellationToken);
    Task AddAsync(ProductEntity product, CancellationToken cancellationToken);
}

public interface IProductReadRepository
{
    Task<PagedResult<ProductResponse>> GetProductsAsync(ProductFilter filter, CancellationToken cancellationToken);
    Task<PagedResult<ProductResponse>> GetSellerProductsAsync(
        Guid sellerId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<ProductResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<CategoryResponse>> GetCategoriesAsync(CancellationToken cancellationToken);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
