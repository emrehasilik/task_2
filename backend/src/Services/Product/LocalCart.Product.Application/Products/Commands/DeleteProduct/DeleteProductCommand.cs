using LocalCart.Product.Application.Abstractions.Caching;
using LocalCart.Product.Application.Abstractions.Identity;
using LocalCart.Product.Application.Abstractions.Persistence;
using LocalCart.Product.Application.Abstractions.Time;
using LocalCart.Product.Application.Common.Exceptions;
using MediatR;

namespace LocalCart.Product.Application.Products.Commands.DeleteProduct;

public sealed record DeleteProductCommand(Guid Id, Guid ExpectedVersion) : IRequest;

public sealed class DeleteProductCommandHandler(
    IProductWriteRepository products,
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ICurrentUser currentUser,
    IDateTimeProvider clock) : IRequestHandler<DeleteProductCommand>
{
    public async Task Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await products.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException("Product was not found.");
        ProductAuthorization.EnsureCanManage(currentUser, product);
        if (product.Version != request.ExpectedVersion)
        {
            throw new ConflictException("The product was modified by another request. Reload and try again.");
        }

        product.SoftDelete(clock.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await cache.RemoveAsync(ProductCacheKeys.Detail(product.Id), cancellationToken).ConfigureAwait(false);
        await cache.IncrementVersionAsync(ProductCacheKeys.ListRegion, cancellationToken).ConfigureAwait(false);
    }
}
