namespace RetroMessenger.Contracts.Calls;

public sealed record CallTokenRequest(Guid ConversationId, string RoomName);

public sealed record CallTokenResponse(string Token, string LiveKitUrl);

public sealed record CreateCallTokenRequest(Guid ConversationId, Guid? TargetUserId = null, string CallType = "audio");
