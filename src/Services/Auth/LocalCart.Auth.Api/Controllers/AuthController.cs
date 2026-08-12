using LocalCart.Auth.Application.Auth;
using LocalCart.Auth.Application.Auth.GetCurrentUser;
using LocalCart.Auth.Application.Auth.Login;
using LocalCart.Auth.Application.Auth.Refresh;
using LocalCart.Auth.Application.Auth.Register;
using LocalCart.Auth.Application.Auth.Revoke;
using LocalCart.Auth.Domain.Users;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LocalCart.Auth.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
[Produces("application/json")]
public sealed class AuthController(ISender sender) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var response = await sender.Send(
            new RegisterCommand(
                request.FirstName,
                request.LastName,
                request.Email,
                request.Password,
                request.Role),
            cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new LoginCommand(request.Email, request.Password), cancellationToken));

    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Refresh(
        RefreshTokenRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new RefreshTokenCommand(request.RefreshToken), cancellationToken));

    [HttpPost("revoke")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Revoke(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        await sender.Send(new RevokeTokenCommand(request.RefreshToken), cancellationToken);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserResponse>> Me(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirst("sub")!.Value);
        return Ok(await sender.Send(new GetCurrentUserQuery(userId), cancellationToken));
    }
}

public sealed record RegisterRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    UserRole Role = UserRole.Customer);

public sealed record LoginRequest(string Email, string Password);

public sealed record RefreshTokenRequest(string RefreshToken);
