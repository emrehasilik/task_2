using LocalCart.Product.Application.Abstractions.Identity;
using LocalCart.Product.Application.Abstractions.Persistence;
using LocalCart.Product.Application.Common.Exceptions;
using MediatR;

namespace LocalCart.Product.Application.Products.Queries.GetSellerProductById;

public sealed record GetSellerProductByIdQuery(Guid Id) : IRequest<ProductResponse>;

public sealed class GetSellerProductByIdQueryHandler(
    IProductReadRepository products,
    ICurrentUser currentUser) : IRequestHandler<GetSellerProductByIdQuery, ProductResponse>
{
    public async Task<ProductResponse> Handle(
        GetSellerProductByIdQuery request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAuthenticated || !currentUser.IsInRole("Seller"))
        {
            throw new ForbiddenException("A seller account is required.");
        }

        return await products.GetSellerProductByIdAsync(
                request.Id,
                currentUser.UserId,
                cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException("Product was not found.");
    }
}
