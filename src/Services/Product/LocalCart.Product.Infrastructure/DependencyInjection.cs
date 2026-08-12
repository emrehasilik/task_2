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
        var connectionString = configuration.GetConnectionString("ProductDatabase")
            ?? throw new InvalidOperationException("ConnectionStrings:ProductDatabase is required.");
        services.AddDbContextPool<ProductDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null)));
        services.AddOptions<RedisOptions>()
            .Bind(configuration.GetSection(RedisOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.AddSingleton<IConnectionMultiplexer>(provider =>
        {
            var redis = provider.GetRequiredService<IOptions<RedisOptions>>().Value;
            var options = ConfigurationOptions.Parse(redis.ConnectionString);
            options.AbortOnConnectFail = false;
            options.ConnectRetry = 2;
            options.ConnectTimeout = 2_000;
            options.AsyncTimeout = 2_000;
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
