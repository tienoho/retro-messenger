# VirusScanning Infrastructure

`ClamAvScanner` triển khai `IClamAvScanner` bằng TCP `INSTREAM` tới daemon nội bộ. Worker sniff content trước, mở stream object mới cho scanner và chỉ finalize khi `processing_owner` còn khớp lease đã claim.

Không publish cổng clamd ra mạng không tin cậy, không log nội dung file và không suy diễn kết quả scan từ tên file. Lỗi daemon được ném lên Worker để retry có giới hạn; virus trả tên signature và chuyển attachment sang `quarantined`.
