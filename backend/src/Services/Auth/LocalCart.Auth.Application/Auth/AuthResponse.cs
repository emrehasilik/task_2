using LocalCart.Auth.Domain.Users;

namespace LocalCart.Auth.Application.Auth;

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    string RefreshToken,
    UserResponse User);

public sealed record UserResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    UserRole Role);

internal static class AuthResponseFactory
{
    public static AuthResponse Create(
        User user,
        Abstractions.Security.AccessToken accessToken,
        string refreshToken) =>
        new(
            accessToken.Value,
            accessToken.ExpiresAtUtc,
            refreshToken,
            new UserResponse(user.Id, user.FirstName, user.LastName, user.Email, user.Role));
}
