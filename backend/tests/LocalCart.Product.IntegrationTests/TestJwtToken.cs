using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace LocalCart.Product.IntegrationTests;

internal static class TestJwtToken
{
    public static string Create(string role)
    {
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ProductApiFactory.JwtSigningKey)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            ProductApiFactory.JwtIssuer,
            ProductApiFactory.JwtAudience,
            [
                new Claim("sub", Guid.NewGuid().ToString()),
                new Claim("role", role),
                new Claim("jti", Guid.NewGuid().ToString("N"))
            ],
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
