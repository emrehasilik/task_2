namespace LocalCart.Product.Application.Abstractions.Identity;

public interface ICurrentUser
{
    Guid UserId { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string role);
}
