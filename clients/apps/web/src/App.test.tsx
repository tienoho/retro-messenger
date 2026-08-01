import { describe, it, expect } from "vitest";
import { useLiveKitCall } from "./features/calls";
import { CallOverlay } from "./widgets/call-overlay";
import { AttachmentPicker, AttachmentPreviewCard } from "./features/attachments";

describe("RetroMessenger Web App Features & Widgets", () => {
  it("should export calls and overlay components", () => {
    expect(useLiveKitCall).toBeDefined();
    expect(CallOverlay).toBeDefined();
  });

  it("should export attachment picker and preview components", () => {
    expect(AttachmentPicker).toBeDefined();
    expect(AttachmentPreviewCard).toBeDefined();
  });
});
