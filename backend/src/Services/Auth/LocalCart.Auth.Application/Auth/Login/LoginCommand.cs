using FluentValidation;
using LocalCart.Auth.Application.Abstractions.Persistence;
using LocalCart.Auth.Application.Abstractions.Security;
using LocalCart.Auth.Application.Abstractions.Time;
using LocalCart.Auth.Application.Common.Exceptions;
using MediatR;

namespace LocalCart.Auth.Application.Auth.Login;

public sealed record LoginCommand(string Email, string Password) : IRequest<AuthResponse>;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(command => command.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(command => command.Password).NotEmpty().MaximumLength(128);
    }
}

public sealed class LoginCommandHandler(
    IUserRepository users,
    IUnitOfWork unitOfWork,
    IPasswordService passwordService,
    IJwtTokenService jwtTokenService,
    IRefreshTokenService refreshTokenService,
    IDateTimeProvider clock) : IRequestHandler<LoginCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await users.FindByNormalizedEmailAsync(normalizedEmail, cancellationToken).ConfigureAwait(false);

        if (user is null || !user.IsActive || !passwordService.Verify(user.PasswordHash, request.Password))
        {
            throw new AuthenticationException("Email or password is incorrect.");
        }

        var accessToken = jwtTokenService.Create(user);
        var refreshToken = refreshTokenService.Generate();
        user.RecordSuccessfulLogin(clock.UtcNow);
        user.AddRefreshToken(refreshToken.Hash, refreshToken.ExpiresAtUtc, clock.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return AuthResponseFactory.Create(user, accessToken, refreshToken.Value);
    }
}
