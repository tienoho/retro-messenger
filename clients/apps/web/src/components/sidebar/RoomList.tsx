import { useState, type FormEvent } from "react";
import type { RoomDto } from "@retro/contracts";
import { IconAdd, IconRooms } from "../../icons/UiIcons";

export interface RoomListProps {
  rooms: RoomDto[];
  onCreateRoom: (title: string, description?: string) => Promise<unknown>;
  onJoinRoom: (roomId: string, roomName: string) => Promise<unknown>;
}

export function RoomList({ rooms, onCreateRoom, onJoinRoom }: RoomListProps) {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;
    await onCreateRoom(newRoomTitle.trim(), newRoomDesc.trim() || undefined);
    setNewRoomTitle("");
    setNewRoomDesc("");
    setShowCreateRoom(false);
  };

  return (
    <div className="buddyContainer">
      <div style={{ padding: "6px" }}>
        <button
          type="button"
          className="toolstripBtn"
          style={{ width: "100%", marginBottom: "8px" }}
          onClick={() => setShowCreateRoom(prev => !prev)}
        >
          {showCreateRoom ? (
            "✕ Đóng"
          ) : (
            <>
              <IconAdd size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Tạo phòng mới
            </>
          )}
        </button>

        {showCreateRoom && (
          <form
            onSubmit={handleCreateSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}
          >
            <input
              className="searchInput"
              placeholder="Tên phòng..."
              value={newRoomTitle}
              onChange={e => setNewRoomTitle(e.target.value)}
              required
            />
            <textarea
              className="searchInput"
              placeholder="Mô tả..."
              value={newRoomDesc}
              onChange={e => setNewRoomDesc(e.target.value)}
              rows={2}
            />
            <button type="submit" className="toolstripBtn">
              Tạo và vào phòng ngay
            </button>
          </form>
        )}

        <div className="categoryGroup">
          <div className="categoryHeader">
            <span>
              <IconRooms size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Phòng công cộng ({rooms.length})
            </span>
          </div>
          <div className="categoryItems">
            {rooms.map(room => (
              <div
                key={room.id}
                className="buddyItem"
                style={{ justifyContent: "space-between" }}
              >
                <div className="buddyInfo">
                  <span className="buddyName">{room.title}</span>
                  <span className="buddyStatusText">{room.description || `${room.memberCount} thành viên`}</span>
                </div>
                <button
                  type="button"
                  className="toolstripBtn"
                  style={{ padding: "3px 8px", fontSize: "11px" }}
                  onClick={() => void onJoinRoom(room.id, room.title)}
                >
                  Vào phòng
                </button>
              </div>
            ))}
            {rooms.length === 0 && (
              <div style={{ color: "#888", padding: "12px", textAlign: "center", fontSize: "11px" }}>
                Chưa có phòng nào. Hãy tạo phòng đầu tiên!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

