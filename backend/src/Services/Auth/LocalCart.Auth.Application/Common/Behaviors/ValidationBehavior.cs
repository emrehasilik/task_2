using FluentValidation;
using MediatR;

namespace LocalCart.Auth.Application.Common.Behaviors;

public sealed class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
#pragma warning disable CA2016 // MediatR v12's RequestHandlerDelegate does not expose a cancellation-token parameter.
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!validators.Any())
        {
            return await next().ConfigureAwait(false);
        }

        var context = new ValidationContext<TRequest>(request);
        var results = await Task.WhenAll(
            validators.Select(validator => validator.ValidateAsync(context, cancellationToken))).ConfigureAwait(false);
        var failures = results.SelectMany(result => result.Errors).Where(failure => failure is not null).ToArray();

        if (failures.Length != 0)
        {
            throw new ValidationException(failures);
        }

        return await next().ConfigureAwait(false);
    }
#pragma warning restore CA2016
}
