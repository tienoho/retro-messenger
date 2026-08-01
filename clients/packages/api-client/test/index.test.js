import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RetroApiClient } from "../src/index.ts";

const authResponse = {
  accessToken: "access-one",
  refreshToken: "refresh-one",
  user: {
    id: "user-1",
    username: "retro",
    displayName: "Retro User",
    status: "online",
  },
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("RetroApiClient", () => {
  it("exposes media, call, and authentication methods", () => {
    const client = new RetroApiClient("http://localhost:5000");
    assert.strictEqual(typeof client.getUploadUrl, "function");
    assert.strictEqual(typeof client.getCallToken, "function");
    assert.strictEqual(typeof client.login, "function");
    assert.strictEqual(typeof client.register, "function");
    assert.strictEqual(typeof client.logout, "function");
    assert.strictEqual(typeof client.restoreSession, "function");
    assert.strictEqual(typeof client.getAdminOverview, "function");
    assert.strictEqual(typeof client.listAdminUsers, "function");
    assert.strictEqual(typeof client.setAdminUserSuspension, "function");
    assert.strictEqual(typeof client.listAdminAuditLogs, "function");
    assert.strictEqual(typeof client.getUploadUrl, "function");
    assert.strictEqual(typeof client.completeAttachmentUpload, "function");
    assert.strictEqual(typeof client.getAttachmentStatus, "function");
    assert.strictEqual(typeof client.getAttachmentDownloadUrl, "function");
  });

  it("adds the login access token to protected requests", async () => {
    const originalFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith("/api/v1/auth/login")) {
        return jsonResponse(authResponse);
      }

      assert.strictEqual(init.headers.authorization, "Bearer access-one");
      return jsonResponse({ user: authResponse.user });
    };

    try {
      const client = new RetroApiClient("http://localhost:5000");
      await client.login("retro", "secret");
      const session = await client.getSession();

      assert.strictEqual(session.user.id, "user-1");
      assert.strictEqual(calls.length, 2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("refreshes once after 401 and retries with the rotated access token", async () => {
    const originalFetch = globalThis.fetch;
    let conversationAttempts = 0;
    let refreshAttempts = 0;
    globalThis.fetch = async (url, init = {}) => {
      const path = new URL(String(url)).pathname;
      if (path === "/api/v1/auth/login") {
        return jsonResponse(authResponse);
      }

      if (path === "/api/v1/auth/refresh") {
        refreshAttempts += 1;
        assert.deepStrictEqual(JSON.parse(init.body), {
          refreshToken: "refresh-one",
        });
        return jsonResponse({
          ...authResponse,
          accessToken: "access-two",
          refreshToken: "refresh-two",
        });
      }

      conversationAttempts += 1;
      if (conversationAttempts === 1) {
        assert.strictEqual(init.headers.authorization, "Bearer access-one");
        return jsonResponse({ error: "expired" }, 401);
      }

      assert.strictEqual(init.headers.authorization, "Bearer access-two");
      return jsonResponse([]);
    };

    try {
      const client = new RetroApiClient("http://localhost:5000");
      await client.login("retro", "secret");
      await client.listConversations();

      assert.strictEqual(refreshAttempts, 1);
      assert.strictEqual(conversationAttempts, 2);
      assert.strictEqual(client.getAccessToken(), "access-two");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("restores a persisted refresh token and keeps it across a transient network failure", async () => {
    const originalFetch = globalThis.fetch;
    let attempts = 0;
    globalThis.fetch = async (_url, init = {}) => {
      attempts += 1;
      assert.deepStrictEqual(JSON.parse(init.body), {
        refreshToken: "persisted-refresh",
      });
      if (attempts === 1) throw new TypeError("network unavailable");
      return jsonResponse({
        ...authResponse,
        accessToken: "restored-access",
        refreshToken: "rotated-refresh",
      });
    };

    try {
      const client = new RetroApiClient("http://localhost:5000");
      await assert.rejects(
        client.restoreSession("persisted-refresh"),
        /network unavailable/,
      );
      const restored = await client.refreshSession();

      assert.strictEqual(restored.refreshToken, "rotated-refresh");
      assert.strictEqual(client.getAccessToken(), "restored-access");
      assert.strictEqual(attempts, 2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("clears a rejected persisted refresh token", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => jsonResponse({ error: "invalid" }, 401);

    try {
      const client = new RetroApiClient("http://localhost:5000");
      await assert.rejects(client.restoreSession("rejected-refresh"), {
        name: "RetroApiError",
        status: 401,
      });
      await assert.rejects(client.refreshSession(), /No refresh token/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("revokes the current refresh token and always clears local tokens on logout", async () => {
    const originalFetch = globalThis.fetch;
    const requests = [];
    globalThis.fetch = async (url, init = {}) => {
      const path = new URL(String(url)).pathname;
      if (path === "/api/v1/auth/login") {
        return jsonResponse(authResponse);
      }

      requests.push({ path, body: JSON.parse(init.body) });
      return jsonResponse({ message: "Logged out successfully." });
    };

    try {
      const client = new RetroApiClient("http://localhost:5000");
      await client.login("retro", "secret");
      await client.logout();

      assert.deepStrictEqual(requests, [
        {
          path: "/api/v1/auth/logout",
          body: { refreshToken: "refresh-one" },
        },
      ]);
      assert.strictEqual(client.getAccessToken(), "");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
