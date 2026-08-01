import { BrowserWindow, dialog } from "electron";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DesktopTransferProgress } from "@retro/contracts";
import type { DesktopSessionManager } from "./session-manager.ts";
import type { DesktopDatabase } from "./database/desktop-database.ts";

const maximumTransferBytes = 25 * 1024 * 1024;

function validateTransferUrl(raw: string): URL {
  const url = new URL(raw);
  const loopback =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
    throw new Error(
      "URL truyền file phải dùng HTTPS, ngoại trừ loopback phát triển.",
    );
  }
  if (url.username || url.password) {
    throw new Error("URL truyền file không được chứa thông tin đăng nhập.");
  }
  return url;
}

function contentTypeFor(fileName: string): string {
  switch (path.extname(fileName).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".pdf":
      return "application/pdf";
    case ".txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

export class DesktopAttachmentManager {
  public constructor(
    private readonly session: DesktopSessionManager,
    private readonly database: DesktopDatabase,
    private readonly getWindow: () => BrowserWindow | null,
    private readonly onProgress: (progress: DesktopTransferProgress) => void,
  ) {}

  public async selectAndUpload(
    conversationId: string,
  ): Promise<DesktopTransferProgress | null> {
    const owner = this.getWindow();
    const options: Electron.OpenDialogOptions = {
      title: "Chọn tệp đính kèm",
      properties: ["openFile"],
    };
    const result = owner
      ? await dialog.showOpenDialog(owner, options)
      : await dialog.showOpenDialog(options);
    const filePath = result.filePaths[0];
    if (result.canceled || !filePath) return null;

    const file = await stat(filePath);
    if (!file.isFile() || file.size <= 0 || file.size > maximumTransferBytes) {
      throw new Error("Tệp phải có kích thước từ 1 byte đến 25 MB.");
    }

    const fileName = path.basename(filePath);
    const transferId = crypto.randomUUID();
    const contentType = contentTypeFor(fileName);
    const progress: DesktopTransferProgress = {
      transferId,
      direction: "upload",
      fileName,
      bytesTransferred: 0,
      totalBytes: file.size,
      state: "pending",
    };
    this.onProgress(progress);

    try {
      const ticket = await this.session.getUploadUrl(
        conversationId,
        fileName,
        contentType,
        file.size,
      );
      progress.attachmentId = ticket.attachmentId;
      const accountId = this.session.getAccountId();
      if (!accountId) throw new Error("Authentication is required.");
      this.database.cacheAttachment(
        accountId,
        ticket.attachmentId,
        conversationId,
        fileName,
        contentType,
        file.size,
        "uploading",
      );
      progress.state = "transferring";
      this.onProgress({ ...progress });
      const uploadUrl = validateTransferUrl(ticket.uploadUrl);
      const body = await readFile(filePath);
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": contentType },
        body,
        redirect: "error",
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok)
        throw new Error(`Upload thất bại (${response.status}).`);

      progress.bytesTransferred = file.size;
      progress.state = "processing";
      this.onProgress({ ...progress });
      let status = await this.session.completeAttachmentUpload(
        ticket.attachmentId,
      );
      this.database.cacheAttachment(
        accountId,
        ticket.attachmentId,
        conversationId,
        fileName,
        contentType,
        file.size,
        status.status,
      );
      for (
        let attempt = 0;
        (status.status === "pending" || status.status === "processing") &&
        attempt < 30;
        attempt++
      ) {
        await new Promise<void>((resolve) => setTimeout(resolve, 1_000));
        status = await this.session.getAttachmentStatus(ticket.attachmentId);
        this.database.cacheAttachment(
          accountId,
          ticket.attachmentId,
          conversationId,
          fileName,
          contentType,
          file.size,
          status.status,
        );
      }
      if (status.status !== "ready") {
        throw new Error(`Tệp chưa sẵn sàng (${status.status}).`);
      }
      progress.state = "completed";
      this.onProgress({ ...progress });
      return progress;
    } catch (error) {
      progress.state = "failed";
      progress.error =
        error instanceof Error ? error.message : "Truyền file thất bại.";
      this.onProgress({ ...progress });
      throw error;
    }
  }

  public async download(
    attachmentId: string,
    suggestedName: string,
  ): Promise<DesktopTransferProgress | null> {
    const safeName = path.basename(suggestedName).slice(0, 255) || "attachment";
    const owner = this.getWindow();
    const options: Electron.SaveDialogOptions = {
      title: "Lưu tệp đính kèm",
      defaultPath: safeName,
    };
    const destination = owner
      ? await dialog.showSaveDialog(owner, options)
      : await dialog.showSaveDialog(options);
    if (destination.canceled || !destination.filePath) return null;

    const transferId = crypto.randomUUID();
    const progress: DesktopTransferProgress = {
      transferId,
      attachmentId,
      direction: "download",
      fileName: safeName,
      bytesTransferred: 0,
      totalBytes: 0,
      state: "transferring",
    };
    this.onProgress(progress);
    try {
      const ticket = await this.session.getAttachmentDownloadUrl(attachmentId);
      const url = validateTransferUrl(ticket.downloadUrl);
      const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok)
        throw new Error(`Download thất bại (${response.status}).`);
      const declaredLength = Number(
        response.headers.get("content-length") ?? 0,
      );
      if (declaredLength > maximumTransferBytes)
        throw new Error("Tệp vượt quá giới hạn 25 MB.");
      const data = Buffer.from(await response.arrayBuffer());
      if (data.byteLength > maximumTransferBytes)
        throw new Error("Tệp vượt quá giới hạn 25 MB.");
      await writeFile(destination.filePath, data, { flag: "w" });
      progress.bytesTransferred = data.byteLength;
      progress.totalBytes = data.byteLength;
      progress.state = "completed";
      this.onProgress({ ...progress });
      return progress;
    } catch (error) {
      progress.state = "failed";
      progress.error =
        error instanceof Error ? error.message : "Download thất bại.";
      this.onProgress({ ...progress });
      throw error;
    }
  }
}

export { validateTransferUrl };
