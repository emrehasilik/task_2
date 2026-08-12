using LocalCart.Auth.Application.Abstractions.Persistence;
using LocalCart.Auth.Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace LocalCart.Auth.Infrastructure.Persistence;

internal sealed class UserRepository(AuthDbContext dbContext) : IUserRepository
{
    public Task<User?> FindByIdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.Users.AsNoTracking().SingleOrDefaultAsync(user => user.Id == id, cancellationToken);

    public Task<User?> FindByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        dbContext.Users
            .Include(user => user.RefreshTokens)
            .SingleOrDefaultAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);

    public Task<User?> FindByRefreshTokenHashAsync(string refreshTokenHash, CancellationToken cancellationToken) =>
        dbContext.Users
            .Include(user => user.RefreshTokens)
            .SingleOrDefaultAsync(
                user => user.RefreshTokens.Any(token => token.TokenHash == refreshTokenHash),
                cancellationToken);

    public Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        dbContext.Users.AsNoTracking().AnyAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);

    public Task AddAsync(User user, CancellationToken cancellationToken) =>
        dbContext.Users.AddAsync(user, cancellationToken).AsTask();
}
