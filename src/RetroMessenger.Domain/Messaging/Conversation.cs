using RetroMessenger.Domain.Common;

namespace RetroMessenger.Domain.Messaging;

public sealed class Conversation
{
    private readonly HashSet<Guid> _memberIds;

    public Conversation(Guid id, string title, IEnumerable<Guid> memberIds)
    {
        if (id == Guid.Empty) throw new DomainException("Conversation ID is required.");
        if (string.IsNullOrWhiteSpace(title)) throw new DomainException("Conversation title is required.");

        _memberIds = memberIds.Where(x => x != Guid.Empty).ToHashSet();
        if (_memberIds.Count < 1) throw new DomainException("A conversation requires at least one member.");

        Id = id;
        Title = title.Trim();
    }

    public Guid Id { get; }
    public string Title { get; private set; }
    public long LastSequence { get; private set; }
    public IReadOnlySet<Guid> MemberIds => _memberIds;

    public bool HasMember(Guid userId) => _memberIds.Contains(userId);

    public bool AddMember(Guid userId)
    {
        if (userId == Guid.Empty) return false;
        return _memberIds.Add(userId);
    }

    public long NextSequence()
    {
        checked { LastSequence++; }
        return LastSequence;
    }
}
