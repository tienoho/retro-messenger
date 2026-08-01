using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Configurations;

public sealed class RoomConfiguration : IEntityTypeConfiguration<RoomEntity>
{
    public void Configure(EntityTypeBuilder<RoomEntity> builder)
    {
        builder.ToTable("chat_rooms", "rooms");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id");

        builder.Property(r => r.Title)
            .HasColumnName("title")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(r => r.Description)
            .HasColumnName("description")
            .HasMaxLength(512);

        builder.Property(r => r.OwnerId)
            .HasColumnName("owner_id")
            .IsRequired();

        builder.Property(r => r.IsPublic).HasColumnName("is_public").IsRequired();
        builder.Property(r => r.MemberCount).HasColumnName("member_count").IsRequired();
        builder.Property(r => r.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();
    }
}
