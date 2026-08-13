using LocalCart.Product.Application.Abstractions.Caching;
using LocalCart.Product.Application.Abstractions.Persistence;
using LocalCart.Product.Application.Abstractions.Time;
using LocalCart.Product.Infrastructure.Caching;
using LocalCart.Product.Infrastructure.Persistence;
using LocalCart.Product.Infrastructure.Time;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace LocalCart.Product.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddProductInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MarketplaceDatabase");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:MarketplaceDatabase is required. Configure the Supabase PostgreSQL connection string through user secrets or environment variables.");
        }

        services.AddDbContextPool<ProductDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null);
                npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "catalog");
            }));
        services.AddOptions<RedisOptions>()
            .Bind(configuration.GetSection(RedisOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.AddSingleton<IConnectionMultiplexer>(provider =>
        {
            var redis = provider.GetRequiredService<IOptions<RedisOptions>>().Value;
            var options = new ConfigurationOptions
            {
                AbortOnConnectFail = false,
                AsyncTimeout = 1_500,
                ClientName = "localcart-product-api",
                ConnectRetry = 3,
                ConnectTimeout = 2_000,
                KeepAlive = 30,
                Password = string.IsNullOrWhiteSpace(redis.Password) ? null : redis.Password,
                ReconnectRetryPolicy = new ExponentialRetry(1_000),
                ResolveDns = true,
                Ssl = redis.UseSsl,
                SslHost = redis.UseSsl ? redis.Endpoint : null,
                SyncTimeout = 1_500,
                User = string.IsNullOrWhiteSpace(redis.User) ? null : redis.User
            };
            options.EndPoints.Add(redis.Endpoint, redis.Port);
            return ConnectionMultiplexer.Connect(options);
        });
        services.AddScoped<IProductWriteRepository, ProductWriteRepository>();
        services.AddScoped<IProductReadRepository, ProductReadRepository>();
        services.AddScoped<IUnitOfWork>(provider => provider.GetRequiredService<ProductDbContext>());
        services.AddSingleton<ICacheService, RedisCacheService>();
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddScoped<DatabaseInitializer>();
        return services;
    }
}
