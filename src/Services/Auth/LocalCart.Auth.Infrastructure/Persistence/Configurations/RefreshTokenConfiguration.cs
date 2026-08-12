using LocalCart.Auth.Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LocalCart.Auth.Infrastructure.Persistence.Configurations;

internal sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");
        builder.HasKey(token => token.Id);
        builder.Property(token => token.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(token => token.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(token => token.TokenHash).HasColumnName("token_hash").HasMaxLength(128).IsRequired();
        builder.Property(token => token.ExpiresAtUtc).HasColumnName("expires_at_utc").IsRequired();
        builder.Property(token => token.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(token => token.RevokedAtUtc).HasColumnName("revoked_at_utc");
        builder.Property(token => token.ReplacedByTokenHash).HasColumnName("replaced_by_token_hash").HasMaxLength(128);
        builder.HasIndex(token => token.TokenHash).IsUnique().HasDatabaseName("ux_refresh_tokens_hash");
        builder.HasIndex(token => new { token.UserId, token.ExpiresAtUtc }).HasDatabaseName("ix_refresh_tokens_user_expiry");
    }
}
