using RetroMessenger.Application.Abstractions;
using RetroMessenger.Application.Admin;
using RetroMessenger.Contracts.Admin;

namespace RetroMessenger.Api.Endpoints;

public static class AdminEndpoints
{
    public const string UsersReadPolicy = "admin.users.read";
    public const string UsersSuspendPolicy = "admin.users.suspend";
    public const string AuditReadPolicy = "admin.audit.read";

    public static IEndpointRouteBuilder MapAdminEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/admin/v1")
            .WithTags("Admin")
            .RequireAuthorization();

        group.MapGet("/overview", async (
            AdminService service,
            CancellationToken ct) =>
            Results.Ok(await service.GetOverviewAsync(ct)))
            .RequireAuthorization(UsersReadPolicy);

        group.MapGet("/users", async (
            int? limit,
            AdminService service,
            CancellationToken ct) =>
            Results.Ok(await service.ListUsersAsync(limit ?? 50, ct)))
            .RequireAuthorization(UsersReadPolicy);

        group.MapPost("/users/{userId:guid}/suspension", async (
            Guid userId,
            SetUserSuspensionRequest request,
            ICurrentUserContext currentUser,
            AdminService service,
            CancellationToken ct) =>
        {
            await service.SetUserSuspensionAsync(
                currentUser.UserId,
                userId,
                request,
                ct);
            return Results.Ok(new { message = "User suspension state updated." });
        })
            .RequireAuthorization(UsersSuspendPolicy);

        group.MapGet("/audit", async (
            int? limit,
            AdminService service,
            CancellationToken ct) =>
            Results.Ok(await service.ListAuditLogsAsync(limit ?? 50, ct)))
            .RequireAuthorization(AuditReadPolicy);

        return endpoints;
    }
}
