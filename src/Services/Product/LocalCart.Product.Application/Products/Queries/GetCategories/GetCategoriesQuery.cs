using LocalCart.Product.Application.Abstractions.Caching;
using LocalCart.Product.Application.Abstractions.Persistence;
using MediatR;

namespace LocalCart.Product.Application.Products.Queries.GetCategories;

public sealed record GetCategoriesQuery : IRequest<IReadOnlyList<CategoryResponse>>;

public sealed class GetCategoriesQueryHandler(IProductReadRepository products, ICacheService cache)
    : IRequestHandler<GetCategoriesQuery, IReadOnlyList<CategoryResponse>>
{
    public async Task<IReadOnlyList<CategoryResponse>> Handle(
        GetCategoriesQuery request,
        CancellationToken cancellationToken)
    {
        var cached = await cache.GetAsync<IReadOnlyList<CategoryResponse>>(
            ProductCacheKeys.Categories,
            cancellationToken).ConfigureAwait(false);
        if (cached is not null)
        {
            return cached;
        }

        var categories = await products.GetCategoriesAsync(cancellationToken).ConfigureAwait(false);
        await cache.SetAsync(
            ProductCacheKeys.Categories,
            categories,
            TimeSpan.FromHours(1),
            cancellationToken).ConfigureAwait(false);
        return categories;
    }
}
