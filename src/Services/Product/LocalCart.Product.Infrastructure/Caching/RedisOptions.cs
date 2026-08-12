using System.ComponentModel.DataAnnotations;

namespace LocalCart.Product.Infrastructure.Caching;

public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    [Required]
    public string ConnectionString { get; init; } = string.Empty;

    [Required]
    public string InstanceName { get; init; } = "localcart";
}
