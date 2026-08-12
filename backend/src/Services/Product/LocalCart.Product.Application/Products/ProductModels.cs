using LocalCart.Product.Domain.Products;
using ProductEntity = LocalCart.Product.Domain.Products.Product;

namespace LocalCart.Product.Application.Products;

public sealed record ProductResponse(
    Guid Id,
    Guid SellerId,
    Guid CategoryId,
    string CategoryName,
    string Name,
    string Slug,
    string Description,
    decimal Price,
    string Currency,
    int StockQuantity,
    string ImageUrl,
    ProductStatus Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    Guid Version);

public sealed record CategoryResponse(Guid Id, string Name, string Slug);

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount)
{
    public int TotalPages => TotalCount == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

internal static class ProductMapper
{
    public static ProductResponse ToResponse(this ProductEntity product, string categoryName) =>
        new(
            product.Id,
            product.SellerId,
            product.CategoryId,
            categoryName,
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
            product.Version);
}
