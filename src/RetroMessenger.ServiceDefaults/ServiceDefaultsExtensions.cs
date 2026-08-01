using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace RetroMessenger.ServiceDefaults;

public static class ServiceDefaultsExtensions
{
    public static IServiceCollection AddRetroServiceDefaults(this IServiceCollection services)
    {
        services.AddProblemDetails();
        services.AddHealthChecks();
        return services;
    }

    public static WebApplication MapRetroDefaultEndpoints(this WebApplication app)
    {
        app.MapHealthChecks("/health");
        return app;
    }
}
