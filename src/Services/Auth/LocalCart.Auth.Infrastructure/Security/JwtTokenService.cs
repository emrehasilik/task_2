using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LocalCart.Auth.Application.Abstractions.Security;
using LocalCart.Auth.Application.Abstractions.Time;
using LocalCart.Auth.Domain.Users;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LocalCart.Auth.Infrastructure.Security;

internal sealed class JwtTokenService(IOptions<JwtOptions> options, IDateTimeProvider clock) : IJwtTokenService
{
    private readonly JwtOptions _options = options.Value;

    public AccessToken Create(User user)
    {
        var expiresAtUtc = clock.UtcNow.AddMinutes(_options.AccessTokenMinutes);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey)),
            SecurityAlgorithms.HmacSha256);
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAtUtc.UtcDateTime,
            IssuedAt = clock.UtcNow.UtcDateTime,
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler();
        return new AccessToken(handler.WriteToken(handler.CreateToken(descriptor)), expiresAtUtc);
    }
}
