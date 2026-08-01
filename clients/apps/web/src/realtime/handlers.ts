import type { MessageDto } from "@retro/contracts";

export type MessageEventHandler = (
  message: MessageDto,
) => void;

export function createDeduplicatingHandler(
  existingIds: Set<string>,
  next: MessageEventHandler,
): MessageEventHandler {
  return message => {
    if (existingIds.has(message.id)) return;
    existingIds.add(message.id);
    next(message);
  };
}
