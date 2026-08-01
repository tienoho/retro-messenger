import type {
  AuthResponse,
  AttachmentStatusResponse,
  BlockedContactDto,
  ContactRequestStateDto,
  ConversationDto,
  FriendDto,
  FriendRequestDto,
  MessageDto,
  PresignedDownloadUrlResponse,
  PresignedUploadUrlResponse,
  SendMessageResponse,
  UserDto,
} from "@retro/contracts";
import type { DesktopSessionState } from "../shared/ipc-contracts.ts";
import type { DesktopDatabase } from "./database/desktop-database.ts";

export interface DesktopEncryption {
  isAvailable(): boolean;
  encrypt(value: string): Uint8Array;
  decrypt(value: Uint8Array): string;
}

export class DesktopApiError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message);
    this.name = "DesktopApiError";
    this.status = status;
  }
}

type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export class DesktopSessionManager {
  private readonly baseUrl: string;
  private readonly database: DesktopDatabase;
  private readonly encryption: DesktopEncryption;
  private readonly fetchImplementation: FetchImplementation;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: UserDto | null = null;
  private refreshInProgress: Promise<void> | null = null;

  public constructor(
    baseUrl: string,
    database: DesktopDatabase,
    encryption: DesktopEncryption,
    fetchImplementation: FetchImplementation = fetch,
  ) {
    this.baseUrl = baseUrl;
    this.database = database;
    this.encryption = encryption;
    this.fetchImplementation = fetchImplementation;
  }

  public getState(): DesktopSessionState {
    return {
      authenticated: this.refreshToken !== null && this.user !== null,
      user: this.user,
    };
  }

  public getAccountId(): string | null {
    return this.user?.id ?? null;
  }

  public getAccessToken(): string {
    if (!this.accessToken)
      throw new DesktopApiError(401, "Authentication is required.");
    return this.accessToken;
  }

  public async login(
    username: string,
    password: string,
  ): Promise<DesktopSessionState> {
    this.requireEncryption();
    const response = await this.request<AuthResponse>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      },
      false,
    );
    this.acceptSession(response);
    return this.getState();
  }

  public async restore(): Promise<DesktopSessionState> {
    const stored = this.database.loadSession();
    if (!stored || !this.encryption.isAvailable()) {
      return this.getState();
    }

    try {
      this.refreshToken = this.encryption.decrypt(stored.encryptedRefreshToken);
      this.user = {
        id: stored.userId,
        username: stored.username,
        displayName: stored.displayName,
        status: stored.status,
      };
      await this.refresh();
    } catch (error) {
      if (error instanceof DesktopApiError && error.status < 500) {
        this.clearMemory();
        this.database.clearSession();
      } else {
        this.accessToken = null;
      }
    }

    return this.getState();
  }

  public async logout(): Promise<void> {
    const refreshToken = this.refreshToken;
    try {
      if (refreshToken) {
        await this.request(
          "/api/v1/auth/logout",
          {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          },
          false,
        );
      }
    } finally {
      this.clearMemory();
      this.database.clearSession();
    }
  }

  public listConversations(): Promise<ConversationDto[]> {
    return this.request<ConversationDto[]>("/api/v1/conversations");
  }

  public listMessages(
    conversationId: string,
    afterSequence?: number,
    limit?: number,
  ): Promise<MessageDto[]> {
    const query = new URLSearchParams();
    if (afterSequence !== undefined)
      query.set("afterSequence", String(afterSequence));
    if (limit !== undefined) query.set("limit", String(limit));
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return this.request<MessageDto[]>(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages${suffix}`,
    );
  }

  public listFriends(): Promise<FriendDto[]> {
    return this.request<FriendDto[]>("/api/v1/contacts");
  }

  public listContactRequests(): Promise<ContactRequestStateDto> {
    return this.request<ContactRequestStateDto>(
      "/api/v1/contacts/requests/state",
    );
  }

  public sendFriendRequest(targetUsername: string): Promise<FriendRequestDto> {
    return this.request<FriendRequestDto>("/api/v1/contacts/requests", {
      method: "POST",
      body: JSON.stringify({ targetUsername }),
    });
  }

  public respondToFriendRequest(
    requestId: string,
    action: "accept" | "reject" | "cancel",
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/api/v1/contacts/requests/${encodeURIComponent(requestId)}/${action}`,
      { method: "POST" },
    );
  }

  public listBlockedContacts(): Promise<BlockedContactDto[]> {
    return this.request<BlockedContactDto[]>("/api/v1/contacts/blocks");
  }

  public blockContact(userId: string): Promise<BlockedContactDto> {
    return this.request<BlockedContactDto>("/api/v1/contacts/blocks", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  public unblockContact(userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/api/v1/contacts/blocks/${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    );
  }

  public async updateStatus(status: string): Promise<{ status: string }> {
    const result = await this.request<{ status: string }>(
      "/api/v1/users/me/status",
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      },
    );
    if (this.user && this.refreshToken) {
      this.user = { ...this.user, status: result.status };
      this.database.saveSession({
        encryptedRefreshToken: this.encryption.encrypt(this.refreshToken),
        userId: this.user.id,
        username: this.user.username,
        displayName: this.user.displayName,
        status: this.user.status,
      });
    }
    return result;
  }

  public getUploadUrl(
    conversationId: string,
    fileName: string,
    contentType: string,
    fileSizeBytes: number,
  ): Promise<PresignedUploadUrlResponse> {
    return this.request<PresignedUploadUrlResponse>(
      "/api/v1/media/upload-url",
      {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          fileName,
          contentType,
          fileSizeBytes,
        }),
      },
    );
  }

  public completeAttachmentUpload(
    attachmentId: string,
  ): Promise<AttachmentStatusResponse> {
    return this.request<AttachmentStatusResponse>(
      `/api/v1/media/${encodeURIComponent(attachmentId)}/complete`,
      { method: "POST" },
    );
  }

  public getAttachmentStatus(
    attachmentId: string,
  ): Promise<AttachmentStatusResponse> {
    return this.request<AttachmentStatusResponse>(
      `/api/v1/media/${encodeURIComponent(attachmentId)}/status`,
    );
  }

  public getAttachmentDownloadUrl(
    attachmentId: string,
  ): Promise<PresignedDownloadUrlResponse> {
    return this.request<PresignedDownloadUrlResponse>(
      `/api/v1/media/${encodeURIComponent(attachmentId)}`,
    );
  }

  public sendMessage(
    conversationId: string,
    clientMessageId: string,
    content: string,
  ): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ clientMessageId, content }),
      },
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    retryOnUnauthorized = true,
  ): Promise<T> {
    const response = await this.fetchImplementation(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(this.accessToken
          ? { authorization: `Bearer ${this.accessToken}` }
          : {}),
        ...(init.headers ?? {}),
      },
      signal: init.signal ?? AbortSignal.timeout(15_000),
    });

    if (response.status === 401 && retryOnUnauthorized && this.refreshToken) {
      await this.refreshOnce();
      return this.request<T>(path, init, false);
    }

    if (!response.ok) {
      throw new DesktopApiError(
        response.status,
        response.status === 401
          ? "Phiên đăng nhập đã hết hạn."
          : `API request failed with status ${response.status}.`,
      );
    }

    return (await response.json()) as T;
  }

  private async refreshOnce(): Promise<void> {
    this.refreshInProgress ??= this.refresh()
      .catch((error) => {
        if (error instanceof DesktopApiError && error.status < 500) {
          this.clearMemory();
          this.database.clearSession();
        }
        throw error;
      })
      .finally(() => {
        this.refreshInProgress = null;
      });
    return this.refreshInProgress;
  }

  private async refresh(): Promise<void> {
    if (!this.refreshToken) {
      throw new DesktopApiError(401, "No refresh session is available.");
    }

    const response = await this.request<AuthResponse>(
      "/api/v1/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      },
      false,
    );
    this.acceptSession(response);
  }

  private acceptSession(response: AuthResponse): void {
    this.requireEncryption();
    const encryptedRefreshToken = this.encryption.encrypt(
      response.refreshToken,
    );
    this.database.saveSession({
      encryptedRefreshToken,
      userId: response.user.id,
      username: response.user.username,
      displayName: response.user.displayName,
      status: response.user.status,
    });
    this.accessToken = response.accessToken;
    this.refreshToken = response.refreshToken;
    this.user = response.user;
  }

  private requireEncryption(): void {
    if (!this.encryption.isAvailable()) {
      throw new Error("Không thể lưu phiên an toàn trên hệ điều hành này.");
    }
  }

  private clearMemory(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
  }
}
