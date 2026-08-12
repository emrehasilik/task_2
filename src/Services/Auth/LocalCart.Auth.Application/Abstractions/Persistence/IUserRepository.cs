using LocalCart.Auth.Domain.Users;

namespace LocalCart.Auth.Application.Abstractions.Persistence;

public interface IUserRepository
{
    Task<User?> FindByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<User?> FindByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task<User?> FindByRefreshTokenHashAsync(string refreshTokenHash, CancellationToken cancellationToken);
    Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task AddAsync(User user, CancellationToken cancellationToken);
}
