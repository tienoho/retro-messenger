export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  accountId: string;
  deviceId: string;
}

export interface SecureTokenStore {
  load(): Promise<AuthSession | null>;
  save(session: AuthSession): Promise<void>;
  clear(): Promise<void>;
}

export function isAccessTokenExpired(
  session: AuthSession,
  now = Date.now(),
): boolean {
  return Date.parse(session.accessTokenExpiresAt) <= now;
}
