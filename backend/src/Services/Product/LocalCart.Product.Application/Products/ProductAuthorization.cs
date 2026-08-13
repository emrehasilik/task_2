using LocalCart.Product.Application.Abstractions.Identity;
using LocalCart.Product.Application.Common.Exceptions;
using LocalCart.Product.Domain.Products;
using ProductEntity = LocalCart.Product.Domain.Products.Product;

namespace LocalCart.Product.Application.Products;

internal static class ProductAuthorization
{
    public static void EnsureCanCreate(ICurrentUser currentUser)
    {
        if (!currentUser.IsAuthenticated ||
            !(currentUser.IsInRole("Seller") || currentUser.IsInRole("Admin")))
        {
            throw new ForbiddenException("Only sellers and administrators can create products.");
        }
    }

    public static void EnsureCanManage(ICurrentUser currentUser, ProductEntity product)
    {
        if (!currentUser.IsAuthenticated ||
            !(currentUser.IsInRole("Admin") ||
              currentUser.IsInRole("Seller") && currentUser.UserId == product.SellerId))
        {
            throw new ForbiddenException("You can manage only your own products.");
        }
    }
}
