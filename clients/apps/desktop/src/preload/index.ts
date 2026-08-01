import { contextBridge, ipcRenderer } from "electron";
import type {
  DesktopTransferProgress,
  DesktopUpdaterState,
  MessageDto,
  PresenceChangedEvent,
} from "@retro/contracts";
import {
  desktopChannels,
  type DesktopConversationRequest,
  type DesktopEnqueueMessageRequest,
  type DesktopLoginRequest,
  type DesktopNotificationRequest,
  type DesktopBuzzEvent,
  type DesktopContactRequest,
  type DesktopDownloadAttachmentRequest,
  type DesktopRespondFriendRequest,
  type DesktopSendFriendRequest,
  type DesktopStatusRequest,
  type DesktopTypingEvent,
  type RetroDesktopBridge,
} from "../shared/ipc-contracts.ts";

function subscribe<T>(
  channel: string,
  listener: (value: T) => void,
): () => void {
  const handler = (_event: Electron.IpcRendererEvent, value: T) =>
    listener(value);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const bridge: RetroDesktopBridge = {
  getSession: () => ipcRenderer.invoke(desktopChannels.getSession),
  login: (request: DesktopLoginRequest) =>
    ipcRenderer.invoke(desktopChannels.login, request),
  logout: () => ipcRenderer.invoke(desktopChannels.logout),
  listConversations: () =>
    ipcRenderer.invoke(desktopChannels.listConversations),
  listMessages: (request: DesktopConversationRequest) =>
    ipcRenderer.invoke(desktopChannels.listMessages, request),
  setActiveConversation: (request: DesktopConversationRequest) =>
    ipcRenderer.invoke(desktopChannels.setActiveConversation, request),
  enqueueMessage: (request: DesktopEnqueueMessageRequest) =>
    ipcRenderer.invoke(desktopChannels.enqueueMessage, request),
  listOutbox: () => ipcRenderer.invoke(desktopChannels.listOutbox),
  onMessageSent: (listener: (message: MessageDto) => void) => {
    return subscribe(desktopChannels.messageSent, listener);
  },
  onRealtimeMessage: (listener: (message: MessageDto) => void) =>
    subscribe(desktopChannels.realtimeMessage, listener),
  startTyping: (request: DesktopConversationRequest) =>
    ipcRenderer.invoke(desktopChannels.startTyping, request),
  stopTyping: (request: DesktopConversationRequest) =>
    ipcRenderer.invoke(desktopChannels.stopTyping, request),
  sendBuzz: (request: DesktopConversationRequest) =>
    ipcRenderer.invoke(desktopChannels.sendBuzz, request),
  onTypingChanged: (listener: (event: DesktopTypingEvent) => void) =>
    subscribe(desktopChannels.typingChanged, listener),
  onBuzzReceived: (listener: (event: DesktopBuzzEvent) => void) =>
    subscribe(desktopChannels.buzzReceived, listener),
  onPresenceChanged: (listener: (event: PresenceChangedEvent) => void) =>
    subscribe(desktopChannels.presenceChanged, listener),
  listFriends: () => ipcRenderer.invoke(desktopChannels.listFriends),
  listContactRequests: () =>
    ipcRenderer.invoke(desktopChannels.listContactRequests),
  sendFriendRequest: (request: DesktopSendFriendRequest) =>
    ipcRenderer.invoke(desktopChannels.sendFriendRequest, request),
  respondFriendRequest: (request: DesktopRespondFriendRequest) =>
    ipcRenderer.invoke(desktopChannels.respondFriendRequest, request),
  listBlockedContacts: () =>
    ipcRenderer.invoke(desktopChannels.listBlockedContacts),
  blockContact: (request: DesktopContactRequest) =>
    ipcRenderer.invoke(desktopChannels.blockContact, request),
  unblockContact: (request: DesktopContactRequest) =>
    ipcRenderer.invoke(desktopChannels.unblockContact, request),
  updateStatus: (request: DesktopStatusRequest) =>
    ipcRenderer.invoke(desktopChannels.updateStatus, request),
  clearLocalData: () => ipcRenderer.invoke(desktopChannels.clearLocalData),
  selectAndUploadAttachment: (request: DesktopConversationRequest) =>
    ipcRenderer.invoke(desktopChannels.selectAndUploadAttachment, request),
  downloadAttachment: (request: DesktopDownloadAttachmentRequest) =>
    ipcRenderer.invoke(desktopChannels.downloadAttachment, request),
  onTransferProgress: (listener: (progress: DesktopTransferProgress) => void) =>
    subscribe(desktopChannels.transferProgress, listener),
  getUpdaterState: () => ipcRenderer.invoke(desktopChannels.updaterGetState),
  checkForUpdates: () => ipcRenderer.invoke(desktopChannels.updaterCheck),
  downloadUpdate: () => ipcRenderer.invoke(desktopChannels.updaterDownload),
  installUpdate: () => ipcRenderer.invoke(desktopChannels.updaterInstall),
  onUpdaterState: (listener: (state: DesktopUpdaterState) => void) =>
    subscribe(desktopChannels.updaterState, listener),
  onNavigateConversation: (listener: (conversationId: string) => void) =>
    subscribe(desktopChannels.navigateConversation, listener),
  notify: (request: DesktopNotificationRequest) =>
    ipcRenderer.invoke(desktopChannels.notify, request),
  buzz: () => ipcRenderer.invoke(desktopChannels.buzz),
};

contextBridge.exposeInMainWorld("retroDesktop", bridge);
