import { isRefreshTokenRejected, type RetroApiClient } from "@retro/api-client";
import type { AuthResponse } from "@retro/contracts";

export interface MobileRefreshTokenStore {
  loadRefreshToken(): Promise<string | null>;
  saveRefreshToken(value: string): Promise<void>;
  clear(): Promise<void>;
}

export class MobileSessionController {
  private readonly api: RetroApiClient;
  private readonly tokens: MobileRefreshTokenStore;

  public constructor(api: RetroApiClient, tokens: MobileRefreshTokenStore) {
    this.api = api;
    this.tokens = tokens;
  }

  public async restore(): Promise<AuthResponse | null> {
    const refreshToken = await this.tokens.loadRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await this.api.restoreSession(refreshToken);
      await this.tokens.saveRefreshToken(response.refreshToken);
      return response;
    } catch (error) {
      if (isRefreshTokenRejected(error)) await this.tokens.clear();
      throw error;
    }
  }

  public async login(
    username: string,
    password: string,
  ): Promise<AuthResponse> {
    const response = await this.api.login(username, password);
    await this.tokens.saveRefreshToken(response.refreshToken);
    return response;
  }

  public async refresh(): Promise<AuthResponse> {
    try {
      const response = await this.api.refreshSession();
      await this.tokens.saveRefreshToken(response.refreshToken);
      return response;
    } catch (error) {
      if (isRefreshTokenRejected(error)) await this.tokens.clear();
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.api.logout();
    } finally {
      await this.tokens.clear();
    }
  }
}
