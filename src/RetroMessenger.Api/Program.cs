using RetroMessenger.Api.Authentication;
using RetroMessenger.Api.Endpoints;
using RetroMessenger.Api.Middleware;
using RetroMessenger.Api.Realtime;
using RetroMessenger.Api.Security;
using RetroMessenger.Application;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Infrastructure;
using RetroMessenger.Infrastructure.Persistence;
using RetroMessenger.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls(
    builder.Configuration["ASPNETCORE_URLS"]
    ?? "http://0.0.0.0:5080");

builder.Services.AddRetroServiceDefaults();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddRetroMessengerApplication();
builder.Services.AddRetroMessengerInfrastructure(builder.Configuration);
builder.Services.AddAuthRateLimiting(builder.Configuration);
builder.Services.AddSingleton<IRealtimePublisher, SignalRRealtimePublisher>();
builder.Services.AddScoped<IPresencePublisher, SignalRPresencePublisher>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(
        AdminEndpoints.UsersReadPolicy,
        policy => policy.RequireRole("admin"));
    options.AddPolicy(
        AdminEndpoints.UsersSuspendPolicy,
        policy => policy.RequireRole("admin"));
    options.AddPolicy(
        AdminEndpoints.AuditReadPolicy,
        policy => policy.RequireRole("admin"));
});

builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 128 * 1024;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(45);
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .SetIsOriginAllowed(_ => true)
              .AllowCredentials());
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseRouting();
app.UseCors();
app.UseRateLimiter();

app.Use(async (context, next) =>
{
    if (string.IsNullOrEmpty(context.Request.Headers.Authorization) &&
        context.Request.Query.TryGetValue("access_token", out var accessToken) &&
        !string.IsNullOrEmpty(accessToken))
    {
        context.Request.Headers.Authorization = $"Bearer {accessToken}";
    }
    await next();
});

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new
{
    name = "Retro Messenger API",
    status = "running"
}));

app.MapSessionEndpoints();
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapContactEndpoints();
app.MapConversationEndpoints();
app.MapMessagingEndpoints();
app.MapRoomEndpoints();
app.MapMediaEndpoints();
app.MapCallEndpoints();
app.MapAdminEndpoints();
app.MapHub<ChatHub>("/realtime");
app.MapRetroDefaultEndpoints();

app.Run();

public partial class Program;
