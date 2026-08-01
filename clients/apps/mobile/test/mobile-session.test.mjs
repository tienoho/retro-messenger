import assert from "node:assert/strict";
import test from "node:test";
import { RetroApiError } from "@retro/api-client";
import { MobileSessionController } from "../src/session/mobile-session.ts";

const response = {
  accessToken: "access-two",
  refreshToken: "refresh-two",
  user: {
    id: "user-1",
    username: "retro",
    displayName: "Retro User",
    status: "online",
  },
};

function createTokenStore(value = "refresh-one") {
  return {
    value,
    saves: [],
    clearCount: 0,
    async loadRefreshToken() {
      return this.value;
    },
    async saveRefreshToken(next) {
      this.value = next;
      this.saves.push(next);
    },
    async clear() {
      this.value = null;
      this.clearCount += 1;
    },
  };
}

test("restore rotates and persists the mobile refresh token", async () => {
  const tokens = createTokenStore();
  const calls = [];
  const api = {
    async restoreSession(refreshToken) {
      calls.push(refreshToken);
      return response;
    },
  };
  const controller = new MobileSessionController(api, tokens);

  const restored = await controller.restore();

  assert.equal(restored, response);
  assert.deepEqual(calls, ["refresh-one"]);
  assert.deepEqual(tokens.saves, ["refresh-two"]);
});

test("restore keeps the secure token when the network is unavailable", async () => {
  const tokens = createTokenStore();
  const api = {
    async restoreSession() {
      throw new TypeError("network unavailable");
    },
  };
  const controller = new MobileSessionController(api, tokens);

  await assert.rejects(controller.restore(), /network unavailable/);
  assert.equal(tokens.value, "refresh-one");
  assert.equal(tokens.clearCount, 0);
});

test("restore removes a refresh token rejected by the backend", async () => {
  const tokens = createTokenStore();
  const api = {
    async restoreSession() {
      throw new RetroApiError(401, "rejected");
    },
  };
  const controller = new MobileSessionController(api, tokens);

  await assert.rejects(controller.restore(), /rejected/);
  assert.equal(tokens.value, null);
  assert.equal(tokens.clearCount, 1);
});

test("logout clears secure storage even when the network call fails", async () => {
  const tokens = createTokenStore();
  const api = {
    async logout() {
      throw new TypeError("offline");
    },
  };
  const controller = new MobileSessionController(api, tokens);

  await assert.rejects(controller.logout(), /offline/);
  assert.equal(tokens.value, null);
  assert.equal(tokens.clearCount, 1);
});
