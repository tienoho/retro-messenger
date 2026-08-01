using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Messaging;

namespace RetroMessenger.Infrastructure.Persistence.Outbox;

#pragma warning disable CA1848
public sealed class OutboxProcessorWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<OutboxProcessorWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingOutboxMessagesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing outbox messages.");
            }

            await Task.Delay(TimeSpan.FromMilliseconds(500), stoppingToken);
        }
    }

    private async Task ProcessPendingOutboxMessagesAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetService<MessengerDbContext>();
        var realtime = scope.ServiceProvider.GetService<IRealtimePublisher>();

        if (db is null || realtime is null)
        {
            return;
        }

        var pendingMessages = await db.OutboxMessages
            .Where(o => o.ProcessedAt == null && !o.IsQuarantined)
            .OrderBy(o => o.OccurredAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        if (pendingMessages.Count == 0)
        {
            return;
        }

        foreach (var outboxMessage in pendingMessages)
        {
            try
            {
                if (outboxMessage.EventType == "MessageCreatedIntegrationEvent")
                {
                    var dto = JsonSerializer.Deserialize<MessageDto>(outboxMessage.Payload);
                    if (dto is not null)
                    {
                        await realtime.PublishMessageAsync(dto, cancellationToken);
                    }
                }

                outboxMessage.ProcessedAt = DateTimeOffset.UtcNow;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to process outbox message {Id}", outboxMessage.Id);
                outboxMessage.Error = ex.Message;
                outboxMessage.RetryCount++;
                if (outboxMessage.RetryCount >= 5)
                {
                    outboxMessage.IsQuarantined = true;
                    outboxMessage.QuarantinedAt = DateTimeOffset.UtcNow;
                    logger.LogWarning("Outbox message {Id} quarantined after {RetryCount} retries.", outboxMessage.Id, outboxMessage.RetryCount);
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
