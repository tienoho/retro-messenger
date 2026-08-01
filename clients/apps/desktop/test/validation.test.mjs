import assert from "node:assert/strict";
import { test } from "node:test";
import { isTrustedRendererFrame } from "../src/main/ipc/sender-validation.ts";
import { isSecureStorageBackendAvailable } from "../src/main/secure-storage/policy.ts";
import {
  normalizeApiBaseUrl,
  validateEnqueueMessageRequest,
  validateLoginRequest,
  validateDownloadAttachmentRequest,
  validateRespondFriendRequest,
  validateStatusRequest,
} from "../src/main/ipc/validation.ts";

test("IPC payload validators reject malformed and oversized input", () => {
  assert.throws(() => validateLoginRequest(null), /must be an object/);
  assert.throws(
    () => validateLoginRequest({ username: "retro", password: "" }),
    /password must contain/,
  );
  assert.throws(
    () =>
      validateEnqueueMessageRequest({
        conversationId: "not-a-uuid",
        clientMessageId: crypto.randomUUID(),
        content: "hello",
      }),
    /conversationId must contain|conversationId must be a UUID/,
  );
  assert.throws(
    () =>
      validateEnqueueMessageRequest({
        conversationId: crypto.randomUUID(),
        clientMessageId: crypto.randomUUID(),
        content: "x".repeat(20_001),
      }),
    /content must contain/,
  );
});

test("new capability validators reject traversal and invalid actions", () => {
  assert.throws(
    () =>
      validateDownloadAttachmentRequest({
        attachmentId: crypto.randomUUID(),
        fileName: "../secret.txt",
      }),
    /fileName|invalid|contain/,
  );
  assert.throws(
    () =>
      validateRespondFriendRequest({
        requestId: crypto.randomUUID(),
        action: "delete",
      }),
    /invalid/,
  );
  assert.throws(() => validateStatusRequest({ status: "offline" }), /invalid/);
});

test("IPC sender must be the exact main frame at the expected URL", () => {
  const mainFrame = { url: "file:///app/renderer/index.html#chat" };
  assert.equal(
    isTrustedRendererFrame(
      mainFrame,
      mainFrame,
      "file:///app/renderer/index.html",
    ),
    true,
  );
  assert.equal(
    isTrustedRendererFrame(
      { url: mainFrame.url },
      mainFrame,
      "file:///app/renderer/index.html",
    ),
    false,
  );
  assert.equal(
    isTrustedRendererFrame(mainFrame, mainFrame, "file:///other/index.html"),
    false,
  );
});

test("API base URL only permits HTTPS or loopback HTTP", () => {
  assert.equal(
    normalizeApiBaseUrl("http://localhost:5080/"),
    "http://localhost:5080",
  );
  assert.equal(
    normalizeApiBaseUrl("https://chat.example.com"),
    "https://chat.example.com",
  );
  assert.throws(
    () => normalizeApiBaseUrl("http://chat.example.com"),
    /must use HTTPS/,
  );
  assert.throws(
    () => normalizeApiBaseUrl("https://user:pass@chat.example.com"),
    /credentials/,
  );
});

test("Linux basic_text key storage is rejected fail-closed", () => {
  assert.equal(isSecureStorageBackendAvailable("win32", true, null), true);
  assert.equal(isSecureStorageBackendAvailable("darwin", true, null), true);
  assert.equal(
    isSecureStorageBackendAvailable("linux", true, "gnome_libsecret"),
    true,
  );
  assert.equal(
    isSecureStorageBackendAvailable("linux", true, "basic_text"),
    false,
  );
  assert.equal(isSecureStorageBackendAvailable("win32", false, null), false);
});
