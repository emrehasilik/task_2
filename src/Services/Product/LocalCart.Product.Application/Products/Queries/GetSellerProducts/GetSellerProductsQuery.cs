using FluentValidation;
using LocalCart.Product.Application.Abstractions.Identity;
using LocalCart.Product.Application.Abstractions.Persistence;
using LocalCart.Product.Application.Common.Exceptions;
using MediatR;

namespace LocalCart.Product.Application.Products.Queries.GetSellerProducts;

public sealed record GetSellerProductsQuery(int Page = 1, int PageSize = 20)
    : IRequest<PagedResult<ProductResponse>>;

public sealed class GetSellerProductsQueryValidator : AbstractValidator<GetSellerProductsQuery>
{
    public GetSellerProductsQueryValidator()
    {
        RuleFor(query => query.Page).GreaterThanOrEqualTo(1);
        RuleFor(query => query.PageSize).InclusiveBetween(1, 50);
    }
}

public sealed class GetSellerProductsQueryHandler(IProductReadRepository products, ICurrentUser currentUser)
    : IRequestHandler<GetSellerProductsQuery, PagedResult<ProductResponse>>
{
    public Task<PagedResult<ProductResponse>> Handle(
        GetSellerProductsQuery request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAuthenticated || !currentUser.IsInRole("Seller"))
        {
            throw new ForbiddenException("A seller account is required.");
        }

        return products.GetSellerProductsAsync(currentUser.UserId, request.Page, request.PageSize, cancellationToken);
    }
}
