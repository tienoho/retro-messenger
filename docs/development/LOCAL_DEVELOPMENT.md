# Local Development

## Yêu cầu

- .NET 10 SDK.
- Node.js 22+, Corepack và pnpm.
- Docker Desktop.
- Python 3 cho repository validator.

## Cấu hình

```powershell
Copy-Item .env.example .env
```

Thay `JWT_SIGNING_KEY` bằng secret ngẫu nhiên tối thiểu 32 byte. Docker ánh xạ biến này sang `Authentication__Jwt__SigningKey`; `JWT_ISSUER`/`JWT_AUDIENCE` phải ổn định giữa các API instance. Không commit `.env` và không dùng giá trị local ở production.

## Hạ tầng và backend

Khởi tạo stack mới:

```powershell
docker compose up -d --build postgres redis minio clamav api worker
docker compose ps
Invoke-WebRequest http://localhost:5080/health
Invoke-WebRequest http://localhost:9000/minio/health/live
```

PostgreSQL chỉ chạy thư mục `/docker-entrypoint-initdb.d` khi volume trống. Nếu volume đã tồn tại hoặc khi triển khai nâng cấp, chạy migration runner:

```powershell
$env:ConnectionStrings__postgres = "Host=localhost;Port=5432;Database=retro_messenger;Username=retro;Password=change-me"
dotnet run --project src/RetroMessenger.Migrations
```

Runner ghi tên script và SHA-256 vào `infrastructure.schema_history`; chạy lại cùng nội dung là idempotent, còn checksum thay đổi sẽ trả exit code khác 0.

MinIO API ở `http://localhost:9000`, console ở `http://localhost:9001`. `.env` cấu hình `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET_NAME`, `MINIO_PUBLIC_ENDPOINT` và `WEB_ORIGIN`. `MINIO_PUBLIC_ENDPOINT` phải là URL browser truy cập được; không đặt hostname Docker nội bộ `minio` ở biến này.

ClamAV chạy sidecar nội bộ ở cổng 3310 và Worker image cài FFmpeg tại `/usr/bin/ffmpeg`. Lần khởi động ClamAV đầu có thể chậm vì tải/kiểm tra signature database; image chính thức cần nhiều RAM, nên kiểm tra Docker Desktop còn đủ bộ nhớ trước khi chạy toàn stack.

Có thể chạy API trực tiếp ngoài Docker bằng cùng connection strings:

```powershell
$env:ConnectionStrings__postgres = "Host=localhost;Port=5432;Database=retro_messenger;Username=retro;Password=change-me"
$env:ConnectionStrings__redis = "localhost:6379,password=change-me"
$env:Authentication__Jwt__SigningKey = "replace-with-at-least-32-random-bytes"
dotnet run --project src/RetroMessenger.Api
```

## Web, Admin, Desktop và Mobile

```powershell
Set-Location clients
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @retro/web dev --host 127.0.0.1
```

Mobile Android emulator dùng API URL `http://10.0.2.2:5080`; thiết bị thật dùng IP LAN của máy phát triển. Refresh token của Web chỉ nằm trong memory, không nằm trong LocalStorage hoặc IndexedDB, nên reload yêu cầu đăng nhập lại; cache tin nhắn và outbox vẫn được phân vùng theo user ID.

## Kiểm tra trước khi handoff

```powershell
dotnet format RetroMessenger.slnx --no-restore --verify-no-changes
dotnet build RetroMessenger.slnx --no-restore
dotnet test tests/RetroMessenger.IntegrationTests/RetroMessenger.IntegrationTests.csproj --no-build
dotnet run --no-build --project tests/RetroMessenger.SmokeTests

Set-Location clients
pnpm typecheck
pnpm test
pnpm build
```
