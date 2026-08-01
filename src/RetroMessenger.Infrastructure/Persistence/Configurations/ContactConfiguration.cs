using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Configurations;

public sealed class ContactConfiguration : IEntityTypeConfiguration<ContactEntity>
{
    public void Configure(EntityTypeBuilder<ContactEntity> builder)
    {
        builder.ToTable("contact_relationships", "contacts");

        builder.HasKey(c => new { c.UserId, c.ContactId });

        builder.Property(c => c.UserId).HasColumnName("user_id");
        builder.Property(c => c.ContactId).HasColumnName("contact_id");
        builder.Property(c => c.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(c => c.GroupName)
            .HasColumnName("group_name")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.HasOne<UserProfileEntity>()
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<UserProfileEntity>()
            .WithMany()
            .HasForeignKey(c => c.ContactId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
