import { useEffect, useState, type FormEvent } from "react";
import type {
  BlockedContactDto,
  ContactRequestStateDto,
  FriendDto,
} from "@retro/contracts";

const emptyRequests: ContactRequestStateDto = { incoming: [], outgoing: [] };

export interface UseDesktopContactsResult {
  friends: FriendDto[];
  requests: ContactRequestStateDto;
  blocked: BlockedContactDto[];
  friendUsername: string;
  setFriendUsername: (username: string) => void;
  loadContacts: () => Promise<void>;
  addFriend: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  blockContact: (friend: FriendDto) => Promise<void>;
  unblockContact: (userId: string) => Promise<void>;
  respondFriendRequest: (
    requestId: string,
    action: "accept" | "reject" | "cancel",
  ) => Promise<void>;
  resetContacts: () => void;
}

export interface DesktopContactAudioHandlers {
  playDoorOpen?: (() => void) | undefined;
  playDoorSlam?: (() => void) | undefined;
}

export function useDesktopContacts(
  onError?: ((message: string) => void) | undefined,
  audioHandlers?: DesktopContactAudioHandlers | undefined,
): UseDesktopContactsResult {
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [requests, setRequests] =
    useState<ContactRequestStateDto>(emptyRequests);
  const [blocked, setBlocked] = useState<BlockedContactDto[]>([]);
  const [friendUsername, setFriendUsername] = useState("");

  async function loadContacts(): Promise<void> {
    const [nextFriends, nextRequests, nextBlocked] = await Promise.all([
      window.retroDesktop.listFriends(),
      window.retroDesktop.listContactRequests(),
      window.retroDesktop.listBlockedContacts(),
    ]);
    setFriends(nextFriends);
    setRequests(nextRequests);
    setBlocked(nextBlocked);
  }

  useEffect(() => {
    const unsubPresence = window.retroDesktop.onPresenceChanged((event) => {
      setFriends((current) =>
        current.map((friend) => {
          if (friend.userId === event.userId) {
            if (event.status === "online" && friend.status !== "online") {
              audioHandlers?.playDoorOpen?.();
            } else if (
              event.status !== "online" &&
              friend.status === "online"
            ) {
              audioHandlers?.playDoorSlam?.();
            }
            return { ...friend, status: event.status };
          }
          return friend;
        }),
      );
    });
    return () => {
      unsubPresence();
    };
  }, [audioHandlers]);

  async function addFriend(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!friendUsername.trim()) return;
    try {
      await window.retroDesktop.sendFriendRequest({
        targetUsername: friendUsername.trim(),
      });
      setFriendUsername("");
      await loadContacts();
    } catch (caught) {
      onError?.(
        caught instanceof Error ? caught.message : "Không thể gửi lời mời.",
      );
    }
  }

  async function blockContact(friend: FriendDto): Promise<void> {
    try {
      await window.retroDesktop.blockContact({ userId: friend.userId });
      await loadContacts();
    } catch (caught) {
      onError?.(
        caught instanceof Error ? caught.message : "Không thể chặn liên hệ.",
      );
    }
  }

  async function unblockContact(userId: string): Promise<void> {
    try {
      await window.retroDesktop.unblockContact({ userId });
      await loadContacts();
    } catch (caught) {
      onError?.(
        caught instanceof Error ? caught.message : "Không thể bỏ chặn.",
      );
    }
  }

  async function respondFriendRequest(
    requestId: string,
    action: "accept" | "reject" | "cancel",
  ): Promise<void> {
    try {
      await window.retroDesktop.respondFriendRequest({ requestId, action });
      await loadContacts();
    } catch (caught) {
      onError?.(
        caught instanceof Error ? caught.message : "Không thể phản hồi lời mời.",
      );
    }
  }

  function resetContacts(): void {
    setFriends([]);
    setRequests(emptyRequests);
    setBlocked([]);
    setFriendUsername("");
  }

  return {
    friends,
    requests,
    blocked,
    friendUsername,
    setFriendUsername,
    loadContacts,
    addFriend,
    blockContact,
    unblockContact,
    respondFriendRequest,
    resetContacts,
  };
}

