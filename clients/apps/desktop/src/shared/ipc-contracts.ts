import type {
  BlockedContactDto,
  CallAnswerEvent,
  CallEndedEvent,
  CallOfferEvent,
  CallStartedEvent,
  ContactRequestStateDto,
  ConversationDto,
  DesktopTransferProgress,
  DesktopUpdaterState,
  FriendDto,
  FriendRequestDto,
  IceCandidateEvent,
  MessageDto,
  ParticipantJoinedEvent,
  ParticipantLeftEvent,
  PresenceChangedEvent,
  UserDto,
} from "@retro/contracts";

export const desktopChannels = {
  getSession: "desktop:session:get",
  login: "desktop:auth:login",
  register: "desktop:auth:register",
  changePassword: "desktop:auth:change-password",
  logout: "desktop:auth:logout",
  listConversations: "desktop:conversations:list",
  listMessages: "desktop:messages:list",
  enqueueMessage: "desktop:messages:enqueue",
  listOutbox: "desktop:outbox:list",
  messageSent: "desktop:message:sent",
  notify: "desktop:notify",
  buzz: "desktop:buzz",
  realtimeMessage: "desktop:realtime:message",
  typingChanged: "desktop:realtime:typing",
  buzzReceived: "desktop:realtime:buzz",
  presenceChanged: "desktop:realtime:presence",
  startTyping: "desktop:typing:start",
  stopTyping: "desktop:typing:stop",
  sendBuzz: "desktop:buzz:send",
  startCall: "desktop:call:start",
  endCall: "desktop:call:end",
  joinCall: "desktop:call:join",
  leaveCall: "desktop:call:leave",
  sendCallOffer: "desktop:call:offer",
  sendCallAnswer: "desktop:call:answer",
  sendIceCandidate: "desktop:call:ice",
  callStarted: "desktop:call:started",
  callEnded: "desktop:call:ended",
  participantJoined: "desktop:call:participant-joined",
  participantLeft: "desktop:call:participant-left",
  callOfferReceived: "desktop:call:offer-received",
  callAnswerReceived: "desktop:call:answer-received",
  iceCandidateReceived: "desktop:call:ice-received",
  listFriends: "desktop:contacts:list",
  listContactRequests: "desktop:contacts:requests:list",
  sendFriendRequest: "desktop:contacts:requests:send",
  respondFriendRequest: "desktop:contacts:requests:respond",
  listBlockedContacts: "desktop:contacts:blocks:list",
  blockContact: "desktop:contacts:block",
  unblockContact: "desktop:contacts:unblock",
  updateStatus: "desktop:presence:update",
  updateProfile: "desktop:profile:update",
  minimizeWindow: "desktop:window:minimize",
  maximizeWindow: "desktop:window:maximize",
  closeWindow: "desktop:window:close",
  clearLocalData: "desktop:data:clear",
  selectAndUploadAttachment: "desktop:attachments:upload",
  downloadAttachment: "desktop:attachments:download",
  transferProgress: "desktop:attachments:progress",
  updaterGetState: "desktop:updater:get-state",
  updaterCheck: "desktop:updater:check",
  updaterDownload: "desktop:updater:download",
  updaterInstall: "desktop:updater:install",
  updaterState: "desktop:updater:state",
  navigateConversation: "desktop:navigate:conversation",
  setActiveConversation: "desktop:conversations:set-active",
} as const;

export interface DesktopSessionState {
  authenticated: boolean;
  user: UserDto | null;
}

export interface DesktopLoginRequest {
  username: string;
  password: string;
}

export interface DesktopRegisterRequest {
  username: string;
  displayName: string;
  password: string;
}

export interface DesktopChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DesktopConversationRequest {
  conversationId: string;
}

export interface DesktopEnqueueMessageRequest
  extends DesktopConversationRequest {
  clientMessageId: string;
  content: string;
}

export interface DesktopNotificationRequest {
  title: string;
  body: string;
}

export interface DesktopTypingEvent extends DesktopConversationRequest {
  userId: string;
  isTyping: boolean;
}

export interface DesktopBuzzEvent extends DesktopConversationRequest {
  senderId: string;
  sentAt: string;
}

export interface DesktopSendFriendRequest {
  targetUsername: string;
}

export interface DesktopRespondFriendRequest {
  requestId: string;
  action: "accept" | "reject" | "cancel";
}

export interface DesktopContactRequest {
  userId: string;
}

export interface DesktopStatusRequest {
  status: "online" | "away" | "busy" | "invisible";
}

export interface DesktopUpdateProfileRequest {
  displayName?: string | undefined;
  customStatus?: string | null | undefined;
}

export interface DesktopDownloadAttachmentRequest {
  attachmentId: string;
  fileName: string;
}

export type DesktopOutboxState =
  | "pending"
  | "sending"
  | "failed-retryable"
  | "failed-permanent";

