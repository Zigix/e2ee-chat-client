import type { RoomDataResponse } from "../types/chat";

export function upsertConversation(
  prev: RoomDataResponse[],
  next: RoomDataResponse,
): RoomDataResponse[] {
  const nextId = Number(next.roomId);

  const exists = prev.some((conv) => Number(conv.roomId) === nextId);

  if (exists) {
    return prev.map((conv) =>
      Number(conv.roomId) === nextId
        ? { ...conv, ...next, roomId: nextId }
        : conv,
    );
  }

  return [{ ...next, roomId: nextId }, ...prev];
}

export function incrementUnread(
  rooms: RoomDataResponse[],
  roomId: number
): RoomDataResponse[] {
  return rooms.map((room) =>
    room.roomId === roomId
      ? {
          ...room,
          unreadCount: (room.unreadCount ?? 0) + 1,
        }
      : room
  );
}

export function clearUnread(
  rooms: RoomDataResponse[],
  roomId: number
): RoomDataResponse[] {
  return rooms.map((room) =>
    room.roomId === roomId
      ? {
          ...room,
          unreadCount: 0,
        }
      : room
  );
}
