using System.ComponentModel.DataAnnotations;

namespace LocalCart.Product.Infrastructure.Caching;

public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    [Required]
    public string Endpoint { get; init; } = string.Empty;

    [Range(1, 65_535)]
    public int Port { get; init; } = 6379;

    public string User { get; init; } = "default";

    public string Password { get; init; } = string.Empty;

    public bool UseSsl { get; init; }

    [Required]
    public string InstanceName { get; init; } = "localcart";
}
