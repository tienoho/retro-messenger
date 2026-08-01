using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Infrastructure.Persistence;

namespace RetroMessenger.Infrastructure.Authentication;

public sealed class HttpCurrentUserContext(IHttpContextAccessor httpContextAccessor) : ICurrentUserContext
{
    public Guid UserId
    {
        get
        {
            var user = httpContextAccessor.HttpContext?.User;
            var sub = user?.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? user?.FindFirstValue("sub")
                   ?? user?.FindFirstValue(ClaimTypes.Name);

            if (!string.IsNullOrEmpty(sub) && Guid.TryParse(sub, out var userId))
            {
                return userId;
            }

            return Guid.Empty;
        }
    }

    public Guid DeviceId
    {
        get
        {
            var deviceIdHeader = httpContextAccessor.HttpContext?.Request.Headers["X-Device-Id"].ToString();
            if (!string.IsNullOrEmpty(deviceIdHeader) && Guid.TryParse(deviceIdHeader, out var devId))
            {
                return devId;
            }

            return Guid.Parse("33333333-3333-3333-3333-333333333333");
        }
    }

    public bool IsAuthenticated =>
        httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated == true;
}
