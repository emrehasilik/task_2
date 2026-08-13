using System.Globalization;
using FluentValidation;
using LocalCart.Product.Application.Abstractions.Caching;
using LocalCart.Product.Application.Abstractions.Persistence;
using MediatR;

namespace LocalCart.Product.Application.Products.Queries.GetProducts;

public enum ProductSort
{
    Newest = 1,
    PriceAscending = 2,
    PriceDescending = 3,
    NameAscending = 4
}

public sealed record ProductFilter(
    string? Search,
    Guid? CategoryId,
    decimal? MinPrice,
    decimal? MaxPrice,
    ProductSort Sort,
    int Page,
    int PageSize)
{
    public string ToCanonicalString() => string.Join('|',
        Search?.Trim().ToLowerInvariant() ?? string.Empty,
        CategoryId?.ToString("N") ?? string.Empty,
        MinPrice?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
        MaxPrice?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
        (int)Sort,
        Page,
        PageSize);
}

public sealed record GetProductsQuery(
    string? Search,
    Guid? CategoryId,
    decimal? MinPrice,
    decimal? MaxPrice,
    ProductSort Sort = ProductSort.Newest,
    int Page = 1,
    int PageSize = 12) : IRequest<PagedResult<ProductResponse>>;

public sealed class GetProductsQueryValidator : AbstractValidator<GetProductsQuery>
{
    public GetProductsQueryValidator()
    {
        RuleFor(query => query.Search).MaximumLength(100);
        RuleFor(query => query.MinPrice).GreaterThanOrEqualTo(0).When(query => query.MinPrice.HasValue);
        RuleFor(query => query.MaxPrice).GreaterThan(0).When(query => query.MaxPrice.HasValue);
        RuleFor(query => query).Must(query => query.MinPrice is null || query.MaxPrice is null || query.MinPrice <= query.MaxPrice)
            .WithMessage("MinPrice cannot be greater than MaxPrice.");
        RuleFor(query => query.Sort).IsInEnum();
        RuleFor(query => query.Page).GreaterThanOrEqualTo(1);
        RuleFor(query => query.PageSize).InclusiveBetween(1, 50);
    }
}

public sealed class GetProductsQueryHandler(IProductReadRepository products, ICacheService cache)
    : IRequestHandler<GetProductsQuery, PagedResult<ProductResponse>>
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(2);

    public async Task<PagedResult<ProductResponse>> Handle(
        GetProductsQuery request,
        CancellationToken cancellationToken)
    {
        var filter = new ProductFilter(
            request.Search,
            request.CategoryId,
            request.MinPrice,
            request.MaxPrice,
            request.Sort,
            request.Page,
            request.PageSize);
        var version = await cache.GetVersionAsync(ProductCacheKeys.ListRegion, cancellationToken).ConfigureAwait(false);
        var key = ProductCacheKeys.List(version, filter.ToCanonicalString());
        var cached = await cache.GetAsync<PagedResult<ProductResponse>>(key, cancellationToken).ConfigureAwait(false);
        if (cached is not null)
        {
            return cached;
        }

        var result = await products.GetProductsAsync(filter, cancellationToken).ConfigureAwait(false);
        await cache.SetAsync(key, result, CacheDuration, cancellationToken).ConfigureAwait(false);
        return result;
    }
}
