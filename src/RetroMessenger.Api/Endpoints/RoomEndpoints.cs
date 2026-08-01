using RetroMessenger.Application.Rooms;
using RetroMessenger.Contracts.Rooms;

namespace RetroMessenger.Api.Endpoints;

public static class RoomEndpoints
{
    public static IEndpointRouteBuilder MapRoomEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/rooms").WithTags("Rooms");

        group.MapGet("/public", async (RoomService roomService, CancellationToken ct) =>
        {
            var rooms = await roomService.GetPublicRoomsAsync(ct);
            return Results.Ok(rooms);
        });

        group.MapPost("/", async (CreateRoomRequest request, RoomService roomService, CancellationToken ct) =>
        {
            var room = await roomService.CreateRoomAsync(request, ct);
            return Results.Ok(room);
        }).RequireAuthorization();

        group.MapPost("/{id:guid}/join", async (Guid id, CancellationToken ct) =>
        {
            await RoomService.JoinRoomAsync(id, ct);
            return Results.Ok(new { message = "Joined room successfully." });
        }).RequireAuthorization();

        return endpoints;
    }
}
