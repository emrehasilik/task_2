using MediatR;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace LocalCart.Auth.IntegrationTests;

public sealed class AuthApiFactory : WebApplicationFactory<Program>
{
    public Mock<ISender> Sender { get; } = new(MockBehavior.Strict);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Database:ApplyMigrationsOnStartup", "false");
        builder.UseSetting(
            "ConnectionStrings:MarketplaceDatabase",
            "Host=localhost;Port=5432;Database=integration_tests;Username=integration_tests;Password=integration_tests");
        builder.UseSetting("Jwt:SigningKey", "localcart-integration-tests-signing-key-2026");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<ISender>();
            services.AddSingleton(Sender.Object);
        });
    }
}
