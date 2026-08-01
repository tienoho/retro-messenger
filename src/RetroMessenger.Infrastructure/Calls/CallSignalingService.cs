using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Calls;

namespace RetroMessenger.Infrastructure.Calls;

public sealed class LiveKitOptions
{
    public const string SectionName = "LiveKit";
    public string ServerUrl { get; set; } = "ws://localhost:7880";
    public string ApiKey { get; set; } = "devkey";
    public string ApiSecret { get; set; } = "secret-dev-key-must-be-at-least-32-bytes-long!";
}

public sealed class CallSignalingService(
    IOptions<LiveKitOptions> options,
    IConversationRepository conversationRepository,
    IUserRepository userRepository)
{
    public async Task<CallTokenResponse> IssueCallTokenAsync(
        Guid userId,
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        var conversation = await conversationRepository.GetAsync(conversationId, cancellationToken)
            ?? throw new KeyNotFoundException("Conversation was not found.");

        if (!conversation.HasMember(userId))
        {
            throw new UnauthorizedAccessException("User is not an authorized participant of this conversation.");
        }

        var user = await userRepository.GetByIdAsync(userId, cancellationToken);
        var roomName = $"conv_{conversationId}";
        var lkOpts = options.Value;

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(lkOpts.ApiSecret);

        var videoGrant = new Dictionary<string, object>
        {
            ["room"] = roomName,
            ["roomJoin"] = true,
            ["canPublish"] = true,
            ["canSubscribe"] = true,
            ["canPublishData"] = true
        };

        var now = DateTimeOffset.UtcNow;
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Issuer = lkOpts.ApiKey,
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim("name", user?.DisplayName ?? userId.ToString())
            ]),
            NotBefore = now.UtcDateTime,
            Expires = now.AddHours(2).UtcDateTime,
            Claims = new Dictionary<string, object>
            {
                ["video"] = videoGrant
            },
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var jwt = tokenHandler.WriteToken(token);

        return new CallTokenResponse(jwt, lkOpts.ServerUrl);
    }
}
