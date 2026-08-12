using System.Text.Json;
using System.Text.Json.Serialization;
using LocalCart.Product.Application.Abstractions.Caching;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace LocalCart.Product.Infrastructure.Caching;

internal sealed partial class RedisCacheService(
    IConnectionMultiplexer connection,
    IOptions<RedisOptions> options,
    ILogger<RedisCacheService> logger) : ICacheService
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };
    private readonly IDatabase _database = connection.GetDatabase();
    private readonly string _prefix = options.Value.InstanceName.TrimEnd(':') + ":";

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken)
    {
        try
        {
            var value = await _database.StringGetAsync(Prefix(key)).WaitAsync(cancellationToken).ConfigureAwait(false);
            if (!value.HasValue)
            {
                LogCacheMiss(logger, key);
                return default;
            }

            LogCacheHit(logger, key);
            return JsonSerializer.Deserialize<T>(value.ToString(), SerializerOptions);
        }
        catch (RedisException exception)
        {
            LogRedisKeyFailure(logger, "read", key, exception);
            return default;
        }
    }

    public async Task SetAsync<T>(
        string key,
        T value,
        TimeSpan expiration,
        CancellationToken cancellationToken)
    {
        try
        {
            var json = JsonSerializer.Serialize(value, SerializerOptions);
            await _database.StringSetAsync(Prefix(key), json, expiration).WaitAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (RedisException exception)
        {
            LogRedisKeyFailure(logger, "write", key, exception);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken)
    {
        try
        {
            await _database.KeyDeleteAsync(Prefix(key)).WaitAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (RedisException exception)
        {
            LogRedisKeyFailure(logger, "delete", key, exception);
        }
    }

    public async Task<long> GetVersionAsync(string region, CancellationToken cancellationToken)
    {
        try
        {
            var key = Prefix($"version:{region}");
            var value = await _database.StringGetAsync(key).WaitAsync(cancellationToken).ConfigureAwait(false);
            if (value.TryParse(out long version))
            {
                return version;
            }

            await _database.StringSetAsync(key, 1, when: When.NotExists)
                .WaitAsync(cancellationToken).ConfigureAwait(false);
            return 1;
        }
        catch (RedisException exception)
        {
            LogRedisRegionFailure(logger, "version-read", region, exception);
            return 1;
        }
    }

    public async Task IncrementVersionAsync(string region, CancellationToken cancellationToken)
    {
        try
        {
            await _database.StringIncrementAsync(Prefix($"version:{region}"))
                .WaitAsync(cancellationToken).ConfigureAwait(false);
            LogRegionInvalidated(logger, region);
        }
        catch (RedisException exception)
        {
            LogRedisRegionFailure(logger, "invalidation", region, exception);
        }
    }

    private string Prefix(string key) => _prefix + key;

    [LoggerMessage(3001, LogLevel.Debug, "Cache miss for {CacheKey}")]
    private static partial void LogCacheMiss(ILogger logger, string cacheKey);

    [LoggerMessage(3002, LogLevel.Debug, "Cache hit for {CacheKey}")]
    private static partial void LogCacheHit(ILogger logger, string cacheKey);

    [LoggerMessage(3003, LogLevel.Warning, "Redis {Operation} failed for {CacheKey}")]
    private static partial void LogRedisKeyFailure(
        ILogger logger,
        string operation,
        string cacheKey,
        Exception exception);

    [LoggerMessage(3004, LogLevel.Warning, "Redis {Operation} failed for region {CacheRegion}")]
    private static partial void LogRedisRegionFailure(
        ILogger logger,
        string operation,
        string cacheRegion,
        Exception exception);

    [LoggerMessage(3005, LogLevel.Information, "Invalidated cache region {CacheRegion}")]
    private static partial void LogRegionInvalidated(ILogger logger, string cacheRegion);
}
