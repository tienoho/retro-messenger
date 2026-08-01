export function isSecureStorageBackendAvailable(
  platform: NodeJS.Platform,
  encryptionAvailable: boolean,
  linuxBackend: string | null,
): boolean {
  if (!encryptionAvailable) return false;
  return platform !== "linux" || linuxBackend !== "basic_text";
}
