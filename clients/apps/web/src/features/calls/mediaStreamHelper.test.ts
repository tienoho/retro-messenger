import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createRetroSimulatedVideoStream,
  createSimulatedAudioTrack,
  acquireUserMedia,
  createAudioLevelMeter,
} from "./mediaStreamHelper";

describe("MediaStreamHelper", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should create fallback simulated video stream and teardown cleanly", () => {
    const result = createRetroSimulatedVideoStream("Test Title", "Test Subtitle");
    expect(result).toBeDefined();
    expect(typeof result.stop).toBe("function");
    expect(() => result.stop()).not.toThrow();
  });

  it("should create simulated audio track with teardown", () => {
    const result = createSimulatedAudioTrack();
    expect(result).toBeDefined();
    expect(typeof result.stop).toBe("function");
    expect(() => result.stop()).not.toThrow();
  });

  it("should acquire user media with transparent fallback when hardware is absent", async () => {
    const result = await acquireUserMedia({
      audio: true,
      video: true,
      fallbackTitle: "Test User",
    });

    expect(result).toBeDefined();
    expect(typeof result.isSimulated).toBe("boolean");
    expect(typeof result.stop).toBe("function");
    expect(() => result.stop()).not.toThrow();
  });

  it("should handle audio level meter safely without crashing", () => {
    const fakeStream = {
      getAudioTracks: () => [],
    } as unknown as MediaStream;

    const cleanup = createAudioLevelMeter(fakeStream, () => {});
    expect(typeof cleanup).toBe("function");
    expect(() => cleanup()).not.toThrow();
  });
});
