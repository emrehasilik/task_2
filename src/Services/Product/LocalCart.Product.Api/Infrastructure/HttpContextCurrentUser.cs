using System.Security.Claims;
using LocalCart.Product.Application.Abstractions.Identity;

namespace LocalCart.Product.Api.Infrastructure;

internal sealed class HttpContextCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public Guid UserId => Guid.TryParse(Principal?.FindFirstValue("sub"), out var id) ? id : Guid.Empty;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public bool IsInRole(string role) => Principal?.IsInRole(role) == true;
}
