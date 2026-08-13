using System.Globalization;
using System.Text.Json.Serialization;
using LocalCart.Auth.Api.Extensions;
using LocalCart.Auth.Api.Health;
using LocalCart.Auth.Api.Infrastructure;
using LocalCart.Auth.Application;
using LocalCart.Auth.Infrastructure;
using LocalCart.Auth.Infrastructure.Persistence;
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
    builder.Services.AddAuthApplication();
    builder.Services.AddAuthInfrastructure(builder.Configuration);
    builder.Services.AddJwtAuthentication(builder.Configuration);
    builder.Services.AddAuthorization();
    builder.Services.AddAuthSwagger();
    builder.Services.AddAuthRateLimiting();
    builder.Services.AddCors(options => options.AddPolicy("frontend", policy => policy
        .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [])
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));
    builder.Services.AddHealthChecks().AddCheck<AuthDatabaseHealthCheck>("auth-database", tags: ["ready"]);

    var app = builder.Build();

    app.UseExceptionHandler();
    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseSerilogRequestLogging();
    app.UseCors("frontend");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "LocalCart Auth API v1");
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

    if (app.Configuration.GetValue("Database:ApplyMigrationsOnStartup", true))
    {
        await using var scope = app.Services.CreateAsyncScope();
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
    Log.Fatal(exception, "Auth API terminated unexpectedly");
    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}

public partial class Program;
