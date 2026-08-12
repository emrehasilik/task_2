using System.Globalization;
using System.Text.Json.Serialization;
using LocalCart.Product.Api.Extensions;
using LocalCart.Product.Api.Health;
using LocalCart.Product.Api.Infrastructure;
using LocalCart.Product.Application;
using LocalCart.Product.Application.Abstractions.Identity;
using LocalCart.Product.Infrastructure;
using LocalCart.Product.Infrastructure.Persistence;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(formatProvider: CultureInfo.InvariantCulture)
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());

    builder.Services
        .AddControllers()
        .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
    builder.Services.AddProblemDetails();
    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUser, HttpContextCurrentUser>();
    builder.Services.AddProductApplication();
    builder.Services.AddProductInfrastructure(builder.Configuration);
    builder.Services.AddProductAuthentication(builder.Configuration);
    builder.Services.AddProductAuthorization();
    builder.Services.AddProductSwagger();
    builder.Services.AddCors(options => options.AddPolicy("frontend", policy => policy
        .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [])
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));
    builder.Services.AddHealthChecks()
        .AddCheck<ProductDatabaseHealthCheck>("product-database", tags: ["ready"])
        .AddCheck<RedisHealthCheck>("redis", tags: ["ready"]);

    var app = builder.Build();
    app.UseExceptionHandler();
    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseSerilogRequestLogging();
    app.UseCors("frontend");
    app.UseAuthentication();
    app.UseAuthorization();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "LocalCart Product API v1");
            options.DisplayRequestDuration();
            options.EnableTryItOutByDefault();
        });
    }

    app.MapControllers();
    app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = registration => registration.Tags.Contains("ready")
    });

    await using (var scope = app.Services.CreateAsyncScope())
    {
        await scope.ServiceProvider.GetRequiredService<DatabaseInitializer>().InitializeAsync();
    }

    await app.RunAsync();
}
catch (HostAbortedException)
{
    // Expected when EF Core design-time tooling stops the host after resolving services.
}
catch (Exception exception)
{
    Log.Fatal(exception, "Product API terminated unexpectedly");
    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}

public partial class Program;
