import type {
  DesktopConversationRequest,
  DesktopEnqueueMessageRequest,
  DesktopLoginRequest,
  DesktopRegisterRequest,
  DesktopChangePasswordRequest,
  DesktopNotificationRequest,
  DesktopContactRequest,
  DesktopDownloadAttachmentRequest,
  DesktopRespondFriendRequest,
  DesktopSendFriendRequest,
  DesktopStatusRequest,
  DesktopUpdateProfileRequest,
  DesktopStartCallRequest,
  DesktopCallOfferRequest,
  DesktopCallAnswerRequest,
  DesktopIceCandidateRequest,
} from "../../shared/ipc-contracts.ts";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("IPC payload must be an object.");
  }

  return value as Record<string, unknown>;
}

function boundedString(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
  trim = true,
): string {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string.`);
  }

  const normalized = trim ? value.trim() : value;
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new RangeError(
      `${field} must contain between ${minimum} and ${maximum} characters.`,
    );
  }

  return normalized;
}

function uuid(value: unknown, field: string): string {
  const parsed = boundedString(value, field, 36, 36);
  if (!uuidPattern.test(parsed)) {
    throw new TypeError(`${field} must be a UUID.`);
  }

  return parsed;
}

export function validateLoginRequest(value: unknown): DesktopLoginRequest {
  const input = record(value);
  return {
    username: boundedString(input.username, "username", 1, 64),
    password: boundedString(input.password, "password", 1, 1_024, false),
  };
}

export function validateRegisterRequest(value: unknown): DesktopRegisterRequest {
  const input = record(value);
  return {
    username: boundedString(input.username, "username", 3, 64),
    displayName: boundedString(input.displayName, "displayName", 1, 64),
    password: boundedString(input.password, "password", 6, 1_024, false),
  };
}

export function validateChangePasswordRequest(
  value: unknown,
): DesktopChangePasswordRequest {
  const input = record(value);
  return {
    currentPassword: boundedString(
      input.currentPassword,
      "currentPassword",
      1,
      1_024,
      false,
    ),
    newPassword: boundedString(
      input.newPassword,
      "newPassword",
      6,
      1_024,
      false,
    ),
  };
}

export function validateConversationRequest(
  value: unknown,
): DesktopConversationRequest {
  const input = record(value);
  return {
    conversationId: uuid(input.conversationId, "conversationId"),
  };
}

export function validateEnqueueMessageRequest(
  value: unknown,
): DesktopEnqueueMessageRequest {
  const input = record(value);
  return {
    conversationId: uuid(input.conversationId, "conversationId"),
    clientMessageId: uuid(input.clientMessageId, "clientMessageId"),
    content: boundedString(input.content, "content", 1, 20_000),
  };
}

export function validateNotificationRequest(
  value: unknown,
): DesktopNotificationRequest {
  const input = record(value);
  return {
    title: boundedString(input.title, "title", 1, 120),
    body: boundedString(input.body, "body", 1, 500),
  };
}

export function validateSendFriendRequest(
  value: unknown,
): DesktopSendFriendRequest {
  const input = record(value);
  return {
    targetUsername: boundedString(
      input.targetUsername,
      "targetUsername",
      1,
      64,
    ),
  };
}

export function validateRespondFriendRequest(
  value: unknown,
): DesktopRespondFriendRequest {
  const input = record(value);
  const action = boundedString(input.action, "action", 6, 6);
  if (action !== "accept" && action !== "reject" && action !== "cancel") {
    throw new TypeError("action is invalid.");
  }
  return { requestId: uuid(input.requestId, "requestId"), action };
}

export function validateContactRequest(value: unknown): DesktopContactRequest {
  const input = record(value);
  return { userId: uuid(input.userId, "userId") };
}

export function validateStatusRequest(value: unknown): DesktopStatusRequest {
  const input = record(value);
  const status = boundedString(input.status, "status", 4, 9);
  if (
    status !== "online" &&
    status !== "away" &&
    status !== "busy" &&
    status !== "invisible"
  ) {
    throw new TypeError("status is invalid.");
  }
  return { status };
}

export function validateDownloadAttachmentRequest(
  value: unknown,
): DesktopDownloadAttachmentRequest {
  const input = record(value);
  const fileName = boundedString(input.fileName, "fileName", 1, 255);
  if (
    fileName.includes("/") ||
    fileName.includes("\\") ||
    fileName === "." ||
    fileName === ".."
  ) {
    throw new TypeError("fileName is invalid.");
  }
  return {
    attachmentId: uuid(input.attachmentId, "attachmentId"),
    fileName,
  };
}

export function normalizeApiBaseUrl(value: string): string {
  const url = new URL(value);
  const loopback =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";

  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
    throw new Error(
      "Desktop API URL must use HTTPS, except for loopback development.",
    );
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "Desktop API URL must not contain credentials, query, or fragment.",
    );
  }

  return url.toString().replace(/\/$/, "");
}

export function validateStartCallRequest(
  value: unknown,
): DesktopStartCallRequest {
  const input = record(value);
  const conversationId = uuid(input.conversationId, "conversationId");
  const callType =
    input.callType === "video" ? "video" : "audio";
  return { conversationId, callType };
}

export function validateCallOfferRequest(
  value: unknown,
): DesktopCallOfferRequest {
  const input = record(value);
  return {
    conversationId: uuid(input.conversationId, "conversationId"),
    sdp: boundedString(input.sdp, "sdp", 1, 100_000, false),
  };
}

export function validateCallAnswerRequest(
  value: unknown,
): DesktopCallAnswerRequest {
  const input = record(value);
  return {
    conversationId: uuid(input.conversationId, "conversationId"),
    sdp: boundedString(input.sdp, "sdp", 1, 100_000, false),
  };
}

export function validateIceCandidateRequest(
  value: unknown,
): DesktopIceCandidateRequest {
  const input = record(value);
  return {
    conversationId: uuid(input.conversationId, "conversationId"),
    candidate: boundedString(input.candidate, "candidate", 1, 10_000, false),
    sdpMid: typeof input.sdpMid === "string" ? input.sdpMid : null,
    sdpMLineIndex:
      typeof input.sdpMLineIndex === "number" ? input.sdpMLineIndex : null,
  };
}

export function validateUpdateProfileRequest(
  value: unknown,
): DesktopUpdateProfileRequest {
  const input = record(value);
  const displayName =
    input.displayName !== undefined
      ? boundedString(input.displayName, "displayName", 1, 64)
      : undefined;
  const customStatus =
    input.customStatus !== undefined
      ? (input.customStatus === null
        ? null
        : boundedString(input.customStatus, "customStatus", 0, 120))
      : undefined;
  return { displayName, customStatus };
}
