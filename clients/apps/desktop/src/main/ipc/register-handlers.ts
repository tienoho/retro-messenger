import { ipcMain, Notification, BrowserWindow, type IpcMainInvokeEvent } from "electron";
import type { DesktopAttachmentManager } from "../attachment-manager.ts";
import type { DesktopDatabase } from "../database/desktop-database.ts";
import type { DesktopOutboxProcessor } from "../outbox-processor.ts";
import type { DesktopSessionManager } from "../session-manager.ts";
import type { DesktopRealtimeCoordinator } from "../realtime-coordinator.ts";
import type { DesktopUpdateManager } from "../update-manager.ts";
import {
  desktopChannels,
  type DesktopConversationRequest,
  type DesktopEnqueueMessageRequest,
  type DesktopLoginRequest,
  type DesktopNotificationRequest,
  type DesktopContactRequest,
  type DesktopDownloadAttachmentRequest,
  type DesktopRespondFriendRequest,
  type DesktopSendFriendRequest,
  type DesktopStatusRequest,
  type DesktopUpdateProfileRequest,
} from "../../shared/ipc-contracts.ts";
import {
  validateConversationRequest,
  validateEnqueueMessageRequest,
  validateLoginRequest,
  validateNotificationRequest,
  validateContactRequest,
  validateDownloadAttachmentRequest,
  validateRespondFriendRequest,
  validateSendFriendRequest,
  validateStatusRequest,
  validateUpdateProfileRequest,
  validateStartCallRequest,
  validateCallOfferRequest,
  validateCallAnswerRequest,
  validateIceCandidateRequest,
} from "./validation.ts";
import { isTrustedRendererFrame } from "./sender-validation.ts";

interface HandlerDependencies {
  database: DesktopDatabase;
  outbox: DesktopOutboxProcessor;
  session: DesktopSessionManager;
  expectedRendererUrl: string;
  realtime: DesktopRealtimeCoordinator;
  attachments: DesktopAttachmentManager;
  updates: DesktopUpdateManager;
  buzzWindow(): void;
  setActiveConversation(conversationId: string): void;
}

function assertTrustedSender(
  event: IpcMainInvokeEvent,
  expectedRendererUrl: string,
): void {
  if (
    !isTrustedRendererFrame(
      event.senderFrame,
      event.sender.mainFrame,
      expectedRendererUrl,
    )
  ) {
    throw new Error("IPC sender is not trusted.");
  }
}

