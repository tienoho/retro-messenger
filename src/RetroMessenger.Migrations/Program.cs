using System.Security.Cryptography;
using System.Text;
using Npgsql;

var root = FindRepositoryRoot();
var migrationDirectory = Path.Combine(root, "deploy", "postgres", "migrations");
var seedDirectory = Path.Combine(root, "deploy", "postgres", "seed");

Console.WriteLine("Retro Messenger migration runner");
Console.WriteLine($"Migration directory: {migrationDirectory}");
Console.WriteLine($"Seed directory: {seedDirectory}");

var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__postgres")
    ?? "Host=localhost;Port=5432;Database=retro_messenger;Username=retro;Password=change-me";

try
{
    await using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();
    Console.WriteLine("Connected to PostgreSQL successfully.");

    await EnsureHistoryTableAsync(connection);
    await ApplyDirectoryAsync(connection, migrationDirectory, "migration");
    await ApplyDirectoryAsync(connection, seedDirectory, "seed");

    Console.WriteLine("Migration and seed completed successfully.");
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Migration failed: {ex.Message}");
    Environment.ExitCode = 1;
}

static async Task EnsureHistoryTableAsync(NpgsqlConnection connection)
{
    const string sql = """
        CREATE SCHEMA IF NOT EXISTS infrastructure;
        CREATE TABLE IF NOT EXISTS infrastructure.schema_history (
            script_name text PRIMARY KEY,
            script_type varchar(20) NOT NULL,
            checksum_sha256 char(64) NOT NULL,
            applied_at timestamptz NOT NULL DEFAULT now()
        );
        """;

    await using var command = new NpgsqlCommand(sql, connection);
    await command.ExecuteNonQueryAsync();
}

static async Task ApplyDirectoryAsync(
    NpgsqlConnection connection,
    string directory,
    string scriptType)
{
    if (!Directory.Exists(directory))
    {
        return;
    }

    foreach (var file in Directory.EnumerateFiles(directory, "*.sql").OrderBy(path => path, StringComparer.Ordinal))
    {
        var scriptName = $"{scriptType}/{Path.GetFileName(file)}";
        var sql = await File.ReadAllTextAsync(file);
        var checksum = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(sql)))
            .ToLowerInvariant();

        await using var lookup = new NpgsqlCommand(
            "SELECT checksum_sha256 FROM infrastructure.schema_history WHERE script_name = $1",
            connection);
        lookup.Parameters.AddWithValue(scriptName);
        var existingChecksum = await lookup.ExecuteScalarAsync() as string;

        if (existingChecksum is not null)
        {
            if (!string.Equals(existingChecksum.Trim(), checksum, StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    $"Applied {scriptType} script '{scriptName}' has a different checksum.");
            }

            Console.WriteLine($"Skipping applied {scriptType} script: {Path.GetFileName(file)}");
            continue;
        }

        Console.WriteLine($"Applying {scriptType} script: {Path.GetFileName(file)}...");
        await using (var apply = new NpgsqlCommand(sql, connection))
        {
            await apply.ExecuteNonQueryAsync();
        }

        await using var record = new NpgsqlCommand(
            """
            INSERT INTO infrastructure.schema_history(script_name, script_type, checksum_sha256)
            VALUES ($1, $2, $3)
            """,
            connection);
        record.Parameters.AddWithValue(scriptName);
        record.Parameters.AddWithValue(scriptType);
        record.Parameters.AddWithValue(checksum);
        await record.ExecuteNonQueryAsync();
    }
}

static string FindRepositoryRoot()
{
    var directory = new DirectoryInfo(AppContext.BaseDirectory);
    while (directory is not null)
    {
        if (File.Exists(Path.Combine(directory.FullName, "RetroMessenger.slnx")))
        {
            return directory.FullName;
        }

        directory = directory.Parent;
    }

    return Directory.GetCurrentDirectory();
}
