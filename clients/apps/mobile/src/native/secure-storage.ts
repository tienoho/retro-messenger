import * as SecureStore from "expo-secure-store";

const refreshTokenKey = "retro.refresh-token";
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureTokenStore = {
  loadRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(refreshTokenKey, secureStoreOptions);
  },
  saveRefreshToken(value: string): Promise<void> {
    return SecureStore.setItemAsync(refreshTokenKey, value, secureStoreOptions);
  },
  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(refreshTokenKey, secureStoreOptions);
  },
};
