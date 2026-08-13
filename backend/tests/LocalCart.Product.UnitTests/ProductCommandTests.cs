using LocalCart.Product.Application.Abstractions.Caching;
using LocalCart.Product.Application.Abstractions.Identity;
using LocalCart.Product.Application.Abstractions.Persistence;
using LocalCart.Product.Application.Abstractions.Time;
using LocalCart.Product.Application.Products;
using LocalCart.Product.Application.Products.Commands.CreateProduct;
using LocalCart.Product.Application.Products.Queries.GetProducts;
using LocalCart.Product.Domain.Products;
using Moq;
using ProductEntity = LocalCart.Product.Domain.Products.Product;

namespace LocalCart.Product.UnitTests;

public sealed class ProductCommandTests
{
    private static readonly Guid SellerId = Guid.Parse("20000000-0000-0000-0000-000000000001");
    private static readonly Guid CategoryId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly DateTimeOffset FixedNow = new(2026, 8, 12, 10, 0, 0, TimeSpan.Zero);

    [Fact]
    public void ProductUpdateChangesVersionAndMarksZeroStockAsOutOfStock()
    {
        var product = CreateProduct();
        var initialVersion = product.Version;

        product.Update(
            CategoryId,
            "Updated Bowl",
            "updated-bowl",
            "Updated handmade bowl",
            250,
            "try",
            0,
            "https://example.com/bowl.webp",
            ProductStatus.Published,
            FixedNow.AddMinutes(1));

        Assert.Equal(ProductStatus.OutOfStock, product.Status);
        Assert.NotEqual(initialVersion, product.Version);
        Assert.Equal("TRY", product.Currency);
    }

    [Fact]
    public async Task CreateHandlerUsesAuthenticatedSellerAndInvalidatesListCache()
    {
        var writeRepository = new Mock<IProductWriteRepository>();
        writeRepository.Setup(repository => repository.GetCategoryNameAsync(CategoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("Handmade");
        writeRepository.Setup(repository => repository.SlugExistsAsync(
                "ceramic-bowl",
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        ProductEntity? persistedProduct = null;
        writeRepository.Setup(repository => repository.AddAsync(It.IsAny<ProductEntity>(), It.IsAny<CancellationToken>()))
            .Callback<ProductEntity, CancellationToken>((product, _) => persistedProduct = product)
            .Returns(Task.CompletedTask);
        var unitOfWork = new Mock<IUnitOfWork>();
        unitOfWork.Setup(unit => unit.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        var cache = new Mock<ICacheService>();
        var currentUser = new Mock<ICurrentUser>();
        currentUser.SetupGet(user => user.IsAuthenticated).Returns(true);
        currentUser.SetupGet(user => user.UserId).Returns(SellerId);
        currentUser.Setup(user => user.IsInRole("Seller")).Returns(true);
        var clock = new Mock<IDateTimeProvider>();
        clock.SetupGet(provider => provider.UtcNow).Returns(FixedNow);
        var handler = new CreateProductCommandHandler(
            writeRepository.Object,
            unitOfWork.Object,
            cache.Object,
            currentUser.Object,
            clock.Object);

        var response = await handler.Handle(
            new CreateProductCommand(
                CategoryId,
                "Ceramic Bowl",
                "ceramic-bowl",
                "A handmade ceramic bowl",
                199.90m,
                "TRY",
                10,
                "https://example.com/bowl.webp",
                ProductStatus.Published),
            CancellationToken.None);

        Assert.NotNull(persistedProduct);
        Assert.Equal(SellerId, persistedProduct.SellerId);
        Assert.Equal("Handmade", response.CategoryName);
        cache.Verify(service => service.IncrementVersionAsync("products:list", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetProductsReturnsCachedPageWithoutQueryingPostgreSql()
    {
        var expected = new PagedResult<ProductResponse>([], 1, 12, 0);
        var cache = new Mock<ICacheService>();
        cache.Setup(service => service.GetVersionAsync("products:list", It.IsAny<CancellationToken>()))
            .ReturnsAsync(7);
        cache.Setup(service => service.GetAsync<PagedResult<ProductResponse>>(
                It.Is<string>(key => key.StartsWith("products:list:v7:", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);
        var repository = new Mock<IProductReadRepository>();
        var handler = new GetProductsQueryHandler(repository.Object, cache.Object);

        var result = await handler.Handle(new GetProductsQuery(null, null, null, null), CancellationToken.None);

        Assert.Same(expected, result);
        repository.Verify(
            service => service.GetProductsAsync(It.IsAny<ProductFilter>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ProductEntity CreateProduct() => ProductEntity.Create(
        SellerId,
        CategoryId,
        "Ceramic Bowl",
        "ceramic-bowl",
        "A handmade ceramic bowl",
        199.90m,
        "TRY",
        10,
        "https://example.com/bowl.webp",
        ProductStatus.Published,
        FixedNow);
}
