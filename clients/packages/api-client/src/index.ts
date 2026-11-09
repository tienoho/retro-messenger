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
  CreateRoomRequest,
  FriendDto,
  FriendRequestDto,
  JoinRoomResponse,
  MessageDto,
  PresignedDownloadUrlResponse,
  PresignedUploadUrlResponse,
  RoomDto,
  SendMessageResponse,
  SessionDto,
  UserDto,
} from "@retro/contracts";

export class RetroApiError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message);
    this.name = "RetroApiError";
    this.status = status;
  }
}

export function isRefreshTokenRejected(error: unknown): boolean {
  return (
    error instanceof RetroApiError &&
    (error.status === 400 || error.status === 401 || error.status === 403)
  );
}

export class RetroApiClient {
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private readonly sessionExpiredListeners = new Set<() => void>();

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
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(this.accessToken
          ? { authorization: `Bearer ${this.accessToken}` }
          : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (response.status === 401 && retryOnUnauthorized) {
      if (this.refreshToken) {
        try {
          await this.refreshSession();
          return await this.request<T>(path, init, false);
        } catch {
          // Refresh failed, continue to throw
        }
      } else {
        try {
          const restored = await this.restoreWebSession();
          if (restored) {
            return await this.request<T>(path, init, false);
          }
        } catch {
          // Restore failed, continue to throw
        }
      }
    }

    if (!response.ok) {
      const body = await response.text();
      throw new RetroApiError(
        response.status,
        `API ${response.status}: ${body || response.statusText}`,
      );
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
      if (isRefreshTokenRejected(error)) {
        this.clearSession();
        this.notifySessionExpired();
      }
      throw error;
    }
  }

  public onSessionExpired(listener: () => void): () => void {
    this.sessionExpiredListeners.add(listener);
    return () => {
      this.sessionExpiredListeners.delete(listener);
    };
  }

  private notifySessionExpired(): void {
    for (const listener of this.sessionExpiredListeners) {
      try {
        listener();
      } catch {
        // ignore subscriber errors
      }
    }
  }

  public async restoreWebSession(): Promise<AuthResponse | null> {
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
    } catch {
      this.clearSession();
      return null;
    }
  }

  public restoreSession(refreshToken: string): Promise<AuthResponse> {
    if (!refreshToken.trim()) {
      throw new Error("A refresh token is required to restore the session.");
    }
    this.refreshToken = refreshToken;
    return this.refreshSession();
  }

  public async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await this.request<{ message: string }>("/api/v1/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  public getAccessToken(): string {
    return this.accessToken ?? "";
  }

  public async getValidAccessToken(): Promise<string> {
    if (!this.accessToken) {
      if (this.refreshToken) {
        try {
          const res = await this.refreshSession();
          return res.accessToken;
        } catch {
          return "";
        }
      } else {
        try {
          const res = await this.restoreWebSession();
          return res?.accessToken ?? "";
        } catch {
          return "";
        }
      }
    }

    try {
      const parts = this.accessToken.split(".");
      if (parts.length === 3) {
        const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
        const payloadStr =
          typeof atob === "function"
            ? atob(base64)
            : (globalThis as unknown as { Buffer?: { from(data: string, enc: string): { toString(enc: string): string } } })
                .Buffer?.from(base64, "base64").toString("utf-8") ?? "{}";
        const payload = JSON.parse(payloadStr);
        if (payload.exp && Date.now() >= (payload.exp - 30) * 1000) {
          if (this.refreshToken) {
            const res = await this.refreshSession();
            return res.accessToken;
          } else {
            const res = await this.restoreWebSession();
            return res?.accessToken ?? "";
          }
        }
      }
    } catch {
      // Ignored
    }
    return this.accessToken;
  }

  public clearSession(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  public async logout(): Promise<void> {
    const refreshToken = this.refreshToken;
    try {
      await this.request<{ message: string }>(
        "/api/v1/auth/logout",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        },
        false,
      );
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

  public createDirectConversation(
    targetUserId: string,
  ): Promise<ConversationDto> {
    return this.request<ConversationDto>(
      "/api/v1/conversations/direct",
      {
        method: "POST",
        body: JSON.stringify({ targetUserId }),
      },
    );
  }

  public createGroupConversation(
    title: string,
    memberIds: string[],
  ): Promise<ConversationDto> {
    return this.request<ConversationDto>(
      "/api/v1/conversations",
      {
        method: "POST",
        body: JSON.stringify({ title, memberIds }),
      },
    );
  }

  public listPublicRooms(): Promise<RoomDto[]> {
    return this.request<RoomDto[]>("/api/v1/rooms/public");
  }

  public createRoom(request: CreateRoomRequest): Promise<RoomDto> {
    return this.request<RoomDto>("/api/v1/rooms", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  public joinRoom(roomId: string): Promise<JoinRoomResponse> {
    return this.request<JoinRoomResponse>(
      `/api/v1/rooms/${encodeURIComponent(roomId)}/join`,
      { method: "POST" },
    );
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

  public updateProfile(
    displayName: string,
    customStatus?: string | null,
  ): Promise<UserDto> {
    return this.request<UserDto>("/api/v1/users/me/profile", {
      method: "PUT",
      body: JSON.stringify({ displayName, customStatus }),
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
