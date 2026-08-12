using FluentValidation;
using LocalCart.Auth.Application.Abstractions.Persistence;
using LocalCart.Auth.Application.Abstractions.Security;
using LocalCart.Auth.Application.Abstractions.Time;
using LocalCart.Auth.Application.Common.Exceptions;
using MediatR;

namespace LocalCart.Auth.Application.Auth.Refresh;

public sealed record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResponse>;

public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator() => RuleFor(command => command.RefreshToken).NotEmpty().MaximumLength(512);
}

public sealed class RefreshTokenCommandHandler(
    IUserRepository users,
    IUnitOfWork unitOfWork,
    IJwtTokenService jwtTokenService,
    IRefreshTokenService refreshTokenService,
    IDateTimeProvider clock) : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var currentHash = refreshTokenService.Hash(request.RefreshToken);
        var user = await users.FindByRefreshTokenHashAsync(currentHash, cancellationToken).ConfigureAwait(false);
        var currentToken = user?.RefreshTokens.SingleOrDefault(token => token.TokenHash == currentHash);

        if (user is null || !user.IsActive || currentToken is null || !currentToken.IsActive(clock.UtcNow))
        {
            throw new AuthenticationException("Refresh token is invalid or expired.");
        }

        var replacement = refreshTokenService.Generate();
        currentToken.Revoke(clock.UtcNow, replacement.Hash);
        user.AddRefreshToken(replacement.Hash, replacement.ExpiresAtUtc, clock.UtcNow);
        var accessToken = jwtTokenService.Create(user);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return AuthResponseFactory.Create(user, accessToken, replacement.Value);
    }
}
