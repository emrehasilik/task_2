using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using LocalCart.Product.Application.Products;
using LocalCart.Product.Application.Products.Commands.CreateProduct;
using LocalCart.Product.Application.Products.Queries.GetSellerProductById;
using LocalCart.Product.Domain.Products;
using Moq;

namespace LocalCart.Product.IntegrationTests;

public sealed class ProductApiTests(ProductApiFactory factory) : IClassFixture<ProductApiFactory>
{
    private static readonly Guid CategoryId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    [Fact]
    public async Task LiveHealthCheckReturnsHealthy()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health/live");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task CreateProductWithoutTokenReturnsUnauthorized()
    {
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/products", CreateRequest());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateProductWithCustomerTokenReturnsForbidden()
    {
        using var client = CreateAuthenticatedClient("Customer");

        var response = await client.PostAsJsonAsync("/api/v1/products", CreateRequest());

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CreateProductWithSellerTokenReturnsCreatedResponse()
    {
        var productId = Guid.NewGuid();
        factory.Sender
            .Setup(sender => sender.Send(It.IsAny<CreateProductCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProductResponse(
                productId,
                Guid.NewGuid(),
                CategoryId,
                "Handmade",
                "Ceramic Bowl",
                "ceramic-bowl",
                "A handmade ceramic bowl.",
                199.90m,
                "TRY",
                10,
                "https://images.example.com/ceramic-bowl.webp",
                ProductStatus.Published,
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow,
                Guid.NewGuid()));
        using var client = CreateAuthenticatedClient("Seller");

        var response = await client.PostAsJsonAsync("/api/v1/products", CreateRequest());
        var body = await response.Content.ReadFromJsonAsync<ProductResponse>(JsonOptions);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(productId, body.Id);
        Assert.Equal(new Uri($"http://localhost/api/v1/products/{productId}"), response.Headers.Location);
    }

    [Fact]
    public async Task GetOwnedDraftProductWithSellerTokenReturnsDraft()
    {
        var productId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        factory.Sender
            .Setup(sender => sender.Send(
                It.Is<GetSellerProductByIdQuery>(query => query.Id == productId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProductResponse(
                productId,
                sellerId,
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
                Guid.NewGuid()));
        using var client = CreateAuthenticatedClient("Seller");

        var response = await client.GetAsync($"/api/v1/products/mine/{productId}");
        var body = await response.Content.ReadFromJsonAsync<ProductResponse>(JsonOptions);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(productId, body.Id);
        Assert.Equal(ProductStatus.Draft, body.Status);
    }

    [Fact]
    public async Task GetOwnedProductWithCustomerTokenReturnsForbidden()
    {
        using var client = CreateAuthenticatedClient("Customer");

        var response = await client.GetAsync($"/api/v1/products/mine/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private HttpClient CreateAuthenticatedClient(string role)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", TestJwtToken.Create(role));
        return client;
    }

    private static object CreateRequest() => new
    {
        categoryId = CategoryId,
        name = "Ceramic Bowl",
        slug = "ceramic-bowl",
        description = "A handmade ceramic bowl.",
        price = 199.90m,
        currency = "TRY",
        stockQuantity = 10,
        imageUrl = "https://images.example.com/ceramic-bowl.webp",
        status = "Published"
    };
}
