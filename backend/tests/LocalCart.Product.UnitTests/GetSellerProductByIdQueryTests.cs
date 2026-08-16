using LocalCart.Product.Application.Abstractions.Identity;
using LocalCart.Product.Application.Abstractions.Persistence;
using LocalCart.Product.Application.Common.Exceptions;
using LocalCart.Product.Application.Products;
using LocalCart.Product.Application.Products.Queries.GetSellerProductById;
using LocalCart.Product.Domain.Products;
using Moq;

namespace LocalCart.Product.UnitTests;

public sealed class GetSellerProductByIdQueryTests
{
    private static readonly Guid ProductId = Guid.Parse("30000000-0000-0000-0000-000000000001");
    private static readonly Guid SellerId = Guid.Parse("20000000-0000-0000-0000-000000000001");
    private static readonly Guid CategoryId = Guid.Parse("10000000-0000-0000-0000-000000000001");

    [Fact]
    public async Task SellerCanReadOwnedDraftProduct()
    {
        var expected = DraftProduct();
        var repository = new Mock<IProductReadRepository>();
        repository.Setup(service => service.GetSellerProductByIdAsync(
                ProductId,
                SellerId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);
        var currentUser = SellerUser();
        var handler = new GetSellerProductByIdQueryHandler(repository.Object, currentUser.Object);

        var result = await handler.Handle(
            new GetSellerProductByIdQuery(ProductId),
            CancellationToken.None);

        Assert.Same(expected, result);
        Assert.Equal(ProductStatus.Draft, result.Status);
    }

    [Fact]
    public async Task MissingOwnedProductReturnsNotFound()
    {
        var repository = new Mock<IProductReadRepository>();
        repository.Setup(service => service.GetSellerProductByIdAsync(
                ProductId,
                SellerId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ProductResponse?)null);
        var currentUser = SellerUser();
        var handler = new GetSellerProductByIdQueryHandler(repository.Object, currentUser.Object);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(
            new GetSellerProductByIdQuery(ProductId),
            CancellationToken.None));
    }

    private static Mock<ICurrentUser> SellerUser()
    {
        var currentUser = new Mock<ICurrentUser>();
        currentUser.SetupGet(user => user.IsAuthenticated).Returns(true);
        currentUser.SetupGet(user => user.UserId).Returns(SellerId);
        currentUser.Setup(user => user.IsInRole("Seller")).Returns(true);
        return currentUser;
    }

    private static ProductResponse DraftProduct() => new(
        ProductId,
        SellerId,
        CategoryId,
        "Handmade",
        "Draft Bowl",
        "draft-bowl",
        "A draft product owned by the authenticated seller.",
        149.90m,
        "TRY",
        3,
        "https://images.example.com/draft-bowl.webp",
        ProductStatus.Draft,
        DateTimeOffset.UtcNow,
        DateTimeOffset.UtcNow,
        Guid.NewGuid());
}
