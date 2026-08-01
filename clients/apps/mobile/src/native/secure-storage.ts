import * as SecureStore from "expo-secure-store";

const refreshTokenKey = "retro.refresh-token";

export const secureTokenStore = {
  loadRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(refreshTokenKey);
  },
  saveRefreshToken(value: string): Promise<void> {
    return SecureStore.setItemAsync(refreshTokenKey, value);
  },
  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(refreshTokenKey);
  },
};
