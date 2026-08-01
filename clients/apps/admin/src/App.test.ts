import { describe, expect, it } from "vitest";
import { validateAdminActionReason } from "./App";

describe("admin action reason", () => {
  it("requires a specific reason between 10 and 500 characters", () => {
    expect(validateAdminActionReason("short")).toBeTruthy();
    expect(validateAdminActionReason("Confirmed abuse after manual review.")).toBeNull();
    expect(validateAdminActionReason("x".repeat(501))).toBeTruthy();
  });
});
