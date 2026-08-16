using LocalCart.Product.Application.Abstractions.Persistence;
using LocalCart.Product.Application.Products;
using LocalCart.Product.Application.Products.Queries.GetProducts;
using LocalCart.Product.Domain.Products;
using Microsoft.EntityFrameworkCore;
using ProductEntity = LocalCart.Product.Domain.Products.Product;

namespace LocalCart.Product.Infrastructure.Persistence;

internal sealed class ProductReadRepository(ProductDbContext dbContext) : IProductReadRepository
{
    public async Task<PagedResult<ProductResponse>> GetProductsAsync(
        ProductFilter filter,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Products
            .AsNoTracking()
            .Where(product => product.Status == ProductStatus.Published || product.Status == ProductStatus.OutOfStock);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var pattern = $"%{filter.Search.Trim()}%";
            query = query.Where(product =>
                EF.Functions.ILike(product.Name, pattern) || EF.Functions.ILike(product.Description, pattern));
        }

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(product => product.CategoryId == filter.CategoryId.Value);
        }

        if (filter.MinPrice.HasValue)
        {
            query = query.Where(product => product.Price >= filter.MinPrice.Value);
        }

        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(product => product.Price <= filter.MaxPrice.Value);
        }

        query = filter.Sort switch
        {
            ProductSort.PriceAscending => query.OrderBy(product => product.Price).ThenBy(product => product.Id),
            ProductSort.PriceDescending => query.OrderByDescending(product => product.Price).ThenBy(product => product.Id),
            ProductSort.NameAscending => query.OrderBy(product => product.Name).ThenBy(product => product.Id),
            _ => query.OrderByDescending(product => product.CreatedAtUtc).ThenBy(product => product.Id)
        };

        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);
        var items = await Project(query)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken).ConfigureAwait(false);
        return new PagedResult<ProductResponse>(items, filter.Page, filter.PageSize, totalCount);
    }

    public async Task<PagedResult<ProductResponse>> GetSellerProductsAsync(
        Guid sellerId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Products.AsNoTracking()
            .Where(product => product.SellerId == sellerId)
            .OrderByDescending(product => product.UpdatedAtUtc);
        var totalCount = await query.CountAsync(cancellationToken).ConfigureAwait(false);
        var items = await Project(query)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken).ConfigureAwait(false);
        return new PagedResult<ProductResponse>(items, page, pageSize, totalCount);
    }

    public Task<ProductResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        Project(dbContext.Products.AsNoTracking()
                .Where(product => product.Id == id &&
                    (product.Status == ProductStatus.Published || product.Status == ProductStatus.OutOfStock)))
            .SingleOrDefaultAsync(cancellationToken);

    public Task<ProductResponse?> GetSellerProductByIdAsync(
        Guid id,
        Guid sellerId,
        CancellationToken cancellationToken) =>
        Project(dbContext.Products.AsNoTracking()
                .Where(product => product.Id == id && product.SellerId == sellerId))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<CategoryResponse>> GetCategoriesAsync(CancellationToken cancellationToken) =>
        await dbContext.Categories.AsNoTracking()
            .Where(category => category.IsActive)
            .OrderBy(category => category.Name)
            .Select(category => new CategoryResponse(category.Id, category.Name, category.Slug))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    private static IQueryable<ProductResponse> Project(IQueryable<ProductEntity> query) =>
        query.Select(product => new ProductResponse(
            product.Id,
            product.SellerId,
            product.CategoryId,
            product.Category.Name,
            product.Name,
            product.Slug,
            product.Description,
            product.Price,
            product.Currency,
            product.StockQuantity,
            product.ImageUrl,
            product.Status,
            product.CreatedAtUtc,
            product.UpdatedAtUtc,
            product.Version));
}
