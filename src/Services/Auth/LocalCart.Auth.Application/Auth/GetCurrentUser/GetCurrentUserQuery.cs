using LocalCart.Auth.Application.Abstractions.Persistence;
using LocalCart.Auth.Application.Common.Exceptions;
using MediatR;

namespace LocalCart.Auth.Application.Auth.GetCurrentUser;

public sealed record GetCurrentUserQuery(Guid UserId) : IRequest<UserResponse>;

public sealed class GetCurrentUserQueryHandler(IUserRepository users)
    : IRequestHandler<GetCurrentUserQuery, UserResponse>
{
    public async Task<UserResponse> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var user = await users.FindByIdAsync(request.UserId, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException("User was not found.");

        return new UserResponse(user.Id, user.FirstName, user.LastName, user.Email, user.Role);
    }
}
