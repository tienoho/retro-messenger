import type { MessageDto } from "@retro/contracts";

export const realtimeEvents = {
  messageReceived: "MessageReceived",
  typingChanged: "TypingChanged",
  buzzReceived: "BuzzReceived",
} as const;

export interface RealtimeEventMap {
  MessageReceived: MessageDto;
  TypingChanged: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  };
  BuzzReceived: {
    conversationId: string;
    senderId: string;
    sentAt: string;
  };
}
