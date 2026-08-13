using LocalCart.Auth.Application.Abstractions.Security;
using Microsoft.AspNetCore.Identity;

namespace LocalCart.Auth.Infrastructure.Security;

internal sealed class PasswordService : IPasswordService
{
    private const string PasswordHasherSubject = "LocalCart";
    private readonly PasswordHasher<string> _hasher = new();

    public string Hash(string password) => _hasher.HashPassword(PasswordHasherSubject, password);

    public bool Verify(string passwordHash, string providedPassword) =>
        _hasher.VerifyHashedPassword(PasswordHasherSubject, passwordHash, providedPassword)
        is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
}
