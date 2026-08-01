import { afterEach, describe, expect, it, vi } from "vitest";
import { putFileToPresignedUrl } from "./useAttachmentUpload";

describe("putFileToPresignedUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects non-success object-storage responses instead of reporting completion", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("denied", { status: 403 })));

    await expect(putFileToPresignedUrl(
      "http://storage.test/upload",
      new Blob(["hello"], { type: "text/plain" }),
      "text/plain",
    )).rejects.toThrow("HTTP 403");
  });

  it("sends the signed content type and body on successful PUT", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const body = new Blob(["hello"], { type: "text/plain" });

    await putFileToPresignedUrl("http://storage.test/upload", body, "text/plain");

    expect(fetchMock).toHaveBeenCalledWith("http://storage.test/upload", {
      method: "PUT",
      headers: { "content-type": "text/plain" },
      body,
    });
  });
});
