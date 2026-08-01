using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RetroMessenger.Infrastructure;
using RetroMessenger.Worker;
using RetroMessenger.Worker.Consumers;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddRetroMessengerWorkerInfrastructure(builder.Configuration);
builder.Services.Configure<MediaProcessingOptions>(
    builder.Configuration.GetSection(MediaProcessingOptions.SectionName));
builder.Services.Configure<MediaCleanupOptions>(
    builder.Configuration.GetSection(MediaCleanupOptions.SectionName));
builder.Services.AddHostedService<MaintenanceWorker>();
builder.Services.AddHostedService<MediaProcessingWorker>();
builder.Services.AddHostedService<MediaCleanupWorker>();

var host = builder.Build();
await host.RunAsync();
