#pragma warning disable CA1848, CA1873
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace RetroMessenger.Worker;

public sealed class MaintenanceWorker(
    ILogger<MaintenanceWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "Retro Messenger worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            logger.LogInformation(
                "Worker heartbeat at {Timestamp}. Media processing and cleanup hosted services are active.",
                DateTimeOffset.UtcNow);

            await Task.Delay(
                TimeSpan.FromSeconds(30),
                stoppingToken);
        }
    }
}
