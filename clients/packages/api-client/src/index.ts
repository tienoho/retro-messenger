import type {
  AuthResponse,
  AttachmentStatusResponse,
  AdminAuditLogDto,
  AdminOverviewDto,
  AdminUserDto,
  CallTokenResponse,
  BlockContactRequest,
  BlockedContactDto,
  ContactRequestStateDto,
  ConversationDto,
  FriendDto,
  FriendRequestDto,
  MessageDto,
  PresignedDownloadUrlResponse,
  PresignedUploadUrlResponse,
  SendMessageResponse,
  SessionDto,
} from "@retro/contracts";

export class RetroApiClient {
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
    retryOnUnauthorized = true,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(this.accessToken
          ? { authorization: `Bearer ${this.accessToken}` }
          : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (response.status === 401 && retryOnUnauthorized && this.refreshToken) {
      await this.refreshSession();
      return this.request<T>(path, init, false);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API ${response.status}: ${body || response.statusText}`);
    }

    return (await response.json()) as T;
  }

  public async login(
    username: string,
    password: string,
  ): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      },
      false,
    );
    this.setSession(response);
    return response;
  }

  public async register(
    username: string,
    displayName: string,
    password: string,
  ): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      "/api/v1/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ username, displayName, password }),
      },
      false,
    );
    this.setSession(response);
    return response;
  }

  public async refreshSession(): Promise<AuthResponse> {
    if (!this.refreshToken) {
      throw new Error("No refresh token is available.");
    }

    try {
      const response = await this.request<AuthResponse>(
        "/api/v1/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        },
        false,
      );
      this.setSession(response);
      return response;
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  public getAccessToken(): string {
    return this.accessToken ?? "";
  }

  public clearSession(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  public async logout(): Promise<void> {
    const refreshToken = this.refreshToken;
    try {
      if (refreshToken) {
        await this.request<{ message: string }>(
          "/api/v1/auth/logout",
          {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          },
          false,
        );
      }
    } finally {
      this.clearSession();
    }
  }

  private setSession(response: AuthResponse): void {
    this.accessToken = response.accessToken;
    this.refreshToken = response.refreshToken;
  }

  public getSession(): Promise<SessionDto> {
    return this.request<SessionDto>("/api/v1/session");
  }

  public listConversations(): Promise<ConversationDto[]> {
    return this.request<ConversationDto[]>("/api/v1/conversations");
  }

  public listMessages(
    conversationId: string,
    afterSequence?: number,
  ): Promise<MessageDto[]> {
    const query =
      afterSequence === undefined
        ? ""
        : `?afterSequence=${encodeURIComponent(afterSequence)}`;
    return this.request<MessageDto[]>(
      `/api/v1/conversations/${conversationId}/messages${query}`,
    );
  }

  public sendMessage(
    conversationId: string,
    clientMessageId: string,
    content: string,
  ): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>(
      `/api/v1/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ clientMessageId, content }),
      },
    );
  }

  public updateStatus(status: string): Promise<{ status: string }> {
    return this.request<{ status: string }>("/api/v1/users/me/status", {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
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

  public blockContact(
    request: BlockContactRequest,
  ): Promise<BlockedContactDto> {
    return this.request<BlockedContactDto>("/api/v1/contacts/blocks", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  public unblockContact(userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/api/v1/contacts/blocks/${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    );
  }

  public getAdminOverview(): Promise<AdminOverviewDto> {
    return this.request<AdminOverviewDto>("/api/admin/v1/overview");
  }

  public listAdminUsers(limit: number = 50): Promise<AdminUserDto[]> {
    return this.request<AdminUserDto[]>(
      `/api/admin/v1/users?limit=${encodeURIComponent(limit)}`,
    );
  }

  public setAdminUserSuspension(
    userId: string,
    suspended: boolean,
    reason: string,
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/api/admin/v1/users/${encodeURIComponent(userId)}/suspension`,
      {
        method: "POST",
        body: JSON.stringify({ suspended, reason }),
      },
    );
  }

  public listAdminAuditLogs(limit: number = 50): Promise<AdminAuditLogDto[]> {
    return this.request<AdminAuditLogDto[]>(
      `/api/admin/v1/audit?limit=${encodeURIComponent(limit)}`,
    );
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

  public getCallToken(
    conversationId: string,
    roomName: string,
    role: string = "publisher",
  ): Promise<CallTokenResponse> {
    return this.request<CallTokenResponse>("/api/v1/calls/token", {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        roomName,
        role,
        targetUserId: conversationId,
      }),
    });
  }
}
