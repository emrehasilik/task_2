using FluentValidation;
using LocalCart.Auth.Application.Abstractions.Persistence;
using LocalCart.Auth.Application.Abstractions.Security;
using LocalCart.Auth.Application.Abstractions.Time;
using MediatR;

namespace LocalCart.Auth.Application.Auth.Revoke;

public sealed record RevokeTokenCommand(string RefreshToken) : IRequest;

public sealed class RevokeTokenCommandValidator : AbstractValidator<RevokeTokenCommand>
{
    public RevokeTokenCommandValidator() => RuleFor(command => command.RefreshToken).NotEmpty().MaximumLength(512);
}

public sealed class RevokeTokenCommandHandler(
    IUserRepository users,
    IUnitOfWork unitOfWork,
    IRefreshTokenService refreshTokenService,
    IDateTimeProvider clock) : IRequestHandler<RevokeTokenCommand>
{
    public async Task Handle(RevokeTokenCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = refreshTokenService.Hash(request.RefreshToken);
        var user = await users.FindByRefreshTokenHashAsync(tokenHash, cancellationToken).ConfigureAwait(false);
        var token = user?.RefreshTokens.SingleOrDefault(item => item.TokenHash == tokenHash);

        if (token is null)
        {
            return;
        }

        token.Revoke(clock.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
