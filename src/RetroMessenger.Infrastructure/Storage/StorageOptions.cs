namespace RetroMessenger.Infrastructure.Storage;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";
    public string Endpoint { get; set; } = "http://localhost:9000";
    public string PublicEndpoint { get; set; } = "http://localhost:9000";
    public string AccessKey { get; set; } = "retroadmin";
    public string SecretKey { get; set; } = "change-me-strong";
    public string BucketName { get; set; } = "retro-messenger";
    public string Region { get; set; } = "us-east-1";
    public bool UsePathStyle { get; set; } = true;
    public bool AutoCreateBucket { get; set; } = true;
}
