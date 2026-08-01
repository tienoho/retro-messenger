import assert from "node:assert/strict";
import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const conversationId = "34b981ea-e24c-4506-a520-c39fb8f65c25";
const user = {
  id: "4f8ac7b6-8a35-4ef7-a72f-c73a3c0dc832",
  username: "retro",
  displayName: "Retro User",
  status: "online",
};
let signedIn = false;
const outbox = [];
const watchdog = setTimeout(() => {
  console.error("Electron renderer smoke watchdog expired.");
  app.quit();
  process.exit(1);
}, 20_000);

function registerMockHandlers() {
  ipcMain.handle("desktop:session:get", () => ({
    authenticated: signedIn,
    user: signedIn ? user : null,
  }));
  ipcMain.handle("desktop:auth:login", () => {
    signedIn = true;
    return { authenticated: true, user };
  });
  ipcMain.handle("desktop:auth:logout", () => {
    signedIn = false;
  });
  ipcMain.handle("desktop:conversations:list", () => [
    {
      id: conversationId,
      title: "Bạn cũ",
      lastSequence: 0,
      memberIds: [user.id],
    },
  ]);
  ipcMain.handle("desktop:messages:list", () => []);
  ipcMain.handle("desktop:conversations:set-active", () => {});
  ipcMain.handle("desktop:outbox:list", () => outbox);
  ipcMain.handle("desktop:messages:enqueue", (_event, request) => {
    const entry = {
      accountId: user.id,
      clientMessageId: request.clientMessageId,
      conversationId: request.conversationId,
      content: request.content,
      state: "pending",
      attemptCount: 0,
      nextAttemptAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    outbox.push(entry);
    return entry;
  });
  ipcMain.handle("desktop:notify", () => {});
  ipcMain.handle("desktop:buzz", () => {});
  ipcMain.handle("desktop:typing:start", () => {});
  ipcMain.handle("desktop:typing:stop", () => {});
  ipcMain.handle("desktop:buzz:send", () => {});
  ipcMain.handle("desktop:contacts:list", () => []);
  ipcMain.handle("desktop:contacts:requests:list", () => ({
    incoming: [],
    outgoing: [],
  }));
  ipcMain.handle("desktop:contacts:blocks:list", () => []);
  ipcMain.handle("desktop:presence:update", (_event, request) => {
    user.status = request.status;
    return { authenticated: true, user };
  });
  ipcMain.handle("desktop:data:clear", () => {});
  ipcMain.handle("desktop:updater:get-state", () => ({ state: "disabled" }));
  ipcMain.handle("desktop:updater:check", () => {});
  ipcMain.handle("desktop:updater:download", () => {});
  ipcMain.handle("desktop:updater:install", () => {});
}

async function waitFor(window, expression, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await window.webContents.executeJavaScript(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

function setInput(selector, value) {
  return `(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`;
}

async function run() {
  try {
    console.log("Electron smoke: app ready");
    registerMockHandlers();
    const window = new BrowserWindow({
      show: false,
      webPreferences: {
        preload: path.join(appDirectory, "out/preload/index.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    await window.loadFile(path.join(appDirectory, "out/renderer/index.html"));
    await waitFor(
      window,
      "document.body.innerText.includes('Trò chuyện như ngày xưa')",
    );
    console.log("Electron smoke: signed-out renderer ready");

    const bridgeKeys = await window.webContents.executeJavaScript(
      "Object.keys(window.retroDesktop).sort()",
    );
    assert.equal(bridgeKeys.includes("encrypt"), false);
    assert.equal(bridgeKeys.includes("login"), true);

    await window.webContents.executeJavaScript(
      setInput("input[autocomplete='username']", "retro"),
    );
    await window.webContents.executeJavaScript(
      setInput("input[type='password']", "secret"),
    );
    await window.webContents.executeJavaScript(
      "document.querySelector('.authPanel form').requestSubmit()",
    );
    await waitFor(window, "document.body.innerText.includes('Bạn cũ')");
    console.log("Electron smoke: login rendered");

    await window.webContents.executeJavaScript(
      setInput(".composer input", "Tin nhắn offline"),
    );
    await window.webContents.executeJavaScript(
      "document.querySelector('.composer').requestSubmit()",
    );
    await waitFor(window, "document.body.innerText.includes('Đang chờ gửi')");
    assert.equal(outbox.length, 1);
    console.log("Electron smoke: offline message queued");

    await window.reload();
    await waitFor(
      window,
      "document.body.innerText.includes('Tin nhắn offline')",
    );
    assert.match(
      await window.webContents.executeJavaScript("document.body.innerText"),
      /Đang chờ gửi/,
    );
    clearTimeout(watchdog);
    window.destroy();
    console.log(
      "Electron renderer smoke passed: login -> offline enqueue -> reload.",
    );
    app.quit();
    process.exit(0);
  } catch (error) {
    clearTimeout(watchdog);
    console.error(error);
    app.quit();
    process.exit(1);
  }
}

app.whenReady().then(() => void run());
