import {
  app,
  BrowserWindow,
  safeStorage,
  session as electronSession,
} from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { desktopChannels } from "../shared/ipc-contracts.ts";
import { DesktopDatabase } from "./database/desktop-database.ts";
import { DesktopAttachmentManager } from "./attachment-manager.ts";
import { registerDesktopIpcHandlers } from "./ipc/register-handlers.ts";
import { normalizeApiBaseUrl } from "./ipc/validation.ts";
import { DesktopOutboxProcessor } from "./outbox-processor.ts";
import { DesktopRealtimeCoordinator } from "./realtime-coordinator.ts";
import { DesktopNativeShell } from "./native-shell.ts";
import { isSecureStorageBackendAvailable } from "./secure-storage/policy.ts";
import { DesktopSessionManager } from "./session-manager.ts";
import { DesktopUpdateManager } from "./update-manager.ts";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
let mainWindow: BrowserWindow | null = null;
let database: DesktopDatabase | null = null;
let flushTimer: NodeJS.Timeout | null = null;
let realtime: DesktopRealtimeCoordinator | null = null;
let nativeShell: DesktopNativeShell | null = null;

function getRendererLocation(): {
  expectedUrl: string;
  load: () => Promise<void>;
} {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    const expectedUrl = new URL(devUrl).toString();
    return {
      expectedUrl,
      load: async () => {
        await mainWindow!.loadURL(expectedUrl);
      },
    };
  }

  const rendererPath = path.join(currentDirectory, "../renderer/index.html");
  return {
    expectedUrl: pathToFileURL(rendererPath).toString(),
    load: async () => {
      await mainWindow!.loadFile(rendererPath);
    },
  };
}

function createWindow(): {
  window: BrowserWindow;
  expectedUrl: string;
  load: () => Promise<void>;
} {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 820,
    minHeight: 580,
    show: false,
    webPreferences: {
      preload: path.join(currentDirectory, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const renderer = getRendererLocation();
  mainWindow.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.once("ready-to-show", () => mainWindow?.show());

  return {
    window: mainWindow,
    expectedUrl: renderer.expectedUrl,
    load: renderer.load,
  };
}

async function start(): Promise<void> {
  electronSession.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      if (permission === "media") {
        callback(true);
        return;
      }
      callback(false);
    },
  );
  electronSession.defaultSession.setPermissionCheckHandler(
    (_webContents, permission) => permission === "media",
  );

  database = new DesktopDatabase(
    path.join(app.getPath("userData"), "retro-messenger.sqlite3"),
  );
  const apiBaseUrl = normalizeApiBaseUrl(
    process.env.RETRO_API_URL ?? "http://localhost:5080",
  );
  const sessionManager = new DesktopSessionManager(apiBaseUrl, database, {
    isAvailable: () =>
      isSecureStorageBackendAvailable(
        process.platform,
        safeStorage.isEncryptionAvailable(),
        process.platform === "linux"
          ? safeStorage.getSelectedStorageBackend()
          : null,
      ),
    encrypt: (value) => safeStorage.encryptString(value),
    decrypt: (value) => safeStorage.decryptString(Buffer.from(value)),
  });
  await sessionManager.restore();

  const { window, expectedUrl, load } = createWindow();
  nativeShell = new DesktopNativeShell(window, () => app.quit());
  nativeShell.initialize();
  const updates = new DesktopUpdateManager((state) => {
    if (!window.isDestroyed())
      window.webContents.send(desktopChannels.updaterState, state);
  });
  const attachments = new DesktopAttachmentManager(
    sessionManager,
    database,
    () => mainWindow,
    (progress) => {
      if (!window.isDestroyed())
        window.webContents.send(desktopChannels.transferProgress, progress);
    },
  );
  realtime = new DesktopRealtimeCoordinator(
    apiBaseUrl,
    database,
    sessionManager,
    {
      onMessage: (message) => {
        if (!window.isDestroyed())
          window.webContents.send(desktopChannels.realtimeMessage, message);
        nativeShell?.notifyMessage(message);
      },
      onTyping: (event) => {
        if (!window.isDestroyed())
          window.webContents.send(desktopChannels.typingChanged, event);
      },
      onBuzz: (event) => {
        if (!window.isDestroyed())
          window.webContents.send(desktopChannels.buzzReceived, event);
        nativeShell?.buzz();
      },
      onPresence: (event) => {
        if (!window.isDestroyed())
          window.webContents.send(desktopChannels.presenceChanged, event);
      },
      onCallStarted: (event) => {
        if (!window.isDestroyed())
          window.webContents.send(desktopChannels.callStarted, event);
      },
      onCallEnded: (event) => {
        if (!window.isDestroyed())
          window.webContents.send(desktopChannels.callEnded, event);
      },
      onParticipantJoined: (event) => {
        if (!window.isDestroyed())
          window.webContents.send(desktopChannels.participantJoined, event);
      },
      onParticipantLeft: (event) => {
        if (!window.isDestroyed())
          window.webContents.send(desktopChannels.participantLeft, event);
      },
      onCallOffer: (event) => {
        if (!window.isDestroyed())
          window.webContents.send(desktopChannels.callOfferReceived, event);
      },
      onCallAnswer: (event) => {
        if (!window.isDestroyed())
          window.webContents.send(desktopChannels.callAnswerReceived, event);
      },
      onIceCandidate: (event) => {
        if (!window.isDestroyed())
          window.webContents.send(desktopChannels.iceCandidateReceived, event);
      },
      onUnreadChanged: (count) => nativeShell?.setUnreadCount(count),
      isWindowFocused: () => window.isFocused(),
    },
  );
  const outbox = new DesktopOutboxProcessor(
    database,
    sessionManager,
    (message) => {
      if (!window.isDestroyed()) {
        window.webContents.send(desktopChannels.messageSent, message);
      }
    },
  );
  registerDesktopIpcHandlers({
    database,
    outbox,
    session: sessionManager,
    expectedRendererUrl: expectedUrl,
    realtime,
    attachments,
    updates,
    buzzWindow: () => nativeShell?.buzz(),
    setActiveConversation: (conversationId) =>
      nativeShell?.setActiveConversation(conversationId),
  });
  await load();

  if (sessionManager.getState().authenticated) void realtime.start();
  if (app.isPackaged) void updates.check();

  void outbox.flush();
  flushTimer = setInterval(() => {
    void outbox.flush();
    void realtime?.start();
  }, 5_000);
}

app
  .whenReady()
  .then(start)
  .catch((error) => {
    console.error("Desktop startup failed.", error);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (flushTimer) clearInterval(flushTimer);
  nativeShell?.destroy();
  nativeShell = null;
  void realtime?.stop();
  realtime = null;
  database?.close();
  database = null;
});
