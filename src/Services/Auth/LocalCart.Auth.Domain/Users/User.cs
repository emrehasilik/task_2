using LocalCart.Auth.Domain.Common;

namespace LocalCart.Auth.Domain.Users;

public sealed class User : Entity
{
    private readonly List<RefreshToken> _refreshTokens = [];

    private User()
    {
    }

    private User(
        string firstName,
        string lastName,
        string email,
        string normalizedEmail,
        UserRole role,
        DateTimeOffset createdAtUtc)
        : base(Guid.NewGuid())
    {
        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        Email = email.Trim();
        NormalizedEmail = normalizedEmail;
        Role = role;
        IsActive = true;
        CreatedAtUtc = createdAtUtc;
    }

    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string NormalizedEmail { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset? LastLoginAtUtc { get; private set; }
    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens;

    public static User Create(
        string firstName,
        string lastName,
        string email,
        string normalizedEmail,
        UserRole role,
        DateTimeOffset createdAtUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(firstName);
        ArgumentException.ThrowIfNullOrWhiteSpace(lastName);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedEmail);

        return new User(firstName, lastName, email, normalizedEmail, role, createdAtUtc);
    }

    public void SetPasswordHash(string passwordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);
        PasswordHash = passwordHash;
    }

    public void RecordSuccessfulLogin(DateTimeOffset utcNow) => LastLoginAtUtc = utcNow;

    public RefreshToken AddRefreshToken(
        string tokenHash,
        DateTimeOffset expiresAtUtc,
        DateTimeOffset createdAtUtc)
    {
        var token = new RefreshToken(Id, tokenHash, expiresAtUtc, createdAtUtc);
        _refreshTokens.Add(token);
        return token;
    }
}
