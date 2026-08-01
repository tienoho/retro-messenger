using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Configurations;

public sealed class ConversationMemberConfiguration : IEntityTypeConfiguration<ConversationMemberEntity>
{
    public void Configure(EntityTypeBuilder<ConversationMemberEntity> builder)
    {
        builder.ToTable("conversation_members", "chat");

        builder.HasKey(x => new { x.ConversationId, x.UserId });
        builder.Property(x => x.ConversationId).HasColumnName("conversation_id");
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.Role).HasColumnName("role").IsRequired();
        builder.Property(x => x.JoinedAt).HasColumnName("joined_at").IsRequired();
        builder.Property(x => x.LastReadSequence).HasColumnName("last_read_sequence").IsRequired();

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
