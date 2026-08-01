using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Configurations;

public sealed class ContactRequestConfiguration : IEntityTypeConfiguration<ContactRequestEntity>
{
    public void Configure(EntityTypeBuilder<ContactRequestEntity> builder)
    {
        builder.ToTable("contact_requests", "contacts");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.SenderId).HasColumnName("sender_id").IsRequired();
        builder.Property(x => x.RecipientId).HasColumnName("recipient_id").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(32).IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.RespondedAt).HasColumnName("responded_at");

        builder.HasIndex(x => new { x.SenderId, x.RecipientId }).IsUnique();
        builder.HasIndex(x => new { x.RecipientId, x.Status, x.CreatedAt });

        builder.HasOne<UserProfileEntity>()
            .WithMany()
            .HasForeignKey(x => x.SenderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<UserProfileEntity>()
            .WithMany()
            .HasForeignKey(x => x.RecipientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
