using FluentValidation;
using LocalCart.Product.Application.Common.Behaviors;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace LocalCart.Product.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddProductApplication(this IServiceCollection services)
    {
        services.AddMediatR(configuration =>
            configuration.RegisterServicesFromAssemblyContaining(typeof(DependencyInjection)));
        services.AddValidatorsFromAssemblyContaining(typeof(DependencyInjection));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        return services;
    }
}
