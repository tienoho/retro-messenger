# Web Architecture

- React/Vite là shell.
- API DTO được map sang client model.
- Server state dùng query layer; UI state không giữ toàn bộ message history.
- Production persistence dùng IndexedDB cho messages, outbox, drafts và sync cursor.
- SignalR chỉ nhận server push; durable send dùng REST.
- Timeline phải virtualize khi dữ liệu lớn.
