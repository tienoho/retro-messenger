export interface RendererFrameIdentity {
  readonly url: string;
}

function normalizedUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

export function isTrustedRendererFrame(
  frame: RendererFrameIdentity | null,
  mainFrame: RendererFrameIdentity,
  expectedRendererUrl: string,
): boolean {
  if (!frame || frame !== mainFrame) return false;

  try {
    return normalizedUrl(frame.url) === normalizedUrl(expectedRendererUrl);
  } catch {
    return false;
  }
}
