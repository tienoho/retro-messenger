export type MessageType =
  | "text"
  | "image"
  | "file"
  | "voice"
  | "sticker"
  | "buzz"
  | "system";

export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  status: string;
  customStatus?: string | null;
}

export interface SessionDto {
  user: UserDto;
  friend?: Pick<UserDto, "id" | "displayName" | "status">;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken?: string | null;
}

export interface AdminOverviewDto {
  userCount: number;
  conversationCount: number;
  pendingOutboxCount: number;
  activeRefreshSessionCount: number;
}

export interface AdminUserDto {
  id: string;
  username: string;
  displayName: string;
  status: string;
  suspended: boolean;
  createdAt: string;
}

export interface AdminAuditLogDto {
  id: string;
  actorId: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  occurredAt: string;
}

export interface ConversationDto {
  id: string;
  title: string;
  lastSequence: number;
  memberIds: string[];
}

export interface CreateDirectConversationRequest {
  targetUserId: string;
}

export interface CreateGroupConversationRequest {
  title: string;
  memberIds: string[];
}

export interface RoomDto {
  id: string;
  title: string;
  description: string;
  memberCount: number;
  isPublic: boolean;
}

export interface CreateRoomRequest {
  title: string;
  description: string;
  isPublic: boolean;
}

export interface JoinRoomResponse {
  message: string;
  conversation?: ConversationDto | null;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  sequence: number;
  type: MessageType | number;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
}

export interface SendMessageResponse {
  message: MessageDto;
  isDuplicate: boolean;
}

export interface CallTokenResponse {
  token: string;
  liveKitUrl: string;
  roomName?: string;
}

export interface CallTokenRequest {
  conversationId?: string;
  roomName?: string;
  role?: string;
}

export interface PresignedUploadUrlResponse {
  attachmentId: string;
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
}

export interface AttachmentStatusResponse {
  attachmentId: string;
  status:
    | "uploading"
    | "pending"
    | "processing"
    | "ready"
    | "quarantined"
    | "failed";
}

export interface PresignedDownloadUrlResponse {
  attachmentId: string;
  downloadUrl: string;
  expiresAt: string;
}

export interface FriendDto {
  userId: string;
  username: string;
  displayName: string;
  status: string;
  groupName?: string | null;
}

export type FriendRequestDirection = "incoming" | "outgoing";

export interface FriendRequestDto {
  requestId: string;
  senderId: string;
  senderDisplayName: string;
  recipientId?: string;
  recipientDisplayName?: string;
  direction?: FriendRequestDirection;
  createdAt: string;
}

export interface BlockedContactDto {
  userId: string;
  username: string;
  displayName: string;
  blockedAt: string;
}

export interface ContactRequestStateDto {
  incoming: FriendRequestDto[];
  outgoing: FriendRequestDto[];
}

export interface SendFriendRequestRequest {
  targetUsername: string;
}

export interface BlockContactRequest {
  userId: string;
}

export interface PresenceChangedEvent {
  userId: string;
  status: string;
  customStatus?: string | null;
  occurredAt: string;
}

export interface DesktopTransferProgress {
  transferId: string;
  attachmentId?: string;
  direction: "upload" | "download";
  fileName: string;
  bytesTransferred: number;
  totalBytes: number;
  state: "pending" | "transferring" | "processing" | "completed" | "failed";
  error?: string;
}

export interface DesktopUpdaterState {
  state:
    | "disabled"
    | "idle"
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "error";
  version?: string;
  percent?: number;
  message?: string;
}

export interface UploadUrlRequest {
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
}

export interface AttachmentMetadata {
  id?: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  url: string;
  thumbnailUrl?: string;
  status?: "uploading" | "processing" | "completed" | "failed";
  progress?: number;
}

export interface CallStartedEvent {
  conversationId: string;
  roomName: string;
  callerId: string;
  callType?: "audio" | "video";
  startedAt: string;
}

export interface CallEndedEvent {
  conversationId: string;
  roomName: string;
  endedAt: string;
  reason?: string;
  endedById?: string;
}

export interface ParticipantJoinedEvent {
  conversationId: string;
  roomName: string;
  userId: string;
  joinedAt: string;
}

export interface ParticipantLeftEvent {
  conversationId: string;
  roomName: string;
  userId: string;
  leftAt: string;
}

export interface CallOfferEvent {
  conversationId: string;
  senderId: string;
  sdp: string;
}

export interface CallAnswerEvent {
  conversationId: string;
  senderId: string;
  sdp: string;
}

export interface IceCandidateEvent {
  conversationId: string;
  senderId: string;
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}
