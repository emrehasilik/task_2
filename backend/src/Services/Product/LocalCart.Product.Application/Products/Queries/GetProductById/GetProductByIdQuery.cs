using LocalCart.Product.Application.Abstractions.Caching;
using LocalCart.Product.Application.Abstractions.Persistence;
using LocalCart.Product.Application.Common.Exceptions;
using MediatR;

namespace LocalCart.Product.Application.Products.Queries.GetProductById;

public sealed record GetProductByIdQuery(Guid Id) : IRequest<ProductResponse>;

public sealed class GetProductByIdQueryHandler(IProductReadRepository products, ICacheService cache)
    : IRequestHandler<GetProductByIdQuery, ProductResponse>
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public async Task<ProductResponse> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var key = ProductCacheKeys.Detail(request.Id);
        var cached = await cache.GetAsync<ProductResponse>(key, cancellationToken).ConfigureAwait(false);
        if (cached is not null)
        {
            return cached;
        }

        var product = await products.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException("Product was not found.");
        await cache.SetAsync(key, product, CacheDuration, cancellationToken).ConfigureAwait(false);
        return product;
    }
}
