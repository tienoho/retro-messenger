using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Infrastructure.Persistence;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Authentication;

public sealed class IdentityService : IIdentityService
{
    private const string RefreshTokenTypeClaim = "token_type";
    private const string RefreshTokenType = "refresh";
    private const string TokenFamilyClaim = "token_family";

    private readonly UserManager<ApplicationUser>? _userManager;
    private readonly MessengerDbContext _db;
    private readonly JwtOptions _jwtOptions;
    private readonly SymmetricSecurityKey _securityKey;

    public IdentityService(
        IServiceProvider serviceProvider,
        IOptions<JwtOptions> jwtOptions)
    {
        _userManager = serviceProvider.GetService(typeof(UserManager<ApplicationUser>)) as UserManager<ApplicationUser>;
        _db = serviceProvider.GetService(typeof(MessengerDbContext)) as MessengerDbContext
            ?? throw new InvalidOperationException("MessengerDbContext is required for refresh-token sessions.");
        _jwtOptions = jwtOptions.Value;
        _securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SigningKey));
    }

    public async Task<(bool Succeeded, string[] Errors, Guid UserId)> RegisterUserAsync(
        string username,
        string displayName,
        string password,
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.CreateVersion7();
        var user = new ApplicationUser
        {
            Id = userId,
            UserName = username,
            DisplayName = displayName,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        if (_userManager is not null)
        {
            var result = await _userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                return (false, result.Errors.Select(e => e.Description).ToArray(), Guid.Empty);
            }

            return (true, [], user.Id);
        }

        return (true, [], userId);
    }

    public async Task<(bool Succeeded, string[] Errors, Guid UserId)> ValidateUserCredentialsAsync(
        string username,
        string password,
        CancellationToken cancellationToken = default)
    {
        var genericFailure = new[] { "Invalid username or password." };
        if (_userManager is not null)
        {
            var user = await _userManager.FindByNameAsync(username);
            if (user is null)
            {
                return (false, genericFailure, Guid.Empty);
            }

            if (await _userManager.IsLockedOutAsync(user))
            {
                return (false, genericFailure, Guid.Empty);
            }

            var valid = await _userManager.CheckPasswordAsync(user, password);
            if (!valid)
            {
                await _userManager.AccessFailedAsync(user);
                return (false, genericFailure, Guid.Empty);
            }

            if (user.AccessFailedCount > 0)
            {
                await _userManager.ResetAccessFailedCountAsync(user);
            }

            return (true, [], user.Id);
        }

        return (true, [], Guid.Empty);
    }

    public async Task<(string AccessToken, string RefreshToken)> GenerateTokensAsync(
        Guid userId,
        string username,
        CancellationToken cancellationToken = default)
    {
        var roles = await GetRolesAsync(userId, cancellationToken);
        var tokenPair = CreateTokenPair(userId, username, Guid.NewGuid(), roles);
        _db.RefreshSessions.Add(tokenPair.Session);
        await _db.SaveChangesAsync(cancellationToken);
        return (tokenPair.AccessToken, tokenPair.RefreshToken);
    }

    public async Task<(bool Succeeded, string AccessToken, string RefreshToken, Guid UserId, string Username)> RefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        if (!TryValidateRefreshToken(
                refreshToken,
                out var userId,
                out var username,
                out var sessionId,
                out var familyId))
        {
            return Failure();
        }

        var tokenHash = HashToken(refreshToken);
        var now = DateTimeOffset.UtcNow;
        var roles = await GetRolesAsync(userId, cancellationToken);

        if (!_db.Database.IsRelational())
        {
            return await RotateInMemoryAsync(
                tokenHash,
                userId,
                username,
                sessionId,
                familyId,
                now,
                roles,
                cancellationToken);
        }

        IDbContextTransaction? transaction = null;
        if (_db.Database.CurrentTransaction is null)
        {
            transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        }

        try
        {
            var replacement = CreateTokenPair(userId, username, familyId, roles);
            var affected = await _db.RefreshSessions
                .Where(x =>
                    x.Id == sessionId &&
                    x.FamilyId == familyId &&
                    x.UserId == userId &&
                    x.TokenHash == tokenHash &&
                    x.ConsumedAt == null &&
                    x.RevokedAt == null &&
                    x.ExpiresAt > now)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(x => x.ConsumedAt, now)
                        .SetProperty(x => x.ReplacedBySessionId, replacement.Session.Id),
                    cancellationToken);

            if (affected != 1)
            {
                await RevokeReusedFamilyAsync(tokenHash, now, cancellationToken);
                if (transaction is not null)
                {
                    await transaction.CommitAsync(cancellationToken);
                }

                return Failure();
            }

            _db.RefreshSessions.Add(replacement.Session);
            await _db.SaveChangesAsync(cancellationToken);
            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return (
                true,
                replacement.AccessToken,
                replacement.RefreshToken,
                userId,
                username);
        }
        catch
        {
            if (transaction is not null)
            {
                await transaction.RollbackAsync(CancellationToken.None);
            }

            return Failure();
        }
        finally
        {
            if (transaction is not null)
            {
                await transaction.DisposeAsync();
            }
        }
    }

    public async Task RevokeTokenAsync(
        string token,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return;
        }

        var tokenHash = HashToken(token);
        var session = await _db.RefreshSessions
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);
        if (session is null)
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        if (_db.Database.IsRelational())
        {
            await _db.RefreshSessions
                .Where(x => x.FamilyId == session.FamilyId && x.RevokedAt == null)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(x => x.RevokedAt, now),
                    cancellationToken);
            return;
        }

        var family = await _db.RefreshSessions
            .Where(x => x.FamilyId == session.FamilyId && x.RevokedAt == null)
            .ToListAsync(cancellationToken);
        foreach (var item in family)
        {
            item.RevokedAt = now;
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<(bool Succeeded, string AccessToken, string RefreshToken, Guid UserId, string Username)> RotateInMemoryAsync(
        string tokenHash,
        Guid userId,
        string username,
        Guid sessionId,
        Guid familyId,
        DateTimeOffset now,
        IReadOnlyCollection<string> roles,
        CancellationToken cancellationToken)
    {
        var current = await _db.RefreshSessions.SingleOrDefaultAsync(
            x => x.Id == sessionId && x.TokenHash == tokenHash,
            cancellationToken);

        if (current is null ||
            current.UserId != userId ||
            current.FamilyId != familyId ||
            current.ExpiresAt <= now ||
            current.ConsumedAt is not null ||
            current.RevokedAt is not null)
        {
            if (current is not null &&
                (current.ConsumedAt is not null || current.RevokedAt is not null))
            {
                var family = await _db.RefreshSessions
                    .Where(x => x.FamilyId == current.FamilyId && x.RevokedAt == null)
                    .ToListAsync(cancellationToken);
                foreach (var item in family)
                {
                    item.RevokedAt = now;
                }

                await _db.SaveChangesAsync(cancellationToken);
            }

            return Failure();
        }

        var replacement = CreateTokenPair(userId, username, familyId, roles);
        current.ConsumedAt = now;
        current.ReplacedBySessionId = replacement.Session.Id;
        _db.RefreshSessions.Add(replacement.Session);
        await _db.SaveChangesAsync(cancellationToken);

        return (
            true,
            replacement.AccessToken,
            replacement.RefreshToken,
            userId,
            username);
    }

    private async Task RevokeReusedFamilyAsync(
        string tokenHash,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var existing = await _db.RefreshSessions
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);
        if (existing is null ||
            (existing.ConsumedAt is null && existing.RevokedAt is null))
        {
            return;
        }

        await _db.RefreshSessions
            .Where(x => x.FamilyId == existing.FamilyId && x.RevokedAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(x => x.RevokedAt, now),
                cancellationToken);
    }

    private TokenPair CreateTokenPair(
        Guid userId,
        string username,
        Guid familyId,
        IReadOnlyCollection<string> roles)
    {
        var now = DateTimeOffset.UtcNow;
        var sessionId = Guid.NewGuid();
        var tokenHandler = new JwtSecurityTokenHandler();

        var accessClaims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new Claim(TokenFamilyClaim, familyId.ToString("N"))
        };
        accessClaims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var accessDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(accessClaims),
            Issuer = _jwtOptions.Issuer,
            Audience = _jwtOptions.Audience,
            Expires = now.AddMinutes(_jwtOptions.AccessTokenLifetimeMinutes).UtcDateTime,
            SigningCredentials = new SigningCredentials(
                _securityKey,
                SecurityAlgorithms.HmacSha256Signature)
        };

        var accessToken = tokenHandler.WriteToken(tokenHandler.CreateToken(accessDescriptor));

        var refreshClaims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(JwtRegisteredClaimNames.Jti, sessionId.ToString("N")),
            new Claim(TokenFamilyClaim, familyId.ToString("N")),
            new Claim(RefreshTokenTypeClaim, RefreshTokenType)
        };

        var expiresAt = now.AddDays(_jwtOptions.RefreshTokenLifetimeDays);
        var refreshDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(refreshClaims),
            Issuer = _jwtOptions.Issuer,
            Audience = _jwtOptions.Audience,
            Expires = expiresAt.UtcDateTime,
            SigningCredentials = new SigningCredentials(
                _securityKey,
                SecurityAlgorithms.HmacSha256Signature)
        };

        var refreshToken = tokenHandler.WriteToken(tokenHandler.CreateToken(refreshDescriptor));
        var session = new RefreshSessionEntity
        {
            Id = sessionId,
            FamilyId = familyId,
            UserId = userId,
            TokenHash = HashToken(refreshToken),
            CreatedAt = now,
            ExpiresAt = expiresAt
        };

        return new TokenPair(accessToken, refreshToken, session);
    }

    private bool TryValidateRefreshToken(
        string refreshToken,
        out Guid userId,
        out string username,
        out Guid sessionId,
        out Guid familyId)
    {
        userId = Guid.Empty;
        username = string.Empty;
        sessionId = Guid.Empty;
        familyId = Guid.Empty;

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return false;
        }

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(
                refreshToken,
                new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = _securityKey,
                    ValidateIssuer = true,
                    ValidIssuer = _jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = _jwtOptions.Audience,
                    ValidateLifetime = true,
                    ValidAlgorithms = [SecurityAlgorithms.HmacSha256]
                },
                out _);

            if (!string.Equals(
                    principal.FindFirstValue(RefreshTokenTypeClaim),
                    RefreshTokenType,
                    StringComparison.Ordinal))
            {
                return false;
            }

            var subject = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var jti = principal.FindFirstValue(JwtRegisteredClaimNames.Jti);
            var family = principal.FindFirstValue(TokenFamilyClaim);

            if (!Guid.TryParse(subject, out userId) ||
                !Guid.TryParse(jti, out sessionId) ||
                !Guid.TryParse(family, out familyId))
            {
                return false;
            }

            username = principal.FindFirstValue(ClaimTypes.Name) ?? "user";
            return true;
        }
        catch (SecurityTokenException)
        {
            return false;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)))
            .ToLowerInvariant();

    private async Task<IReadOnlyCollection<string>> GetRolesAsync(
        Guid userId,
        CancellationToken cancellationToken) =>
        await (
            from userRole in _db.UserRoles.AsNoTracking()
            join role in _db.Roles.AsNoTracking()
                on userRole.RoleId equals role.Id
            where userRole.UserId == userId && role.Name != null
            select role.Name!)
            .ToListAsync(cancellationToken);

    private static (bool Succeeded, string AccessToken, string RefreshToken, Guid UserId, string Username) Failure() =>
        (false, string.Empty, string.Empty, Guid.Empty, string.Empty);

    private sealed record TokenPair(
        string AccessToken,
        string RefreshToken,
        RefreshSessionEntity Session);
}
