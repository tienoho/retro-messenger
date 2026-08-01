using Microsoft.EntityFrameworkCore;
using RetroMessenger.Application.Abstractions;

namespace RetroMessenger.Infrastructure.Persistence;

public sealed class EfTransactionRunner(MessengerDbContext db) : ITransactionRunner
{
    public async Task<T> ExecuteAsync<T>(
        Func<CancellationToken, Task<T>> action,
        CancellationToken cancellationToken)
    {
        if (!db.Database.IsRelational() || db.Database.CurrentTransaction is not null)
        {
            return await action(cancellationToken);
        }

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            var result = await action(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return result;
        });
    }
}
