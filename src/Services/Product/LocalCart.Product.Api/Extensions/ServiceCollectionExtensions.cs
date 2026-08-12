using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace LocalCart.Product.Api.Extensions;

internal static class ServiceCollectionExtensions
{
    public static IServiceCollection AddProductAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwt = configuration.GetRequiredSection("Jwt").Get<JwtValidationOptions>()
            ?? throw new InvalidOperationException("Jwt configuration is required.");
        if (jwt.SigningKey.Length < 32)
        {
            throw new InvalidOperationException("Jwt:SigningKey must contain at least 32 characters.");
        }

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = "sub",
                    RoleClaimType = "role"
                };
            });
        return services;
    }

    public static IServiceCollection AddProductAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy("ProductManager", policy => policy.RequireRole("Seller", "Admin"));
            options.AddPolicy("SellerOnly", policy => policy.RequireRole("Seller"));
        });
        return services;
    }

    public static IServiceCollection AddProductSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "LocalCart Product API",
                Version = "v1",
                Description = "CQRS catalog API with PostgreSQL filtering and Redis cache-aside."
            });
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Paste an access token issued by LocalCart Auth API."
            });
            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                [new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                }] = Array.Empty<string>()
            });
        });
        return services;
    }

    private sealed record JwtValidationOptions(string Issuer, string Audience, string SigningKey);
}
