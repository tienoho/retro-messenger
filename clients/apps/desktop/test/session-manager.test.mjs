import assert from "node:assert/strict";
import { test } from "node:test";
import { DesktopDatabase } from "../src/main/database/desktop-database.ts";
import { DesktopSessionManager } from "../src/main/session-manager.ts";

const user = {
  id: "4f8ac7b6-8a35-4ef7-a72f-c73a3c0dc832",
  username: "retro",
  displayName: "Retro User",
  status: "online",
};

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function encryption(available = true) {
  return {
    isAvailable: () => available,
    encrypt: (value) =>
      Uint8Array.from(Buffer.from(value), (byte) => byte ^ 0x5a),
    decrypt: (value) =>
      Buffer.from(value.map((byte) => byte ^ 0x5a)).toString("utf8"),
  };
}

test("login fails closed before network access when OS encryption is unavailable", async () => {
  const database = new DesktopDatabase(":memory:");
  let calls = 0;
  const manager = new DesktopSessionManager(
    "https://api.example.test",
    database,
    encryption(false),
    async () => {
      calls += 1;
      return response({});
    },
  );

  try {
    await assert.rejects(
      () => manager.login("retro", "secret"),
      /lưu phiên an toàn/,
    );
    assert.equal(calls, 0);
    assert.equal(database.loadSession(), null);
  } finally {
    database.close();
  }
});

test("renderer session state never contains access or refresh tokens", async () => {
  const database = new DesktopDatabase(":memory:");
  const manager = new DesktopSessionManager(
    "https://api.example.test",
    database,
    encryption(),
    async () =>
      response({
        accessToken: "access-secret",
        refreshToken: "refresh-secret",
        user,
      }),
  );

  try {
    const state = await manager.login("retro", "secret");
    const serialized = JSON.stringify(state);
    assert.equal(state.authenticated, true);
    assert.equal(state.user?.id, user.id);
    assert.doesNotMatch(serialized, /access-secret|refresh-secret|Token/i);
    assert.notDeepEqual(
      database.loadSession()?.encryptedRefreshToken,
      Uint8Array.from(Buffer.from("refresh-secret")),
    );
  } finally {
    database.close();
  }
});

test("startup restore rotates and persists the refresh token", async () => {
  const database = new DesktopDatabase(":memory:");
  const crypto = encryption();
  database.saveSession({
    encryptedRefreshToken: crypto.encrypt("refresh-old"),
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    status: user.status,
  });

  const manager = new DesktopSessionManager(
    "https://api.example.test",
    database,
    crypto,
    async (_url, init) => {
      assert.deepEqual(JSON.parse(init.body), { refreshToken: "refresh-old" });
      return response({
        accessToken: "access-new",
        refreshToken: "refresh-new",
        user,
      });
    },
  );

  try {
    assert.equal((await manager.restore()).authenticated, true);
    assert.equal(
      crypto.decrypt(database.loadSession().encryptedRefreshToken),
      "refresh-new",
    );
  } finally {
    database.close();
  }
});

test("offline startup preserves the encrypted refresh session for cache access", async () => {
  const database = new DesktopDatabase(":memory:");
  const crypto = encryption();
  database.saveSession({
    encryptedRefreshToken: crypto.encrypt("refresh-offline"),
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    status: user.status,
  });
  const manager = new DesktopSessionManager(
    "https://api.example.test",
    database,
    crypto,
    async () => {
      throw new TypeError("network unavailable");
    },
  );
  try {
    const state = await manager.restore();
    assert.equal(state.authenticated, true);
    assert.equal(state.user?.id, user.id);
    assert.ok(database.loadSession());
    assert.throws(() => manager.getAccessToken(), /Authentication is required/);
  } finally {
    database.close();
  }
});

test("an invalid runtime refresh clears memory and persisted credentials", async () => {
  const database = new DesktopDatabase(":memory:");
  const manager = new DesktopSessionManager(
    "https://api.example.test",
    database,
    encryption(),
    async (url) => {
      const path = new URL(String(url)).pathname;
      if (path === "/api/v1/auth/login") {
        return response({
          accessToken: "expired",
          refreshToken: "revoked",
          user,
        });
      }
      return response({ error: "unauthorized" }, 401);
    },
  );

  try {
    await manager.login("retro", "secret");
    await assert.rejects(() => manager.listConversations(), /hết hạn/);
    assert.equal(manager.getState().authenticated, false);
    assert.equal(database.loadSession(), null);
  } finally {
    database.close();
  }
});
