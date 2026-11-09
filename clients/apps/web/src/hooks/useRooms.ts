import { useCallback, useState } from "react";
import type { RetroApiClient } from "@retro/api-client";
import type { ConversationDto, RoomDto } from "@retro/contracts";

export function useRooms(
  api: RetroApiClient,
  onRoomJoined?: (conv: ConversationDto) => void,
) {
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const publicRooms = await api.listPublicRooms();
      setRooms(publicRooms);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createRoom = useCallback(
    async (title: string, description?: string) => {
      try {
        const room = await api.createRoom({
          title,
          description: description ?? "",
          isPublic: true,
        });
        await loadRooms();
        const conv = await api.joinRoom(room.id);
        const target: ConversationDto = conv.conversation ?? {
          id: room.id,
          title: room.title,
          lastSequence: 0,
          memberIds: [],
        };
        onRoomJoined?.(target);
        return target;
      } catch {
        return null;
      }
    },
    [api, loadRooms, onRoomJoined],
  );

  const joinRoom = useCallback(
    async (roomId: string, roomName: string) => {
      try {
        const res = await api.joinRoom(roomId);
        const target: ConversationDto = res.conversation ?? {
          id: roomId,
          title: roomName,
          lastSequence: 0,
          memberIds: [],
        };
        onRoomJoined?.(target);
        return target;
      } catch {
        return null;
      }
    },
    [api, onRoomJoined],
  );

  return {
    rooms,
    loading,
    loadRooms,
    createRoom,
    joinRoom,
  };
}
