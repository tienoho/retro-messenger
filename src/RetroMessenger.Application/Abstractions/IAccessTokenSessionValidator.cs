namespace RetroMessenger.Application.Abstractions;

public interface IAccessTokenSessionValidator
{
    Task<bool> IsActiveAsync(
        Guid userId,
        Guid familyId,
        CancellationToken cancellationToken = default);
}
