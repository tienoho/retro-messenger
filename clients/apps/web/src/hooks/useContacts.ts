import { useCallback, useState } from "react";
import type { RetroApiClient } from "@retro/api-client";
import type {
  BlockedContactDto,
  ContactRequestStateDto,
  ConversationDto,
  FriendDto,
} from "@retro/contracts";

export function useContacts(
  api: RetroApiClient,
  onConversationStarted?: (conv: ConversationDto) => void,
) {
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [requests, setRequests] = useState<ContactRequestStateDto>({
    incoming: [],
    outgoing: [],
  });
  const [blocked, setBlocked] = useState<BlockedContactDto[]>([]);
  const [loading, setLoading] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const [nextFriends, nextRequests, nextBlocked] = await Promise.all([
        api.listFriends(),
        api.listContactRequests(),
        api.listBlockedContacts(),
      ]);
      setFriends(nextFriends);
      setRequests(nextRequests);
      setBlocked(nextBlocked);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, [api]);

  const addFriend = useCallback(
    async (username: string): Promise<boolean> => {
      try {
        await api.sendFriendRequest(username);
        await loadContacts();
        return true;
      } catch {
        return false;
      }
    },
    [api, loadContacts],
  );

  const respondRequest = useCallback(
    async (
      requestId: string,
      action: "accept" | "reject" | "cancel",
    ): Promise<boolean> => {
      try {
        await api.respondToFriendRequest(requestId, action);
        await loadContacts();
        return true;
      } catch {
        return false;
      }
    },
    [api, loadContacts],
  );

  const unblockContact = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        await api.unblockContact(userId);
        await loadContacts();
        return true;
      } catch {
        return false;
      }
    },
    [api, loadContacts],
  );

  const startChatWithFriend = useCallback(
    async (friendUserId: string, friendDisplayName: string) => {
      try {
        const conv = await api.createDirectConversation(friendUserId);
        const target: ConversationDto = {
          ...conv,
          title: conv.title || friendDisplayName,
        };
        onConversationStarted?.(target);
        return target;
      } catch {
        return null;
      }
    },
    [api, onConversationStarted],
  );

  return {
    friends,
    setFriends,
    requests,
    blocked,
    loading,
    loadContacts,
    addFriend,
    respondRequest,
    unblockContact,
    startChatWithFriend,
  };
}

