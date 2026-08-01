using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using RetroMessenger.Infrastructure.Persistence;

namespace RetroMessenger.Migrations;

public sealed class MessengerDbContextFactory : IDesignTimeDbContextFactory<MessengerDbContext>
{
    public MessengerDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<MessengerDbContext>();
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5432;Database=retro_messenger;Username=retro;Password=change-me");
        optionsBuilder.UseOpenIddict<Guid>();

        return new MessengerDbContext(optionsBuilder.Options);
    }
}
