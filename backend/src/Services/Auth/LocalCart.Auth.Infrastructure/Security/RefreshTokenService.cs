using System.Security.Cryptography;
using System.Text;
using LocalCart.Auth.Application.Abstractions.Security;
using LocalCart.Auth.Application.Abstractions.Time;
using Microsoft.Extensions.Options;

namespace LocalCart.Auth.Infrastructure.Security;

internal sealed class RefreshTokenService(IOptions<JwtOptions> options, IDateTimeProvider clock)
    : IRefreshTokenService
{
    private readonly JwtOptions _options = options.Value;

    public GeneratedRefreshToken Generate()
    {
        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        return new GeneratedRefreshToken(rawToken, Hash(rawToken), clock.UtcNow.AddDays(_options.RefreshTokenDays));
    }

    public string Hash(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
}
