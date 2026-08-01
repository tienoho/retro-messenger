using Microsoft.AspNetCore.Identity;

namespace RetroMessenger.Infrastructure.Authentication;

public class ApplicationUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public string Status { get; set; } = "offline";
    public string? CustomStatus { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
