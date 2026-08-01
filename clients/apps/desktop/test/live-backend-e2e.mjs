import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RetroRealtimeClient } from "../../../packages/realtime-client/src/index.ts";

const apiBaseUrl = (
  process.env.RETRO_API_URL ?? "http://127.0.0.1:5080"
).replace(/\/$/, "");
const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const suffix = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
const password = `Retro!${suffix}aA1`;
const firstUsername = `desktop-e2e-a-${suffix}`;
const secondUsername = `desktop-e2e-b-${suffix}`;
const conversationId = crypto.randomUUID();
const attachmentBytes = new TextEncoder().encode(
  `Retro live attachment ${suffix}`,
);

async function api(pathname, token, init = {}) {
  const response = await fetch(`${apiBaseUrl}${pathname}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    signal: init.signal ?? AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${pathname} failed (${response.status}): ${await response.text()}`,
    );
  }
  return response.status === 204 ? null : response.json();
}

async function register(username, displayName) {
  return api("/api/v1/auth/register", null, {
    method: "POST",
    body: JSON.stringify({ username, displayName, password }),
  });
}

function provisionConversation(firstUserId, secondUserId) {
  const sql = [
    `INSERT INTO chat.conversations(id, title, conversation_type, last_sequence) VALUES ('${conversationId}', 'Desktop live E2E', 1, 0);`,
    `INSERT INTO chat.conversation_members(conversation_id, user_id) VALUES ('${conversationId}', '${firstUserId}'), ('${conversationId}', '${secondUserId}');`,
  ].join(" ");
  execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "retro",
      "-d",
      "retro_messenger",
      "-c",
      sql,
    ],
    { cwd: repositoryRoot, stdio: "pipe" },
  );
}

function waitFor(register, predicate, label, timeoutMs = 20_000) {
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error(`Timed out waiting for ${label}.`));
    }, timeoutMs);
    unsubscribe = register((...args) => {
      if (!predicate(...args)) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(args);
    });
  });
}

async function waitForAttachmentReady(token, attachmentId) {
  for (let attempt = 0; attempt < 120; attempt++) {
    const status = await api(`/api/v1/media/${attachmentId}/status`, token);
    if (status.status === "ready") return;
    if (status.status === "failed" || status.status === "quarantined") {
      throw new Error(`Attachment reached terminal status ${status.status}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("Attachment did not become ready within 120 seconds.");
}

let firstRealtime;
let secondRealtime;
let firstSession;
let secondSession;

try {
  firstSession = await register(firstUsername, "Desktop E2E A");
  secondSession = await register(secondUsername, "Desktop E2E B");
  provisionConversation(firstSession.user.id, secondSession.user.id);

  const friendRequest = await api(
    "/api/v1/contacts/requests",
    firstSession.accessToken,
    {
      method: "POST",
      body: JSON.stringify({ targetUsername: secondUsername }),
    },
  );
  await api(
    `/api/v1/contacts/requests/${friendRequest.requestId}/accept`,
    secondSession.accessToken,
    {
      method: "POST",
    },
  );

  firstRealtime = new RetroRealtimeClient(
    `${apiBaseUrl}/realtime`,
    async () => firstSession.accessToken,
  );
  secondRealtime = new RetroRealtimeClient(
    `${apiBaseUrl}/realtime`,
    async () => secondSession.accessToken,
  );
  await Promise.all([firstRealtime.start(), secondRealtime.start()]);
  await Promise.all([
    firstRealtime.subscribeConversation(conversationId),
    secondRealtime.subscribeConversation(conversationId),
  ]);

  const clientMessageId = crypto.randomUUID();
  const receivedMessage = waitFor(
    (listener) => secondRealtime.onMessage(listener),
    (message) => message.clientMessageId === clientMessageId,
    "realtime message",
  );
  const sent = await api(
    `/api/v1/conversations/${conversationId}/messages`,
    firstSession.accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        clientMessageId,
        content: "Live desktop E2E message",
      }),
    },
  );
  const [message] = await receivedMessage;
  assert.equal(message.id, sent.message.id);

  const typingStarted = waitFor(
    (listener) => secondRealtime.onTyping(listener),
    (targetConversationId, userId, isTyping) =>
      targetConversationId === conversationId &&
      userId === firstSession.user.id &&
      isTyping,
    "typing event",
  );
  await firstRealtime.startTyping(conversationId);
  await typingStarted;
  await firstRealtime.stopTyping(conversationId);

  const buzzReceived = waitFor(
    (listener) => secondRealtime.onBuzz(listener),
    (targetConversationId, senderId) =>
      targetConversationId === conversationId &&
      senderId === firstSession.user.id,
    "Buzz event",
  );
  await firstRealtime.sendBuzz(conversationId);
  await buzzReceived;

  const presenceChanged = waitFor(
    (listener) => secondRealtime.onPresence(listener),
    (event) => event.userId === firstSession.user.id && event.status === "away",
    "presence event",
  );
  await api("/api/v1/users/me/status", firstSession.accessToken, {
    method: "PUT",
    body: JSON.stringify({ status: "away" }),
  });
  await presenceChanged;

  const upload = await api(
    "/api/v1/media/upload-url",
    firstSession.accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        fileName: "desktop-live-e2e.txt",
        contentType: "text/plain",
        fileSizeBytes: attachmentBytes.byteLength,
      }),
    },
  );
  const uploadResponse = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "content-type": "text/plain" },
    body: attachmentBytes,
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(uploadResponse.ok, true);
  await api(
    `/api/v1/media/${upload.attachmentId}/complete`,
    firstSession.accessToken,
    { method: "POST" },
  );
  await waitForAttachmentReady(secondSession.accessToken, upload.attachmentId);
  const download = await api(
    `/api/v1/media/${upload.attachmentId}`,
    secondSession.accessToken,
  );
  const downloaded = new Uint8Array(
    await (
      await fetch(download.downloadUrl, {
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      })
    ).arrayBuffer(),
  );
  assert.deepEqual(downloaded, attachmentBytes);

  console.log(
    "PASS: live two-account message, typing, Buzz, presence, upload, scan and download E2E.",
  );
} finally {
  await Promise.allSettled([firstRealtime?.stop(), secondRealtime?.stop()]);
  await Promise.allSettled([
    firstSession &&
      api("/api/v1/auth/logout", null, {
        method: "POST",
        body: JSON.stringify({ refreshToken: firstSession.refreshToken }),
      }),
    secondSession &&
      api("/api/v1/auth/logout", null, {
        method: "POST",
        body: JSON.stringify({ refreshToken: secondSession.refreshToken }),
      }),
  ]);
}
