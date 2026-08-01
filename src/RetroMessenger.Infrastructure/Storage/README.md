# Storage Infrastructure

`S3StorageService` triển khai `IStorageService` bằng AWS SDK S3 v4 cho MinIO, AWS S3 hoặc R2. Application/Domain chỉ biết object key, stream và metadata; provider-specific type không rò rỉ qua boundary.

- `Storage.Endpoint`: endpoint nội bộ cho API/Worker.
- `Storage.PublicEndpoint`: endpoint được ký cho browser; HTTP/HTTPS lấy trực tiếp từ scheme cấu hình.
- Private bucket, path-style tùy provider, SigV4 và presigned PUT/GET hết hạn sau 15 phút.
- Bucket có thể được tạo khi `AutoCreateBucket=true`; CORS thuộc provisioning của provider, không được mutate trong request path.

Luồng upload: tạo metadata `uploading`, browser PUT trực tiếp, API HEAD để xác nhận exact size/content type, rồi chuyển `pending`. Worker claim atomically bằng PostgreSQL `FOR UPDATE SKIP LOCKED`, sniff magic bytes/UTF-8, gửi stream mới tới ClamAV daemon bằng TCP `INSTREAM`; file sạch dạng ảnh/video được đọc lại để FFmpeg tạo PNG thumbnail, sau đó owner-CAS chuyển `ready`. Virus chuyển `quarantined`; MIME mismatch chuyển `failed` và object bị xóa.

- `ClamAv.Host`, `ClamAv.Port`, `ClamAv.ChunkSizeBytes`, `ClamAv.TimeoutSeconds` cấu hình daemon nội bộ; không publish cổng 3310 ra mạng không tin cậy.
- `FFmpeg.ExecutablePath`, `FFmpeg.MaxDimensionPixels`, `FFmpeg.TimeoutSeconds` cấu hình executable trong Worker.

`MediaProcessing` cấu hình batch, poll interval, lease, số lần thử và exponential backoff. `MediaCleanup` xóa object upload dở sau 24 giờ và object `failed`/`quarantined` sau 7 ngày theo mặc định; metadata vẫn được giữ để audit. Cleanup cũng claim bằng lease nên nhiều Worker không xóa trùng.

Giới hạn hiện tại: chưa có multipart, deep validation cho container/polyglot hoặc thumbnail retry riêng.
