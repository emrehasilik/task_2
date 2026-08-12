using FluentValidation;
using LocalCart.Auth.Application.Abstractions.Persistence;
using LocalCart.Auth.Application.Abstractions.Security;
using LocalCart.Auth.Application.Abstractions.Time;
using LocalCart.Auth.Application.Common.Exceptions;
using LocalCart.Auth.Domain.Users;
using MediatR;

namespace LocalCart.Auth.Application.Auth.Register;

public sealed record RegisterCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    UserRole Role) : IRequest<AuthResponse>;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(command => command.FirstName).NotEmpty().MaximumLength(80);
        RuleFor(command => command.LastName).NotEmpty().MaximumLength(80);
        RuleFor(command => command.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(command => command.Password)
            .NotEmpty()
            .MinimumLength(10)
            .MaximumLength(128)
            .Matches("[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain a number.");
        RuleFor(command => command.Role)
            .Must(role => role is UserRole.Customer or UserRole.Seller)
            .WithMessage("Public registration supports only Customer or Seller roles.");
    }
}

public sealed class RegisterCommandHandler(
    IUserRepository users,
    IUnitOfWork unitOfWork,
    IPasswordService passwordService,
    IJwtTokenService jwtTokenService,
    IRefreshTokenService refreshTokenService,
    IDateTimeProvider clock) : IRequestHandler<RegisterCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        if (await users.EmailExistsAsync(normalizedEmail, cancellationToken).ConfigureAwait(false))
        {
            throw new ConflictException("An account with this email already exists.");
        }

        var user = User.Create(
            request.FirstName,
            request.LastName,
            request.Email,
            normalizedEmail,
            request.Role,
            clock.UtcNow);
        user.SetPasswordHash(passwordService.Hash(request.Password));

        var accessToken = jwtTokenService.Create(user);
        var refreshToken = refreshTokenService.Generate();
        user.AddRefreshToken(refreshToken.Hash, refreshToken.ExpiresAtUtc, clock.UtcNow);

        await users.AddAsync(user, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return AuthResponseFactory.Create(user, accessToken, refreshToken.Value);
    }
}
