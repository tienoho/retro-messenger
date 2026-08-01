Console.WriteLine(
    "Retro Messenger development host\n\n" +
    "Start services in separate terminals:\n" +
    "1. dotnet run --project src/RetroMessenger.Api\n" +
    "2. dotnet run --project src/RetroMessenger.Worker\n" +
    "3. node tools/demo-server/server.mjs\n" +
    "4. cd clients && pnpm dev:web\n\n" +
    "Infrastructure: docker compose up -d postgres redis minio livekit");
