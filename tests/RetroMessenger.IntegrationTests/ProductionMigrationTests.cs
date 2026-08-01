#pragma warning disable CA1707
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Npgsql;
using RetroMessenger.Infrastructure.Persistence;
using Xunit;

namespace RetroMessenger.IntegrationTests;

[Collection("PostgresAndRedis")]
public sealed class ProductionMigrationTests(PostgresAndRedisFixture fixture)
{
    [Fact]
    public async Task SqlMigrations_ProvideEveryEfMappedTableAndColumn()
    {
        Assert.True(fixture.IsUsingRealContainers);

        var databaseName = $"schema_{Guid.NewGuid():N}";
        var adminConnectionString = new NpgsqlConnectionStringBuilder(fixture.PostgresConnectionString)
        {
            Database = "postgres"
        }.ConnectionString;
        var targetConnectionString = new NpgsqlConnectionStringBuilder(fixture.PostgresConnectionString)
        {
            Database = databaseName
        }.ConnectionString;

        await using var adminConnection = new NpgsqlConnection(adminConnectionString);
        await adminConnection.OpenAsync();
        await using (var createDatabase = new NpgsqlCommand(
            $"CREATE DATABASE \"{databaseName}\"",
            adminConnection))
        {
            await createDatabase.ExecuteNonQueryAsync();
        }

        try
        {
            var migrationDirectory = Path.Combine(
                FindRepositoryRoot(),
                "deploy",
                "postgres",
                "migrations");

            await ApplyScriptsAsync(targetConnectionString, migrationDirectory);
            await ApplyScriptsAsync(targetConnectionString, migrationDirectory);

            var optionsBuilder = new DbContextOptionsBuilder<MessengerDbContext>();
            optionsBuilder.UseNpgsql(targetConnectionString);
            optionsBuilder.UseOpenIddict<Guid>();
            await using var db = new MessengerDbContext(optionsBuilder.Options);

            var actualColumns = await ReadActualColumnsAsync(targetConnectionString);
            foreach (var entityType in db.Model.GetEntityTypes())
            {
                var tableName = entityType.GetTableName();
                if (tableName is null)
                {
                    continue;
                }

                var schema = entityType.GetSchema() ?? "public";
                var table = StoreObjectIdentifier.Table(tableName, schema);
                foreach (var property in entityType.GetProperties())
                {
                    var columnName = property.GetColumnName(table);
                    if (columnName is null)
                    {
                        continue;
                    }

                    Assert.Contains(
                        (schema, tableName, columnName),
                        actualColumns);
                }
            }
        }
        finally
        {
            await using var dropDatabase = new NpgsqlCommand(
                $"DROP DATABASE IF EXISTS \"{databaseName}\" WITH (FORCE)",
                adminConnection);
            await dropDatabase.ExecuteNonQueryAsync();
        }
    }

    private static async Task ApplyScriptsAsync(
        string connectionString,
        string migrationDirectory)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();

        foreach (var file in Directory.EnumerateFiles(migrationDirectory, "*.sql")
                     .OrderBy(path => path, StringComparer.Ordinal))
        {
            var sql = await File.ReadAllTextAsync(file);
            await using var command = new NpgsqlCommand(sql, connection);
            await command.ExecuteNonQueryAsync();
        }
    }

    private static async Task<HashSet<(string Schema, string Table, string Column)>> ReadActualColumnsAsync(
        string connectionString)
    {
        const string sql = """
            SELECT table_schema, table_name, column_name
            FROM information_schema.columns
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            """;

        var result = new HashSet<(string Schema, string Table, string Column)>();
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add((reader.GetString(0), reader.GetString(1), reader.GetString(2)));
        }

        return result;
    }

    private static string FindRepositoryRoot()
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

        throw new DirectoryNotFoundException("Could not locate the repository root.");
    }
}
