const sensitiveKeys = new Set([
  "password",
  "accessToken",
  "refreshToken",
  "otp",
  "authorization",
]);

export function redactLogValue(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [
        key,
        sensitiveKeys.has(key) ? "[REDACTED]" : item,
      ]),
  );
}

export const logger = {
  info(message: string, context?: unknown): void {
    console.info(message, redactLogValue(context));
  },
  error(message: string, context?: unknown): void {
    console.error(message, redactLogValue(context));
  },
};