export interface DesktopOutboxEntry {
  accountId: string;
  clientMessageId: string;
  conversationId: string;
  content: string;
  state: DesktopOutboxState;
  attemptCount: number;
  nextAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DesktopStartCallRequest extends DesktopConversationRequest {
  callType?: "audio" | "video";
}

export interface DesktopCallOfferRequest extends DesktopConversationRequest {
  sdp: string;
}

export interface DesktopCallAnswerRequest extends DesktopConversationRequest {
  sdp: string;
}

export interface DesktopIceCandidateRequest extends DesktopConversationRequest {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

export interface RetroDesktopBridge {
  getSession(): Promise<DesktopSessionState>;
  login(request: DesktopLoginRequest): Promise<DesktopSessionState>;
  register(request: DesktopRegisterRequest): Promise<DesktopSessionState>;
  changePassword(request: DesktopChangePasswordRequest): Promise<void>;
  logout(): Promise<void>;
  listConversations(): Promise<ConversationDto[]>;
  listMessages(request: DesktopConversationRequest): Promise<MessageDto[]>;
  setActiveConversation(request: DesktopConversationRequest): Promise<void>;
  enqueueMessage(
    request: DesktopEnqueueMessageRequest,
  ): Promise<DesktopOutboxEntry>;
  listOutbox(): Promise<DesktopOutboxEntry[]>;
  onMessageSent(listener: (message: MessageDto) => void): () => void;
  onRealtimeMessage(listener: (message: MessageDto) => void): () => void;
  startTyping(request: DesktopConversationRequest): Promise<void>;
  stopTyping(request: DesktopConversationRequest): Promise<void>;
  sendBuzz(request: DesktopConversationRequest): Promise<void>;
  onTypingChanged(listener: (event: DesktopTypingEvent) => void): () => void;
  onBuzzReceived(listener: (event: DesktopBuzzEvent) => void): () => void;
  onPresenceChanged(
    listener: (event: PresenceChangedEvent) => void,
  ): () => void;
  startCall(request: DesktopStartCallRequest): Promise<void>;
  endCall(request: DesktopConversationRequest): Promise<void>;
  joinCall(request: DesktopConversationRequest): Promise<void>;
  leaveCall(request: DesktopConversationRequest): Promise<void>;
  sendCallOffer(request: DesktopCallOfferRequest): Promise<void>;
  sendCallAnswer(request: DesktopCallAnswerRequest): Promise<void>;
  sendIceCandidate(request: DesktopIceCandidateRequest): Promise<void>;
  onCallStarted(listener: (event: CallStartedEvent) => void): () => void;
  onCallEnded(listener: (event: CallEndedEvent) => void): () => void;
  onParticipantJoined(
    listener: (event: ParticipantJoinedEvent) => void,
  ): () => void;
  onParticipantLeft(listener: (event: ParticipantLeftEvent) => void): () => void;
  onCallOfferReceived(listener: (event: CallOfferEvent) => void): () => void;
  onCallAnswerReceived(listener: (event: CallAnswerEvent) => void): () => void;
  onIceCandidateReceived(
    listener: (event: IceCandidateEvent) => void,
  ): () => void;
  listFriends(): Promise<FriendDto[]>;
  listContactRequests(): Promise<ContactRequestStateDto>;
  sendFriendRequest(
    request: DesktopSendFriendRequest,
  ): Promise<FriendRequestDto>;
  respondFriendRequest(request: DesktopRespondFriendRequest): Promise<void>;
  listBlockedContacts(): Promise<BlockedContactDto[]>;
  blockContact(request: DesktopContactRequest): Promise<BlockedContactDto>;
  unblockContact(request: DesktopContactRequest): Promise<void>;
  updateStatus(request: DesktopStatusRequest): Promise<DesktopSessionState>;
  updateProfile(request: DesktopUpdateProfileRequest): Promise<DesktopSessionState>;
  minimizeWindow(): Promise<void>;
  maximizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  clearLocalData(): Promise<void>;
  selectAndUploadAttachment(
    request: DesktopConversationRequest,
  ): Promise<DesktopTransferProgress | null>;
  downloadAttachment(
    request: DesktopDownloadAttachmentRequest,
  ): Promise<DesktopTransferProgress | null>;
  onTransferProgress(
    listener: (progress: DesktopTransferProgress) => void,
  ): () => void;
  getUpdaterState(): Promise<DesktopUpdaterState>;
  checkForUpdates(): Promise<void>;
  downloadUpdate(): Promise<void>;
  installUpdate(): Promise<void>;
  onUpdaterState(listener: (state: DesktopUpdaterState) => void): () => void;
  onNavigateConversation(
    listener: (conversationId: string) => void,
  ): () => void;
  notify(request: DesktopNotificationRequest): Promise<void>;
  buzz(): Promise<void>;
}
