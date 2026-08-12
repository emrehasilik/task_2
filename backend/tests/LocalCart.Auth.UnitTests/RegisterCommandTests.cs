using FluentValidation.TestHelper;
using LocalCart.Auth.Application.Abstractions.Persistence;
using LocalCart.Auth.Application.Abstractions.Security;
using LocalCart.Auth.Application.Abstractions.Time;
using LocalCart.Auth.Application.Auth.Register;
using LocalCart.Auth.Application.Common.Exceptions;
using LocalCart.Auth.Domain.Users;
using Moq;

namespace LocalCart.Auth.UnitTests;

public sealed class RegisterCommandTests
{
    private static readonly DateTimeOffset FixedNow = new(2026, 8, 12, 10, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task ValidatorRejectsAdminRegistrationAndWeakPassword()
    {
        var validator = new RegisterCommandValidator();
        var command = new RegisterCommand("Ada", "Lovelace", "ada@example.com", "weak", UserRole.Admin);

        var result = await validator.TestValidateAsync(command);

        result.ShouldHaveValidationErrorFor(item => item.Password);
        result.ShouldHaveValidationErrorFor(item => item.Role);
    }

    [Fact]
    public async Task HandlerRejectsDuplicateEmailBeforeHashingPassword()
    {
        var users = new Mock<IUserRepository>();
        users.Setup(repository => repository.EmailExistsAsync("ADA@EXAMPLE.COM", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var password = new Mock<IPasswordService>();
        var handler = CreateHandler(users, password);

        var action = () => handler.Handle(
            new RegisterCommand("Ada", "Lovelace", "ada@example.com", "StrongPass123", UserRole.Seller),
            CancellationToken.None);

        await Assert.ThrowsAsync<ConflictException>(action);
        password.Verify(service => service.Hash(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task HandlerCreatesSellerAndPersistsHashedRefreshToken()
    {
        var users = new Mock<IUserRepository>();
        users.Setup(repository => repository.EmailExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        User? persistedUser = null;
        users.Setup(repository => repository.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((user, _) => persistedUser = user)
            .Returns(Task.CompletedTask);
        var password = new Mock<IPasswordService>();
        password.Setup(service => service.Hash("StrongPass123")).Returns("password-hash");
        var handler = CreateHandler(users, password);

        var response = await handler.Handle(
            new RegisterCommand("Ada", "Lovelace", "ada@example.com", "StrongPass123", UserRole.Seller),
            CancellationToken.None);

        Assert.Equal("access-token", response.AccessToken);
        Assert.Equal(UserRole.Seller, response.User.Role);
        Assert.NotNull(persistedUser);
        Assert.Equal("password-hash", persistedUser.PasswordHash);
        Assert.Equal("refresh-hash", persistedUser.RefreshTokens.Single().TokenHash);
    }

    private static RegisterCommandHandler CreateHandler(
        Mock<IUserRepository> users,
        Mock<IPasswordService> password)
    {
        var unitOfWork = new Mock<IUnitOfWork>();
        unitOfWork.Setup(unit => unit.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        var jwt = new Mock<IJwtTokenService>();
        jwt.Setup(service => service.Create(It.IsAny<User>()))
            .Returns(new AccessToken("access-token", FixedNow.AddMinutes(15)));
        var refresh = new Mock<IRefreshTokenService>();
        refresh.Setup(service => service.Generate())
            .Returns(new GeneratedRefreshToken("refresh-token", "refresh-hash", FixedNow.AddDays(14)));
        var clock = new Mock<IDateTimeProvider>();
        clock.SetupGet(provider => provider.UtcNow).Returns(FixedNow);
        return new RegisterCommandHandler(
            users.Object,
            unitOfWork.Object,
            password.Object,
            jwt.Object,
            refresh.Object,
            clock.Object);
    }
}
