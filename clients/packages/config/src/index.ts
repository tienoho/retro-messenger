export function requireEnvironmentValue(
  name: string,
  value: string | undefined,
): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`Missing environment value: ${name}`);
  }
  return normalized;
}

export function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}
