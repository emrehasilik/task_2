using LocalCart.Product.Infrastructure.Caching;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using StackExchange.Redis;

namespace LocalCart.Product.UnitTests;

public sealed class RedisCacheServiceTests
{
    [Fact]
    public async Task GetAsyncReturnsCacheMissWhenRedisTimesOut()
    {
        var database = CreateDatabase();
        database
            .Setup(db => db.StringGetAsync(
                It.IsAny<RedisKey>(),
                It.IsAny<CommandFlags>()))
            .ThrowsAsync(CreateTimeout());
        var cache = CreateCache(database);

        var result = await cache.GetAsync<string>("products:list", CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task SetAsyncCompletesWhenRedisTimesOut()
    {
        var database = CreateDatabase();
        database
            .Setup(db => db.StringSetAsync(
                It.IsAny<RedisKey>(),
                It.IsAny<RedisValue>(),
                It.IsAny<Expiration>(),
                It.IsAny<ValueCondition>(),
                It.IsAny<CommandFlags>()))
            .ThrowsAsync(CreateTimeout());
        var cache = CreateCache(database);

        var exception = await Record.ExceptionAsync(() => cache.SetAsync(
            "products:list",
            new { Count = 3 },
            TimeSpan.FromMinutes(1),
            CancellationToken.None));

        Assert.Null(exception);
    }

    [Fact]
    public async Task GetVersionAsyncReturnsSafeDefaultWhenRedisTimesOut()
    {
        var database = CreateDatabase();
        database
            .Setup(db => db.StringGetAsync(
                It.IsAny<RedisKey>(),
                It.IsAny<CommandFlags>()))
            .ThrowsAsync(CreateTimeout());
        var cache = CreateCache(database);

        var version = await cache.GetVersionAsync("products:list", CancellationToken.None);

        Assert.Equal(1, version);
    }

    private static Mock<IDatabase> CreateDatabase() => new(MockBehavior.Strict);

    private static RedisCacheService CreateCache(Mock<IDatabase> database)
    {
        var connection = new Mock<IConnectionMultiplexer>(MockBehavior.Strict);
        connection.SetupGet(item => item.IsConnected).Returns(true);
        connection
            .Setup(item => item.GetDatabase(It.IsAny<int>(), It.IsAny<object?>()))
            .Returns(database.Object);

        return new RedisCacheService(
            connection.Object,
            Options.Create(new RedisOptions
            {
                Endpoint = "localhost",
                InstanceName = "localcart-tests"
            }),
            NullLogger<RedisCacheService>.Instance);
    }

    private static RedisTimeoutException CreateTimeout() =>
        new("Simulated Redis timeout", CommandStatus.WaitingToBeSent);
}
