using LocalCart.Auth.Domain.Common;

namespace LocalCart.Auth.Domain.Users;

public sealed class RefreshToken : Entity
{
    private RefreshToken()
    {
    }

    internal RefreshToken(Guid userId, string tokenHash, DateTimeOffset expiresAtUtc, DateTimeOffset createdAtUtc)
        : base(Guid.NewGuid())
    {
        UserId = userId;
        TokenHash = tokenHash;
        ExpiresAtUtc = expiresAtUtc;
        CreatedAtUtc = createdAtUtc;
    }

    public Guid UserId { get; private set; }
    public string TokenHash { get; private set; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset? RevokedAtUtc { get; private set; }
    public string? ReplacedByTokenHash { get; private set; }

    public bool IsActive(DateTimeOffset utcNow) => RevokedAtUtc is null && ExpiresAtUtc > utcNow;

    public void Revoke(DateTimeOffset utcNow, string? replacementTokenHash = null)
    {
        if (RevokedAtUtc is not null)
        {
            return;
        }

        RevokedAtUtc = utcNow;
        ReplacedByTokenHash = replacementTokenHash;
    }
}
