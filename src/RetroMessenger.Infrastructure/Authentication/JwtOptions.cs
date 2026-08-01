namespace RetroMessenger.Infrastructure.Authentication;

public sealed class JwtOptions
{
    public const string SectionName = "Authentication:Jwt";

    public string SigningKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "retro-messenger";
    public string Audience { get; set; } = "retro-messenger-clients";
    public int AccessTokenLifetimeMinutes { get; set; } = 60;
    public int RefreshTokenLifetimeDays { get; set; } = 30;
}
