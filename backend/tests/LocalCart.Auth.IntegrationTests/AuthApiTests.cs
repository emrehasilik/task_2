using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using LocalCart.Auth.Application.Auth;
using LocalCart.Auth.Application.Auth.Register;
using LocalCart.Auth.Domain.Users;
using Moq;

namespace LocalCart.Auth.IntegrationTests;

public sealed class AuthApiTests(AuthApiFactory factory) : IClassFixture<AuthApiFactory>
{
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
    public async Task RegisterSellerReturnsCreatedJsonResponse()
    {
        var userId = Guid.NewGuid();
        factory.Sender
            .Setup(sender => sender.Send(It.IsAny<RegisterCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AuthResponse(
                "test-access-token",
                DateTimeOffset.UtcNow.AddMinutes(15),
                "test-refresh-token",
                new UserResponse(userId, "Ada", "Lovelace", "ada@example.test", UserRole.Seller)));
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            firstName = "Ada",
            lastName = "Lovelace",
            email = "ada@example.test",
            password = "StrongPass123",
            role = "Seller"
        });
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(userId, body.User.Id);
        Assert.Equal(UserRole.Seller, body.User.Role);
    }

    [Fact]
    public async Task CurrentUserWithoutTokenReturnsUnauthorized()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