export function registerDesktopIpcHandlers({
  database,
  outbox,
  session,
  expectedRendererUrl,
  realtime,
  attachments,
  updates,
  buzzWindow,
  setActiveConversation,
}: HandlerDependencies): void {
  ipcMain.handle(desktopChannels.getSession, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    return session.getState();
  });

  ipcMain.handle(desktopChannels.login, async (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request: DesktopLoginRequest = validateLoginRequest(raw);
    const state = await session.login(request.username, request.password);
    void realtime.start();
    return state;
  });

  ipcMain.handle(desktopChannels.logout, async (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    try {
      await session.logout();
    } finally {
      await realtime.stop();
    }
  });

  ipcMain.handle(desktopChannels.listConversations, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    return realtime.listConversations();
  });

  ipcMain.handle(desktopChannels.listMessages, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request: DesktopConversationRequest =
      validateConversationRequest(raw);
    return realtime.listMessages(request.conversationId);
  });

  ipcMain.handle(
    desktopChannels.setActiveConversation,
    (event, raw: unknown) => {
      assertTrustedSender(event, expectedRendererUrl);
      const request = validateConversationRequest(raw);
      realtime.setActiveConversation(request.conversationId);
      setActiveConversation(request.conversationId);
    },
  );

  ipcMain.handle(desktopChannels.enqueueMessage, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request: DesktopEnqueueMessageRequest =
      validateEnqueueMessageRequest(raw);
    const accountId = session.getAccountId();
    if (!accountId) {
      throw new Error("Authentication is required.");
    }

    const entry = database.enqueue(
      accountId,
      request.conversationId,
      request.clientMessageId,
      request.content,
    );
    void outbox.flush();
    return entry;
  });

  ipcMain.handle(desktopChannels.listOutbox, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    const accountId = session.getAccountId();
    return accountId ? database.listOutbox(accountId) : [];
  });

  ipcMain.handle(desktopChannels.notify, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request: DesktopNotificationRequest =
      validateNotificationRequest(raw);
    if (Notification.isSupported()) {
      new Notification(request).show();
    }
  });

  ipcMain.handle(desktopChannels.buzz, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    buzzWindow();
  });

  ipcMain.handle(desktopChannels.startTyping, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request = validateConversationRequest(raw);
    return realtime.startTyping(request.conversationId);
  });
  ipcMain.handle(desktopChannels.stopTyping, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request = validateConversationRequest(raw);
    return realtime.stopTyping(request.conversationId);
  });
  ipcMain.handle(desktopChannels.sendBuzz, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request = validateConversationRequest(raw);
    return realtime.sendBuzz(request.conversationId);
  });

  ipcMain.handle(desktopChannels.startCall, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request = validateStartCallRequest(raw);
    return realtime.startCall(request.conversationId, request.callType);
  });
  ipcMain.handle(desktopChannels.endCall, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request = validateConversationRequest(raw);
    return realtime.endCall(request.conversationId);
  });
  ipcMain.handle(desktopChannels.joinCall, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request = validateConversationRequest(raw);
    return realtime.joinCall(request.conversationId);
  });
  ipcMain.handle(desktopChannels.leaveCall, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request = validateConversationRequest(raw);
    return realtime.leaveCall(request.conversationId);
  });
  ipcMain.handle(desktopChannels.sendCallOffer, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request = validateCallOfferRequest(raw);
    return realtime.sendCallOffer(request.conversationId, request.sdp);
  });
  ipcMain.handle(desktopChannels.sendCallAnswer, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request = validateCallAnswerRequest(raw);
    return realtime.sendCallAnswer(request.conversationId, request.sdp);
  });
  ipcMain.handle(desktopChannels.sendIceCandidate, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request = validateIceCandidateRequest(raw);
    return realtime.sendIceCandidate(
      request.conversationId,
      request.candidate,
      request.sdpMid,
      request.sdpMLineIndex,
    );
  });

  ipcMain.handle(desktopChannels.listFriends, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    return session.listFriends();
  });
  ipcMain.handle(desktopChannels.listContactRequests, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    return session.listContactRequests();
  });
  ipcMain.handle(desktopChannels.sendFriendRequest, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request: DesktopSendFriendRequest = validateSendFriendRequest(raw);
    return session.sendFriendRequest(request.targetUsername);
  });
  ipcMain.handle(
    desktopChannels.respondFriendRequest,
    async (event, raw: unknown) => {
      assertTrustedSender(event, expectedRendererUrl);
      const request: DesktopRespondFriendRequest =
        validateRespondFriendRequest(raw);
      await session.respondToFriendRequest(request.requestId, request.action);
    },
  );
  ipcMain.handle(desktopChannels.listBlockedContacts, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    return session.listBlockedContacts();
  });
  ipcMain.handle(desktopChannels.blockContact, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request: DesktopContactRequest = validateContactRequest(raw);
    return session.blockContact(request.userId);
  });
  ipcMain.handle(
    desktopChannels.unblockContact,
    async (event, raw: unknown) => {
      assertTrustedSender(event, expectedRendererUrl);
      const request: DesktopContactRequest = validateContactRequest(raw);
      await session.unblockContact(request.userId);
    },
  );
  ipcMain.handle(desktopChannels.updateStatus, async (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request: DesktopStatusRequest = validateStatusRequest(raw);
    await session.updateStatus(request.status);
    return session.getState();
  });
  ipcMain.handle(desktopChannels.updateProfile, async (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request: DesktopUpdateProfileRequest = validateUpdateProfileRequest(raw);
    const currentUser = session.getState().user;
    if (currentUser) {
      await session.updateProfile(
        request.displayName ?? currentUser.displayName,
        request.customStatus,
      );
    }
    return session.getState();
  });
  ipcMain.handle(desktopChannels.minimizeWindow, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });
  ipcMain.handle(desktopChannels.maximizeWindow, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });
  ipcMain.handle(desktopChannels.closeWindow, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });
  ipcMain.handle(desktopChannels.clearLocalData, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    const accountId = session.getAccountId();
    if (accountId) database.clearAccountData(accountId);
  });
  ipcMain.handle(
    desktopChannels.selectAndUploadAttachment,
    (event, raw: unknown) => {
      assertTrustedSender(event, expectedRendererUrl);
      const request = validateConversationRequest(raw);
      return attachments.selectAndUpload(request.conversationId);
    },
  );
  ipcMain.handle(desktopChannels.downloadAttachment, (event, raw: unknown) => {
    assertTrustedSender(event, expectedRendererUrl);
    const request: DesktopDownloadAttachmentRequest =
      validateDownloadAttachmentRequest(raw);
    return attachments.download(request.attachmentId, request.fileName);
  });
  ipcMain.handle(desktopChannels.updaterGetState, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    return updates.getState();
  });
  ipcMain.handle(desktopChannels.updaterCheck, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    return updates.check();
  });
  ipcMain.handle(desktopChannels.updaterDownload, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    return updates.download();
  });
  ipcMain.handle(desktopChannels.updaterInstall, (event) => {
    assertTrustedSender(event, expectedRendererUrl);
    updates.install();
  });
}
