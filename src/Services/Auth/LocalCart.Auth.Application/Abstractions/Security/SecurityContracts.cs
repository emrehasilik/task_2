using LocalCart.Auth.Domain.Users;

namespace LocalCart.Auth.Application.Abstractions.Security;

public interface IPasswordService
{
    string Hash(string password);
    bool Verify(string passwordHash, string providedPassword);
}

public interface IJwtTokenService
{
    AccessToken Create(User user);
}

public interface IRefreshTokenService
{
    GeneratedRefreshToken Generate();
    string Hash(string rawToken);
}

public sealed record AccessToken(string Value, DateTimeOffset ExpiresAtUtc);

public sealed record GeneratedRefreshToken(string Value, string Hash, DateTimeOffset ExpiresAtUtc);
