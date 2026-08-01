# Src — App

## Responsibility

Provider composition, lifecycle, navigation and deep linking.

## Rules

- Chỉ phụ thuộc layer/package được kiến trúc cho phép.
- Public contract phải typed và có test khi triển khai code.
- Không lưu secret hoặc bypass authorization.

Không tạo thư mục `src/app` chỉ để chứa tài liệu: Expo Router ưu tiên thư mục đó làm route root và sẽ bỏ qua các route thật trong `app`.
