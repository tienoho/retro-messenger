using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Configurations;

public sealed class AttachmentConfiguration : IEntityTypeConfiguration<AttachmentEntity>
{
    public void Configure(EntityTypeBuilder<AttachmentEntity> builder)
    {
        builder.ToTable("attachments", "media");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.ConversationId).HasColumnName("conversation_id").IsRequired();
        builder.Property(x => x.UploaderId).HasColumnName("uploader_id").IsRequired();
        builder.Property(x => x.FileName).HasColumnName("file_name").HasMaxLength(255).IsRequired();
        builder.Property(x => x.ContentType).HasColumnName("content_type").HasMaxLength(100).IsRequired();
        builder.Property(x => x.FileSizeBytes).HasColumnName("file_size_bytes").IsRequired();
        builder.Property(x => x.ObjectKey).HasColumnName("object_key").HasMaxLength(500).IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(32).HasDefaultValue("pending").IsRequired();
        builder.Property(x => x.ThumbnailKey).HasColumnName("thumbnail_key").HasMaxLength(500);
        builder.Property(x => x.QuarantineReason).HasColumnName("quarantine_reason");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.ScannedAt).HasColumnName("scanned_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(x => x.ProcessingOwner).HasColumnName("processing_owner");
        builder.Property(x => x.ProcessingLeaseUntil).HasColumnName("processing_lease_until");
        builder.Property(x => x.ProcessingAttempts).HasColumnName("processing_attempts").HasDefaultValue(0).IsRequired();
        builder.Property(x => x.NextProcessingAt).HasColumnName("next_processing_at").HasDefaultValueSql("now()");
        builder.Property(x => x.LastProcessingError).HasColumnName("last_processing_error");
        builder.Property(x => x.CleanupOwner).HasColumnName("cleanup_owner");
        builder.Property(x => x.CleanupLeaseUntil).HasColumnName("cleanup_lease_until");
        builder.Property(x => x.StorageDeletedAt).HasColumnName("storage_deleted_at");
        builder.Property(x => x.LastCleanupError).HasColumnName("last_cleanup_error");

        builder.HasOne(x => x.Conversation)
            .WithMany()
            .HasForeignKey(x => x.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Uploader)
            .WithMany()
            .HasForeignKey(x => x.UploaderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
